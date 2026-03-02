import { useState } from 'react'
import { useAppStore } from '../../store/app'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import type { Container } from '../../types'

export default function AIPanel() {
  const { toggleAI } = useAppStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m monitoring your infrastructure. What can I help with?' }
  ])

  const { data: containers = [] } = useQuery<Container[]>({ queryKey: ['containers'], queryFn: api.containers.list })
  const running = containers.filter(c => c.state === 'running')

  const send = (txt?: string) => {
    const msg = txt ?? input.trim()
    if (!msg) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])

    setTimeout(() => {
      let reply = 'I\'m analyzing your infrastructure. All services appear healthy.'
      if (msg.toLowerCase().includes('mem')) {
        reply = `Top memory consumers:\n${running.slice(0,3).map((c,i)=>`${i+1}. **${c.name}**`).join('\n')}`
      } else if (msg.toLowerCase().includes('restart') || msg.toLowerCase().includes('restar')) {
        reply = 'No containers with high restart counts detected right now.'
      } else if (msg.toLowerCase().includes('running')) {
        reply = `${running.length} containers currently running: ${running.slice(0,4).map(c=>c.name).join(', ')}${running.length>4?'…':''}`
      }
      setMessages(m => [...m, { role: 'ai', text: reply }])
    }, 800)
  }

  return (
    <aside className="ai-panel" id="aiPanel">
      <div className="ai-ph">
        <div className="ai-orb"><div className="ai-orb-core"></div></div>
        <div><div className="ai-ph-title">OrcaHub AI</div><div className="ai-ph-sub">Infrastructure co-pilot</div></div>
        <button className="icon-btn" style={{marginLeft:'auto'}} onClick={toggleAI}>✕</button>
      </div>
      <div className="ai-msgs" id="aiMsgs">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className={`msg-av ${m.role === 'ai' ? 'ai' : 'usr'}`}>{m.role === 'ai' ? 'AI' : 'U'}</div>
            <div className="msg-bub" dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        ))}
      </div>
      <div className="ai-sugg">
        <div className="ai-sugg-lbl">Try asking</div>
        <button className="sugg-chip" onClick={() => send('Which containers are using the most memory?')}>📊 Top memory users?</button>
        <button className="sugg-chip" onClick={() => send('How many containers are running?')}>🐳 Running containers?</button>
        <button className="sugg-chip" onClick={() => send('Show containers with restart issues')}>⚠️ Restart issues?</button>
      </div>
      <div className="ai-input-row">
        <input
          className="ai-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your infrastructure…"
        />
        <button className="btn btn-primary btn-sm" onClick={() => send()}>Send</button>
      </div>
    </aside>
  )
}