package adapter

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/volumes/domain"
)

type VolumeAdapter interface {
	List(ctx context.Context) ([]domain.Volume, error)
	Inspect(ctx context.Context, name string) (*domain.Volume, error)
	Create(ctx context.Context, opts domain.CreateVolumeOptions) (*domain.Volume, error)
	Delete(ctx context.Context, name string) error
}
