package adapter

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/containers/model"
)

type ContainerAdapter interface {
	List(ctx context.Context) ([]model.Container, error)
	Inspect(ctx context.Context, id string) (*model.Container, error)
	Create(ctx context.Context, container model.Container) (*model.Container, error)
	Delete(ctx context.Context, id string) error
	Start(ctx context.Context, id string) error
	Stop(ctx context.Context, id string, timeout *int) error
	Restart(ctx context.Context, id string) error
	Logs(ctx context.Context, id string, opts model.LogsOptions) ([]string, error)
	Stats(ctx context.Context, id string) (*model.ContainerStats, error)
	Exec(ctx context.Context, id string, opts model.ExecOptions) (*model.ExecResult, error)
}
