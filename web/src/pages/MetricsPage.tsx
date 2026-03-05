import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader } from '@/components/orcahub/PageHeader'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes } from '@/lib/utils'
import type { MetricPoint } from '@/types'

const WINDOW = 60 // seconds

function genPoint(): MetricPoint {
  return { ts: Date.now(), cpu: Math.random() * 45 + 5, mem: Math.random() * 30 + 30 }
}

function initHistory(): MetricPoint[] {
  return Array.from({ length: WINDOW }, (_, i) => ({
    ts:  Date.now() - (WINDOW - i) * 1000,
    cpu: Math.random() * 45 + 5,
    mem: Math.random() * 30 + 30,
  }))
}

export function MetricsPage() {
  const { state }       = useApp()
  const [history, setHistory] = useState<MetricPoint[]>(initHistory)
  const [timeRange, setTimeRange] = useState('1m')
  const svgRef = useRef<SVGSVGElement>(null)
  const animRef = useRef<number>(0)

  const running = state.containers.filter(c => c.state === 'running')
  const latest = history[history.length - 1]

  useEffect(() => {
    const id = setInterval(() => {
      setHistory(h => [...h.slice(1), genPoint()])
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Draw chart
  const drawChart = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const w = svg.clientWidth || 600
    const h = 160
    const pad = { t: 12, b: 24, l: 0, r: 0 }
    const IW = w - pad.l - pad.r
    const IH = h - pad.t - pad.b
    const pts = history.slice(-WINDOW)
    const n = pts.length

    const toX = (i: number) => pad.l + (i / (n - 1)) * IW
    const toY = (v: number) => pad.t + IH - (v / 100) * IH

    const cpuPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.cpu)}`).join(' ')
    const memPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.mem)}`).join(' ')
    const cpuFill = `${cpuPath} L${toX(n-1)},${pad.t+IH} L${toX(0)},${pad.t+IH} Z`
    const memFill = `${memPath} L${toX(n-1)},${pad.t+IH} L${toX(0)},${pad.t+IH} Z`

    svg.innerHTML = `
      <defs>
        <linearGradient id="cpu-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="mem-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10d98a" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#10d98a" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${[0,25,50,75,100].map(v => `
        <line x1="${pad.l}" y1="${toY(v)}" x2="${w-pad.r}" y2="${toY(v)}"
          stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        <text x="${pad.l+6}" y="${toY(v)-3}" font-size="9" fill="rgba(240,244,255,0.28)"
          font-family="JetBrains Mono,monospace">${v}%</text>
      `).join('')}
      <path d="${cpuFill}" fill="url(#cpu-grad)"/>
      <path d="${cpuPath}" fill="none" stroke="#00d4ff" stroke-width="2"/>
      <path d="${memFill}" fill="url(#mem-grad)"/>
      <path d="${memPath}" fill="none" stroke="#10d98a" stroke-width="2"/>
    `
  }, [history])

  useEffect(() => {
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(drawChart)
  }, [drawChart])

  useEffect(() => {
    const ro = new ResizeObserver(drawChart)
    if (svgRef.current?.parentElement) ro.observe(svgRef.current.parentElement)
    return () => ro.disconnect()
  }, [drawChart])

  return (
    <div className="animate-pagein">
      <PageHeader
        title="Metrics"
        sub="Real-time resource usage across all containers"
        actions={
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              {['1m','5m','15m','1h'].map(t => (
                <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      {/* Big metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total CPU', value: `${latest.cpu.toFixed(1)}%`, sub: `across ${running.length} running`, color: 'text-[#00d4ff]' },
          { label: 'Memory Used', value: formatBytes(latest.mem / 100 * 8 * 1024 * 1024 * 1024), sub: `${latest.mem.toFixed(0)}% of available`, color: 'text-[#10d98a]' },
          { label: 'Net I/O', value: '12.4 MB/s', sub: 'last minute', color: 'text-[#f59e0b]' },
        ].map(m => (
          <div key={m.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] px-5 py-5 relative overflow-hidden after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent">
            <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[var(--text-muted)] mb-2">{m.label}</div>
            <div className={`text-[32px] font-extrabold tracking-tight leading-none mb-2 ${m.color}`}>{m.value}</div>
            <div className="text-[11.5px] text-[var(--text-muted)]">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-bold text-[var(--text-primary)]">
            CPU &amp; Memory over time
            <span className="ml-2 text-[11px] text-[var(--text-muted)] font-normal">Live · {WINDOW}s window</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#00d4ff] inline-block rounded" /> CPU</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#10d98a] inline-block rounded" /> Memory</span>
          </div>
        </div>
        <svg ref={svgRef} className="w-full" style={{ height: '160px' }} />
      </div>

      {/* Per-container table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] text-[13.5px] font-bold text-[var(--text-primary)]">
          Per-container stats
        </div>
        <table className="orca-table">
          <thead>
            <tr>
              <th>Container</th>
              <th>CPU %</th>
              <th>Memory</th>
              <th>Mem %</th>
              <th>Net I/O</th>
              <th>Block I/O</th>
              <th>PIDs</th>
            </tr>
          </thead>
          <tbody>
            {running.map(c => {
              const cpu  = (Math.random() * 30 + 1).toFixed(1)
              const mem  = Math.floor(Math.random() * 400 + 50)
              const memP = (mem / 800 * 100).toFixed(0)
              const pids = Math.floor(Math.random() * 20 + 1)
              return (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium text-[13px]">{c.name.replace(/^\//, '')}</div>
                    <div className="font-mono text-[10.5px] text-[var(--text-muted)]">{c.image}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-[#00d4ff] w-12">{cpu}%</span>
                      <div className="w-16 h-1 bg-[var(--bg-raised)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00d4ff] rounded-full" style={{ width: `${cpu}%` }} />
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-[12px] text-[var(--text-secondary)]">{formatBytes(mem * 1024 * 1024)}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-[#10d98a] w-10">{memP}%</span>
                      <div className="w-16 h-1 bg-[var(--bg-raised)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#10d98a] rounded-full" style={{ width: `${memP}%` }} />
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-[11.5px] text-[var(--text-muted)]">{(Math.random() * 5).toFixed(1)} / {(Math.random() * 2).toFixed(1)} MB</span></td>
                  <td><span className="font-mono text-[11.5px] text-[var(--text-muted)]">{(Math.random() * 20).toFixed(1)} / {(Math.random() * 5).toFixed(1)} MB</span></td>
                  <td><span className="font-mono text-[11.5px] text-[var(--text-secondary)]">{pids}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
