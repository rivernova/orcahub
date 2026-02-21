package adapter

import (
	"context"
	"fmt"

	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	"github.com/rivernova/orcahub/internal/docker/volumes/domain"
)

type VolumeAdapterImpl struct {
	client *client.Client
}

func NewVolumeAdapterImpl() (*VolumeAdapterImpl, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}
	return &VolumeAdapterImpl{client: cli}, nil
}

// Compile-time check: VolumeAdapterImpl must implement VolumeAdapter
var _ VolumeAdapter = (*VolumeAdapterImpl)(nil)

func (a *VolumeAdapterImpl) List(ctx context.Context) ([]domain.Volume, error) {
	resp, err := a.client.VolumeList(ctx, volume.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list volumes: %w", err)
	}

	result := make([]domain.Volume, 0, len(resp.Volumes))
	for _, v := range resp.Volumes {
		result = append(result, domain.Volume{
			Name:       v.Name,
			Driver:     v.Driver,
			Mountpoint: v.Mountpoint,
			Labels:     v.Labels,
			Options:    v.Options,
			Scope:      v.Scope,
			CreatedAt:  v.CreatedAt,
		})
	}
	return result, nil
}

func (a *VolumeAdapterImpl) Inspect(ctx context.Context, name string) (*domain.Volume, error) {
	v, err := a.client.VolumeInspect(ctx, name)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect volume %s: %w", name, err)
	}

	status := make(map[string]interface{})
	for k, val := range v.Status {
		status[k] = val
	}

	return &domain.Volume{
		Name:       v.Name,
		Driver:     v.Driver,
		Mountpoint: v.Mountpoint,
		Labels:     v.Labels,
		Options:    v.Options,
		Scope:      v.Scope,
		CreatedAt:  v.CreatedAt,
		Status:     status,
	}, nil
}

func (a *VolumeAdapterImpl) Create(ctx context.Context, opts domain.CreateVolumeOptions) (*domain.Volume, error) {
	v, err := a.client.VolumeCreate(ctx, volume.CreateOptions{
		Name:       opts.Name,
		Driver:     opts.Driver,
		DriverOpts: opts.DriverOpts,
		Labels:     opts.Labels,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create volume %s: %w", opts.Name, err)
	}

	return &domain.Volume{
		Name:       v.Name,
		Driver:     v.Driver,
		Mountpoint: v.Mountpoint,
		Labels:     v.Labels,
		Options:    v.Options,
		Scope:      v.Scope,
		CreatedAt:  v.CreatedAt,
	}, nil
}

func (a *VolumeAdapterImpl) Delete(ctx context.Context, name string) error {
	if err := a.client.VolumeRemove(ctx, name, false); err != nil {
		return fmt.Errorf("failed to delete volume %s: %w", name, err)
	}
	return nil
}
