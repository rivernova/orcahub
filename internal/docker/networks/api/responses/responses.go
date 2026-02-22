package responses

type NetworkResponse struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Driver     string            `json:"driver"`
	Scope      string            `json:"scope"`
	Internal   bool              `json:"internal"`
	Attachable bool              `json:"attachable"`
	Labels     map[string]string `json:"labels"`
	Created    string            `json:"created"`
}

type NetworkInspectResponse struct {
	NetworkResponse
	IPAM       IPAMResponse                 `json:"ipam"`
	Containers map[string]ContainerEndpoint `json:"containers"`
	Options    map[string]string            `json:"options"`
}

type IPAMResponse struct {
	Driver string         `json:"driver"`
	Config []IPAMPoolInfo `json:"config"`
}

type IPAMPoolInfo struct {
	Subnet  string `json:"subnet"`
	Gateway string `json:"gateway"`
}

type ContainerEndpoint struct {
	Name        string `json:"name"`
	EndpointID  string `json:"endpoint_id"`
	MacAddress  string `json:"mac_address"`
	IPv4Address string `json:"ipv4_address"`
}
