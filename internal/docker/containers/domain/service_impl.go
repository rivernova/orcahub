package domain

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/containers/adapter"
	model "github.com/rivernova/orcahub/internal/docker/containers/model"
)

type ContainerServiceImpl struct {
	adapter adapter.ContainerAdapter
}

func NewContainerServiceImpl(adapter adapter.ContainerAdapter) *ContainerServiceImpl {
	return &ContainerServiceImpl{adapter: adapter}
}

func (s *ContainerServiceImpl) List(ctx context.Context) ([]model.Container, error) {
	return s.adapter.List(ctx)
}

func (s *ContainerServiceImpl) Inspect(ctx context.Context, id string) (*model.Container, error) {
	return s.adapter.Inspect(ctx, id)
}

func (s *ContainerServiceImpl) Create(ctx context.Context, container model.Container) (*model.Container, error) {
	return s.adapter.Create(ctx, container)
}

func (s *ContainerServiceImpl) Delete(ctx context.Context, id string) error {
	return s.adapter.Delete(ctx, id)
}

func (s *ContainerServiceImpl) Start(ctx context.Context, id string) error {
	return s.adapter.Start(ctx, id)
}

func (s *ContainerServiceImpl) Stop(ctx context.Context, id string, timeout *int) error {
	return s.adapter.Stop(ctx, id, timeout)
}

func (s *ContainerServiceImpl) Restart(ctx context.Context, id string) error {
	return s.adapter.Restart(ctx, id)
}

func (s *ContainerServiceImpl) Logs(ctx context.Context, id string, opts model.LogsOptions) ([]string, error) {
	return s.adapter.Logs(ctx, id, opts)
}

func (s *ContainerServiceImpl) Stats(ctx context.Context, id string) (*model.ContainerStats, error) {
	return s.adapter.Stats(ctx, id)
}

func (s *ContainerServiceImpl) Exec(ctx context.Context, id string, opts model.ExecOptions) (*model.ExecResult, error) {
	return s.adapter.Exec(ctx, id, opts)
}
