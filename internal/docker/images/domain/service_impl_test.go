package domain_test

import (
	"context"
	"errors"
	"testing"

	"github.com/rivernova/orcahub/internal/docker/images/domain"
	"github.com/rivernova/orcahub/internal/docker/images/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockImageAdapter struct{ mock.Mock }

func (m *mockImageAdapter) List(ctx context.Context) ([]model.Image, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Image), args.Error(1)
}
func (m *mockImageAdapter) Inspect(ctx context.Context, id string) (*model.Image, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Image), args.Error(1)
}
func (m *mockImageAdapter) Delete(ctx context.Context, id string, opts model.RemoveOptions) (*model.RemoveResult, error) {
	args := m.Called(ctx, id, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.RemoveResult), args.Error(1)
}
func (m *mockImageAdapter) Pull(ctx context.Context, opts model.PullOptions) error {
	return m.Called(ctx, opts).Error(0)
}
func (m *mockImageAdapter) Build(ctx context.Context, opts model.BuildOptions) (*model.BuildResult, error) {
	args := m.Called(ctx, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.BuildResult), args.Error(1)
}

func TestImageService_List(t *testing.T) {
	a := &mockImageAdapter{}
	svc := domain.NewImageServiceImpl(a)
	ctx := context.Background()

	expected := []model.Image{
		{ID: "sha256:abc", Tags: []string{"nginx:latest"}},
	}
	a.On("List", ctx).Return(expected, nil)

	result, err := svc.List(ctx)
	assert.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestImageService_List_Error(t *testing.T) {
	a := &mockImageAdapter{}
	svc := domain.NewImageServiceImpl(a)
	ctx := context.Background()

	a.On("List", ctx).Return([]model.Image{}, errors.New("daemon error"))

	_, err := svc.List(ctx)
	assert.Error(t, err)
}

func TestImageService_Inspect(t *testing.T) {
	a := &mockImageAdapter{}
	svc := domain.NewImageServiceImpl(a)
	ctx := context.Background()

	expected := &model.Image{ID: "sha256:abc", Tags: []string{"nginx:latest"}, Os: "linux"}
	a.On("Inspect", ctx, "sha256:abc").Return(expected, nil)

	result, err := svc.Inspect(ctx, "sha256:abc")
	assert.NoError(t, err)
	assert.Equal(t, "linux", result.Os)
}

func TestImageService_Delete(t *testing.T) {
	a := &mockImageAdapter{}
	svc := domain.NewImageServiceImpl(a)
	ctx := context.Background()

	opts := model.RemoveOptions{Force: true}
	expected := &model.RemoveResult{
		Deleted:  []string{"sha256:abc"},
		Untagged: []string{"nginx:latest"},
	}
	a.On("Delete", ctx, "sha256:abc", opts).Return(expected, nil)

	result, err := svc.Delete(ctx, "sha256:abc", opts)
	assert.NoError(t, err)
	assert.Equal(t, []string{"sha256:abc"}, result.Deleted)
}

func TestImageService_Pull(t *testing.T) {
	a := &mockImageAdapter{}
	svc := domain.NewImageServiceImpl(a)
	ctx := context.Background()

	opts := model.PullOptions{Image: "nginx:latest"}
	a.On("Pull", ctx, opts).Return(nil)

	assert.NoError(t, svc.Pull(ctx, opts))
}

func TestImageService_Pull_WithAuth(t *testing.T) {
	a := &mockImageAdapter{}
	svc := domain.NewImageServiceImpl(a)
	ctx := context.Background()

	opts := model.PullOptions{
		Image: "myregistry.com/myapp:v1",
		Auth:  &model.RegistryAuth{Username: "user", Password: "pass"},
	}
	a.On("Pull", ctx, opts).Return(nil)

	assert.NoError(t, svc.Pull(ctx, opts))
}

func TestImageService_Build(t *testing.T) {
	a := &mockImageAdapter{}
	svc := domain.NewImageServiceImpl(a)
	ctx := context.Background()

	opts := model.BuildOptions{Tag: "myapp:latest", Context: "/tmp/project"}
	expected := &model.BuildResult{ImageID: "sha256:new", Tags: []string{"myapp:latest"}}
	a.On("Build", ctx, opts).Return(expected, nil)

	result, err := svc.Build(ctx, opts)
	assert.NoError(t, err)
	assert.Equal(t, "sha256:new", result.ImageID)
}
