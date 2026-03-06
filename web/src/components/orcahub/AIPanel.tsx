import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import { X, Send, Sparkles } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

interface Message { role: 'user' | 'ai'; text: string }
const SUGGESTIONS = ['Which containers use the most memory?','Are there any unhealthy containers?','What images are unused?','How can I reduce disk usage?']

export function AIPanel() {
  const { state, dispatch } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])
  useEffect(() => { if (state.aiOpen && !started && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300) }, [state.aiOpen, started])

  const buildContext = () => {
    const running = state.containers.filter(c => c.state === 'running')
    const stopped = state.containers.filter(c => c.state !== 'running')
    const imgSize = state.images.reduce((s, i) => s + i.size, 0)
    return `You are OrcaHub AI, an expert Docker and container management assistant.\nCurrent Docker environment:\n- Containers: ${state.containers.length} total (${running.length} running, ${stopped.length} stopped/exited)\n- Running: ${running.map(c => `${c.name.replace(/^\//, '')} (${c.image})`).join(', ') || 'none'}\n- Images: ${state.images.length} (total size: ${formatBytes(imgSize)})\n- Volumes: ${state.volumes.length}\n- Networks: ${state.networks.length}\nAnswer concisely and helpfully. Use markdown formatting.`
  }

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || thinking) return
    setInput(''); setStarted(true)
    const userMsg: Message = { role: 'user', text: msg }
    setMessages(prev => [...prev, userMsg]); setThinking(true)
    try {
      const history = [...messages, userMsg]
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: buildContext(), messages: history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })) }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const aiText = data.content?.map((b: { type: string; text?: string }) => b.text ?? '').join('') ?? 'Sorry, I could not get a response.'
      setMessages(prev => [...prev, { role: 'ai', text: aiText }])
    } catch { setMessages(prev => [...prev, { role: 'ai', text: 'Failed to reach OrcaHub AI. Please try again.' }]) }
    finally { setThinking(false) }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className={cn('fixed right-0 top-[58px] h-[calc(100vh-58px)] z-[300] flex flex-col', 'bg-[var(--bg-surface)] border-l border-[var(--border)]', 'transition-all duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)]', state.aiOpen ? 'w-[380px] opacity-100' : 'w-0 opacity-0 pointer-events-none')}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[rgba(0,212,255,0.2)] to-[rgba(124,58,237,0.2)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-[#00d4ff]" /></div>
          <div><div className="text-[13px] font-bold">OrcaHub AI</div><div className="text-[10.5px] text-[var(--text-muted)]">Powered by Claude</div></div>
        </div>
        <button onClick={() => dispatch({ type: 'TOGGLE_AI' })} className="w-[28px] h-[28px] flex items-center justify-center rounded-[7px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] transition-all"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!started ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(124,58,237,0.15)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center mb-3"><Sparkles className="w-6 h-6 text-[#00d4ff]" /></div>
              <div className="text-[14px] font-semibold mb-1">Ask me anything</div>
              <div className="text-[12px] text-[var(--text-muted)] leading-relaxed">I have full context of your {state.containers.length} containers, {state.images.length} images, and {state.volumes.length} volumes.</div>
            </div>
            <div className="space-y-2">{SUGGESTIONS.map(s => (<button key={s} onClick={() => send(s)} className="w-full text-left text-[12.5px] px-3 py-2.5 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-bright)] hover:text-[var(--text-primary)] transition-all">{s}</button>))}</div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'ai' && (<div className="w-6 h-6 rounded-full bg-gradient-to-br from-[rgba(0,212,255,0.2)] to-[rgba(124,58,237,0.2)] border border-[rgba(0,212,255,0.25)] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"><Sparkles className="w-3 h-3 text-[#00d4ff]" /></div>)}
              <div className={cn('max-w-[85%] px-3.5 py-2.5 rounded-[13px] text-[12.5px] leading-relaxed', m.role === 'user' ? 'bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] text-[var(--text-primary)]' : 'bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-secondary)]')}>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          ))
        )}
        {thinking && (<div className="flex items-start gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-[rgba(0,212,255,0.2)] to-[rgba(124,58,237,0.2)] border border-[rgba(0,212,255,0.25)] flex items-center justify-center flex-shrink-0"><Sparkles className="w-3 h-3 text-[#00d4ff]" /></div><div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-[13px] px-3.5 py-3 flex gap-1.5 items-center">{[0, 150, 300].map(d => (<span key={d} className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: `${d}ms` }} />))}</div></div>)}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex items-end gap-2 bg-[var(--bg-glass)] border border-[var(--border)] rounded-[13px] px-3 py-2.5 focus-within:border-[var(--border-focus)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)] transition-all">
          <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask about your containers…" className="flex-1 bg-transparent border-none outline-none resize-none text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] max-h-24 overflow-auto" />
          <button onClick={() => send()} disabled={!input.trim() || thinking} className="w-7 h-7 flex items-center justify-center rounded-[8px] bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] disabled:opacity-30 hover:bg-[rgba(0,212,255,0.25)] transition-all flex-shrink-0"><Send className="w-3.5 h-3.5" /></button>
        </div>
        <div className="text-[10px] text-[var(--text-muted)] text-center mt-2">Enter to send · Shift+Enter for newline</div>
      </div>
    </div>
  )
}
