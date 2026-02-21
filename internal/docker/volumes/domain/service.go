package domain

import "context"

type VolumeService interface {
	List(ctx context.Context) ([]Volume, error)
	Inspect(ctx context.Context, name string) (*Volume, error)
	Create(ctx context.Context, opts CreateVolumeOptions) (*Volume, error)
	Delete(ctx context.Context, name string) error
}
