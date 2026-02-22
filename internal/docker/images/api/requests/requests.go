package requests

type PullImageRequest struct {
	Image string        `json:"image" binding:"required"` // e.g. "nginx:latest"
	Auth  *RegistryAuth `json:"auth"`                     // opcional para registries privados
}

type RegistryAuth struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	ServerAddress string `json:"server_address"`
}

type BuildImageRequest struct {
	Tag        string            `json:"tag" binding:"required"`     // e.g. "myapp:1.0"
	Dockerfile string            `json:"dockerfile"`                 // path dentro del contexto, default "Dockerfile"
	Context    string            `json:"context" binding:"required"` // path al build context
	BuildArgs  map[string]string `json:"build_args"`
	Labels     map[string]string `json:"labels"`
	NoCache    bool              `json:"no_cache"`
}

type RemoveImageRequest struct {
	Force         bool `form:"force"`
	PruneChildren bool `form:"prune_children"`
}
