package adapter_test

import (
	"context"
	"testing"

	"github.com/rivernova/orcahub/internal/docker/images/adapter"
	"github.com/rivernova/orcahub/internal/docker/images/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Run with: go test -tags integration ./internal/docker/images/adapter/...

func TestImageAdapter_List(t *testing.T) {
	a, err := adapter.NewImageAdapterImpl()
	require.NoError(t, err)

	images, err := a.List(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, images)
}

func TestImageAdapter_Pull_And_Inspect_And_Delete(t *testing.T) {
	a, err := adapter.NewImageAdapterImpl()
	require.NoError(t, err)
	ctx := context.Background()

	// Pull a small image
	err = a.Pull(ctx, model.PullOptions{Image: "alpine:latest"})
	require.NoError(t, err)

	// Inspect
	img, err := a.Inspect(ctx, "alpine:latest")
	require.NoError(t, err)
	assert.Equal(t, "linux", img.Os)
	assert.NotEmpty(t, img.ID)
	assert.NotEmpty(t, img.Tags)
	t.Logf("Inspected image: %s layers=%d", img.ID, img.Layers)

	// Delete — untagged first, then by ID
	result, err := a.Delete(ctx, "alpine:latest", model.RemoveOptions{Force: false})
	require.NoError(t, err)
	assert.NotEmpty(t, result.Untagged)
}

func TestImageAdapter_Inspect_NotFound(t *testing.T) {
	a, err := adapter.NewImageAdapterImpl()
	require.NoError(t, err)

	_, err = a.Inspect(context.Background(), "sha256:doesnotexist0000000000000000")
	assert.Error(t, err)
}
