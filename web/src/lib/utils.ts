import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatUptime(unixTs: number): string {
  const seconds = Math.floor(Date.now() / 1000) - unixTs
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

export function shortId(id: string): string {
  return id.replace('sha256:', '').slice(0, 12)
}

export function stateColor(state: string): string {
  switch (state.toLowerCase()) {
    case 'running': return 'running'
    case 'exited':  return 'exited'
    case 'paused':  return 'paused'
    default:        return 'stopped'
  }
}

export function formatPorts(ports: { private_port: number; public_port: number; type: string }[]): string {
  if (!ports?.length) return '—'
  return ports.filter(p => p.public_port).map(p => `${p.public_port}:${p.private_port}`).join(', ') || '—'
}
