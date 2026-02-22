package adapter_test

import (
	"context"
	"testing"

	"github.com/rivernova/orcahub/internal/docker/networks/adapter"
	"github.com/rivernova/orcahub/internal/docker/networks/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Run with: go test -tags integration ./internal/docker/networks/adapter/...

func TestNetworkAdapter_List(t *testing.T) {
	a, err := adapter.NewNetworkAdapterImpl()
	require.NoError(t, err)

	networks, err := a.List(context.Background())
	assert.NoError(t, err)
	assert.NotNil(t, networks)

	// bridge and host are always present in any Docker installation
	names := make(map[string]bool)
	for _, n := range networks {
		names[n.Name] = true
	}
	assert.True(t, names["bridge"], "bridge network should always exist")
}

func TestNetworkAdapter_Lifecycle(t *testing.T) {
	a, err := adapter.NewNetworkAdapterImpl()
	require.NoError(t, err)
	ctx := context.Background()

	// Create
	net, err := a.Create(ctx, model.CreateNetworkOptions{
		Name:   "orcahub-test-network",
		Driver: "bridge",
		Labels: map[string]string{"test": "orcahub"},
	})
	require.NoError(t, err)
	require.NotEmpty(t, net.ID)
	assert.Equal(t, "orcahub-test-network", net.Name)
	assert.Equal(t, "bridge", net.Driver)

	t.Cleanup(func() { _ = a.Delete(ctx, net.ID) })

	// Inspect
	inspected, err := a.Inspect(ctx, net.ID)
	require.NoError(t, err)
	assert.Equal(t, net.ID, inspected.ID)
	assert.Equal(t, "bridge", inspected.Driver)
	assert.NotEmpty(t, inspected.IPAM.Config)

	// Delete
	err = a.Delete(ctx, net.ID)
	require.NoError(t, err)
}

func TestNetworkAdapter_Inspect_NotFound(t *testing.T) {
	a, err := adapter.NewNetworkAdapterImpl()
	require.NoError(t, err)

	_, err = a.Inspect(context.Background(), "nonexistent-network-id")
	assert.Error(t, err)
}
