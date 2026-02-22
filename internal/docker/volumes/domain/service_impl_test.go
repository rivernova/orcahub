package domain_test

import (
	"context"
	"errors"
	"testing"

	"github.com/rivernova/orcahub/internal/docker/volumes/domain"
	"github.com/rivernova/orcahub/internal/docker/volumes/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockVolumeAdapter struct{ mock.Mock }

func (m *mockVolumeAdapter) List(ctx context.Context) ([]model.Volume, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Volume), args.Error(1)
}
func (m *mockVolumeAdapter) Inspect(ctx context.Context, name string) (*model.Volume, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Volume), args.Error(1)
}
func (m *mockVolumeAdapter) Create(ctx context.Context, opts model.CreateVolumeOptions) (*model.Volume, error) {
	args := m.Called(ctx, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Volume), args.Error(1)
}
func (m *mockVolumeAdapter) Delete(ctx context.Context, name string) error {
	return m.Called(ctx, name).Error(0)
}

func TestVolumeService_List(t *testing.T) {
	a := &mockVolumeAdapter{}
	svc := domain.NewVolumeServiceImpl(a)
	ctx := context.Background()

	expected := []model.Volume{
		{Name: "postgres-data", Driver: "local"},
		{Name: "redis-data", Driver: "local"},
	}
	a.On("List", ctx).Return(expected, nil)

	result, err := svc.List(ctx)
	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "postgres-data", result[0].Name)
}

func TestVolumeService_List_Error(t *testing.T) {
	a := &mockVolumeAdapter{}
	svc := domain.NewVolumeServiceImpl(a)
	ctx := context.Background()

	a.On("List", ctx).Return([]model.Volume{}, errors.New("daemon error"))

	_, err := svc.List(ctx)
	assert.Error(t, err)
}

func TestVolumeService_Inspect(t *testing.T) {
	a := &mockVolumeAdapter{}
	svc := domain.NewVolumeServiceImpl(a)
	ctx := context.Background()

	expected := &model.Volume{
		Name:       "postgres-data",
		Driver:     "local",
		Mountpoint: "/var/lib/docker/volumes/postgres-data/_data",
	}
	a.On("Inspect", ctx, "postgres-data").Return(expected, nil)

	result, err := svc.Inspect(ctx, "postgres-data")
	assert.NoError(t, err)
	assert.Equal(t, "/var/lib/docker/volumes/postgres-data/_data", result.Mountpoint)
}

func TestVolumeService_Inspect_NotFound(t *testing.T) {
	a := &mockVolumeAdapter{}
	svc := domain.NewVolumeServiceImpl(a)
	ctx := context.Background()

	a.On("Inspect", ctx, "nope").Return(nil, errors.New("volume not found"))

	_, err := svc.Inspect(ctx, "nope")
	assert.Error(t, err)
}

func TestVolumeService_Create(t *testing.T) {
	a := &mockVolumeAdapter{}
	svc := domain.NewVolumeServiceImpl(a)
	ctx := context.Background()

	opts := model.CreateVolumeOptions{Name: "my-vol", Driver: "local"}
	expected := &model.Volume{Name: "my-vol", Driver: "local"}
	a.On("Create", ctx, opts).Return(expected, nil)

	result, err := svc.Create(ctx, opts)
	assert.NoError(t, err)
	assert.Equal(t, "my-vol", result.Name)
}

func TestVolumeService_Delete(t *testing.T) {
	a := &mockVolumeAdapter{}
	svc := domain.NewVolumeServiceImpl(a)
	ctx := context.Background()

	a.On("Delete", ctx, "my-vol").Return(nil)
	assert.NoError(t, svc.Delete(ctx, "my-vol"))
}

func TestVolumeService_Delete_Error(t *testing.T) {
	a := &mockVolumeAdapter{}
	svc := domain.NewVolumeServiceImpl(a)
	ctx := context.Background()

	a.On("Delete", ctx, "in-use").Return(errors.New("volume in use"))
	assert.Error(t, svc.Delete(ctx, "in-use"))
}
