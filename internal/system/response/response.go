package response

type StatusResponse struct {
	Docker     DockerStatus     `json:"docker"`
	Kubernetes KubernetesStatus `json:"kubernetes"`
}

type DockerStatus struct {
	Available bool   `json:"available"`
	Version   string `json:"version,omitempty"`
	Error     string `json:"error,omitempty"`
}

type KubernetesStatus struct {
	Available  bool   `json:"available"`
	Context    string `json:"context,omitempty"`
	ServerInfo string `json:"server_info,omitempty"`
	Error      string `json:"error,omitempty"`
}
