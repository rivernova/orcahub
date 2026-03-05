import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RefreshCw, Bell, Sun, Moon, Sparkles } from 'lucide-react'
import type { Route } from '@/types'

export function Header() {
  const { state, dispatch, navigate, loadAll, toast } = useApp()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
    toast('Data refreshed', 'success')
  }

  const switchEnv = (env: 'docker' | 'k8s') => {
    if (env === 'k8s' && !state.k8sConnected) {
      toast('Kubernetes not detected in this environment', 'info')
      return
    }
    dispatch({ type: 'SET_ENV', payload: env })
    navigate(env === 'k8s' ? 'k8s-overview' : 'overview')
  }

  // Search results
  const searchResults = search.length > 1
    ? [
        ...state.containers.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.image.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 4).map(c => ({ type: 'container', label: c.name, sub: c.image, route: 'containers' as Route, icon: '📦' })),
        ...state.images.filter(img =>
          img.repo_tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
        ).slice(0, 3).map(img => ({ type: 'image', label: img.repo_tags[0] ?? 'unnamed', sub: 'image', route: 'images' as Route, icon: '🖼' })),
      ]
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="flex items-center h-[58px] px-0 pr-[18px] border-b border-[var(--border)] bg-[var(--bg-void)] z-[200]">
      {/* Logo zone — matches sidebar width */}
      <div
        className={cn(
          'flex-shrink-0 flex items-center gap-[11px] overflow-hidden',
          'transition-all duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          state.sidebarOpen ? 'w-[232px] px-[18px]' : 'w-14 px-0 justify-center',
        )}
      >
        <LogoMark />
        <span
          className={cn(
            'text-[17px] font-extrabold tracking-[.06em] whitespace-nowrap',
            'bg-gradient-to-br from-[#00d4ff] to-[#a78bfa] bg-clip-text text-transparent',
            'transition-all duration-[220ms]',
            !state.sidebarOpen && 'opacity-0 w-0 overflow-hidden',
          )}
        >
          OrcaHub
        </span>
      </div>

      {/* Env switcher */}
      <div className="mx-3.5 flex-shrink-0">
        <div className="flex items-center gap-[3px] bg-[var(--bg-raised)] border border-[var(--border)] rounded-[16px] p-[3px]">
          <EnvBtn
            active={state.env === 'docker'}
            onClick={() => switchEnv('docker')}
            label="🐳 Docker"
            color="cyan"
            connected
          />
          <EnvBtn
            active={state.env === 'k8s'}
            onClick={() => switchEnv('k8s')}
            label="⎈ Kubernetes"
            color="purple"
            connected={state.k8sConnected}
            detectTag={state.k8sConnected ? 'detected' : undefined}
          />
        </div>
      </div>

      {/* Search */}
      <div ref={searchRef} className="flex-1 px-3.5 relative max-w-[380px]">
        <div
          className={cn(
            'flex items-center gap-[9px] rounded-[11px] px-3 py-[7px] w-full',
            'bg-[var(--bg-glass)] border border-[var(--border)] transition-all duration-[220ms]',
            searchOpen && 'border-[var(--border-focus)] bg-[var(--bg-glass-hover)] shadow-[0_0_0_3px_var(--accent-glow)]',
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] flex-shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            placeholder={state.env === 'docker' ? 'Search containers, images, volumes…' : 'Search pods, deployments, services…'}
            className="bg-transparent border-none outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full"
          />
          <span className="font-mono text-[9.5px] px-[5px] py-[2px] bg-[var(--bg-raised)] border border-[var(--border)] rounded text-[var(--text-muted)] whitespace-nowrap">⌘K</span>
        </div>

        {/* Dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] p-2 shadow-[var(--shadow-modal)] z-[500] animate-pagein">
            <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[var(--text-muted)] px-2.5 py-1.5 mb-1">Results</div>
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => { navigate(r.route); setSearchOpen(false); setSearch('') }}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[7px] hover:bg-[var(--bg-glass-hover)] transition-colors"
              >
                <span className="w-7 h-7 rounded-[7px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[13px] flex-shrink-0">{r.icon}</span>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-[var(--text-primary)]">{r.label}</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">{r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-[7px] ml-auto">
        <Button
          variant="icon"
          title="Refresh"
          onClick={handleRefresh}
          className={refreshing ? 'animate-spin' : ''}
        >
          <RefreshCw className="w-[15px] h-[15px]" />
        </Button>

        <Button
          variant="icon"
          title="Toggle theme"
          onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })}
        >
          {state.theme === 'dark'
            ? <Sun className="w-[15px] h-[15px]" />
            : <Moon className="w-[15px] h-[15px]" />}
        </Button>

        <Button
          variant="icon"
          title="Notifications"
          className="relative"
          onClick={() => toast('3 containers need attention', 'info')}
        >
          <Bell className="w-[15px] h-[15px]" />
          <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] bg-[#f59e0b] rounded-full shadow-[0_0_6px_#f59e0b] animate-pdot" />
        </Button>

        <div className="w-px h-[22px] bg-[var(--border)] mx-[3px]" />

        <button
          onClick={() => dispatch({ type: 'TOGGLE_AI' })}
          className={cn(
            'flex items-center gap-[7px] px-3.5 py-[7px] rounded-[11px] text-[12.5px] font-semibold',
            'transition-all duration-[220ms] whitespace-nowrap border',
            state.aiOpen
              ? 'bg-gradient-to-br from-[rgba(0,212,255,0.22)] to-[rgba(124,58,237,0.2)] border-[rgba(0,212,255,0.35)] text-[#00d4ff] shadow-[0_0_22px_rgba(0,212,255,0.18)]'
              : 'bg-gradient-to-br from-[rgba(0,212,255,0.1)] to-[rgba(124,58,237,0.1)] border-[rgba(0,212,255,0.22)] text-[#00d4ff] hover:from-[rgba(0,212,255,0.18)] hover:to-[rgba(124,58,237,0.18)] hover:border-[rgba(0,212,255,0.45)] hover:shadow-[0_0_18px_rgba(0,212,255,0.12)]',
          )}
        >
          <span className="w-[7px] h-[7px] rounded-full bg-[#00d4ff] shadow-[0_0_7px_#00d4ff] animate-pdot flex-shrink-0" />
          <Sparkles className="w-3.5 h-3.5" />
          OrcaHub AI
        </button>

        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-[12px] font-bold text-white cursor-pointer">
          U
        </div>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <div className="w-[30px] h-[30px] flex-shrink-0">
      <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <rect x="2" y="2" width="12" height="12" rx="2.5" fill="rgba(0,212,255,.14)" stroke="rgba(0,212,255,.45)" strokeWidth="1.2"/>
        <rect x="18" y="2" width="12" height="12" rx="2.5" fill="rgba(0,212,255,.07)" stroke="rgba(0,212,255,.22)" strokeWidth="1.2"/>
        <rect x="2" y="18" width="12" height="12" rx="2.5" fill="rgba(0,212,255,.07)" stroke="rgba(0,212,255,.22)" strokeWidth="1.2"/>
        <rect x="18" y="18" width="12" height="12" rx="2.5" fill="rgba(124,58,237,.1)" stroke="rgba(124,58,237,.3)" strokeWidth="1.2"/>
        <circle cx="16" cy="16" r="2.8" fill="rgba(0,212,255,.65)"/>
      </svg>
    </div>
  )
}

function EnvBtn({
  active, onClick, label, color, connected, detectTag
}: {
  active:     boolean
  onClick:    () => void
  label:      string
  color:      'cyan' | 'purple'
  connected:  boolean
  detectTag?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-[5px] rounded-[11px] text-[12px] font-semibold',
        'transition-all duration-[220ms] border-none whitespace-nowrap relative',
        active
          ? cn(
              'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_1px_6px_rgba(0,0,0,0.2)]',
              color === 'cyan'   && 'text-[#00d4ff]',
              color === 'purple' && 'text-[#a78bfa]',
            )
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-secondary)]',
      )}
    >
      <span
        className={cn(
          'w-[6px] h-[6px] rounded-full flex-shrink-0',
          connected
            ? color === 'cyan'
              ? 'bg-[#10d98a] shadow-[0_0_5px_#10d98a] animate-pdot'
              : 'bg-[#a78bfa] shadow-[0_0_5px_#a78bfa] animate-pdot'
            : 'bg-[var(--text-muted)]',
        )}
      />
      {label}
      {detectTag && (
        <span className="text-[8.5px] font-bold tracking-[.05em] px-[5px] py-px rounded bg-[rgba(16,217,138,0.12)] text-[#10d98a] border border-[rgba(16,217,138,0.2)]">
          {detectTag}
        </span>
      )}
    </button>
  )
}
