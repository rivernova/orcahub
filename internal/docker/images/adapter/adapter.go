package adapter

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/images/domain"
)

type ImageAdapter interface {
	List(ctx context.Context) ([]domain.Image, error)
	Inspect(ctx context.Context, id string) (*domain.Image, error)
	Delete(ctx context.Context, id string, opts domain.RemoveOptions) (*domain.RemoveResult, error)
	Pull(ctx context.Context, opts domain.PullOptions) error
	Build(ctx context.Context, opts domain.BuildOptions) (*domain.BuildResult, error)
}
