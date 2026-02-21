package api

import (
	domain "github.com/rivernova/orcahub/internal/docker/images/domain"
)

func toImageResponseList(imgs []domain.Image) []ImageResponse {
	result := make([]ImageResponse, 0, len(imgs))
	for _, img := range imgs {
		result = append(result, toImageResponse(img))
	}
	return result
}

func toImageResponse(img domain.Image) ImageResponse {
	return ImageResponse{
		ID:         img.ID,
		Tags:       img.Tags,
		Size:       img.Size,
		Created:    img.Created,
		Labels:     img.Labels,
		Containers: img.Containers,
	}
}

func toImageInspectResponse(img *domain.Image) *ImageInspectResponse {
	return &ImageInspectResponse{
		ImageResponse: toImageResponse(*img),
		Os:            img.Os,
		Architecture:  img.Architecture,
		Author:        img.Author,
		Comment:       img.Comment,
		Cmd:           img.Cmd,
		Entrypoint:    img.Entrypoint,
		Env:           img.Env,
		WorkingDir:    img.WorkingDir,
		ExposedPorts:  img.ExposedPorts,
		Layers:        img.Layers,
		VirtualSize:   img.VirtualSize,
	}
}
