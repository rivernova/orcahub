package mappers_test

import (
	"testing"

	mappers "github.com/rivernova/orcahub/internal/docker/containers/api/mappers"
	requests "github.com/rivernova/orcahub/internal/docker/containers/api/requests"
	"github.com/rivernova/orcahub/internal/docker/containers/model"
	"github.com/stretchr/testify/assert"
)

func TestToContainerResponse(t *testing.T) {
	c := model.Container{
		ID:      "abc123",
		Name:    "my-app",
		Image:   "nginx:latest",
		ImageID: "sha256:xyz",
		State:   "running",
		Status:  "Up 2 hours",
		Created: 1700000000,
		Labels:  map[string]string{"env": "prod"},
		Ports: []model.Port{
			{PrivatePort: 80, PublicPort: 8080, Type: "tcp", IP: "0.0.0.0"},
		},
	}

	resp := mappers.ToContainerResponse(c)

	assert.Equal(t, "abc123", resp.ID)
	assert.Equal(t, "my-app", resp.Name)
	assert.Equal(t, "nginx:latest", resp.Image)
	assert.Equal(t, "running", resp.State)
	assert.Equal(t, "Up 2 hours", resp.Status)
	assert.Equal(t, int64(1700000000), resp.Created)
	assert.Equal(t, map[string]string{"env": "prod"}, resp.Labels)
	assert.Len(t, resp.Ports, 1)
	assert.Equal(t, 80, resp.Ports[0].PrivatePort)
	assert.Equal(t, 8080, resp.Ports[0].PublicPort)
	assert.Equal(t, "tcp", resp.Ports[0].Type)
}

func TestToContainerResponseList(t *testing.T) {
	containers := []model.Container{
		{ID: "a", Name: "app1", Image: "nginx"},
		{ID: "b", Name: "app2", Image: "redis"},
	}

	result := mappers.ToContainerResponseList(containers)

	assert.Len(t, result, 2)
	assert.Equal(t, "a", result[0].ID)
	assert.Equal(t, "b", result[1].ID)
}

func TestToContainerResponseList_Empty(t *testing.T) {
	result := mappers.ToContainerResponseList([]model.Container{})
	assert.Empty(t, result)
}

func TestToContainerInspectResponse(t *testing.T) {
	c := &model.Container{
		ID:            "abc123",
		Name:          "my-app",
		Image:         "nginx:latest",
		NetworkMode:   "bridge",
		RestartPolicy: "unless-stopped",
		Env:           []string{"PORT=8080", "ENV=prod"},
		Hostname:      "my-app-host",
		ExitCode:      0,
		StartedAt:     "2024-01-01T00:00:00Z",
		FinishedAt:    "",
		Mounts: []model.Mount{
			{Type: "volume", Source: "my-vol", Destination: "/data", Mode: "rw", RW: true},
		},
		Networks: map[string]model.NetworkEndpoint{
			"bridge": {NetworkID: "net1", IPAddress: "172.17.0.2", Gateway: "172.17.0.1"},
		},
	}

	resp := mappers.ToContainerInspectResponse(c)

	assert.Equal(t, "abc123", resp.ID)
	assert.Equal(t, "bridge", resp.NetworkMode)
	assert.Equal(t, "unless-stopped", resp.RestartPolicy)
	assert.Equal(t, []string{"PORT=8080", "ENV=prod"}, resp.Env)
	assert.Equal(t, "my-app-host", resp.Hostname)
	assert.Len(t, resp.Mounts, 1)
	assert.Equal(t, "volume", resp.Mounts[0].Type)
	assert.Equal(t, "/data", resp.Mounts[0].Destination)
	assert.Contains(t, resp.Networks, "bridge")
	assert.Equal(t, "172.17.0.2", resp.Networks["bridge"].IPAddress)
}

func TestToDomainContainer(t *testing.T) {
	req := requests.CreateContainerRequest{
		Name:          "my-app",
		Image:         "nginx:latest",
		RestartPolicy: "always",
		Labels:        map[string]string{"app": "web"},
	}

	result := mappers.ToDomainContainer(req)

	assert.Equal(t, "my-app", result.Name)
	assert.Equal(t, "nginx:latest", result.Image)
	assert.Equal(t, []string{"PORT=80"}, result.Env)
	assert.Equal(t, "always", result.RestartPolicy)
	assert.Len(t, result.Ports, 1)
	assert.Equal(t, 80, result.Ports[0].PrivatePort)
	assert.Equal(t, 8080, result.Ports[0].PublicPort)
}

func TestToStatsResponse(t *testing.T) {
	stats := &model.ContainerStats{
		CPUPercent:    12.5,
		MemoryUsage:   104857600,
		MemoryLimit:   2147483648,
		MemoryPercent: 4.88,
		NetworkIn:     1024,
		NetworkOut:    2048,
		BlockRead:     512,
		BlockWrite:    256,
		PIDs:          5,
	}

	resp := mappers.ToStatsResponse(stats)

	assert.Equal(t, 12.5, resp.CPUPercent)
	assert.Equal(t, uint64(104857600), resp.MemoryUsage)
	assert.Equal(t, uint64(2147483648), resp.MemoryLimit)
	assert.Equal(t, 4.88, resp.MemoryPercent)
	assert.Equal(t, uint64(1024), resp.NetworkIn)
	assert.Equal(t, uint64(2048), resp.NetworkOut)
	assert.Equal(t, uint64(5), resp.PIDs)
}
