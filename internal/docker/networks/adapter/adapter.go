package adapter

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/networks/model"
)

type NetworkAdapter interface {
	List(ctx context.Context) ([]model.Network, error)
	Inspect(ctx context.Context, id string) (*model.Network, error)
	Create(ctx context.Context, opts model.CreateNetworkOptions) (*model.Network, error)
	Delete(ctx context.Context, id string) error
	Connect(ctx context.Context, networkID string, opts model.ConnectOptions) error
	Disconnect(ctx context.Context, networkID string, opts model.DisconnectOptions) error
}
