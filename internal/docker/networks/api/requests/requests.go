package requests

type CreateNetworkRequest struct {
	Name       string            `json:"name" binding:"required"`
	Driver     string            `json:"driver"`   // bridge, host, overlay, none. default "bridge"
	Internal   bool              `json:"internal"` // aísla la red del exterior
	Attachable bool              `json:"attachable"`
	Labels     map[string]string `json:"labels"`
	Options    map[string]string `json:"options"`
	IPAM       *IPAMConfig       `json:"ipam"`
}

type IPAMConfig struct {
	Driver string     `json:"driver"`
	Config []IPAMPool `json:"config"`
}

type IPAMPool struct {
	Subnet  string `json:"subnet"`  // e.g. "172.20.0.0/16"
	Gateway string `json:"gateway"` // e.g. "172.20.0.1"
}

type ConnectContainerRequest struct {
	ContainerID string   `json:"container_id" binding:"required"`
	IPv4Address string   `json:"ipv4_address"` // opcional, asigna IP estática
	Aliases     []string `json:"aliases"`      // DNS aliases dentro de la red
}

type DisconnectContainerRequest struct {
	ContainerID string `json:"container_id" binding:"required"`
	Force       bool   `json:"force"`
}
