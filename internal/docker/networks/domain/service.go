package domain

import "context"

type NetworkService interface {
	List(ctx context.Context) ([]Network, error)
	Inspect(ctx context.Context, id string) (*Network, error)
	Create(ctx context.Context, opts CreateNetworkOptions) (*Network, error)
	Delete(ctx context.Context, id string) error
	Connect(ctx context.Context, networkID string, opts ConnectOptions) error
	Disconnect(ctx context.Context, networkID string, opts DisconnectOptions) error
}
