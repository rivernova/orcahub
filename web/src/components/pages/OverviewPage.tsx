import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../../store/app'
import { api } from '../../api'
import type { Container } from '../../types'
import { useState } from 'react'

function fmtMem(bytes: number) {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  return `${(bytes / 1e6).toFixed(0)} MB`
}

export default function OverviewPage() {
  const { openDrawer, setPage, addToast } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')

  const { data: containers = [], isLoading, refetch } = useQuery<Container[]>({
    queryKey: ['containers'],
    queryFn: api.containers.list,
  })

  const running = containers.filter(c => c.state === 'running')
  const stopped = containers.filter(c => c.state !== 'running')
  const filtered = filter === 'all' ? containers : filter === 'running' ? running : stopped

  return (
    <div className="page active" id="page-overview">
      <div className="ph">
        <div className="ph-left">
          <h1>Overview</h1>
          <p id="overview-sub">{isLoading ? 'Loading…' : `${running.length} running · ${containers.length} total`}</p>
        </div>
        <div className="ph-right">
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setPage('containers')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Deploy
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Running</div>
          <div className="stat-val c-green">{running.length}</div>
          <div className="stat-sub">containers active</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Containers</div>
          <div className="stat-val">{containers.length}</div>
          <div className="stat-sub">{stopped.length} stopped</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Images</div>
          <div className="stat-val c-cyan" id="s-cpu">—</div>
          <div className="stat-sub">across all containers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className="stat-val">{containers.length > 0 ? '✓ Healthy' : '—'}</div>
          <div className="stat-sub">Docker daemon</div>
        </div>
      </div>

      <div className="sh">
        <div className="sh-title">
          Containers <span className="sh-count">{filtered.length}</span>
        </div>
        <div className="sh-right">
          <div className="ftabs">
            {(['all', 'running', 'stopped'] as const).map(f => (
              <div key={f} className={`ftab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-grid">
        {filtered.map(c => <ContainerCard key={c.id} container={c} onOpen={openDrawer} />)}
      </div>
    </div>
  )
}

function ContainerCard({ container: c, onOpen }: { container: Container; onOpen: (id: string) => void }) {
  const statusCls = c.state === 'running' ? 'running' : c.state === 'exited' ? 'exited' : 'stopped'
  const ports = c.ports?.filter(p => p.public_port > 0).slice(0, 2) ?? []

  return (
    <div className="card" onClick={() => onOpen(c.id)} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <div className="card-icon">🐳</div>
        <div className="card-meta">
          <div className="card-name">{c.name}</div>
          <div className="card-image">{c.image}</div>
        </div>
        <span className={`status-badge ${statusCls}`}>{c.state}</span>
      </div>
      {ports.length > 0 && (
        <div className="card-ports">
          {ports.map((p, i) => (
            <span key={i} className="port-tag">{p.public_port}:{p.private_port}/{p.type}</span>
          ))}
        </div>
      )}
      <div className="card-footer">
        <span className="card-id">{c.id.slice(0, 12)}</span>
        <span className="card-status-txt">{c.status}</span>
      </div>
    </div>
  )
}