import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/app'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import type { Container, Image, Volume, Network } from '../../types'
import { RefreshCw, Moon, Sun, Bell, X } from 'lucide-react'

export default function Header() {
  const { env, k8sAvailable, theme, toggleAI, aiOpen, setTheme, setPage } = useAppStore()
  const [searchQ, setSearchQ] = useState('')
  const [ddOpen, setDdOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: containers = [] } = useQuery<Container[]>({ queryKey: ['containers'], queryFn: api.containers.list })
  const { data: images = [] } = useQuery<Image[]>({ queryKey: ['images'], queryFn: api.images.list })
  const { data: volumes = [] } = useQuery<Volume[]>({ queryKey: ['volumes'], queryFn: api.volumes.list })
  const { data: networks = [] } = useQuery<Network[]>({ queryKey: ['networks'], queryFn: api.networks.list })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('globalSearch')?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDdOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const q = searchQ.trim().toLowerCase()
  const results: Array<{ cat: string; icon: string; name: string; sub: string; page: string; action?: () => void }> = []

  if (q) {
    containers
      .filter(c => c.name.toLowerCase().includes(q) || c.image.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(c => results.push({
        cat: 'Containers', icon: c.state === 'running' ? '🟢' : '⭕',
        name: c.name, sub: c.image, page: 'containers',
        action: () => { setPage('containers'); useAppStore.getState().openDrawer(c.id) },
      }))

    images
      .filter(i => i.tags?.some(t => t.toLowerCase().includes(q)))
      .slice(0, 3)
      .forEach(i => results.push({
        cat: 'Images', icon: '📦',
        name: i.tags?.[0] ?? i.id.slice(0, 12), sub: `${(i.size / 1e6).toFixed(0)} MB`,
        page: 'images',
      }))

    volumes
      .filter(v => v.name.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach(v => results.push({
        cat: 'Volumes', icon: '💾', name: v.name, sub: v.driver, page: 'volumes',
      }))

    networks
      .filter(n => n.name.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach(n => results.push({
        cat: 'Networks', icon: '🌐', name: n.name, sub: n.driver, page: 'networks',
      }))
  }

  const cats = [...new Set(results.map(r => r.cat))]

  const handleResultClick = (r: typeof results[0]) => {
    setDdOpen(false)
    setSearchQ('')
    if (r.action) {
      r.action()
    } else {
      setPage(r.page as any)
    }
  }

  const hl = (s: string) =>
    q ? s.replace(new RegExp(`(${q})`, 'gi'), '<span class="search-highlight">$1</span>') : s

  return (
    <header className="header">
      <div className="logo-zone">
        <div className="logo-mark">
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2.5" fill="rgba(0,212,255,.14)" stroke="rgba(0,212,255,.45)" strokeWidth="1.2"/>
            <rect x="18" y="2" width="12" height="12" rx="2.5" fill="rgba(0,212,255,.07)" stroke="rgba(0,212,255,.22)" strokeWidth="1.2"/>
            <rect x="2" y="18" width="12" height="12" rx="2.5" fill="rgba(0,212,255,.07)" stroke="rgba(0,212,255,.22)" strokeWidth="1.2"/>
            <rect x="18" y="18" width="12" height="12" rx="2.5" fill="rgba(124,58,237,.1)" stroke="rgba(124,58,237,.3)" strokeWidth="1.2"/>
            <circle cx="16" cy="16" r="2.8" fill="rgba(0,212,255,.65)"/>
          </svg>
        </div>
        <span className="logo-text">OrcaHub</span>
      </div>

      <EnvSwitcher />

      <div className="header-center">
        <div className="search-wrap" ref={searchRef}>
          <div className="search-bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--text-muted)',flexShrink:0}}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              id="globalSearch"
              type="text"
              placeholder={env === 'docker' ? 'Search containers, images, volumes…' : 'Search pods, deployments, services…'}
              autoComplete="off"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setDdOpen(!!e.target.value.trim()) }}
              onFocus={() => searchQ.trim() && setDdOpen(true)}
            />
            <span className="kbd">⌘K</span>
          </div>
          {ddOpen && (
            <div className="search-dropdown open">
              {results.length === 0 ? (
                <div className="search-cat">No results</div>
              ) : cats.map(cat => (
                <div key={cat}>
                  <div className="search-cat">{cat}</div>
                  {results.filter(r => r.cat === cat).map((r, i) => (
                    <div key={i} className="search-result" onClick={() => handleResultClick(r)}>
                      <div className="search-result-icon">{r.icon}</div>
                      <div>
                        <div className="search-result-name" dangerouslySetInnerHTML={{ __html: hl(r.name) }} />
                        <div className="search-result-sub">{r.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" title="Refresh" onClick={() => window.location.reload()}>
          <RefreshCw size={15} />
        </button>
        <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={15} />
          <span className="notif-dot"></span>
        </button>
        <div className="hdivider"></div>
        <button className={`ai-btn ${aiOpen ? 'active' : ''}`} onClick={toggleAI}>
          <span className="ai-dot"></span>OrcaHub AI
        </button>
        <div className="avatar">U</div>
      </div>
    </header>
  )
}

function EnvSwitcher() {
  const { env, setEnv, setPage, k8sAvailable } = useAppStore()

  const handleSwitch = (e: 'docker' | 'k8s') => {
    if (e === env) return
    setEnv(e)
    if (e === 'k8s') {
      setPage(k8sAvailable ? 'k8s-overview' : 'k8s-connect')
    } else {
      setPage('overview')
    }
  }

  return (
    <div style={{ marginLeft: 14, marginRight: 8, flexShrink: 0 }}>
      <div className="env-switcher" id="envSwitcher">
        <button
          className={`env-btn ${env === 'docker' ? 'env-btn-active docker' : ''}`}
          onClick={() => handleSwitch('docker')}
        >
          <span className={`env-btn-dot ${env === 'docker' ? 'connected' : 'disconnected'}`}></span>
          🐳 Docker
        </button>
        {/* Only show K8s button if it was detected OR user is already in k8s mode */}
        {(k8sAvailable || env === 'k8s') && (
          <button
            className={`env-btn k8s ${env === 'k8s' ? 'env-btn-active k8s' : ''}`}
            onClick={() => handleSwitch('k8s')}
          >
            <span className={`env-btn-dot ${k8sAvailable ? 'k8s-connected' : 'disconnected'}`}></span>
            ⎈ Kubernetes
          </button>
        )}
      </div>
    </div>
  )
}