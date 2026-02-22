package api

import (
	model "github.com/rivernova/orcahub/internal/docker/volumes/model"
)

func toVolumeResponseList(vs []model.Volume) []VolumeResponse {
	result := make([]VolumeResponse, 0, len(vs))
	for _, v := range vs {
		result = append(result, toVolumeResponse(v))
	}
	return result
}

func toVolumeResponse(v model.Volume) VolumeResponse {
	return VolumeResponse{
		Name:       v.Name,
		Driver:     v.Driver,
		Mountpoint: v.Mountpoint,
		Labels:     v.Labels,
		Scope:      v.Scope,
		CreatedAt:  v.CreatedAt,
	}
}

func toVolumeInspectResponse(v *model.Volume) *VolumeInspectResponse {
	return &VolumeInspectResponse{
		VolumeResponse: toVolumeResponse(*v),
		Options:        v.Options,
		Status:         v.Status,
	}
}
