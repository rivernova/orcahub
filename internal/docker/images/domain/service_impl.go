package domain

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/images/adapter"
	model "github.com/rivernova/orcahub/internal/docker/images/model"
)

type ImageServiceImpl struct {
	adapter adapter.ImageAdapter
}

func NewImageServiceImpl(adapter adapter.ImageAdapter) *ImageServiceImpl {
	return &ImageServiceImpl{adapter: adapter}
}

func (s *ImageServiceImpl) List(ctx context.Context) ([]model.Image, error) {
	return s.adapter.List(ctx)
}

func (s *ImageServiceImpl) Inspect(ctx context.Context, id string) (*model.Image, error) {
	return s.adapter.Inspect(ctx, id)
}

func (s *ImageServiceImpl) Delete(ctx context.Context, id string, opts model.RemoveOptions) (*model.RemoveResult, error) {
	return s.adapter.Delete(ctx, id, opts)
}

func (s *ImageServiceImpl) Pull(ctx context.Context, opts model.PullOptions) error {
	return s.adapter.Pull(ctx, opts)
}

func (s *ImageServiceImpl) Build(ctx context.Context, opts model.BuildOptions) (*model.BuildResult, error) {
	return s.adapter.Build(ctx, opts)
}
