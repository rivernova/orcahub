package adapter

import (
	"context"
	"fmt"

	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/rivernova/orcahub/internal/docker/networks/domain"
)

type NetworkAdapterImpl struct {
	client *client.Client
}

func NewNetworkAdapterImpl() (*NetworkAdapterImpl, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}
	return &NetworkAdapterImpl{client: cli}, nil
}

// Compile-time check: NetworkAdapterImpl must implement NetworkAdapter
var _ NetworkAdapter = (*NetworkAdapterImpl)(nil)

func (a *NetworkAdapterImpl) List(ctx context.Context) ([]domain.Network, error) {
	networks, err := a.client.NetworkList(ctx, network.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list networks: %w", err)
	}

	result := make([]domain.Network, 0, len(networks))
	for _, n := range networks {
		result = append(result, domain.Network{
			ID:         n.ID,
			Name:       n.Name,
			Driver:     n.Driver,
			Scope:      n.Scope,
			Internal:   n.Internal,
			Attachable: n.Attachable,
			Labels:     n.Labels,
			Options:    n.Options,
			Created:    n.Created.String(),
		})
	}
	return result, nil
}

func (a *NetworkAdapterImpl) Inspect(ctx context.Context, id string) (*domain.Network, error) {
	n, err := a.client.NetworkInspect(ctx, id, network.InspectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to inspect network %s: %w", id, err)
	}

	pools := make([]domain.IPAMPool, 0, len(n.IPAM.Config))
	for _, p := range n.IPAM.Config {
		pools = append(pools, domain.IPAMPool{
			Subnet:  p.Subnet,
			Gateway: p.Gateway,
		})
	}

	containers := make(map[string]domain.ContainerEndpoint, len(n.Containers))
	for cid, c := range n.Containers {
		containers[cid] = domain.ContainerEndpoint{
			Name:        c.Name,
			EndpointID:  c.EndpointID,
			MacAddress:  c.MacAddress,
			IPv4Address: c.IPv4Address,
		}
	}

	return &domain.Network{
		ID:         n.ID,
		Name:       n.Name,
		Driver:     n.Driver,
		Scope:      n.Scope,
		Internal:   n.Internal,
		Attachable: n.Attachable,
		Labels:     n.Labels,
		Options:    n.Options,
		Created:    n.Created.String(),
		IPAM: domain.IPAM{
			Driver: n.IPAM.Driver,
			Config: pools,
		},
		Containers: containers,
	}, nil
}

func (a *NetworkAdapterImpl) Create(ctx context.Context, opts domain.CreateNetworkOptions) (*domain.Network, error) {
	ipamConfig := []network.IPAMConfig{}
	if opts.IPAM != nil {
		for _, p := range opts.IPAM.Config {
			ipamConfig = append(ipamConfig, network.IPAMConfig{
				Subnet:  p.Subnet,
				Gateway: p.Gateway,
			})
		}
	}

	driver := opts.Driver
	if driver == "" {
		driver = "bridge"
	}

	resp, err := a.client.NetworkCreate(ctx, opts.Name, network.CreateOptions{
		Driver:     driver,
		Internal:   opts.Internal,
		Attachable: opts.Attachable,
		Labels:     opts.Labels,
		Options:    opts.Options,
		IPAM: &network.IPAM{
			Config: ipamConfig,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create network %s: %w", opts.Name, err)
	}

	return a.Inspect(ctx, resp.ID)
}

func (a *NetworkAdapterImpl) Delete(ctx context.Context, id string) error {
	if err := a.client.NetworkRemove(ctx, id); err != nil {
		return fmt.Errorf("failed to delete network %s: %w", id, err)
	}
	return nil
}

func (a *NetworkAdapterImpl) Connect(ctx context.Context, networkID string, opts domain.ConnectOptions) error {
	err := a.client.NetworkConnect(ctx, networkID, opts.ContainerID, &network.EndpointSettings{
		IPAddress: opts.IPv4Address,
		Aliases:   opts.Aliases,
	})
	if err != nil {
		return fmt.Errorf("failed to connect container %s to network %s: %w", opts.ContainerID, networkID, err)
	}
	return nil
}

func (a *NetworkAdapterImpl) Disconnect(ctx context.Context, networkID string, opts domain.DisconnectOptions) error {
	if err := a.client.NetworkDisconnect(ctx, networkID, opts.ContainerID, opts.Force); err != nil {
		return fmt.Errorf("failed to disconnect container %s from network %s: %w", opts.ContainerID, networkID, err)
	}
	return nil
}
