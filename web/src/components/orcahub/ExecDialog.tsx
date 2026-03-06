import { useState, useRef, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/api/client'
import { cn } from '@/lib/utils'
import { Terminal, Send, RotateCcw } from 'lucide-react'

interface TerminalLine { type: 'input' | 'output' | 'error' | 'system'; text: string }
interface ExecDialogProps { open: boolean; onClose: () => void; containerId: string; containerName: string }

export function ExecDialog({ open, onClose, containerId, containerName }: ExecDialogProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setLines([{ type: 'system', text: `Connected to container: ${containerName}` }, { type: 'system', text: 'Type commands to execute inside the container.' }, { type: 'system', text: '\u2500'.repeat(56) }])
      setInput(''); setHistory([]); setHistIdx(-1)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, containerName])

  useEffect(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight }, [lines])

  const runCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return
    setLines(l => [...l, { type: 'input', text: `$ ${trimmed}` }])
    setHistory(h => [trimmed, ...h.slice(0, 49)]); setHistIdx(-1); setLoading(true)
    if (trimmed === 'clear') { setLines([{ type: 'system', text: 'Screen cleared.' }]); setLoading(false); return }
    try {
      const parts = trimmed.split(/\s+/).filter(Boolean)
      const result = await api.containers.exec(containerId, { command: parts, attach_stdout: true, attach_stderr: true })
      const outLines = result.output.split('\n').filter(l => l !== '')
      const newLines: TerminalLine[] = outLines.length > 0
        ? outLines.map(l => ({ type: result.exit_code !== 0 ? 'error' as const : 'output' as const, text: l }))
        : [{ type: 'system', text: `Exit code: ${result.exit_code}` }]
      setLines(l => [...l, ...newLines])
    } catch (e: unknown) { setLines(l => [...l, { type: 'error', text: e instanceof Error ? e.message : 'Command failed' }]) }
    finally { setLoading(false) }
  }, [containerId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { runCommand(input); setInput('') }
    else if (e.key === 'ArrowUp' && history.length > 0) { const idx = Math.min(histIdx + 1, history.length - 1); setHistIdx(idx); setInput(history[idx]) }
    else if (e.key === 'ArrowDown') { if (histIdx <= 0) { setHistIdx(-1); setInput('') } else { const idx = histIdx - 1; setHistIdx(idx); setInput(history[idx]) } }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-raised)]">
          <div className="w-8 h-8 rounded-[9px] bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.22)] flex items-center justify-center flex-shrink-0">
            <Terminal className="w-4 h-4 text-[#00d4ff]" />
          </div>
          <DialogHeader className="mb-0 flex-1">
            <DialogTitle className="text-[14px] font-bold">Exec "\u2014" <span className="text-[#00d4ff]">{containerName}</span></DialogTitle>
          </DialogHeader>
          <button onClick={() => setLines([{ type: 'system', text: 'Screen cleared.' }])} className="flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-[var(--bg-glass)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] transition-all">
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </div>
        <div ref={outputRef} className="terminal-output h-72 overflow-y-auto p-4 cursor-text" onClick={() => inputRef.current?.focus()}>
          {lines.map((line, i) => (<div key={i} className={cn('log-line', line.type === 'input' && 'terminal-prompt', line.type === 'error' && 'terminal-error', line.type === 'system' && 'terminal-sys')}>{line.text}</div>))}
          {loading && (<div className="terminal-sys flex items-center gap-2"><span className="inline-block w-3 h-3 border border-[#00d4ff] border-t-transparent rounded-full animate-spin" />executing\u2026</div>)}
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-raised)]">
          <span className="terminal-prompt font-mono text-[12px] flex-shrink-0">$</span>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder="Enter command\u2026" spellCheck={false} autoCapitalize="off" autoComplete="off"
            className={cn('flex-1 bg-transparent outline-none font-mono text-[12px] text-[#a8ff78]', 'placeholder:text-[var(--text-muted)] disabled:opacity-50')} />
          <button onClick={() => { runCommand(input); setInput('') }} disabled={loading || !input.trim()} className="text-[var(--text-muted)] hover:text-[#00d4ff] transition-colors disabled:opacity-30"><Send className="w-4 h-4" /></button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
