package adapter_test

import (
	"context"
	"testing"

	"github.com/rivernova/orcahub/internal/docker/volumes/adapter"
	"github.com/rivernova/orcahub/internal/docker/volumes/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVolumeAdapter_List(t *testing.T) {
	a, err := adapter.NewVolumeAdapterImpl()
	require.NoError(t, err)

	volumes, err := a.List(context.Background())
	assert.NoError(t, err)
	assert.NotNil(t, volumes)
}

func TestVolumeAdapter_Lifecycle(t *testing.T) {
	a, err := adapter.NewVolumeAdapterImpl()
	require.NoError(t, err)
	ctx := context.Background()

	vol, err := a.Create(ctx, model.CreateVolumeOptions{
		Name:   "orcahub-test-volume",
		Driver: "local",
		Labels: map[string]string{"test": "orcahub"},
	})
	require.NoError(t, err)
	assert.Equal(t, "orcahub-test-volume", vol.Name)
	assert.Equal(t, "local", vol.Driver)
	assert.NotEmpty(t, vol.Mountpoint)

	t.Cleanup(func() { _ = a.Delete(ctx, "orcahub-test-volume") })

	inspected, err := a.Inspect(ctx, "orcahub-test-volume")
	require.NoError(t, err)
	assert.Equal(t, "orcahub-test-volume", inspected.Name)
	assert.Equal(t, vol.Mountpoint, inspected.Mountpoint)

	volumes, err := a.List(ctx)
	require.NoError(t, err)
	found := false
	for _, v := range volumes {
		if v.Name == "orcahub-test-volume" {
			found = true
			break
		}
	}
	assert.True(t, found, "created volume should appear in list")

	err = a.Delete(ctx, "orcahub-test-volume")
	require.NoError(t, err)
}

func TestVolumeAdapter_Inspect_NotFound(t *testing.T) {
	a, err := adapter.NewVolumeAdapterImpl()
	require.NoError(t, err)

	_, err = a.Inspect(context.Background(), "nonexistent-volume")
	assert.Error(t, err)
}
