package api

type VolumeResponse struct {
	Name       string            `json:"name"`
	Driver     string            `json:"driver"`
	Mountpoint string            `json:"mountpoint"`
	Labels     map[string]string `json:"labels"`
	Scope      string            `json:"scope"`
	CreatedAt  string            `json:"created_at"`
}

type VolumeInspectResponse struct {
	VolumeResponse
	Options map[string]string      `json:"options"`
	Status  map[string]interface{} `json:"status"`
}
