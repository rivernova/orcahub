package domain

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/containers/adapter"
)

type ContainerServiceImpl struct {
	adapter adapter.ContainerAdapter
}

func NewContainerServiceImpl(adapter adapter.ContainerAdapter) *ContainerServiceImpl {
	return &ContainerServiceImpl{adapter: adapter}
}

func (s *ContainerServiceImpl) List(ctx context.Context) ([]Container, error) {
	return s.adapter.List(ctx)
}

func (s *ContainerServiceImpl) Inspect(ctx context.Context, id string) (*Container, error) {
	return s.adapter.Inspect(ctx, id)
}

func (s *ContainerServiceImpl) Create(ctx context.Context, container Container) (*Container, error) {
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

func (s *ContainerServiceImpl) Logs(ctx context.Context, id string, opts LogsOptions) ([]string, error) {
	return s.adapter.Logs(ctx, id, opts)
}

func (s *ContainerServiceImpl) Stats(ctx context.Context, id string) (*ContainerStats, error) {
	return s.adapter.Stats(ctx, id)
}

func (s *ContainerServiceImpl) Exec(ctx context.Context, id string, opts ExecOptions) (*ExecResult, error) {
	return s.adapter.Exec(ctx, id, opts)
}
