package model

type Container struct {
	ID            string
	Name          string
	Image         string
	ImageID       string
	State         string
	Status        string
	Created       int64
	Ports         []Port
	Mounts        []Mount
	Labels        map[string]string
	NetworkMode   string
	RestartPolicy string
	Env           []string
	Cmd           []string
	Entrypoint    []string
	WorkingDir    string
	User          string
	Hostname      string
	Networks      map[string]NetworkEndpoint
	StartedAt     string
	FinishedAt    string
	ExitCode      int
}

type Port struct {
	PrivatePort int
	PublicPort  int
	Type        string
	IP          string
}

type Mount struct {
	Type        string
	Source      string
	Destination string
	Mode        string
	RW          bool
}

type NetworkEndpoint struct {
	NetworkID  string
	IPAddress  string
	Gateway    string
	MacAddress string
}

type ContainerStats struct {
	CPUPercent    float64
	MemoryUsage   uint64
	MemoryLimit   uint64
	MemoryPercent float64
	NetworkIn     uint64
	NetworkOut    uint64
	BlockRead     uint64
	BlockWrite    uint64
	PIDs          uint64
}

type LogsOptions struct {
	Since  string
	Until  string
	Tail   string
	Follow bool
}

type ExecOptions struct {
	Command      []string
	AttachStdout bool
	AttachStderr bool
}

type ExecResult struct {
	Output   string
	ExitCode int
}
