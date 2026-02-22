package requests

type CreateContainerRequest struct {
	Name          string            `json:"name" binding:"required"`
	Image         string            `json:"image" binding:"required"`
	Ports         []PortBinding     `json:"ports"`
	Environment   []string          `json:"env"`
	Volumes       []string          `json:"volumes"`
	Labels        map[string]string `json:"labels"`
	RestartPolicy string            `json:"restart_policy"` // no, always, on-failure, unless-stopped
}

type PortBinding struct {
	HostPort      string `json:"host_port"`
	ContainerPort string `json:"container_port"`
	Protocol      string `json:"protocol"` // tcp, udp
}

type StopContainerRequest struct {
	Timeout *int `json:"timeout"` // seconds, nil = default (10s)
}

type ExecRequest struct {
	Command      []string `json:"command" binding:"required"`
	AttachStdout bool     `json:"attach_stdout"`
	AttachStderr bool     `json:"attach_stderr"`
}

type LogsQueryRequest struct {
	Since  string `form:"since"` // timestamp or relative e.g. "10m"
	Until  string `form:"until"`
	Tail   string `form:"tail"` // number of lines or "all"
	Follow bool   `form:"follow"`
}
