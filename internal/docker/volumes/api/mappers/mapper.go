package mappers

import (
	responses "github.com/rivernova/orcahub/internal/docker/volumes/api/responses"
	model "github.com/rivernova/orcahub/internal/docker/volumes/model"
)

func ToVolumeResponseList(vs []model.Volume) []responses.VolumeResponse {
	result := make([]responses.VolumeResponse, 0, len(vs))
	for _, v := range vs {
		result = append(result, ToVolumeResponse(v))
	}
	return result
}

func ToVolumeResponse(v model.Volume) responses.VolumeResponse {
	return responses.VolumeResponse{
		Name:       v.Name,
		Driver:     v.Driver,
		Mountpoint: v.Mountpoint,
		Labels:     v.Labels,
		Scope:      v.Scope,
		CreatedAt:  v.CreatedAt,
	}
}

func ToVolumeInspectResponse(v *model.Volume) *responses.VolumeInspectResponse {
	return &responses.VolumeInspectResponse{
		VolumeResponse: ToVolumeResponse(*v),
		Options:        v.Options,
		Status:         v.Status,
	}
}
