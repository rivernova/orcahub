package adapter

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/rivernova/orcahub/internal/docker/containers/domain"
)

type ContainerAdapterImpl struct {
	client *client.Client
}

func NewContainerAdapterImpl() (*ContainerAdapterImpl, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}
	return &ContainerAdapterImpl{client: cli}, nil
}

// Compile-time check: ContainerAdapterImpl must implement ContainerAdapter
var _ ContainerAdapter = (*ContainerAdapterImpl)(nil)

func (a *ContainerAdapterImpl) List(ctx context.Context) ([]domain.Container, error) {
	containers, err := a.client.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %w", err)
	}

	result := make([]domain.Container, 0, len(containers))
	for _, c := range containers {
		ports := make([]domain.Port, 0, len(c.Ports))
		for _, p := range c.Ports {
			ports = append(ports, domain.Port{
				PrivatePort: int(p.PrivatePort),
				PublicPort:  int(p.PublicPort),
				Type:        p.Type,
				IP:          p.IP,
			})
		}
		mounts := make([]domain.Mount, 0, len(c.Mounts))
		for _, m := range c.Mounts {
			mounts = append(mounts, domain.Mount{
				Type:        string(m.Type),
				Source:      m.Source,
				Destination: m.Destination,
				Mode:        m.Mode,
				RW:          m.RW,
			})
		}
		name := ""
		if len(c.Names) > 0 {
			name = c.Names[0][1:]
		}
		result = append(result, domain.Container{
			ID:      c.ID,
			Name:    name,
			Image:   c.Image,
			ImageID: c.ImageID,
			State:   c.State,
			Status:  c.Status,
			Created: c.Created,
			Ports:   ports,
			Mounts:  mounts,
			Labels:  c.Labels,
		})
	}
	return result, nil
}

func (a *ContainerAdapterImpl) Inspect(ctx context.Context, id string) (*domain.Container, error) {
	c, err := a.client.ContainerInspect(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect container %s: %w", id, err)
	}

	ports := make([]domain.Port, 0)
	for port, bindings := range c.NetworkSettings.Ports {
		for _, b := range bindings {
			publicPort := 0
			fmt.Sscanf(b.HostPort, "%d", &publicPort)
			privatePort, _ := nat.ParsePort(port.Port())
			ports = append(ports, domain.Port{
				PrivatePort: privatePort,
				PublicPort:  publicPort,
				Type:        port.Proto(),
				IP:          b.HostIP,
			})
		}
	}

	mounts := make([]domain.Mount, 0, len(c.Mounts))
	for _, m := range c.Mounts {
		mounts = append(mounts, domain.Mount{
			Type:        string(m.Type),
			Source:      m.Source,
			Destination: m.Destination,
			Mode:        m.Mode,
			RW:          m.RW,
		})
	}

	networks := make(map[string]domain.NetworkEndpoint)
	for name, n := range c.NetworkSettings.Networks {
		networks[name] = domain.NetworkEndpoint{
			NetworkID:  n.NetworkID,
			IPAddress:  n.IPAddress,
			Gateway:    n.Gateway,
			MacAddress: n.MacAddress,
		}
	}

	name := c.Name
	if len(name) > 0 && name[0] == '/' {
		name = name[1:]
	}

	created, _ := time.Parse(time.RFC3339, c.Created)

	return &domain.Container{
		ID:            c.ID,
		Name:          name,
		Image:         c.Config.Image,
		ImageID:       c.Image,
		State:         c.State.Status,
		Status:        c.State.Status,
		Created:       created.Unix(),
		Ports:         ports,
		Mounts:        mounts,
		Labels:        c.Config.Labels,
		NetworkMode:   string(c.HostConfig.NetworkMode),
		RestartPolicy: string(c.HostConfig.RestartPolicy.Name),
		Env:           c.Config.Env,
		Cmd:           c.Config.Cmd,
		Entrypoint:    c.Config.Entrypoint,
		WorkingDir:    c.Config.WorkingDir,
		User:          c.Config.User,
		Hostname:      c.Config.Hostname,
		Networks:      networks,
		StartedAt:     c.State.StartedAt,
		FinishedAt:    c.State.FinishedAt,
		ExitCode:      c.State.ExitCode,
	}, nil
}

func (a *ContainerAdapterImpl) Create(ctx context.Context, c domain.Container) (*domain.Container, error) {
	portBindings := nat.PortMap{}
	exposedPorts := nat.PortSet{}
	for _, p := range c.Ports {
		port, err := nat.NewPort(p.Type, fmt.Sprintf("%d", p.PrivatePort))
		if err != nil {
			return nil, fmt.Errorf("invalid port: %w", err)
		}
		exposedPorts[port] = struct{}{}
		portBindings[port] = []nat.PortBinding{
			{HostIP: "0.0.0.0", HostPort: fmt.Sprintf("%d", p.PublicPort)},
		}
	}

	resp, err := a.client.ContainerCreate(ctx,
		&container.Config{
			Image:        c.Image,
			Env:          c.Env,
			Labels:       c.Labels,
			ExposedPorts: exposedPorts,
		},
		&container.HostConfig{
			PortBindings: portBindings,
			RestartPolicy: container.RestartPolicy{
				Name: container.RestartPolicyMode(c.RestartPolicy),
			},
		},
		nil, nil, c.Name,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create container: %w", err)
	}

	return &domain.Container{ID: resp.ID}, nil
}

func (a *ContainerAdapterImpl) Delete(ctx context.Context, id string) error {
	if err := a.client.ContainerRemove(ctx, id, container.RemoveOptions{Force: true}); err != nil {
		return fmt.Errorf("failed to delete container %s: %w", id, err)
	}
	return nil
}

func (a *ContainerAdapterImpl) Start(ctx context.Context, id string) error {
	if err := a.client.ContainerStart(ctx, id, container.StartOptions{}); err != nil {
		return fmt.Errorf("failed to start container %s: %w", id, err)
	}
	return nil
}

func (a *ContainerAdapterImpl) Stop(ctx context.Context, id string, timeout *int) error {
	if err := a.client.ContainerStop(ctx, id, container.StopOptions{Timeout: timeout}); err != nil {
		return fmt.Errorf("failed to stop container %s: %w", id, err)
	}
	return nil
}

func (a *ContainerAdapterImpl) Restart(ctx context.Context, id string) error {
	if err := a.client.ContainerRestart(ctx, id, container.StopOptions{}); err != nil {
		return fmt.Errorf("failed to restart container %s: %w", id, err)
	}
	return nil
}

func (a *ContainerAdapterImpl) Logs(ctx context.Context, id string, opts domain.LogsOptions) ([]string, error) {
	reader, err := a.client.ContainerLogs(ctx, id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Since:      opts.Since,
		Until:      opts.Until,
		Tail:       opts.Tail,
		Follow:     opts.Follow,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get logs for container %s: %w", id, err)
	}
	defer reader.Close()

	var lines []string
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return lines, scanner.Err()
}

func (a *ContainerAdapterImpl) Stats(ctx context.Context, id string) (*domain.ContainerStats, error) {
	resp, err := a.client.ContainerStatsOneShot(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get stats for container %s: %w", id, err)
	}
	defer resp.Body.Close()

	var stats container.StatsResponse
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, fmt.Errorf("failed to decode stats: %w", err)
	}

	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage - stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemUsage - stats.PreCPUStats.SystemUsage)
	numCPUs := float64(stats.CPUStats.OnlineCPUs)
	if numCPUs == 0 {
		numCPUs = float64(len(stats.CPUStats.CPUUsage.PercpuUsage))
	}
	cpuPercent := 0.0
	if systemDelta > 0 {
		cpuPercent = (cpuDelta / systemDelta) * numCPUs * 100.0
	}

	memUsage := stats.MemoryStats.Usage - stats.MemoryStats.Stats["cache"]
	memLimit := stats.MemoryStats.Limit
	memPercent := 0.0
	if memLimit > 0 {
		memPercent = float64(memUsage) / float64(memLimit) * 100.0
	}

	var netIn, netOut uint64
	for _, n := range stats.Networks {
		netIn += n.RxBytes
		netOut += n.TxBytes
	}

	var blockRead, blockWrite uint64
	for _, b := range stats.BlkioStats.IoServiceBytesRecursive {
		switch b.Op {
		case "Read":
			blockRead += b.Value
		case "Write":
			blockWrite += b.Value
		}
	}

	return &domain.ContainerStats{
		CPUPercent:    cpuPercent,
		MemoryUsage:   memUsage,
		MemoryLimit:   memLimit,
		MemoryPercent: memPercent,
		NetworkIn:     netIn,
		NetworkOut:    netOut,
		BlockRead:     blockRead,
		BlockWrite:    blockWrite,
		PIDs:          uint64(stats.PidsStats.Current),
	}, nil
}

func (a *ContainerAdapterImpl) Exec(ctx context.Context, id string, opts domain.ExecOptions) (*domain.ExecResult, error) {
	execID, err := a.client.ContainerExecCreate(ctx, id, container.ExecOptions{
		Cmd:          opts.Command,
		AttachStdout: opts.AttachStdout,
		AttachStderr: opts.AttachStderr,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create exec for container %s: %w", id, err)
	}

	resp, err := a.client.ContainerExecAttach(ctx, execID.ID, container.ExecAttachOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to attach exec: %w", err)
	}
	defer resp.Close()

	output, err := io.ReadAll(resp.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read exec output: %w", err)
	}

	inspect, err := a.client.ContainerExecInspect(ctx, execID.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect exec: %w", err)
	}

	return &domain.ExecResult{
		Output:   string(output),
		ExitCode: inspect.ExitCode,
	}, nil
}
