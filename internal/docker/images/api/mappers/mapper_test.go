package api_test

import (
	"testing"

	"github.com/rivernova/orcahub/internal/docker/images/api/mappers"
	"github.com/rivernova/orcahub/internal/docker/images/model"
	"github.com/stretchr/testify/assert"
)

func TestToImageResponse(t *testing.T) {
	img := model.Image{
		ID:         "sha256:abc",
		Tags:       []string{"nginx:latest", "nginx:1.25"},
		Size:       54321000,
		Created:    1700000000,
		Labels:     map[string]string{"maintainer": "team"},
		Containers: 3,
	}

	resp := mappers.ToImageResponse(img)

	assert.Equal(t, "sha256:abc", resp.ID)
	assert.Equal(t, []string{"nginx:latest", "nginx:1.25"}, resp.Tags)
	assert.Equal(t, int64(54321000), resp.Size)
	assert.Equal(t, int64(1700000000), resp.Created)
	assert.Equal(t, int64(3), resp.Containers)
}

func TestToImageResponseList(t *testing.T) {
	images := []model.Image{
		{ID: "sha256:aaa", Tags: []string{"nginx:latest"}},
		{ID: "sha256:bbb", Tags: []string{"redis:7"}},
	}

	result := mappers.ToImageResponseList(images)

	assert.Len(t, result, 2)
	assert.Equal(t, "sha256:aaa", result[0].ID)
	assert.Equal(t, "sha256:bbb", result[1].ID)
}

func TestToImageResponseList_Empty(t *testing.T) {
	result := mappers.ToImageResponseList([]model.Image{})
	assert.Empty(t, result)
}

func TestToImageInspectResponse(t *testing.T) {
	img := &model.Image{
		ID:           "sha256:abc",
		Tags:         []string{"nginx:latest"},
		Size:         54321000,
		Os:           "linux",
		Architecture: "amd64",
		Author:       "NGINX Docker Maintainers",
		Cmd:          []string{"nginx", "-g", "daemon off;"},
		Entrypoint:   []string{"/docker-entrypoint.sh"},
		Env:          []string{"PATH=/usr/local/sbin"},
		WorkingDir:   "/",
		ExposedPorts: []string{"80/tcp"},
		Layers:       7,
		VirtualSize:  142000000,
	}

	resp := mappers.ToImageInspectResponse(img)

	assert.Equal(t, "sha256:abc", resp.ID)
	assert.Equal(t, "linux", resp.Os)
	assert.Equal(t, "amd64", resp.Architecture)
	assert.Equal(t, "NGINX Docker Maintainers", resp.Author)
	assert.Equal(t, []string{"nginx", "-g", "daemon off;"}, resp.Cmd)
	assert.Equal(t, []string{"80/tcp"}, resp.ExposedPorts)
	assert.Equal(t, 7, resp.Layers)
	assert.Equal(t, int64(142000000), resp.VirtualSize)
}
