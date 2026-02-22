package domain

import (
	"context"

	model "github.com/rivernova/orcahub/internal/docker/volumes/model"
)

type VolumeService interface {
	List(ctx context.Context) ([]model.Volume, error)
	Inspect(ctx context.Context, name string) (*model.Volume, error)
	Create(ctx context.Context, opts model.CreateVolumeOptions) (*model.Volume, error)
	Delete(ctx context.Context, name string) error
}
