package domain

import (
	"context"

	model "github.com/rivernova/orcahub/internal/docker/volumes/model"
)

type VolumeServiceImpl struct {
	adapter VolumeAdapter
}

func NewVolumeServiceImpl(adapter VolumeAdapter) *VolumeServiceImpl {
	return &VolumeServiceImpl{adapter: adapter}
}

func (s *VolumeServiceImpl) List(ctx context.Context) ([]model.Volume, error) {
	return s.adapter.List(ctx)
}

func (s *VolumeServiceImpl) Inspect(ctx context.Context, name string) (*model.Volume, error) {
	return s.adapter.Inspect(ctx, name)
}

func (s *VolumeServiceImpl) Create(ctx context.Context, opts model.CreateVolumeOptions) (*model.Volume, error) {
	return s.adapter.Create(ctx, opts)
}

func (s *VolumeServiceImpl) Delete(ctx context.Context, name string) error {
	return s.adapter.Delete(ctx, name)
}
