package responses

type ImageResponse struct {
	ID         string            `json:"id"`
	Tags       []string          `json:"tags"`
	Size       int64             `json:"size"`
	Created    int64             `json:"created"`
	Labels     map[string]string `json:"labels"`
	Containers int64             `json:"containers"`
}

type ImageInspectResponse struct {
	ImageResponse
	Os           string   `json:"os"`
	Architecture string   `json:"architecture"`
	Author       string   `json:"author"`
	Comment      string   `json:"comment"`
	Cmd          []string `json:"cmd"`
	Entrypoint   []string `json:"entrypoint"`
	Env          []string `json:"env"`
	WorkingDir   string   `json:"working_dir"`
	ExposedPorts []string `json:"exposed_ports"`
	Layers       int      `json:"layers"`
	VirtualSize  int64    `json:"virtual_size"`
}

type PullImageResponse struct {
	Status   string `json:"status"`
	Progress string `json:"progress"`
}

type BuildImageResponse struct {
	ImageID  string   `json:"image_id"`
	Tags     []string `json:"tags"`
	Warnings []string `json:"warnings"`
}

type RemoveImageResponse struct {
	Deleted  []string `json:"deleted"`
	Untagged []string `json:"untagged"`
}
