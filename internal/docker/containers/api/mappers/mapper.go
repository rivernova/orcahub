package mappers

import (
	requests "github.com/rivernova/orcahub/internal/docker/containers/api/requests"
	responses "github.com/rivernova/orcahub/internal/docker/containers/api/responses"
	model "github.com/rivernova/orcahub/internal/docker/containers/model"
)

func toContainerResponseList(cs []model.Container) []responses.ContainerResponse {
	result := make([]responses.ContainerResponse, 0, len(cs))
	for _, c := range cs {
		result = append(result, toContainerResponse(c))
	}
	return result
}

func toContainerResponse(c model.Container) responses.ContainerResponse {
	return responses.ContainerResponse{
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

func toContainerInspectResponse(c *model.Container) *responses.ContainerInspectResponse {
	networks := make(map[string]responses.NetworkEndpoint, len(c.Networks))
	for k, v := range c.Networks {
		networks[k] = responses.NetworkEndpoint{
			NetworkID:  v.NetworkID,
			IPAddress:  v.IPAddress,
			Gateway:    v.Gateway,
			MacAddress: v.MacAddress,
		}
	}
	return &responses.ContainerInspectResponse{
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

func toDomainContainer(req requests.CreateContainerRequest) model.Container {
	ports := make([]model.Port, 0, len(req.Ports))
	for _, p := range req.Ports {
		ports = append(ports, model.Port{
			Type: p.Protocol,
		})
	}
	return model.Container{
		Name:          req.Name,
		Image:         req.Image,
		Labels:        req.Labels,
		Env:           req.Environment,
		RestartPolicy: req.RestartPolicy,
		Ports:         ports,
	}
}

func toPortResponseList(ports []model.Port) []responses.PortResponse {
	result := make([]responses.PortResponse, 0, len(ports))
	for _, p := range ports {
		result = append(result, responses.PortResponse{
			PrivatePort: p.PrivatePort,
			PublicPort:  p.PublicPort,
			Type:        p.Type,
			IP:          p.IP,
		})
	}
	return result
}

func toMountResponseList(mounts []model.Mount) []responses.MountResponse {
	result := make([]responses.MountResponse, 0, len(mounts))
	for _, m := range mounts {
		result = append(result, responses.MountResponse{
			Type:        m.Type,
			Source:      m.Source,
			Destination: m.Destination,
			Mode:        m.Mode,
			RW:          m.RW,
		})
	}
	return result
}

func toStatsResponse(s *model.ContainerStats) *responses.StatsResponse {
	return &responses.StatsResponse{
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
