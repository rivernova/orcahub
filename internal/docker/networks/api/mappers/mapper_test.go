package mappers_test

import (
	"testing"

	"github.com/rivernova/orcahub/internal/docker/networks/api"
	"github.com/rivernova/orcahub/internal/docker/networks/model"
	"github.com/stretchr/testify/assert"
)

func TestToNetworkResponse(t *testing.T) {
	n := &model.Network{
		ID:         "net1",
		Name:       "my-network",
		Driver:     "bridge",
		Scope:      "local",
		Internal:   false,
		Attachable: true,
		Labels:     map[string]string{"env": "dev"},
		Created:    "2024-01-01 00:00:00 +0000 UTC",
	}

	resp := toNetworkResponse(n)

	assert.Equal(t, "net1", resp.ID)
	assert.Equal(t, "my-network", resp.Name)
	assert.Equal(t, "bridge", resp.Driver)
	assert.Equal(t, "local", resp.Scope)
	assert.True(t, resp.Attachable)
	assert.False(t, resp.Internal)
}

func TestToNetworkResponseList(t *testing.T) {
	networks := []model.Network{
		{ID: "net1", Name: "bridge"},
		{ID: "net2", Name: "host"},
	}

	result := api.ToNetworkResponseList(networks)

	assert.Len(t, result, 2)
	assert.Equal(t, "net1", result[0].ID)
	assert.Equal(t, "net2", result[1].ID)
}

func TestToNetworkInspectResponse(t *testing.T) {
	n := &model.Network{
		ID:     "net1",
		Name:   "my-network",
		Driver: "bridge",
		IPAM: model.IPAM{
			Driver: "default",
			Config: []model.IPAMPool{
				{Subnet: "172.18.0.0/16", Gateway: "172.18.0.1"},
			},
		},
		Containers: map[string]model.ContainerEndpoint{
			"abc123": {
				Name:        "my-app",
				EndpointID:  "ep1",
				MacAddress:  "02:42:ac:12:00:02",
				IPv4Address: "172.18.0.2/16",
			},
		},
	}

	resp := mappers.ToNetworkInspectResponse(n)

	assert.Equal(t, "net1", resp.ID)
	assert.Equal(t, "default", resp.IPAM.Driver)
	assert.Len(t, resp.IPAM.Config, 1)
	assert.Equal(t, "172.18.0.0/16", resp.IPAM.Config[0].Subnet)
	assert.Equal(t, "172.18.0.1", resp.IPAM.Config[0].Gateway)
	assert.Contains(t, resp.Containers, "abc123")
	assert.Equal(t, "my-app", resp.Containers["abc123"].Name)
	assert.Equal(t, "172.18.0.2/16", resp.Containers["abc123"].IPv4Address)
}

func TestToNetworkResponseList_Empty(t *testing.T) {
	result := mappers.ToNetworkResponseList([]model.Network{})
	assert.Empty(t, result)
}
