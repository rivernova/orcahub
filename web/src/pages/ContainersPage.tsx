import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader } from '@/components/orcahub/PageHeader'
import { StatusBadge } from '@/components/orcahub/StatusBadge'
import { ExecDialog } from '@/components/orcahub/ExecDialog'
import { LogsDialog } from '@/components/orcahub/LogsDialog'
import { DeployDialog } from '@/components/orcahub/DeployDialog'
import { InspectDialog } from '@/components/orcahub/InspectDialog'
import { EmptyTableRow, ErrorBanner } from '@/components/orcahub/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { api } from '@/api/client'
import { formatUptime, shortId, formatPorts } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Play, Square, RotateCcw, Trash2, Terminal, FileText, Pause, Plus, Trash, Search } from 'lucide-react'

type Filter = 'all' | 'running' | 'stopped' | 'exited' | 'paused'
interface DlgState { open: boolean; id: string; name: string }

export function ContainersPage() {
  const { state, loadAll, toast } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [exec, setExec] = useState<DlgState>({ open: false, id: '', name: '' })
  const [logs, setLogs] = useState<DlgState>({ open: false, id: '', name: '' })
  const [inspect, setInspect] = useState<DlgState>({ open: false, id: '', name: '' })
  const [deployOpen, setDeployOpen] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const containers = state.containers
  const filtered = useMemo(() => { switch (filter) { case 'running': return containers.filter(c => c.state === 'running'); case 'stopped': return containers.filter(c => c.state === 'created' || c.state === 'stopped'); case 'exited': return containers.filter(c => c.state === 'exited'); case 'paused': return containers.filter(c => c.state === 'paused'); default: return containers } }, [containers, filter])

  const act = async (id: string, action: 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'delete') => {
    setBusy(b => ({ ...b, [id]: true }))
    try { if (action === 'delete') { if (!window.confirm('Delete this container?')) return; await api.containers.delete(id); toast('Container deleted', 'success') } else { await api.containers[action](id); toast(`Container ${action}ed`, 'success') }; await loadAll() }
    catch { toast(`Failed to ${action} container`, 'error') }
    finally { setBusy(b => ({ ...b, [id]: false })) }
  }
  const pruneContainers = async () => { if (!window.confirm('Remove all stopped containers?')) return; try { await api.containers.delete('prune'); await loadAll(); toast('Stopped containers removed', 'success') } catch { toast('Prune failed', 'error') } }

  return (
    <div className="animate-pagein">
      <PageHeader title="Containers" sub="Manage running and stopped containers" actions={<><Button variant="ghost" size="sm" onClick={pruneContainers}><Trash className="w-3 h-3" /> Prune stopped</Button><Button variant="primary" size="sm" onClick={() => setDeployOpen(true)}><Plus className="w-3 h-3" /> Deploy</Button></>} />
      {state.error && <ErrorBanner message={state.error} onRetry={loadAll} />}
      <SectionHeader title="Containers" count={filtered.length} right={<Tabs value={filter} onValueChange={v => setFilter(v as Filter)}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="running">Running</TabsTrigger><TabsTrigger value="stopped">Stopped</TabsTrigger><TabsTrigger value="exited">Exited</TabsTrigger><TabsTrigger value="paused">Paused</TabsTrigger></TabsList></Tabs>} />
      <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Container</TableHead><TableHead>Image</TableHead><TableHead>State</TableHead><TableHead>Ports</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
        {filtered.length === 0 ? (<EmptyTableRow cols={6} icon="📦" title={state.initialLoad ? 'Loading…' : 'No containers'} description={state.loading ? undefined : 'No containers match the current filter'} />) : (
          filtered.map(c => { const isRunning = c.state === 'running'; const isPaused = c.state === 'paused'; const name = c.name.replace(/^\//, ''); return (
            <TableRow key={c.id} className={cn(busy[c.id] && 'opacity-50')}>
              <TableCell><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-[7px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-xs flex-shrink-0">📦</div><div><div className="font-semibold text-[13px] text-[var(--text-primary)]">{name}</div><div className="font-mono text-[10.5px] text-[var(--text-muted)]">{shortId(c.id)}</div></div></div></TableCell>
              <TableCell><span className="font-mono text-[11.5px] max-w-[160px] truncate block">{c.image}</span></TableCell>
              <TableCell><StatusBadge state={c.state} /></TableCell>
              <TableCell><span className="font-mono text-[11px] text-[var(--text-muted)]">{formatPorts(c.ports) || '\u2014'}</span></TableCell>
              <TableCell><span className="text-[11.5px]">{formatUptime(c.created)} ago</span></TableCell>
              <TableCell><div className="flex items-center gap-1">
                {isPaused ? <Btn title="Resume" success onClick={() => act(c.id, 'unpause')} disabled={!!busy[c.id]}><Play className="w-3 h-3" /></Btn> : isRunning ? (<><Btn title="Pause" onClick={() => act(c.id, 'pause')} disabled={!!busy[c.id]}><Pause className="w-3 h-3" /></Btn><Btn title="Restart" onClick={() => act(c.id, 'restart')} disabled={!!busy[c.id]}><RotateCcw className="w-3 h-3" /></Btn><Btn title="Stop" onClick={() => act(c.id, 'stop')} disabled={!!busy[c.id]} danger><Square className="w-3 h-3" /></Btn></>) : <Btn title="Start" onClick={() => act(c.id, 'start')} disabled={!!busy[c.id]} success><Play className="w-3 h-3" /></Btn>}
                <Btn title="Inspect" onClick={() => setInspect({ open: true, id: c.id, name })}><Search className="w-3 h-3" /></Btn>
                <Btn title="Exec" onClick={() => setExec({ open: true, id: c.id, name })} disabled={!isRunning}><Terminal className="w-3 h-3" /></Btn>
                <Btn title="Logs" onClick={() => setLogs({ open: true, id: c.id, name })}><FileText className="w-3 h-3" /></Btn>
                <Btn title="Delete" onClick={() => act(c.id, 'delete')} disabled={!!busy[c.id]} danger><Trash2 className="w-3 h-3" /></Btn>
              </div></TableCell></TableRow>)})
        )}</TableBody></Table></Card>
      <ExecDialog open={exec.open} onClose={() => setExec(e => ({ ...e, open: false }))} containerId={exec.id} containerName={exec.name} />
      <LogsDialog open={logs.open} onClose={() => setLogs(l => ({ ...l, open: false }))} containerId={logs.id} containerName={logs.name} />
      <InspectDialog open={inspect.open} onClose={() => setInspect(i => ({ ...i, open: false }))} containerId={inspect.id} containerName={inspect.name} />
      <DeployDialog open={deployOpen} onClose={() => setDeployOpen(false)} onDone={loadAll} toast={toast} />
    </div>
  )
}

function Btn({ children, title, onClick, disabled = false, danger = false, success = false }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; danger?: boolean; success?: boolean }) {
  return (<button onClick={onClick} disabled={disabled} title={title} className={cn('w-[26px] h-[26px] flex items-center justify-center rounded-[6px] border border-transparent transition-all duration-[220ms]', 'text-[var(--text-muted)] disabled:opacity-30 disabled:cursor-not-allowed', danger && 'hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444]', success && 'hover:bg-[rgba(16,217,138,0.12)] hover:border-[rgba(16,217,138,0.25)] hover:text-[#10d98a]', !danger && !success && 'hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border)] hover:text-[var(--text-primary)]')}>{children}</button>)
}
