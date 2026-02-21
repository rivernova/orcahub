package adapter

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/containers/domain"
)

type ContainerAdapter interface {
	List(ctx context.Context) ([]domain.Container, error)
	Inspect(ctx context.Context, id string) (*domain.Container, error)
	Create(ctx context.Context, container domain.Container) (*domain.Container, error)
	Delete(ctx context.Context, id string) error
	Start(ctx context.Context, id string) error
	Stop(ctx context.Context, id string, timeout *int) error
	Restart(ctx context.Context, id string) error
	Logs(ctx context.Context, id string, opts domain.LogsOptions) ([]string, error)
	Stats(ctx context.Context, id string) (*domain.ContainerStats, error)
	Exec(ctx context.Context, id string, opts domain.ExecOptions) (*domain.ExecResult, error)
}
