import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader } from '@/components/orcahub/PageHeader'
import { EmptyState, ErrorBanner } from '@/components/orcahub/EmptyState'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { api } from '@/api/client'
import { formatBytes } from '@/lib/utils'
import type { ContainerStats } from '@/types'

interface StatsEntry {
  id:    string
  name:  string
  stats: ContainerStats
}

const WINDOW = 60

interface MetricPoint { ts: number; cpu: number; mem: number }

export function MetricsPage() {
  const { state, loadAll }    = useApp()
  const [timeRange, setTimeRange] = useState('1m')
  const [statsMap, setStatsMap]   = useState<Record<string, StatsEntry>>({})
  const [history, setHistory]     = useState<MetricPoint[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const svgRef  = useRef<SVGSVGElement>(null)
  const animRef = useRef<number>(0)

  const running = state.containers.filter(c => c.state === 'running')

  // Fetch real stats for all running containers
  const fetchStats = useCallback(async () => {
    if (running.length === 0) return
    setLoadingStats(true)
    try {
      const results = await Promise.allSettled(
        running.map(c => api.containers.stats(c.id).then(s => ({ id: c.id, name: c.name.replace(/^\//, ''), stats: s })))
      )
      const newMap: Record<string, StatsEntry> = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') newMap[r.value.id] = r.value
      })
      setStatsMap(newMap)

      // Aggregate for chart
      const entries = Object.values(newMap)
      if (entries.length > 0) {
        const avgCpu = entries.reduce((sum, e) => sum + e.stats.cpu_percent, 0) / entries.length
        const avgMem = entries.reduce((sum, e) => sum + e.stats.memory_percent, 0) / entries.length
        setHistory(h => [...h.slice(-(WINDOW - 1)), { ts: Date.now(), cpu: avgCpu, mem: avgMem }])
      }
    } catch {
      // stats unavailable — keep existing data
    } finally {
      setLoadingStats(false)
    }
  }, [running])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 3000)
    return () => clearInterval(id)
  }, [fetchStats])

  // Draw chart
  const drawChart = useCallback(() => {
    const svg = svgRef.current
    if (!svg || history.length < 2) return
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
        <line x1="${pad.l}" y1="${toY(v)}" x2="${w-pad.r}" y2="${toY(v)}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        <text x="${pad.l+6}" y="${toY(v)-3}" font-size="9" fill="rgba(240,244,255,0.28)" font-family="JetBrains Mono,monospace">${v}%</text>
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

  const statsEntries = Object.values(statsMap)
  const latest = history[history.length - 1]

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

      {state.error && <ErrorBanner message={state.error} onRetry={loadAll} />}

      {running.length === 0 ? (
        <Card>
          <EmptyState
            icon="📊"
            title="No running containers"
            description="Start a container to see real-time metrics"
          />
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              {
                label: 'Avg CPU',
                value: latest ? `${latest.cpu.toFixed(1)}%` : '—',
                sub: `across ${running.length} containers`,
                color: 'text-[#00d4ff]',
              },
              {
                label: 'Avg Memory',
                value: latest ? `${latest.mem.toFixed(1)}%` : '—',
                sub: statsEntries[0] ? formatBytes(statsEntries.reduce((s,e) => s + e.stats.memory_usage, 0)) + ' used' : 'loading…',
                color: 'text-[#10d98a]',
              },
              {
                label: 'Running',
                value: running.length,
                sub: `${state.containers.length} total containers`,
                color: 'text-[#f59e0b]',
              },
            ].map(m => (
              <div key={m.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] px-5 py-5 relative overflow-hidden after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent">
                <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[var(--text-muted)] mb-2">{m.label}</div>
                <div className={`text-[32px] font-extrabold tracking-tight leading-none mb-2 ${m.color}`}>{m.value}</div>
                <div className="text-[11.5px] text-[var(--text-muted)]">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <Card className="p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-bold text-[var(--text-primary)]">
                CPU &amp; Memory over time
                <span className="ml-2 text-[11px] text-[var(--text-muted)] font-normal">
                  {loadingStats ? 'Fetching…' : `Live · ${WINDOW}s window`}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#00d4ff] inline-block rounded" /> CPU</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#10d98a] inline-block rounded" /> Memory</span>
              </div>
            </div>
            {history.length < 2 ? (
              <div className="h-40 flex items-center justify-center text-[12px] text-[var(--text-muted)]">
                Collecting data…
              </div>
            ) : (
              <svg ref={svgRef} className="w-full" style={{ height: '160px' }} />
            )}
          </Card>

          {/* Per-container table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Per-container stats</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Container</TableHead>
                    <TableHead>CPU %</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>Mem %</TableHead>
                    <TableHead>Net I/O</TableHead>
                    <TableHead>Block I/O</TableHead>
                    <TableHead>PIDs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[12px] text-[var(--text-muted)]">
                        Fetching stats…
                      </td>
                    </tr>
                  ) : (
                    statsEntries.map(({ id, name, stats: s }) => (
                      <TableRow key={id}>
                        <TableCell>
                          <div className="font-medium text-[13px] text-[var(--text-primary)]">{name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] text-[#00d4ff] w-12">{s.cpu_percent.toFixed(1)}%</span>
                            <div className="w-16 h-1 bg-[var(--bg-raised)] rounded-full overflow-hidden">
                              <div className="h-full bg-[#00d4ff] rounded-full" style={{ width: `${Math.min(s.cpu_percent, 100)}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[12px] text-[var(--text-secondary)]">{formatBytes(s.memory_usage)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] text-[#10d98a] w-10">{s.memory_percent.toFixed(1)}%</span>
                            <div className="w-16 h-1 bg-[var(--bg-raised)] rounded-full overflow-hidden">
                              <div className="h-full bg-[#10d98a] rounded-full" style={{ width: `${Math.min(s.memory_percent, 100)}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[11.5px] text-[var(--text-muted)]">
                            ↑{formatBytes(s.network_in)} / ↓{formatBytes(s.network_out)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[11.5px] text-[var(--text-muted)]">
                            R:{formatBytes(s.block_read)} / W:{formatBytes(s.block_write)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[11.5px] text-[var(--text-secondary)]">{s.pids}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
