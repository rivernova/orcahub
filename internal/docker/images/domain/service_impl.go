package domain

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/images/adapter"
)

type ImageServiceImpl struct {
	adapter adapter.ImageAdapter
}

func NewImageServiceImpl(adapter adapter.ImageAdapter) *ImageServiceImpl {
	return &ImageServiceImpl{adapter: adapter}
}

func (s *ImageServiceImpl) List(ctx context.Context) ([]Image, error) {
	return s.adapter.List(ctx)
}

func (s *ImageServiceImpl) Inspect(ctx context.Context, id string) (*Image, error) {
	return s.adapter.Inspect(ctx, id)
}

func (s *ImageServiceImpl) Delete(ctx context.Context, id string, opts RemoveOptions) (*RemoveResult, error) {
	return s.adapter.Delete(ctx, id, opts)
}

func (s *ImageServiceImpl) Pull(ctx context.Context, opts PullOptions) error {
	return s.adapter.Pull(ctx, opts)
}

func (s *ImageServiceImpl) Build(ctx context.Context, opts BuildOptions) (*BuildResult, error) {
	return s.adapter.Build(ctx, opts)
}
