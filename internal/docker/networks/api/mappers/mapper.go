package mappers

import (
	responses "github.com/rivernova/orcahub/internal/docker/networks/api/responses"
	model "github.com/rivernova/orcahub/internal/docker/networks/model"
)

func toNetworkResponseList(ns []model.Network) []responses.NetworkResponse {
	result := make([]responses.NetworkResponse, 0, len(ns))
	for _, n := range ns {
		result = append(result, toNetworkResponse(n))
	}
	return result
}

func toNetworkResponse(n model.Network) responses.NetworkResponse {
	return responses.NetworkResponse{
		ID:         n.ID,
		Name:       n.Name,
		Driver:     n.Driver,
		Scope:      n.Scope,
		Internal:   n.Internal,
		Attachable: n.Attachable,
		Labels:     n.Labels,
		Created:    n.Created,
	}
}

func toNetworkInspectResponse(n *model.Network) *responses.NetworkInspectResponse {
	pools := make([]responses.IPAMPoolInfo, 0, len(n.IPAM.Config))
	for _, p := range n.IPAM.Config {
		pools = append(pools, responses.IPAMPoolInfo{Subnet: p.Subnet, Gateway: p.Gateway})
	}

	endpoints := make(map[string]responses.ContainerEndpoint, len(n.Containers))
	for k, v := range n.Containers {
		endpoints[k] = responses.ContainerEndpoint{
			Name:        v.Name,
			EndpointID:  v.EndpointID,
			MacAddress:  v.MacAddress,
			IPv4Address: v.IPv4Address,
		}
	}

	return &responses.NetworkInspectResponse{
		NetworkResponse: toNetworkResponse(*n),
		IPAM: responses.IPAMResponse{
			Driver: n.IPAM.Driver,
			Config: pools,
		},
		Containers: endpoints,
		Options:    n.Options,
	}
}
