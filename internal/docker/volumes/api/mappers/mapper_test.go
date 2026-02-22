package mappers_test

import (
	"testing"

	"github.com/rivernova/orcahub/internal/docker/volumes/api/mappers"
	"github.com/rivernova/orcahub/internal/docker/volumes/model"
	"github.com/stretchr/testify/assert"
)

func TestToVolumeResponse(t *testing.T) {
	v := &model.Volume{
		Name:       "postgres-data",
		Driver:     "local",
		Mountpoint: "/var/lib/docker/volumes/postgres-data/_data",
		Labels:     map[string]string{"app": "postgres"},
		Scope:      "local",
		CreatedAt:  "2024-01-01T00:00:00Z",
	}

	resp := mappers.ToVolumeResponse(v)

	assert.Equal(t, "postgres-data", resp.Name)
	assert.Equal(t, "local", resp.Driver)
	assert.Equal(t, "/var/lib/docker/volumes/postgres-data/_data", resp.Mountpoint)
	assert.Equal(t, "local", resp.Scope)
}

func TestToVolumeInspectResponse(t *testing.T) {
	v := &model.Volume{
		Name:    "my-vol",
		Driver:  "local",
		Options: map[string]string{"type": "nfs"},
		Status:  map[string]interface{}{"MountedAt": "2024-01-01"},
	}

	resp := mappers.ToVolumeInspectResponse(v)

	assert.Equal(t, "my-vol", resp.Name)
	assert.Equal(t, map[string]string{"type": "nfs"}, resp.Options)
	assert.Equal(t, "2024-01-01", resp.Status["MountedAt"])
}

func TestToVolumeResponseList(t *testing.T) {
	volumes := []model.Volume{
		{Name: "vol1", Driver: "local"},
		{Name: "vol2", Driver: "local"},
	}

	result := mappers.ToVolumeResponseList(volumes)

	assert.Len(t, result, 2)
	assert.Equal(t, "vol1", result[0].Name)
	assert.Equal(t, "vol2", result[1].Name)
}

func TestToVolumeResponseList_Empty(t *testing.T) {
	result := mappers.ToVolumeResponseList([]model.Volume{})
	assert.Empty(t, result)
}
