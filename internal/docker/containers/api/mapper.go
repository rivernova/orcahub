package api

import (
	domain "github.com/rivernova/orcahub/internal/docker/containers/domain"
)

func toContainerResponseList(cs []domain.Container) []ContainerResponse {
	result := make([]ContainerResponse, 0, len(cs))
	for _, c := range cs {
		result = append(result, toContainerResponse(c))
	}
	return result
}

func toContainerResponse(c domain.Container) ContainerResponse {
	return ContainerResponse{
		ID:            c.ID,
		Name:          c.Name,
		Image:         c.Image,
		ImageID:       c.ImageID,
		Status:        c.Status,
		State:         c.State,
		Created:       c.Created,
		Ports:         toPortResponseList(c.Ports),
		Labels:        c.Labels,
		Mounts:        toMountResponseList(c.Mounts),
		NetworkMode:   c.NetworkMode,
		RestartPolicy: c.RestartPolicy,
	}
}

func toContainerInspectResponse(c *domain.Container) *ContainerInspectResponse {
	networks := make(map[string]NetworkEndpoint, len(c.Networks))
	for k, v := range c.Networks {
		networks[k] = NetworkEndpoint{
			NetworkID:  v.NetworkID,
			IPAddress:  v.IPAddress,
			Gateway:    v.Gateway,
			MacAddress: v.MacAddress,
		}
	}
	return &ContainerInspectResponse{
		ContainerResponse: toContainerResponse(*c),
		Hostname:          c.Hostname,
		Env:               c.Env,
		Cmd:               c.Cmd,
		Entrypoint:        c.Entrypoint,
		WorkingDir:        c.WorkingDir,
		User:              c.User,
		Networks:          networks,
		StartedAt:         c.StartedAt,
		FinishedAt:        c.FinishedAt,
		ExitCode:          c.ExitCode,
	}
}

func toDomainContainer(req CreateContainerRequest) domain.Container {
	ports := make([]domain.Port, 0, len(req.Ports))
	for _, p := range req.Ports {
		ports = append(ports, domain.Port{
			Type: p.Protocol,
		})
	}
	return domain.Container{
		Name:          req.Name,
		Image:         req.Image,
		Labels:        req.Labels,
		Env:           req.Environment,
		RestartPolicy: req.RestartPolicy,
		Ports:         ports,
	}
}

func toPortResponseList(ports []domain.Port) []PortResponse {
	result := make([]PortResponse, 0, len(ports))
	for _, p := range ports {
		result = append(result, PortResponse{
			PrivatePort: p.PrivatePort,
			PublicPort:  p.PublicPort,
			Type:        p.Type,
			IP:          p.IP,
		})
	}
	return result
}

func toMountResponseList(mounts []domain.Mount) []MountResponse {
	result := make([]MountResponse, 0, len(mounts))
	for _, m := range mounts {
		result = append(result, MountResponse{
			Type:        m.Type,
			Source:      m.Source,
			Destination: m.Destination,
			Mode:        m.Mode,
			RW:          m.RW,
		})
	}
	return result
}

func toStatsResponse(s *domain.ContainerStats) *StatsResponse {
	return &StatsResponse{
		CPUPercent:    s.CPUPercent,
		MemoryUsage:   s.MemoryUsage,
		MemoryLimit:   s.MemoryLimit,
		MemoryPercent: s.MemoryPercent,
		NetworkIn:     s.NetworkIn,
		NetworkOut:    s.NetworkOut,
		BlockRead:     s.BlockRead,
		BlockWrite:    s.BlockWrite,
		PIDs:          s.PIDs,
	}
}
