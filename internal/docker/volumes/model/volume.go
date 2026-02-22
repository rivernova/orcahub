package model

type Volume struct {
	Name       string
	Driver     string
	Mountpoint string
	Labels     map[string]string
	Options    map[string]string
	Scope      string
	CreatedAt  string
	Status     map[string]interface{}
}

type CreateVolumeOptions struct {
	Name       string
	Driver     string
	DriverOpts map[string]string
	Labels     map[string]string
}
