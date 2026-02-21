package api

type ContainerResponse struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Image         string            `json:"image"`
	ImageID       string            `json:"image_id"`
	Status        string            `json:"status"`
	State         string            `json:"state"`
	Created       int64             `json:"created"`
	Ports         []PortResponse    `json:"ports"`
	Labels        map[string]string `json:"labels"`
	Mounts        []MountResponse   `json:"mounts"`
	NetworkMode   string            `json:"network_mode"`
	RestartPolicy string            `json:"restart_policy"`
}

type PortResponse struct {
	PrivatePort int    `json:"private_port"`
	PublicPort  int    `json:"public_port"`
	Type        string `json:"type"`
	IP          string `json:"ip"`
}

type MountResponse struct {
	Type        string `json:"type"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Mode        string `json:"mode"`
	RW          bool   `json:"rw"`
}

type ContainerInspectResponse struct {
	ContainerResponse
	Hostname   string                     `json:"hostname"`
	Env        []string                   `json:"env"`
	Cmd        []string                   `json:"cmd"`
	Entrypoint []string                   `json:"entrypoint"`
	WorkingDir string                     `json:"working_dir"`
	User       string                     `json:"user"`
	Networks   map[string]NetworkEndpoint `json:"networks"`
	StartedAt  string                     `json:"started_at"`
	FinishedAt string                     `json:"finished_at"`
	ExitCode   int                        `json:"exit_code"`
}

type NetworkEndpoint struct {
	NetworkID  string `json:"network_id"`
	IPAddress  string `json:"ip_address"`
	Gateway    string `json:"gateway"`
	MacAddress string `json:"mac_address"`
}

type StatsResponse struct {
	CPUPercent    float64 `json:"cpu_percent"`
	MemoryUsage   uint64  `json:"memory_usage"`
	MemoryLimit   uint64  `json:"memory_limit"`
	MemoryPercent float64 `json:"memory_percent"`
	NetworkIn     uint64  `json:"network_in"`
	NetworkOut    uint64  `json:"network_out"`
	BlockRead     uint64  `json:"block_read"`
	BlockWrite    uint64  `json:"block_write"`
	PIDs          uint64  `json:"pids"`
}

type LogsResponse struct {
	Logs []string `json:"logs"`
}

type ExecResponse struct {
	Output   string `json:"output"`
	ExitCode int    `json:"exit_code"`
}

type CreateContainerResponse struct {
	ID       string   `json:"id"`
	Warnings []string `json:"warnings"`
}
