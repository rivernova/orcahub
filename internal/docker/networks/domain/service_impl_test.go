package domain_test

import (
	"context"
	"errors"
	"testing"

	"github.com/rivernova/orcahub/internal/docker/networks/domain"
	"github.com/rivernova/orcahub/internal/docker/networks/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockNetworkAdapter struct{ mock.Mock }

func (m *mockNetworkAdapter) List(ctx context.Context) ([]model.Network, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Network), args.Error(1)
}
func (m *mockNetworkAdapter) Inspect(ctx context.Context, id string) (*model.Network, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Network), args.Error(1)
}
func (m *mockNetworkAdapter) Create(ctx context.Context, opts model.CreateNetworkOptions) (*model.Network, error) {
	args := m.Called(ctx, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Network), args.Error(1)
}
func (m *mockNetworkAdapter) Delete(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockNetworkAdapter) Connect(ctx context.Context, networkID string, opts model.ConnectOptions) error {
	return m.Called(ctx, networkID, opts).Error(0)
}
func (m *mockNetworkAdapter) Disconnect(ctx context.Context, networkID string, opts model.DisconnectOptions) error {
	return m.Called(ctx, networkID, opts).Error(0)
}

func TestNetworkService_List(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	expected := []model.Network{
		{ID: "net1", Name: "bridge", Driver: "bridge"},
		{ID: "net2", Name: "host", Driver: "host"},
	}
	a.On("List", ctx).Return(expected, nil)

	result, err := svc.List(ctx)
	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "bridge", result[0].Name)
}

func TestNetworkService_List_Error(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	a.On("List", ctx).Return([]model.Network{}, errors.New("daemon error"))

	_, err := svc.List(ctx)
	assert.Error(t, err)
}

func TestNetworkService_Inspect(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	expected := &model.Network{
		ID:     "net1",
		Name:   "my-network",
		Driver: "bridge",
		IPAM: model.IPAM{
			Driver: "default",
			Config: []model.IPAMPool{{Subnet: "172.18.0.0/16", Gateway: "172.18.0.1"}},
		},
	}
	a.On("Inspect", ctx, "net1").Return(expected, nil)

	result, err := svc.Inspect(ctx, "net1")
	assert.NoError(t, err)
	assert.Equal(t, "172.18.0.0/16", result.IPAM.Config[0].Subnet)
}

func TestNetworkService_Inspect_NotFound(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	a.On("Inspect", ctx, "nope").Return(nil, errors.New("network not found"))

	_, err := svc.Inspect(ctx, "nope")
	assert.Error(t, err)
}

func TestNetworkService_Create(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	opts := model.CreateNetworkOptions{Name: "my-network", Driver: "bridge"}
	expected := &model.Network{ID: "newnet", Name: "my-network", Driver: "bridge"}
	a.On("Create", ctx, opts).Return(expected, nil)

	result, err := svc.Create(ctx, opts)
	assert.NoError(t, err)
	assert.Equal(t, "newnet", result.ID)
}

func TestNetworkService_Delete(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	a.On("Delete", ctx, "net1").Return(nil)
	assert.NoError(t, svc.Delete(ctx, "net1"))
}

func TestNetworkService_Connect(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	opts := model.ConnectOptions{ContainerID: "abc123", IPv4Address: "172.18.0.5"}
	a.On("Connect", ctx, "net1", opts).Return(nil)

	assert.NoError(t, svc.Connect(ctx, "net1", opts))
}

func TestNetworkService_Disconnect(t *testing.T) {
	a := &mockNetworkAdapter{}
	svc := domain.NewNetworkServiceImpl(a)
	ctx := context.Background()

	opts := model.DisconnectOptions{ContainerID: "abc123", Force: false}
	a.On("Disconnect", ctx, "net1", opts).Return(nil)

	assert.NoError(t, svc.Disconnect(ctx, "net1", opts))
}
