import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'

export default function LogsPanel({ id }: { id: string }) {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [tail, setTail] = useState(200)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    api.containers.logs(id, tail).then(r => {
      setLogs(r?.logs ?? [])
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
    })
  }, [id, tail])

  const logLevel = (line: string) => {
    const l = line.toLowerCase()
    if (l.includes('error') || l.includes('fatal')) return 'err'
    if (l.includes('warn')) return 'warn'
    if (l.includes('info') || l.startsWith('[i]')) return 'info'
    return ''
  }

  return (
    <div className="drawer-tab-panel active" id="dt-logs" style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
        <span style={{fontSize:12,color:'var(--text-muted)'}}>Lines:</span>
        {[100,200,500].map(n => (
          <button key={n} className={`btn btn-ghost btn-xs ${tail===n?'active':''}`} onClick={() => setTail(n)}>{n}</button>
        ))}
        <button className="btn btn-ghost btn-xs" onClick={() => {setLogs([]); setLoading(true); api.containers.logs(id, tail).then(r => { setLogs(r?.logs ?? []); setLoading(false) })}}>↺</button>
      </div>
      <div className="logs-wrap" style={{flex:1,overflowY:'auto',background:'var(--code-bg)',borderRadius:'var(--r-md)',padding:'10px 12px'}}>
        {loading
          ? <div style={{color:'var(--text-muted)',fontSize:13}}>Loading logs…</div>
          : logs.length === 0
            ? <div style={{color:'var(--text-muted)',fontSize:13}}>No logs available</div>
            : logs.map((line, i) => (
              <div key={i} className={`log-line ${logLevel(line)}`}>{line}</div>
            ))
        }
        <div ref={bottomRef} />
      </div>
    </div>
  )
}