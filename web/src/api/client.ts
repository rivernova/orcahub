import type {
  Container, ContainerInspect, ContainerStats,
  DockerImage, Volume, Network, ExecRequest, ExecResponse
} from '@/types'

const BASE = '/api/v1'

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Containers ──────────────────────────────────────────────────────────────
export const containers = {
  list:    ()                                    => req<Container[]>('GET', '/containers'),
  inspect: (id: string)                          => req<ContainerInspect>('GET', `/containers/${id}`),
  create:  (data: Record<string, unknown>)       => req<{ id: string }>('POST', '/containers', data),
  delete:  (id: string)                          => req<void>('DELETE', `/containers/${id}`),
  start:   (id: string)                          => req<void>('POST', `/containers/${id}/start`),
  stop:    (id: string, timeout?: number)        => req<void>('POST', `/containers/${id}/stop`, { timeout }),
  restart: (id: string)                          => req<void>('POST', `/containers/${id}/restart`),
  logs:    (id: string, tail = 200)              => req<{ logs: string[] }>('GET', `/containers/${id}/logs?tail=${tail}`),
  stats:   (id: string)                          => req<ContainerStats>('GET', `/containers/${id}/stats`),
  exec:    (id: string, data: ExecRequest)       => req<ExecResponse>('POST', `/containers/${id}/exec`, data),
}

// ─── Images ──────────────────────────────────────────────────────────────────
export const images = {
  list:   () => req<DockerImage[]>('GET', '/images'),
  pull:   (ref: string) => req<void>('POST', '/images/pull', { ref }),
  delete: (id: string)  => req<void>('DELETE', `/images/${id}`),
  prune:  ()            => req<{ reclaimed: number }>('POST', '/images/prune'),
}

// ─── Volumes ─────────────────────────────────────────────────────────────────
export const volumes = {
  list:   ()             => req<Volume[]>('GET', '/volumes'),
  create: (name: string) => req<Volume>('POST', '/volumes', { name }),
  delete: (name: string) => req<void>('DELETE', `/volumes/${name}`),
  prune:  ()             => req<{ reclaimed: number }>('POST', '/volumes/prune'),
}

// ─── Networks ────────────────────────────────────────────────────────────────
export const networks = {
  list:   ()                               => req<Network[]>('GET', '/networks'),
  create: (name: string, driver: string)   => req<Network>('POST', '/networks', { name, driver }),
  delete: (id: string)                     => req<void>('DELETE', `/networks/${id}`),
  prune:  ()                               => req<{ reclaimed: number }>('POST', '/networks/prune'),
}

// ─── System ──────────────────────────────────────────────────────────────────
export const system = {
  detect: () => req<{ docker: boolean; k8s: boolean; k8s_version?: string }>('GET', '/system/detect'),
  prune:  () => req<{ reclaimed: number }>('POST', '/system/prune'),
}

export const api = { containers, images, volumes, networks, system }

// ─── Mock data (used when backend not available) ──────────────────────────────
export function getMockContainers(): Container[] {
  return [
    { id: 'a1b2c3d4e5f6', name: 'app-backend', image: 'node:20-alpine', image_id: 'sha256:abc1', status: 'Up 3 days', state: 'running', created: Date.now()/1000 - 259200, ports: [{ private_port: 3000, public_port: 3000, type: 'tcp', ip: '0.0.0.0' }], labels: {}, mounts: [], network_mode: 'bridge', restart_policy: 'unless-stopped' },
    { id: 'b2c3d4e5f6a7', name: 'postgres-main', image: 'postgres:16', image_id: 'sha256:abc2', status: 'Up 12 days', state: 'running', created: Date.now()/1000 - 1036800, ports: [{ private_port: 5432, public_port: 5432, type: 'tcp', ip: '127.0.0.1' }], labels: {}, mounts: [{ type: 'volume', source: 'pgdata', destination: '/var/lib/postgresql/data', mode: 'rw', rw: true }], network_mode: 'bridge', restart_policy: 'always' },
    { id: 'c3d4e5f6a7b8', name: 'redis-cache', image: 'redis:7-alpine', image_id: 'sha256:abc3', status: 'Up 5 hours', state: 'running', created: Date.now()/1000 - 18000, ports: [{ private_port: 6379, public_port: 6379, type: 'tcp', ip: '127.0.0.1' }], labels: {}, mounts: [], network_mode: 'bridge', restart_policy: 'unless-stopped' },
    { id: 'd4e5f6a7b8c9', name: 'nginx-proxy', image: 'nginx:1.25-alpine', image_id: 'sha256:abc4', status: 'Up 3 days', state: 'running', created: Date.now()/1000 - 259200, ports: [{ private_port: 80, public_port: 80, type: 'tcp', ip: '0.0.0.0' }, { private_port: 443, public_port: 443, type: 'tcp', ip: '0.0.0.0' }], labels: {}, mounts: [], network_mode: 'bridge', restart_policy: 'always' },
    { id: 'e5f6a7b8c9d0', name: 'worker-queue', image: 'myapp/worker:latest', image_id: 'sha256:abc5', status: 'Exited (1) 2 hours ago', state: 'exited', created: Date.now()/1000 - 86400, ports: [], labels: {}, mounts: [], network_mode: 'bridge', restart_policy: 'on-failure' },
    { id: 'f6a7b8c9d0e1', name: 'grafana', image: 'grafana/grafana:10.2.0', image_id: 'sha256:abc6', status: 'Up 2 days', state: 'running', created: Date.now()/1000 - 172800, ports: [{ private_port: 3000, public_port: 3001, type: 'tcp', ip: '0.0.0.0' }], labels: {}, mounts: [], network_mode: 'bridge', restart_policy: 'unless-stopped' },
    { id: 'a7b8c9d0e1f2', name: 'prometheus', image: 'prom/prometheus:v2.48.0', image_id: 'sha256:abc7', status: 'Up 2 days', state: 'running', created: Date.now()/1000 - 172800, ports: [{ private_port: 9090, public_port: 9090, type: 'tcp', ip: '0.0.0.0' }], labels: {}, mounts: [], network_mode: 'bridge', restart_policy: 'unless-stopped' },
    { id: 'b8c9d0e1f2a3', name: 'api-gateway', image: 'traefik:v3.0', image_id: 'sha256:abc8', status: 'Exited (0) 5 mins ago', state: 'exited', created: Date.now()/1000 - 300, ports: [], labels: {}, mounts: [], network_mode: 'host', restart_policy: 'no' },
  ]
}

export function getMockImages(): DockerImage[] {
  return [
    { id: 'sha256:abc1', repo_tags: ['node:20-alpine'], repo_digests: [], size: 128_000_000, virtual_size: 128_000_000, created: Date.now()/1000 - 604800, labels: {}, used_by: ['app-backend'] },
    { id: 'sha256:abc2', repo_tags: ['postgres:16'], repo_digests: [], size: 379_000_000, virtual_size: 379_000_000, created: Date.now()/1000 - 1209600, labels: {}, used_by: ['postgres-main'] },
    { id: 'sha256:abc3', repo_tags: ['redis:7-alpine'], repo_digests: [], size: 41_000_000, virtual_size: 41_000_000, created: Date.now()/1000 - 864000, labels: {}, used_by: ['redis-cache'] },
    { id: 'sha256:abc4', repo_tags: ['nginx:1.25-alpine'], repo_digests: [], size: 43_000_000, virtual_size: 43_000_000, created: Date.now()/1000 - 432000, labels: {}, used_by: ['nginx-proxy'] },
    { id: 'sha256:abc6', repo_tags: ['grafana/grafana:10.2.0'], repo_digests: [], size: 320_000_000, virtual_size: 320_000_000, created: Date.now()/1000 - 1728000, labels: {}, used_by: ['grafana'] },
    { id: 'sha256:abc9', repo_tags: ['ubuntu:22.04'], repo_digests: [], size: 77_000_000, virtual_size: 77_000_000, created: Date.now()/1000 - 2592000, labels: {}, used_by: [] },
  ]
}

export function getMockVolumes(): Volume[] {
  return [
    { name: 'pgdata', driver: 'local', mountpoint: '/var/lib/docker/volumes/pgdata/_data', scope: 'local', created_at: new Date(Date.now() - 1036800000).toISOString(), labels: {}, options: {}, used_by: ['postgres-main'], size_bytes: 524_288_000 },
    { name: 'grafana_data', driver: 'local', mountpoint: '/var/lib/docker/volumes/grafana_data/_data', scope: 'local', created_at: new Date(Date.now() - 172800000).toISOString(), labels: {}, options: {}, used_by: ['grafana'], size_bytes: 67_108_864 },
    { name: 'prometheus_data', driver: 'local', mountpoint: '/var/lib/docker/volumes/prometheus_data/_data', scope: 'local', created_at: new Date(Date.now() - 172800000).toISOString(), labels: {}, options: {}, used_by: ['prometheus'], size_bytes: 256_000_000 },
    { name: 'redis_data', driver: 'local', mountpoint: '/var/lib/docker/volumes/redis_data/_data', scope: 'local', created_at: new Date(Date.now() - 18000000).toISOString(), labels: {}, options: {}, used_by: [], size_bytes: 0 },
  ]
}

export function getMockNetworks(): Network[] {
  return [
    { id: 'net1abc', name: 'bridge', driver: 'bridge', scope: 'local', internal: false, ipam_config: [{ subnet: '172.17.0.0/16', gateway: '172.17.0.1' }], containers: {}, labels: {}, created: new Date(Date.now() - 2592000000).toISOString(), enable_ipv6: false },
    { id: 'net2abc', name: 'app_network', driver: 'bridge', scope: 'local', internal: false, ipam_config: [{ subnet: '172.18.0.0/16', gateway: '172.18.0.1' }], containers: { 'app-backend': { name: 'app-backend', mac_address: '02:42:ac:12:00:02', ipv4_address: '172.18.0.2/16', ipv6_address: '' }, 'postgres-main': { name: 'postgres-main', mac_address: '02:42:ac:12:00:03', ipv4_address: '172.18.0.3/16', ipv6_address: '' } }, labels: {}, created: new Date(Date.now() - 259200000).toISOString(), enable_ipv6: false },
    { id: 'net3abc', name: 'monitoring', driver: 'bridge', scope: 'local', internal: true, ipam_config: [{ subnet: '172.19.0.0/24', gateway: '172.19.0.1' }], containers: { 'grafana': { name: 'grafana', mac_address: '02:42:ac:13:00:02', ipv4_address: '172.19.0.2/24', ipv6_address: '' } }, labels: {}, created: new Date(Date.now() - 172800000).toISOString(), enable_ipv6: false },
    { id: 'net4abc', name: 'host', driver: 'host', scope: 'local', internal: false, ipam_config: [], containers: {}, labels: {}, created: new Date(Date.now() - 2592000000).toISOString(), enable_ipv6: false },
  ]
}
