package domain

type Network struct {
	ID         string
	Name       string
	Driver     string
	Scope      string
	Internal   bool
	Attachable bool
	Labels     map[string]string
	Options    map[string]string
	Created    string
	IPAM       IPAM
	Containers map[string]ContainerEndpoint
}

type IPAM struct {
	Driver string
	Config []IPAMPool
}

type IPAMPool struct {
	Subnet  string
	Gateway string
}

type ContainerEndpoint struct {
	Name        string
	EndpointID  string
	MacAddress  string
	IPv4Address string
}

type CreateNetworkOptions struct {
	Name       string
	Driver     string
	Internal   bool
	Attachable bool
	Labels     map[string]string
	Options    map[string]string
	IPAM       *IPAM
}

type ConnectOptions struct {
	ContainerID string
	IPv4Address string
	Aliases     []string
}

type DisconnectOptions struct {
	ContainerID string
	Force       bool
}
