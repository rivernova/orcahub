import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'

type Section = 'connection' | 'appearance' | 'about'

export default function SettingsPage() {
  const { theme, setTheme, addToast } = useAppStore()
  const [section, setSection] = useState<Section>('connection')
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('oh_api_url') || '/api')

  const { data: status } = useQuery({ queryKey: ['system-status'], queryFn: api.system.status })

  const save = () => {
    localStorage.setItem('oh_api_url', apiUrl)
    addToast('Settings saved', 'success')
  }

  return (
    <div className="page active" id="page-settings">
      <div className="ph"><div className="ph-left"><h1>Settings</h1><p>Configure OrcaHub and your Docker connection</p></div></div>
      <div className="settings-grid">
        <div className="settings-nav">
          {(['connection','appearance','about'] as Section[]).map(s => (
            <div key={s} className={`snav-item ${section===s?'active':''}`} onClick={() => setSection(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>
        <div className="settings-panel">
          {section === 'connection' && (
            <div className="settings-section active">
              <h2>Docker Connection</h2>
              <div className="desc">Configure how OrcaHub connects to the backend API.</div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-title">API Base URL</div>
                  <div className="setting-desc">Backend API endpoint (default: /api)</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <input type="text" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
                    style={{background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'7px 12px',color:'var(--text-primary)',fontSize:13,width:280}} />
                  <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
                </div>
              </div>
              {status && (
                <div className="detail-grid" style={{marginTop:16}}>
                  <div className="detail-item">
                    <div className="detail-item-label">Docker</div>
                    <div className="detail-item-val" style={{color: status.docker.available ? 'var(--accent-green)' : 'var(--accent-red)'}}>
                      {status.docker.available ? `✓ Connected (v${status.docker.version})` : `✗ ${status.docker.error}`}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-item-label">Kubernetes</div>
                    <div className="detail-item-val" style={{color: status.kubernetes.available ? 'var(--accent-green)' : 'var(--text-muted)'}}>
                      {status.kubernetes.available ? `✓ ${status.kubernetes.context}` : 'Not detected'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {section === 'appearance' && (
            <div className="settings-section active">
              <h2>Appearance</h2>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-title">Dark mode</div>
                  <div className="setting-desc">Toggle between dark and light theme</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={theme==='dark'} onChange={e => setTheme(e.target.checked?'dark':'light')} />
                  <span className="toggle-thumb"></span>
                </label>
              </div>
            </div>
          )}
          {section === 'about' && (
            <div className="settings-section active">
              <h2>About OrcaHub</h2>
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-item-label">Version</div><div className="detail-item-val">1.0.0-beta</div></div>
                <div className="detail-item"><div className="detail-item-label">Build</div><div className="detail-item-val mono">2026-03-01</div></div>
                <div className="detail-item detail-full">
                  <div className="detail-item-label">Backend API</div>
                  <div className="detail-item-val mono" style={{color: status?.docker.available ? 'var(--accent-green)' : 'var(--text-muted)'}}>
                    {apiUrl} · {status?.docker.available ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}