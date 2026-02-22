package adapter

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/registry"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/archive"
	"github.com/rivernova/orcahub/internal/docker/images/domain"
)

type ImageAdapterImpl struct {
	client *client.Client
}

func NewImageAdapterImpl() (*ImageAdapterImpl, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}
	return &ImageAdapterImpl{client: cli}, nil
}

var _ ImageAdapter = (*ImageAdapterImpl)(nil)

func (a *ImageAdapterImpl) List(ctx context.Context) ([]domain.Image, error) {
	images, err := a.client.ImageList(ctx, image.ListOptions{All: true})
	if err != nil {
		return nil, fmt.Errorf("failed to list images: %w", err)
	}

	result := make([]domain.Image, 0, len(images))
	for _, img := range images {
		result = append(result, domain.Image{
			ID:         img.ID,
			Tags:       img.RepoTags,
			Size:       img.Size,
			Created:    img.Created,
			Labels:     img.Labels,
			Containers: img.Containers,
		})
	}
	return result, nil
}

func (a *ImageAdapterImpl) Inspect(ctx context.Context, id string) (*domain.Image, error) {
	img, _, err := a.client.ImageInspectWithRaw(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect image %s: %w", id, err)
	}

	exposedPorts := make([]string, 0, len(img.Config.ExposedPorts))
	for port := range img.Config.ExposedPorts {
		exposedPorts = append(exposedPorts, string(port))
	}

	created, _ := time.Parse(time.RFC3339Nano, img.Created)

	return &domain.Image{
		ID:           img.ID,
		Tags:         img.RepoTags,
		Size:         img.Size,
		Created:      created.Unix(),
		Labels:       img.Config.Labels,
		Os:           img.Os,
		Architecture: img.Architecture,
		Author:       img.Author,
		Comment:      img.Comment,
		Cmd:          img.Config.Cmd,
		Entrypoint:   img.Config.Entrypoint,
		Env:          img.Config.Env,
		WorkingDir:   img.Config.WorkingDir,
		ExposedPorts: exposedPorts,
		Layers:       len(img.RootFS.Layers),
		VirtualSize:  img.VirtualSize,
	}, nil
}

func (a *ImageAdapterImpl) Delete(ctx context.Context, id string, opts domain.RemoveOptions) (*domain.RemoveResult, error) {
	items, err := a.client.ImageRemove(ctx, id, image.RemoveOptions{
		Force:         opts.Force,
		PruneChildren: opts.PruneChildren,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to delete image %s: %w", id, err)
	}

	result := &domain.RemoveResult{}
	for _, item := range items {
		if item.Deleted != "" {
			result.Deleted = append(result.Deleted, item.Deleted)
		}
		if item.Untagged != "" {
			result.Untagged = append(result.Untagged, item.Untagged)
		}
	}
	return result, nil
}

func (a *ImageAdapterImpl) Pull(ctx context.Context, opts domain.PullOptions) error {
	pullOpts := image.PullOptions{}

	if opts.Auth != nil {
		authConfig := registry.AuthConfig{
			Username:      opts.Auth.Username,
			Password:      opts.Auth.Password,
			ServerAddress: opts.Auth.ServerAddress,
		}
		authBytes, err := json.Marshal(authConfig)
		if err != nil {
			return fmt.Errorf("failed to encode auth config: %w", err)
		}
		pullOpts.RegistryAuth = base64.URLEncoding.EncodeToString(authBytes)
	}

	reader, err := a.client.ImagePull(ctx, opts.Image, pullOpts)
	if err != nil {
		return fmt.Errorf("failed to pull image %s: %w", opts.Image, err)
	}
	defer reader.Close()

	_, err = io.Copy(io.Discard, reader)
	return err
}

func (a *ImageAdapterImpl) Build(ctx context.Context, opts domain.BuildOptions) (*domain.BuildResult, error) {
	dockerfile := opts.Dockerfile
	if dockerfile == "" {
		dockerfile = "Dockerfile"
	}

	buildContext, err := archive.TarWithOptions(opts.Context, &archive.TarOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create build context: %w", err)
	}
	defer buildContext.Close()

	buildArgs := make(map[string]*string, len(opts.BuildArgs))
	for k, v := range opts.BuildArgs {
		val := v
		buildArgs[k] = &val
	}

	resp, err := a.client.ImageBuild(ctx, buildContext, types.ImageBuildOptions{
		Tags:       []string{opts.Tag},
		Dockerfile: dockerfile,
		BuildArgs:  buildArgs,
		Labels:     opts.Labels,
		NoCache:    opts.NoCache,
		Remove:     true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to build image: %w", err)
	}
	defer resp.Body.Close()

	var warnings []string
	decoder := json.NewDecoder(resp.Body)
	var imageID string
	for {
		var msg struct {
			Stream string `json:"stream"`
			Error  string `json:"error"`
			Aux    struct {
				ID string `json:"ID"`
			} `json:"aux"`
		}
		if err := decoder.Decode(&msg); err == io.EOF {
			break
		} else if err != nil {
			break
		}
		if msg.Error != "" {
			return nil, fmt.Errorf("build error: %s", msg.Error)
		}
		if msg.Aux.ID != "" {
			imageID = msg.Aux.ID
		}
		if strings.Contains(msg.Stream, "WARNING") {
			warnings = append(warnings, strings.TrimSpace(msg.Stream))
		}
	}

	return &domain.BuildResult{
		ImageID:  imageID,
		Tags:     []string{opts.Tag},
		Warnings: warnings,
	}, nil
}
