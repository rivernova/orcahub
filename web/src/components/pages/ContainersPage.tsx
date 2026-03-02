import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../store/app'
import { api } from '../../api'
import type { Container } from '../../types'
import DeployModal from '../modals/DeployModal'

export default function ContainersPage() {
  const { openDrawer, addToast } = useAppStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped' | 'exited'>('all')
  const [deployOpen, setDeployOpen] = useState(false)

  const { data: containers = [], isLoading } = useQuery<Container[]>({
    queryKey: ['containers'],
    queryFn: api.containers.list,
    refetchInterval: 5000,
  })

  const pruneMut = useMutation({
    mutationFn: api.containers.prune,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['containers'] })
      addToast(`Pruned ${r.deleted?.length ?? 0} containers`, 'success')
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  const actionMut = useMutation({
    mutationFn: ({ action, id }: { action: string; id: string }) => {
      if (action === 'start')   return api.containers.start(id)
      if (action === 'stop')    return api.containers.stop(id)
      if (action === 'restart') return api.containers.restart(id)
      if (action === 'remove')  return api.containers.remove(id, true)
      return Promise.resolve()
    },
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['containers'] })
      addToast(`Container ${action}ed`, 'success')
    },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  const filtered = containers.filter(c => {
    if (filter === 'all') return true
    if (filter === 'running') return c.state === 'running'
    if (filter === 'stopped') return c.state === 'exited' || c.state === 'created'
    return c.state === filter
  })

  return (
    <div className="page active" id="page-containers">
      <div className="ph">
        <div className="ph-left"><h1>Containers</h1><p>Manage and monitor all your Docker containers</p></div>
        <div className="ph-right">
          <button className="btn btn-ghost btn-sm" onClick={() => pruneMut.mutate()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Prune stopped
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setDeployOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New container
          </button>
        </div>
      </div>

      <div className="sh">
        <div className="sh-title">All containers <span className="sh-count">{filtered.length}</span></div>
        <div className="sh-right">
          <div className="ftabs">
            {(['all', 'running', 'stopped', 'exited'] as const).map(f => (
              <div key={f} className={`ftab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Name</th><th>Image</th><th>Status</th><th>CPU</th><th>Memory</th>
            <th>Ports</th><th>Created</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>Loading…</td></tr>}
            {filtered.map(c => (
              <ContainerRow
                key={c.id}
                container={c}
                onOpen={(id, tab) => openDrawer(id, tab)}
                onAction={(action, id) => actionMut.mutate({ action, id })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {deployOpen && <DeployModal onClose={() => setDeployOpen(false)} />}
    </div>
  )
}

function ContainerRow({ container: c, onOpen, onAction }: {
  container: Container
  onOpen: (id: string, tab?: any) => void
  onAction: (action: string, id: string) => void
}) {
  const statusCls = c.state === 'running' ? 'running' : c.state === 'exited' ? 'exited' : 'stopped'
  const ports = c.ports?.filter(p => p.public_port > 0).slice(0, 2) ?? []
  const created = new Date(c.created * 1000).toLocaleDateString()

  return (
    <tr onContextMenu={(e) => { e.preventDefault(); onOpen(c.id) }} style={{ cursor: 'context-menu' }}>
      <td><span className="fw mono">{c.name}</span></td>
      <td><span className="mono" style={{fontSize:11.5,color:'var(--text-secondary)'}}>{c.image}</span></td>
      <td><span className={`status-badge ${statusCls}`}>{c.state}</span></td>
      <td>—</td>
      <td>—</td>
      <td>{ports.map((p,i) => <span key={i} className="port-tag">{p.public_port}:{p.private_port}</span>)}</td>
      <td style={{color:'var(--text-muted)',fontSize:12}}>{created}</td>
      <td>
        <div style={{display:'flex',gap:4}}>
          {c.state !== 'running'
            ? <button className="btn btn-ghost btn-xs" onClick={() => onAction('start', c.id)}>▶</button>
            : <button className="btn btn-ghost btn-xs" onClick={() => onAction('stop', c.id)}>■</button>
          }
          <button className="btn btn-ghost btn-xs" onClick={() => onAction('restart', c.id)}>↺</button>
          <button className="btn btn-ghost btn-xs" onClick={() => onOpen(c.id, 'logs')}>Logs</button>
          <button className="btn btn-ghost btn-xs" onClick={() => onOpen(c.id, 'exec')}>Exec</button>
          <button className="btn btn-ghost btn-xs" style={{color:'var(--accent-red)'}} onClick={() => onAction('remove', c.id)}>✕</button>
        </div>
      </td>
    </tr>
  )
}