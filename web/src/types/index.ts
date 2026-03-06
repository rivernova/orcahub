export interface Port {
  private_port: number
  public_port:  number
  type:         string
  ip:           string
}

export interface Mount {
  type:        string
  source:      string
  destination: string
  mode:        string
  rw:          boolean
}

export interface Container {
  id:             string
  name:           string
  image:          string
  image_id:       string
  status:         string
  state:          string
  created:        number
  ports:          Port[]
  labels:         Record<string, string>
  mounts:         Mount[]
  network_mode:   string
  restart_policy: string
}

export interface ContainerInspect extends Container {
  hostname:    string
  env:         string[]
  cmd:         string[]
  entrypoint:  string[]
  working_dir: string
  user:        string
  networks:    Record<string, NetworkEndpoint>
  started_at:  string
  finished_at: string
  exit_code:   number
}

export interface NetworkEndpoint {
  network_id:  string
  ip_address:  string
  gateway:     string
  mac_address: string
}

export interface ContainerStats {
  cpu_percent:    number
  memory_usage:   number
  memory_limit:   number
  memory_percent: number
  network_in:     number
  network_out:    number
  block_read:     number
  block_write:    number
  pids:           number
}

export interface DockerImage {
  id:           string
  repo_tags:    string[]
  repo_digests: string[]
  size:         number
  virtual_size: number
  created:      number
  labels:       Record<string, string>
  used_by:      string[]
}

export interface Volume {
  name:       string
  driver:     string
  mountpoint: string
  scope:      string
  created_at: string
  labels:     Record<string, string>
  options:    Record<string, string>
  used_by:    string[]
  size_bytes: number
}

export interface Network {
  id:          string
  name:        string
  driver:      string
  scope:       string
  internal:    boolean
  ipam_config: IPAMConfig[]
  containers:  Record<string, NetworkContainerInfo>
  labels:      Record<string, string>
  created:     string
  enable_ipv6: boolean
}

export interface IPAMConfig {
  subnet:  string
  gateway: string
}

export interface NetworkContainerInfo {
  name:         string
  mac_address:  string
  ipv4_address: string
  ipv6_address: string
}

export interface ExecRequest {
  command:       string[]
  attach_stdout: boolean
  attach_stderr: boolean
}

export interface ExecResponse {
  output:    string
  exit_code: number
}

export type Env = "docker" | "k8s"

export type Route =
  | "overview"
  | "containers"
  | "images"
  | "volumes"
  | "networks"
  | "metrics"
  | "compose"
  | "settings"
  | "k8s-overview"
  | "k8s-pods"
  | "k8s-deployments"
  | "k8s-services"
  | "k8s-namespaces"

export interface AppState {
  route:        Route
  theme:        "dark" | "light"
  env:          Env
  k8sConnected: boolean
  sidebarOpen:  boolean
  aiOpen:       boolean
  containers:   Container[]
  images:       DockerImage[]
  volumes:      Volume[]
  networks:     Network[]
  loading:      boolean
  error:        string | null
}

export type AppAction =
  | { type: "SET_ROUTE";      payload: Route }
  | { type: "SET_THEME";      payload: "dark" | "light" }
  | { type: "SET_ENV";        payload: Env }
  | { type: "SET_K8S";        payload: boolean }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_AI" }
  | { type: "SET_CONTAINERS"; payload: Container[] }
  | { type: "SET_IMAGES";     payload: DockerImage[] }
  | { type: "SET_VOLUMES";    payload: Volume[] }
  | { type: "SET_NETWORKS";   payload: Network[] }
  | { type: "SET_LOADING";    payload: boolean }
  | { type: "SET_ERROR";      payload: string | null }
