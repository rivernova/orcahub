export interface Container {
  id: string
  name: string
  image: string
  image_id: string
  state: string
  status: string
  created: number
  ports: Port[]
  mounts: Mount[]
  labels: Record<string, string>
  network_mode: string
  restart_policy: string
  env: string[]
  cmd: string[]
  networks: Record<string, NetworkEndpoint>
  started_at: string
  finished_at: string
  exit_code: number
}

export interface Port {
  private_port: number
  public_port: number
  type: string
  ip: string
}

export interface Mount {
  type: string
  source: string
  destination: string
  mode: string
  rw: boolean
}

export interface NetworkEndpoint {
  network_id: string
  ip_address: string
  gateway: string
  mac_address: string
}

export interface ContainerStats {
  cpu_percent: number
  memory_usage: number
  memory_limit: number
  memory_percent: number
  network_in: number
  network_out: number
  block_read: number
  block_write: number
  pids: number
}

export interface Image {
  id: string
  tags: string[]
  size: number
  created: number
  labels: Record<string, string>
  containers: number
  architecture?: string
  os?: string
}

export interface Volume {
  name: string
  driver: string
  mountpoint: string
  created_at?: string
  labels: Record<string, string>
  scope: string
  size?: number
}

export interface Network {
  id: string
  name: string
  driver: string
  scope: string
  internal: boolean
  attachable: boolean
  created: string
  subnet?: string
  gateway?: string
  containers: Record<string, NetworkContainer>
}

export interface NetworkContainer {
  name: string
  ipv4_address: string
  mac_address: string
}

export interface SystemStatus {
  docker: { available: boolean; version?: string; error?: string }
  kubernetes: { available: boolean; context?: string; server_info?: string; error?: string }
}

export interface ExecResult {
  output: string
  exit_code: number
}

export interface PruneResult {
  deleted: string[]
  space_reclaimed: number
}