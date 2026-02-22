package domain_test

import (
	"context"
	"errors"
	"testing"

	"github.com/rivernova/orcahub/internal/docker/containers/domain"
	"github.com/rivernova/orcahub/internal/docker/containers/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockAdapter struct{ mock.Mock }

func (m *mockAdapter) List(ctx context.Context) ([]model.Container, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Container), args.Error(1)
}
func (m *mockAdapter) Inspect(ctx context.Context, id string) (*model.Container, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Container), args.Error(1)
}
func (m *mockAdapter) Create(ctx context.Context, c model.Container) (*model.Container, error) {
	args := m.Called(ctx, c)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Container), args.Error(1)
}
func (m *mockAdapter) Delete(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockAdapter) Start(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockAdapter) Stop(ctx context.Context, id string, timeout *int) error {
	return m.Called(ctx, id, timeout).Error(0)
}
func (m *mockAdapter) Restart(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockAdapter) Logs(ctx context.Context, id string, opts model.LogsOptions) ([]string, error) {
	args := m.Called(ctx, id, opts)
	return args.Get(0).([]string), args.Error(1)
}
func (m *mockAdapter) Stats(ctx context.Context, id string) (*model.ContainerStats, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ContainerStats), args.Error(1)
}
func (m *mockAdapter) Exec(ctx context.Context, id string, opts model.ExecOptions) (*model.ExecResult, error) {
	args := m.Called(ctx, id, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ExecResult), args.Error(1)
}

func TestContainerService_List(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	expected := []model.Container{
		{ID: "abc", Name: "app1"},
		{ID: "def", Name: "app2"},
	}
	adapter.On("List", ctx).Return(expected, nil)

	result, err := svc.List(ctx)

	assert.NoError(t, err)
	assert.Equal(t, expected, result)
	adapter.AssertExpectations(t)
}

func TestContainerService_List_Error(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	adapter.On("List", ctx).Return([]model.Container{}, errors.New("docker daemon unreachable"))

	result, err := svc.List(ctx)

	assert.Error(t, err)
	assert.Empty(t, result)
	assert.EqualError(t, err, "docker daemon unreachable")
}

func TestContainerService_Inspect(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	expected := &model.Container{ID: "abc123", Name: "my-app", State: "running"}
	adapter.On("Inspect", ctx, "abc123").Return(expected, nil)

	result, err := svc.Inspect(ctx, "abc123")

	assert.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestContainerService_Inspect_NotFound(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	adapter.On("Inspect", ctx, "notexist").Return(nil, errors.New("container not found"))

	result, err := svc.Inspect(ctx, "notexist")

	assert.Error(t, err)
	assert.Nil(t, result)
}

func TestContainerService_Create(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	input := model.Container{Name: "new-app", Image: "nginx:latest"}
	created := &model.Container{ID: "newid123", Name: "new-app"}
	adapter.On("Create", ctx, input).Return(created, nil)

	result, err := svc.Create(ctx, input)

	assert.NoError(t, err)
	assert.Equal(t, "newid123", result.ID)
}

func TestContainerService_Delete(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	adapter.On("Delete", ctx, "abc123").Return(nil)

	err := svc.Delete(ctx, "abc123")

	assert.NoError(t, err)
}

func TestContainerService_Start(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	adapter.On("Start", ctx, "abc123").Return(nil)
	assert.NoError(t, svc.Start(ctx, "abc123"))
}

func TestContainerService_Stop(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	timeout := 10
	adapter.On("Stop", ctx, "abc123", &timeout).Return(nil)
	assert.NoError(t, svc.Stop(ctx, "abc123", &timeout))
}

func TestContainerService_Stop_NilTimeout(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	adapter.On("Stop", ctx, "abc123", (*int)(nil)).Return(nil)
	assert.NoError(t, svc.Stop(ctx, "abc123", nil))
}

func TestContainerService_Restart(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	adapter.On("Restart", ctx, "abc123").Return(nil)
	assert.NoError(t, svc.Restart(ctx, "abc123"))
}

func TestContainerService_Logs(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	opts := model.LogsOptions{Tail: "100", Follow: false}
	expected := []string{"line1", "line2", "line3"}
	adapter.On("Logs", ctx, "abc123", opts).Return(expected, nil)

	result, err := svc.Logs(ctx, "abc123", opts)

	assert.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestContainerService_Stats(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	expected := &model.ContainerStats{CPUPercent: 5.2, MemoryUsage: 52428800}
	adapter.On("Stats", ctx, "abc123").Return(expected, nil)

	result, err := svc.Stats(ctx, "abc123")

	assert.NoError(t, err)
	assert.Equal(t, 5.2, result.CPUPercent)
	assert.Equal(t, uint64(52428800), result.MemoryUsage)
}

func TestContainerService_Exec(t *testing.T) {
	adapter := &mockAdapter{}
	svc := domain.NewContainerServiceImpl(adapter)
	ctx := context.Background()

	opts := model.ExecOptions{Command: []string{"ls", "-la"}, AttachStdout: true}
	expected := &model.ExecResult{Output: "total 48\n...", ExitCode: 0}
	adapter.On("Exec", ctx, "abc123", opts).Return(expected, nil)

	result, err := svc.Exec(ctx, "abc123", opts)

	assert.NoError(t, err)
	assert.Equal(t, 0, result.ExitCode)
	assert.Contains(t, result.Output, "total 48")
}
