package adapter

import (
	"context"

	"github.com/rivernova/orcahub/internal/docker/networks/domain"
)

type NetworkAdapter interface {
	List(ctx context.Context) ([]domain.Network, error)
	Inspect(ctx context.Context, id string) (*domain.Network, error)
	Create(ctx context.Context, opts domain.CreateNetworkOptions) (*domain.Network, error)
	Delete(ctx context.Context, id string) error
	Connect(ctx context.Context, networkID string, opts domain.ConnectOptions) error
	Disconnect(ctx context.Context, networkID string, opts domain.DisconnectOptions) error
}
