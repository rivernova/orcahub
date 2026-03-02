import { useEffect } from 'react'
import { useAppStore } from '../../store/app'

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="toast-container" style={{
      position: 'fixed', bottom: 24, right: 24,
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <Toast key={t.id} id={t.id} msg={t.msg} type={t.type} onRemove={removeToast} />
      ))}
    </div>
  )
}

function Toast({ id, msg, type, onRemove }: {
  id: number; msg: string; type: string; onRemove: (id: number) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3500)
    return () => clearTimeout(timer)
  }, [id, onRemove])

  const colors: Record<string, string> = {
    success: 'var(--accent-green)', info: 'var(--accent)',
    warn: 'var(--accent-amber)', error: 'var(--accent-red)',
  }

  return (
    <div className="toast" style={{
      background: 'var(--bg-surface)', border: `1px solid var(--border)`,
      borderLeft: `3px solid ${colors[type] ?? colors.info}`,
      borderRadius: 'var(--r-md)', padding: '10px 16px',
      color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
      boxShadow: 'var(--shadow-modal)', minWidth: 260, maxWidth: 360,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      animation: 'pagein 0.2s var(--ease) both',
    }}>
      <span>{msg}</span>
      <button onClick={() => onRemove(id)} style={{
        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
      }}>✕</button>
    </div>
  )
}