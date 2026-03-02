import { apiRequest } from './client'
import type {
  Container, ContainerStats, Image, Volume, Network,
  SystemStatus, ExecResult, PruneResult
} from '../types'

export const api = {
  system: {
    status: () => apiRequest<SystemStatus>('GET', '/system/status'),
  },

  containers: {
    list:    ()              => apiRequest<Container[]>('GET', '/docker/containers'),
    inspect: (id: string)   => apiRequest<Container>('GET', `/docker/containers/${id}`),
    start:   (id: string)   => apiRequest<void>('POST', `/docker/containers/${id}/start`),
    stop:    (id: string, timeout?: number) =>
      apiRequest<void>('POST', `/docker/containers/${id}/stop`, timeout ? { timeout } : undefined),
    restart: (id: string)   => apiRequest<void>('POST', `/docker/containers/${id}/restart`),
    remove:  (id: string, force = false) =>
      apiRequest<void>('DELETE', `/docker/containers/${id}?force=${force}`),
    logs:    (id: string, tail = 200) =>
      apiRequest<{ logs: string[] }>('GET', `/docker/containers/${id}/logs?tail=${tail}`),
    stats:   (id: string)   => apiRequest<ContainerStats>('GET', `/docker/containers/${id}/stats`),
    prune:   ()             => apiRequest<PruneResult>('POST', '/docker/containers/prune'),
    create:  (cfg: unknown) => apiRequest<{ id: string }>('POST', '/docker/containers', cfg),
    exec:    (id: string, command: string[], attachStderr = true) =>
      apiRequest<ExecResult>('POST', `/docker/containers/${id}/exec`, {
        command, attach_stdout: true, attach_stderr: attachStderr,
      }),
  },

  images: {
    list:    ()             => apiRequest<Image[]>('GET', '/docker/images'),
    inspect: (id: string)  => apiRequest<Image>('GET', `/docker/images/${id}`),
    pull:    (name: string) => apiRequest<void>('POST', '/docker/images/pull', { image: name }),
    remove:  (id: string, force = false) =>
      apiRequest<void>('DELETE', `/docker/images/${id}?force=${force}`),
    prune:   ()            => apiRequest<PruneResult>('POST', '/docker/images/prune'),
  },

  volumes: {
    list:    ()             => apiRequest<Volume[]>('GET', '/docker/volumes'),
    inspect: (name: string) => apiRequest<Volume>('GET', `/docker/volumes/${name}`),
    create:  (cfg: unknown) => apiRequest<Volume>('POST', '/docker/volumes', cfg),
    remove:  (name: string) => apiRequest<void>('DELETE', `/docker/volumes/${name}`),
    prune:   ()            => apiRequest<PruneResult>('POST', '/docker/volumes/prune'),
  },

  networks: {
    list:       ()             => apiRequest<Network[]>('GET', '/docker/networks'),
    inspect:    (id: string)   => apiRequest<Network>('GET', `/docker/networks/${id}`),
    create:     (cfg: unknown) => apiRequest<Network>('POST', '/docker/networks', cfg),
    remove:     (id: string)   => apiRequest<void>('DELETE', `/docker/networks/${id}`),
    connect:    (id: string, containerId: string) =>
      apiRequest<void>('POST', `/docker/networks/${id}/connect`, { container_id: containerId }),
    disconnect: (id: string, containerId: string, force = false) =>
      apiRequest<void>('POST', `/docker/networks/${id}/disconnect`, { container_id: containerId, force }),
  },
}