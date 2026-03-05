import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import { X, Send, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'ai'
  text: string
}

const SUGGESTIONS = [
  'Which containers use the most memory?',
  'How do I scale my Redis service?',
  'Show containers with high restart count',
  'What images are unused?',
]

const RESPONSES: Record<string, string> = {
  memory: "Your top memory consumers:\n\n1. **postgres-main** — 384 MB (67%)\n2. **app-backend** — 256 MB (55%)\n3. **grafana** — 128 MB (38%)\n\nConsider setting memory limits via `--memory` flag.",
  scale:  "To scale with Docker Compose:\n\n`docker compose up --scale redis=3 -d`\n\nFor HA Redis, consider Redis Sentinel or Redis Cluster.",
  restart:"Containers with high restart counts:\n\n- **worker-queue** — 5 restarts\n- **prometheus** — 3 restarts\n- **api-gateway** — 2 restarts\n\nCheck `worker-queue` logs first — it likely has a startup crash.",
  image:  "Unused images (not backing any container):\n\n- `ubuntu:22.04` — 77 MB\n\nRun `docker image prune` to reclaim disk space.",
  default:"All critical services are healthy ✓\n\nI can help you analyze resource usage, diagnose issues, or suggest optimizations. What would you like to know?",
}

export function AIPanel() {
  const { state, dispatch } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = (text?: string) => {
    const msg = text ?? input.trim()
    if (!msg) return
    setInput('')
    setStarted(true)
    setMessages(m => [...m, { role: 'user', text: msg }])
    setTyping(true)

    const key = msg.toLowerCase().includes('mem') ? 'memory'
      : msg.toLowerCase().includes('scale') || msg.toLowerCase().includes('replica') ? 'scale'
      : msg.toLowerCase().includes('restart') ? 'restart'
      : msg.toLowerCase().includes('image') ? 'image'
      : 'default'

    setTimeout(() => {
      setTyping(false)
      setMessages(m => [...m, { role: 'ai', text: RESPONSES[key] }])
    }, 900 + Math.random() * 600)
  }

  if (!state.aiOpen) return null

  return (
    <div
      className={cn(
        'w-[360px] flex-shrink-0 border-l border-[var(--border)]',
        'bg-[var(--bg-void)] flex flex-col animate-slide-in',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(124,58,237,0.15)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#00d4ff]" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-[var(--text-primary)]">OrcaHub AI</div>
          <div className="text-[10.5px] text-[var(--text-muted)]">Infrastructure assistant</div>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AI' })}
          className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!started && (
          <div>
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(124,58,237,0.15)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed max-w-[220px] mx-auto">
                Ask me anything about your infrastructure.
              </p>
            </div>

            <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[var(--text-muted)] mb-2">Suggestions</div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-[12px] text-[var(--text-secondary)] px-3 py-2.5 rounded-[9px] bg-[var(--bg-glass)] border border-[var(--border)] hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-bright)] hover:text-[var(--text-primary)] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}

        {typing && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(124,58,237,0.15)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#00d4ff]">
              AI
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[9px] px-3 py-2.5 flex items-center gap-1">
              {[0,1,2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pdot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-end gap-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[11px] px-3 py-2 transition-all focus-within:border-[var(--border-focus)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)]">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about your infrastructure…"
            rows={1}
            className="flex-1 bg-transparent outline-none text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none min-h-[20px] max-h-[80px]"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || typing}
            className="text-[#00d4ff] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // Render markdown-lite
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Code block
      if (line.startsWith('`') && line.endsWith('`')) {
        return (
          <div key={i} className="my-1 px-2 py-1 rounded bg-[rgba(0,0,0,0.35)] font-mono text-[11px] text-[#00d4ff]">
            {line.slice(1, -1)}
          </div>
        )
      }
      // Bold
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i} className="block">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </span>
      )
    })
  }

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-7 h-7 rounded-[7px] flex-shrink-0 flex items-center justify-center text-[10px] font-bold',
          isUser
            ? 'bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] text-white'
            : 'bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(124,58,237,0.15)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff]',
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>
      <div
        className={cn(
          'max-w-[240px] rounded-[9px] px-3 py-2.5 text-[12px] leading-relaxed',
          isUser
            ? 'bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--text-primary)]'
            : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]',
        )}
      >
        {renderText(message.text)}
      </div>
    </div>
  )
}
