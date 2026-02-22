package model

type Image struct {
	ID           string
	Tags         []string
	Size         int64
	Created      int64
	Labels       map[string]string
	Containers   int64
	Os           string
	Architecture string
	Author       string
	Comment      string
	Cmd          []string
	Entrypoint   []string
	Env          []string
	WorkingDir   string
	ExposedPorts []string
	Layers       int
	VirtualSize  int64
}

type PullOptions struct {
	Image string
	Auth  *RegistryAuth
}

type RegistryAuth struct {
	Username      string
	Password      string
	ServerAddress string
}

type BuildOptions struct {
	Tag        string
	Dockerfile string
	Context    string
	BuildArgs  map[string]string
	Labels     map[string]string
	NoCache    bool
}

type BuildResult struct {
	ImageID  string
	Tags     []string
	Warnings []string
}

type RemoveOptions struct {
	Force         bool
	PruneChildren bool
}

type RemoveResult struct {
	Deleted  []string
	Untagged []string
}
