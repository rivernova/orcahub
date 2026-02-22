package domain

import (
	"context"

	model "github.com/rivernova/orcahub/internal/docker/images/model"
)

type ImageService interface {
	List(ctx context.Context) ([]model.Image, error)
	Inspect(ctx context.Context, id string) (*model.Image, error)
	Delete(ctx context.Context, id string, opts model.RemoveOptions) (*model.RemoveResult, error)
	Pull(ctx context.Context, opts model.PullOptions) error
	Build(ctx context.Context, opts model.BuildOptions) (*model.BuildResult, error)
}
