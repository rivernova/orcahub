package api

import (
	domain "github.com/rivernova/orcahub/internal/docker/networks/domain"
)

func toNetworkResponseList(ns []domain.Network) []NetworkResponse {
	result := make([]NetworkResponse, 0, len(ns))
	for _, n := range ns {
		result = append(result, toNetworkResponse(n))
	}
	return result
}

func toNetworkResponse(n domain.Network) NetworkResponse {
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

func toNetworkInspectResponse(n *domain.Network) *NetworkInspectResponse {
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
