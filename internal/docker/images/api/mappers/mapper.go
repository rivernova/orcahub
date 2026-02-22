package mappers

import (
	responses "github.com/rivernova/orcahub/internal/docker/images/api/responses"
	model "github.com/rivernova/orcahub/internal/docker/images/model"
)

func ToImageResponseList(imgs []model.Image) []responses.ImageResponse {
	result := make([]responses.ImageResponse, 0, len(imgs))
	for _, img := range imgs {
		result = append(result, ToImageResponse(img))
	}
	return result
}

func ToImageResponse(img model.Image) responses.ImageResponse {
	return responses.ImageResponse{
		ID:         img.ID,
		Tags:       img.Tags,
		Size:       img.Size,
		Created:    img.Created,
		Labels:     img.Labels,
		Containers: img.Containers,
	}
}

func ToImageInspectResponse(img *model.Image) *responses.ImageInspectResponse {
	return &responses.ImageInspectResponse{
		ImageResponse: ToImageResponse(*img),
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
