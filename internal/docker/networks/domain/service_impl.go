package domain

import (
	"context"

	adapter "github.com/rivernova/orcahub/internal/docker/networks/adapter"
	model "github.com/rivernova/orcahub/internal/docker/networks/model"
)

type NetworkServiceImpl struct {
	adapter adapter.NetworkAdapter
}

func NewNetworkServiceImpl(adapter adapter.NetworkAdapter) *NetworkServiceImpl {
	return &NetworkServiceImpl{adapter: adapter}
}

func (s *NetworkServiceImpl) List(ctx context.Context) ([]model.Network, error) {
	return s.adapter.List(ctx)
}

func (s *NetworkServiceImpl) Inspect(ctx context.Context, id string) (*model.Network, error) {
	return s.adapter.Inspect(ctx, id)
}

func (s *NetworkServiceImpl) Create(ctx context.Context, opts model.CreateNetworkOptions) (*model.Network, error) {
	return s.adapter.Create(ctx, opts)
}

func (s *NetworkServiceImpl) Delete(ctx context.Context, id string) error {
	return s.adapter.Delete(ctx, id)
}

func (s *NetworkServiceImpl) Connect(ctx context.Context, networkID string, opts model.ConnectOptions) error {
	return s.adapter.Connect(ctx, networkID, opts)
}

func (s *NetworkServiceImpl) Disconnect(ctx context.Context, networkID string, opts model.DisconnectOptions) error {
	return s.adapter.Disconnect(ctx, networkID, opts)
}
