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
  list:    ()                              => req<Container[]>('GET', '/containers'),
  inspect: (id: string)                   => req<ContainerInspect>('GET', `/containers/${id}`),
  create:  (data: Record<string, unknown>)=> req<{ id: string }>('POST', '/containers', data),
  delete:  (id: string)                   => req<void>('DELETE', `/containers/${id}`),
  start:   (id: string)                   => req<void>('POST', `/containers/${id}/start`),
  stop:    (id: string, timeout?: number) => req<void>('POST', `/containers/${id}/stop`, { timeout }),
  restart: (id: string)                   => req<void>('POST', `/containers/${id}/restart`),
  logs:    (id: string, tail = 200)       => req<{ logs: string[] }>('GET', `/containers/${id}/logs?tail=${tail}`),
  stats:   (id: string)                   => req<ContainerStats>('GET', `/containers/${id}/stats`),
  exec:    (id: string, data: ExecRequest)=> req<ExecResponse>('POST', `/containers/${id}/exec`, data),
}

export const images = {
  list:   ()            => req<DockerImage[]>('GET', '/images'),
  pull:   (ref: string) => req<void>('POST', '/images/pull', { ref }),
  delete: (id: string)  => req<void>('DELETE', `/images/${id}`),
  prune:  ()            => req<{ reclaimed: number }>('POST', '/images/prune'),
}

export const volumes = {
  list:   ()             => req<Volume[]>('GET', '/volumes'),
  create: (name: string) => req<Volume>('POST', '/volumes', { name }),
  delete: (name: string) => req<void>('DELETE', `/volumes/${name}`),
  prune:  ()             => req<{ reclaimed: number }>('POST', '/volumes/prune'),
}

export const networks = {
  list:   ()                             => req<Network[]>('GET', '/networks'),
  create: (name: string, driver: string) => req<Network>('POST', '/networks', { name, driver }),
  delete: (id: string)                   => req<void>('DELETE', `/networks/${id}`),
  prune:  ()                             => req<{ reclaimed: number }>('POST', '/networks/prune'),
}

export const system = {
  detect: () => req<{ docker: boolean; k8s: boolean; k8s_version?: string }>('GET', '/system/detect'),
  prune:  () => req<{ reclaimed: number }>('POST', '/system/prune'),
}

export const api = { containers, images, volumes, networks, system }
