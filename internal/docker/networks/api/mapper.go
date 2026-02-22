package api

import (
	model "github.com/rivernova/orcahub/internal/docker/networks/model"
)

func toNetworkResponseList(ns []model.Network) []NetworkResponse {
	result := make([]NetworkResponse, 0, len(ns))
	for _, n := range ns {
		result = append(result, toNetworkResponse(n))
	}
	return result
}

func toNetworkResponse(n model.Network) NetworkResponse {
	return NetworkResponse{
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

func toNetworkInspectResponse(n *model.Network) *NetworkInspectResponse {
	pools := make([]IPAMPoolInfo, 0, len(n.IPAM.Config))
	for _, p := range n.IPAM.Config {
		pools = append(pools, IPAMPoolInfo{Subnet: p.Subnet, Gateway: p.Gateway})
	}

	endpoints := make(map[string]ContainerEndpoint, len(n.Containers))
	for k, v := range n.Containers {
		endpoints[k] = ContainerEndpoint{
			Name:        v.Name,
			EndpointID:  v.EndpointID,
			MacAddress:  v.MacAddress,
			IPv4Address: v.IPv4Address,
		}
	}

	return &NetworkInspectResponse{
		NetworkResponse: toNetworkResponse(*n),
		IPAM: IPAMResponse{
			Driver: n.IPAM.Driver,
			Config: pools,
		},
		Containers: endpoints,
		Options:    n.Options,
	}
}
