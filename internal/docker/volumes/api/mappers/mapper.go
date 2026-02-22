package mappers

import (
	responses "github.com/rivernova/orcahub/internal/docker/volumes/api/responses"
	model "github.com/rivernova/orcahub/internal/docker/volumes/model"
)

func toVolumeResponseList(vs []model.Volume) []responses.VolumeResponse {
	result := make([]responses.VolumeResponse, 0, len(vs))
	for _, v := range vs {
		result = append(result, toVolumeResponse(v))
	}
	return result
}

func toVolumeResponse(v model.Volume) responses.VolumeResponse {
	return responses.VolumeResponse{
		Name:       v.Name,
		Driver:     v.Driver,
		Mountpoint: v.Mountpoint,
		Labels:     v.Labels,
		Scope:      v.Scope,
		CreatedAt:  v.CreatedAt,
	}
}

func toVolumeInspectResponse(v *model.Volume) *responses.VolumeInspectResponse {
	return &responses.VolumeInspectResponse{
		VolumeResponse: toVolumeResponse(*v),
		Options:        v.Options,
		Status:         v.Status,
	}
}
