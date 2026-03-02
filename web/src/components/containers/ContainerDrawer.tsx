import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../store/app'
import { api } from '../../api'
import type { Container } from '../../types'
import LogsPanel from './LogsPanel'
import ExecPanel from './ExecPanel'

export default function ContainerDrawer() {
  const { drawerContainerId, drawerTab, closeDrawer, setDrawerTab } = useAppStore()
  if (!drawerContainerId) return null

  return (
    <div className="drawer-overlay open" id="drawerOverlay" onClick={e => {
      if ((e.target as HTMLElement).id === 'drawerOverlay') closeDrawer()
    }}>
      <div className="drawer">
        <DrawerContent id={drawerContainerId} tab={drawerTab} onTabChange={setDrawerTab} onClose={closeDrawer} />
      </div>
    </div>
  )
}

function DrawerContent({ id, tab, onTabChange, onClose }: {
  id: string
  tab: string
  onTabChange: (t: any) => void
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { addToast } = useAppStore()

  const { data: container } = useQuery<Container>({
    queryKey: ['container', id],
    queryFn: () => api.containers.inspect(id),
  })

  const actionMut = useMutation({
    mutationFn: (action: string) => {
      if (action === 'start')   return api.containers.start(id)
      if (action === 'stop')    return api.containers.stop(id)
      if (action === 'restart') return api.containers.restart(id)
      return Promise.resolve()
    },
    onSuccess: (_, action) => {
      qc.invalidateQueries({ queryKey: ['containers'] })
      qc.invalidateQueries({ queryKey: ['container', id] })
      addToast(`Container ${action}ed`, 'success')
    },
  })

  if (!container) return <div className="drawer" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>Loading…</div>

  const statusCls = container.state === 'running' ? 'running' : 'stopped'
  const tabs = ['info', 'logs', 'env', 'mounts', 'exec']

  return (
    <>
      <div className="drawer-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="drawer-avatar">🐳</div>
          <div>
            <div className="drawer-title">{container.name}</div>
            <div className="drawer-sub">{container.image}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6,marginLeft:'auto',alignItems:'center'}}>
          <span className={`status-badge ${statusCls}`}>{container.state}</span>
          {container.state !== 'running'
            ? <button className="btn btn-primary btn-sm" onClick={() => actionMut.mutate('start')}>Start</button>
            : <button className="btn btn-ghost btn-sm" onClick={() => actionMut.mutate('stop')}>Stop</button>
          }
          <button className="btn btn-ghost btn-sm" onClick={() => actionMut.mutate('restart')}>Restart</button>
          <button className="icon-btn" onClick={onClose} style={{marginLeft:4}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div className="drawer-tabs">
        {tabs.map(t => (
          <button key={t} className={`drawer-tab ${tab === t ? 'active' : ''}`} onClick={() => onTabChange(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="drawer-body">
        {tab === 'info' && <InfoPanel container={container} />}
        {tab === 'logs' && <LogsPanel id={id} />}
        {tab === 'env' && (
          <div className="drawer-tab-panel active">
            {container.env?.length ? container.env.map((e, i) => (
              <div key={i} className="log-line" style={{fontFamily:'var(--font-mono)',fontSize:12.5}}>{e}</div>
            )) : <p style={{color:'var(--text-muted)'}}>No environment variables</p>}
          </div>
        )}
        {tab === 'mounts' && (
          <div className="drawer-tab-panel active">
            {container.mounts?.length ? container.mounts.map((m, i) => (
              <div key={i} style={{padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontFamily:'var(--font-mono)',fontSize:12}}>{m.source} → {m.destination}</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{m.type} · {m.mode} · {m.rw ? 'RW' : 'RO'}</div>
              </div>
            )) : <p style={{color:'var(--text-muted)'}}>No mounts</p>}
          </div>
        )}
        {tab === 'exec' && <ExecPanel id={id} isRunning={container.state === 'running'} />}
      </div>
    </>
  )
}

function InfoPanel({ container: c }: { container: Container }) {
  const ports = c.ports?.filter(p => p.public_port > 0) ?? []
  return (
    <div className="drawer-tab-panel active" id="dt-info">
      <div className="detail-grid">
        <div className="detail-item"><div className="detail-item-label">Container ID</div><div className="detail-item-val mono">{c.id.slice(0,12)}</div></div>
        <div className="detail-item"><div className="detail-item-label">State</div><div className="detail-item-val">{c.state}</div></div>
        <div className="detail-item"><div className="detail-item-label">Image</div><div className="detail-item-val mono">{c.image}</div></div>
        <div className="detail-item"><div className="detail-item-label">Network Mode</div><div className="detail-item-val">{c.network_mode || '—'}</div></div>
        <div className="detail-item"><div className="detail-item-label">Restart Policy</div><div className="detail-item-val">{c.restart_policy || '—'}</div></div>
        <div className="detail-item"><div className="detail-item-label">Started At</div><div className="detail-item-val mono">{c.started_at || '—'}</div></div>
        {ports.length > 0 && (
          <div className="detail-item detail-full">
            <div className="detail-item-label">Ports</div>
            <div className="detail-item-val">{ports.map((p,i) => <span key={i} className="port-tag">{p.public_port}:{p.private_port}/{p.type}</span>)}</div>
          </div>
        )}
        {c.cmd?.length > 0 && (
          <div className="detail-item detail-full">
            <div className="detail-item-label">Command</div>
            <div className="detail-item-val mono" style={{fontSize:12}}>{c.cmd.join(' ')}</div>
          </div>
        )}
      </div>
    </div>
  )
}