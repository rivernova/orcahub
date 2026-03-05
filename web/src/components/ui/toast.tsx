import { useEffect, useState } from 'react'
import { onToast } from '@/context/AppContext'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastItem {
  id:   string
  msg:  string
  type: 'success' | 'error' | 'info'
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    return onToast(t => {
      setToasts(prev => [...prev, t])
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, 3400)
    })
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10d98a]" />,
    error:   <XCircle     className="w-4 h-4 flex-shrink-0 text-[#ef4444]" />,
    info:    <Info        className="w-4 h-4 flex-shrink-0 text-[#00d4ff]" />,
  }

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[11px] min-w-[260px] max-w-[380px]',
        'bg-[var(--bg-elevated)] border border-[var(--border-bright)]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
        'animate-[toast-in_0.22s_cubic-bezier(0.4,0,0.2,1)_both]',
      )}
    >
      {icons[toast.type]}
      <span className="text-[12.5px] text-[var(--text-primary)] flex-1">{toast.msg}</span>
      <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
