import { useState, useRef, useEffect } from 'react'
import { api } from '../../api'
import { useAppStore } from '../../store/app'

interface HistoryEntry {
  cmd: string
  output: string
  exitCode: number
  error?: string
}

export default function ExecPanel({ id, isRunning }: { id: string; isRunning: boolean }) {
  const { addToast } = useAppStore()
  const [cmd, setCmd] = useState('ls -la')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [running, setRunning] = useState(false)
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [cmdIdx, setCmdIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const run = async () => {
    const trimmed = cmd.trim()
    if (!trimmed || running) return

    setRunning(true)
    setCmdHistory(h => [trimmed, ...h].slice(0, 50))
    setCmdIdx(-1)

    try {
      const result = await api.containers.exec(id, trimmed.split(/\s+/))
      setHistory(h => [...h, { cmd: trimmed, output: result.output, exitCode: result.exit_code }])
      if (result.exit_code !== 0) {
        addToast(`Command exited with code ${result.exit_code}`, 'warn')
      }
    } catch (e: any) {
      setHistory(h => [...h, { cmd: trimmed, output: '', exitCode: 1, error: e.message }])
      addToast(e.message, 'error')
    } finally {
      setRunning(false)
      setCmd('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { run(); return }
    if (e.key === 'ArrowUp') {
      const next = Math.min(cmdIdx + 1, cmdHistory.length - 1)
      setCmdIdx(next)
      setCmd(cmdHistory[next] ?? '')
      e.preventDefault()
    }
    if (e.key === 'ArrowDown') {
      const next = Math.max(cmdIdx - 1, -1)
      setCmdIdx(next)
      setCmd(next === -1 ? '' : (cmdHistory[next] ?? ''))
      e.preventDefault()
    }
  }

  if (!isRunning) {
    return (
      <div className="drawer-tab-panel active" style={{display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--text-muted)',padding:'40px 0'}}>
        <span style={{fontSize:32}}>⏸</span>
        <span>Container is not running</span>
        <span style={{fontSize:12}}>Start the container to use exec</span>
      </div>
    )
  }

  return (
    <div className="drawer-tab-panel active" id="dt-exec" style={{display:'flex',flexDirection:'column',height:'100%',gap:0}}>
      {/* Terminal output */}
      <div style={{
        flex:1, overflowY:'auto', background:'#020409', borderRadius:'var(--r-md)',
        padding:'12px 14px', fontFamily:'var(--font-mono)', fontSize:12.5,
        marginBottom:8, minHeight:200,
      }}>
        {history.length === 0 && (
          <div style={{color:'rgba(255,255,255,0.25)',userSelect:'none'}}>
            # Type a command and press Enter to execute it inside the container
          </div>
        )}
        {history.map((entry, i) => (
          <div key={i} style={{marginBottom:8}}>
            <div style={{color:'#00d4ff'}}>
              <span style={{color:'rgba(0,212,255,0.5)'}}>❯ </span>{entry.cmd}
            </div>
            {entry.error ? (
              <div style={{color:'#ef4444',whiteSpace:'pre-wrap',marginTop:2}}>{entry.error}</div>
            ) : entry.output ? (
              <div style={{
                color: entry.exitCode !== 0 ? '#fbbf24' : '#e2e8f0',
                whiteSpace:'pre-wrap', marginTop:2,
              }}>{entry.output}</div>
            ) : (
              <div style={{color:'rgba(255,255,255,0.2)',fontStyle:'italic',marginTop:2,fontSize:11}}>
                (no output) exit code {entry.exitCode}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display:'flex', alignItems:'center', gap:8,
        background:'#020409', borderRadius:'var(--r-md)',
        border:'1px solid rgba(0,212,255,0.25)', padding:'8px 12px',
      }}>
        <span style={{color:'rgba(0,212,255,0.6)',fontFamily:'var(--font-mono)',fontSize:13,flexShrink:0}}>❯</span>
        <input
          ref={inputRef}
          type="text"
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter command…"
          disabled={running}
          style={{
            flex:1, background:'none', border:'none', outline:'none',
            color:'#f0f4ff', fontFamily:'var(--font-mono)', fontSize:13,
          }}
          autoFocus
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={run}
          disabled={running || !cmd.trim()}
          style={{flexShrink:0}}
        >
          {running ? '…' : 'Run'}
        </button>
      </div>
      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4,paddingLeft:2}}>
        ↑↓ navigate history · Enter to run
      </div>
    </div>
  )
}