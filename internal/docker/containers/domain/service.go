package domain

import (
	"context"
)

type ContainerService interface {
	List(ctx context.Context) ([]Container, error)
	Inspect(ctx context.Context, id string) (*Container, error)
	Create(ctx context.Context, container Container) (*Container, error)
	Delete(ctx context.Context, id string) error
	Start(ctx context.Context, id string) error
	Stop(ctx context.Context, id string, timeout *int) error
	Restart(ctx context.Context, id string) error
	Logs(ctx context.Context, id string, opts LogsOptions) ([]string, error)
	Stats(ctx context.Context, id string) (*ContainerStats, error)
	Exec(ctx context.Context, id string, opts ExecOptions) (*ExecResult, error)
}
