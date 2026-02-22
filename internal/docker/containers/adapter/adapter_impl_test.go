package adapter_test

import (
	"context"
	"testing"
	"time"

	"github.com/rivernova/orcahub/internal/docker/containers/adapter"
	"github.com/rivernova/orcahub/internal/docker/containers/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDockerAdapter_List(t *testing.T) {
	a, err := adapter.NewContainerAdapterImpl()
	require.NoError(t, err)

	containers, err := a.List(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, containers)
	// we can't assert a specific count since it depends on the environment
}

func TestDockerAdapter_Lifecycle(t *testing.T) {
	a, err := adapter.NewContainerAdapterImpl()
	require.NoError(t, err)
	ctx := context.Background()

	// Create
	created, err := a.Create(ctx, model.Container{
		Name:  "orcahub-test-container",
		Image: "alpine:latest",
		Cmd:   []string{"sleep", "60"},
	})
	require.NoError(t, err)
	require.NotEmpty(t, created.ID)
	t.Logf("Created container: %s", created.ID)

	// cleanup regardless of test outcome
	t.Cleanup(func() {
		_ = a.Delete(ctx, created.ID)
	})

	// Start
	err = a.Start(ctx, created.ID)
	require.NoError(t, err)

	// Inspect — verify it's running
	time.Sleep(500 * time.Millisecond)
	container, err := a.Inspect(ctx, created.ID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, container.ID)
	assert.Equal(t, "running", container.State)

	// Stats
	stats, err := a.Stats(ctx, created.ID)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, stats.CPUPercent, 0.0)
	assert.Greater(t, stats.MemoryLimit, uint64(0))

	// Logs
	logs, err := a.Logs(ctx, created.ID, model.LogsOptions{Tail: "10"})
	require.NoError(t, err)
	assert.NotNil(t, logs)

	// Exec
	result, err := a.Exec(ctx, created.ID, model.ExecOptions{
		Command:      []string{"echo", "orcahub"},
		AttachStdout: true,
		AttachStderr: true,
	})
	require.NoError(t, err)
	assert.Equal(t, 0, result.ExitCode)

	// Stop
	timeout := 5
	err = a.Stop(ctx, created.ID, &timeout)
	require.NoError(t, err)

	// Restart
	err = a.Start(ctx, created.ID)
	require.NoError(t, err)
	err = a.Restart(ctx, created.ID)
	require.NoError(t, err)

	// Delete
	err = a.Delete(ctx, created.ID)
	require.NoError(t, err)
}

func TestDockerAdapter_Inspect_NotFound(t *testing.T) {
	a, err := adapter.NewContainerAdapterImpl()
	require.NoError(t, err)

	_, err = a.Inspect(context.Background(), "nonexistent-container-id")
	assert.Error(t, err)
}
