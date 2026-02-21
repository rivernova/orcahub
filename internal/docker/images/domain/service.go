package domain

import (
	"context"
)

type ImageService interface {
	List(ctx context.Context) ([]Image, error)
	Inspect(ctx context.Context, id string) (*Image, error)
	Delete(ctx context.Context, id string, opts RemoveOptions) (*RemoveResult, error)
	Pull(ctx context.Context, opts PullOptions) error
	Build(ctx context.Context, opts BuildOptions) (*BuildResult, error)
}
