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

export const containers = {
  list:    ()                               => req<Container[]>('GET', '/docker/containers'),
  inspect: (id: string)                    => req<ContainerInspect>('GET', '/docker/containers/${id}'),
  create:  (data: Record<string, unknown>) => req<{ id: string }>('POST', '/docker/containers', data),
  delete:  (id: string)                    => req<void>('DELETE', '/docker/containers/${id}'),
  start:   (id: string)                    => req<void>('POST', '/docker/containers/${id}/start'),
  stop:    (id: string, timeout?: number)  => req<void>('POST', '/docker/containers/${id}/stop', { timeout }),
  restart: (id: string)                    => req<void>('POST', '/docker/containers/${id}/restart'),
  pause:   (id: string)                    => req<void>('POST', '/docker/containers/${id}/pause'),
  unpause: (id: string)                    => req<void>('POST', '/docker/containers/${id}/unpause'),
  rename:  (id: string, name: string)      => req<void>('POST', '/docker/containers/${id}/rename', { name }),
  kill:    (id: string, signal = 'SIGKILL')=> req<void>('POST', '/docker/containers/${id}/kill', { signal }),
  logs:    (id: string, tail = 200)        => req<{ logs: string[] }>('GET', '/docker/containers/${id}/logs?tail=${tail}'),
  stats:   (id: string)                    => req<ContainerStats>('GET', '/docker/containers/${id}/stats'),
  top:     (id: string)                    => req<{ titles: string[]; processes: string[][] }>('GET', '/docker/containers/${id}/top'),
  exec:    (id: string, data: ExecRequest) => req<ExecResponse>('POST', '/docker/containers/${id}/exec', data),
}

export const images = {
  list:   ()            => req<DockerImage[]>('GET', '/docker/images'),
  pull: (ref: string) => req<void>('POST', '/docker/images/pull', { image: ref }),
  delete: (id: string)  => req<void>('DELETE', `/docker/images/${id}`),
  prune:  ()            => req<{ reclaimed: number }>('POST', '/docker/images/prune'),
}

export const volumes = {
  list:   ()             => req<Volume[]>('GET', '/docker/volumes'),
  create: (name: string) => req<Volume>('POST', '/docker/volumes', { name }),
  delete: (name: string) => req<void>('DELETE', `/docker/volumes/${name}`),
  prune:  ()             => req<{ reclaimed: number }>('POST', '/docker/volumes/prune'),
}

export const networks = {
  list:   ()                             => req<Network[]>('GET', '/docker/networks'),
  create: (name: string, driver: string) => req<Network>('POST', '/docker/networks', { name, driver }),
  delete: (id: string)                   => req<void>('DELETE', `/docker/networks/${id}`),
  prune:  ()                             => req<{ reclaimed: number }>('POST', '/docker/networks/prune'),
}

export const system = {
  detect: () => req<{ docker: boolean; k8s: boolean; k8s_version?: string }>('GET', '/system/detect'),
  prune:  () => req<{ reclaimed: number; containers_deleted: string[]; images_deleted: number; volumes_deleted: string[]; networks_deleted: string[] }>('POST', '/system/prune'),
}

export const api = { containers, images, volumes, networks, system }
