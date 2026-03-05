import { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader } from '@/components/orcahub/PageHeader'
import { StatusBadge } from '@/components/orcahub/StatusBadge'
import { ExecDialog } from '@/components/orcahub/ExecDialog'
import { LogsDialog } from '@/components/orcahub/LogsDialog'
import { EmptyTableRow, ErrorBanner } from '@/components/orcahub/EmptyState'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { api } from '@/api/client'
import { formatUptime, shortId, formatPorts } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Play, Square, RotateCcw, Trash2, Terminal, FileText, Info, Plus, Trash } from 'lucide-react'
import type { Container } from '@/types'

type ContainerFilter = 'all' | 'running' | 'stopped' | 'exited'
interface ExecState { open: boolean; id: string; name: string }
interface LogsState { open: boolean; id: string; name: string }

export function ContainersPage() {
  const { state, loadAll, toast } = useApp()
  const [filter, setFilter] = useState<ContainerFilter>('all')
  const [exec, setExec]     = useState<ExecState>({ open: false, id: '', name: '' })
  const [logs, setLogs]     = useState<LogsState>({ open: false, id: '', name: '' })
  const [busy, setBusy]     = useState<Record<string, boolean>>({})

  const containers = state.containers

  const filtered = useMemo(() => {
    switch (filter) {
      case 'running': return containers.filter(c => c.state === 'running')
      case 'stopped': return containers.filter(c => c.state !== 'running' && c.state !== 'exited')
      case 'exited':  return containers.filter(c => c.state === 'exited')
      default:        return containers
    }
  }, [containers, filter])

  const act = async (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    setBusy(b => ({ ...b, [id]: true }))
    try {
      if (action === 'start')   { await api.containers.start(id);   toast('Container started', 'success') }
      if (action === 'stop')    { await api.containers.stop(id);    toast('Container stopped', 'success') }
      if (action === 'restart') { await api.containers.restart(id); toast('Container restarted', 'success') }
      if (action === 'delete')  {
        if (!window.confirm('Delete this container?')) return
        await api.containers.delete(id)
        toast('Container deleted', 'success')
      }
      await loadAll()
    } catch {
      toast(`Failed to ${action} container`, 'error')
    } finally {
      setBusy(b => ({ ...b, [id]: false }))
    }
  }

  const pruneContainers = async () => {
    if (!window.confirm('Remove all stopped containers?')) return
    try {
      await Promise.all(
        containers.filter(c => c.state !== 'running').map(c => api.containers.delete(c.id))
      )
      await loadAll()
      toast('Stopped containers pruned', 'success')
    } catch {
      toast('Prune failed', 'error')
    }
  }

  return (
    <div className="animate-pagein">
      <PageHeader
        title="Containers"
        sub="Manage and monitor all your Docker containers"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={pruneContainers}>
              <Trash className="w-3 h-3" /> Prune stopped
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast('New container dialog coming soon', 'info')}>
              <Plus className="w-3 h-3" /> New container
            </Button>
          </>
        }
      />

      {state.error && <ErrorBanner message={state.error} onRetry={loadAll} />}

      <SectionHeader
        title="All containers"
        count={filtered.length}
        right={
          <Tabs value={filter} onValueChange={v => setFilter(v as ContainerFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="stopped">Stopped</TabsTrigger>
              <TabsTrigger value="exited">Exited</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ports</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <EmptyTableRow
                cols={6}
                icon="📦"
                title={state.loading ? 'Loading containers…' : 'No containers'}
                description={state.loading ? undefined : 'No containers match the current filter'}
              />
            ) : (
              filtered.map(c => (
                <ContainerRow
                  key={c.id}
                  container={c}
                  loading={!!busy[c.id]}
                  onAction={act}
                  onExec={(id, name) => setExec({ open: true, id, name })}
                  onLogs={(id, name) => setLogs({ open: true, id, name })}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ExecDialog
        open={exec.open}
        onClose={() => setExec(e => ({ ...e, open: false }))}
        containerId={exec.id}
        containerName={exec.name}
      />
      <LogsDialog
        open={logs.open}
        onClose={() => setLogs(l => ({ ...l, open: false }))}
        containerId={logs.id}
        containerName={logs.name}
      />
    </div>
  )
}

function ContainerRow({
  container: c, loading, onAction, onExec, onLogs,
}: {
  container: Container
  loading:   boolean
  onAction:  (id: string, a: 'start' | 'stop' | 'restart' | 'delete') => void
  onExec:    (id: string, name: string) => void
  onLogs:    (id: string, name: string) => void
}) {
  const isRunning = c.state === 'running'
  const name = c.name.replace(/^\//, '')

  return (
    <TableRow className={cn(loading && 'opacity-50')}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-xs flex-shrink-0">
            📦
          </div>
          <div>
            <div className="font-semibold text-[13px] text-[var(--text-primary)]">{name}</div>
            <div className="font-mono text-[10.5px] text-[var(--text-muted)]">{shortId(c.id)}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-mono text-[11.5px] max-w-[160px] truncate block">{c.image}</span>
      </TableCell>
      <TableCell><StatusBadge state={c.state} /></TableCell>
      <TableCell>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{formatPorts(c.ports) || '—'}</span>
      </TableCell>
      <TableCell>
        <span className="text-[11.5px]">{formatUptime(c.created)} ago</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {isRunning ? (
            <>
              <ActionBtn title="Restart" onClick={() => onAction(c.id, 'restart')} disabled={loading}>
                <RotateCcw className="w-3 h-3" />
              </ActionBtn>
              <ActionBtn title="Stop" onClick={() => onAction(c.id, 'stop')} disabled={loading} danger>
                <Square className="w-3 h-3" />
              </ActionBtn>
            </>
          ) : (
            <ActionBtn title="Start" onClick={() => onAction(c.id, 'start')} disabled={loading} success>
              <Play className="w-3 h-3" />
            </ActionBtn>
          )}
          <ActionBtn title="Exec" onClick={() => onExec(c.id, name)} disabled={!isRunning}>
            <Terminal className="w-3 h-3" />
          </ActionBtn>
          <ActionBtn title="Logs" onClick={() => onLogs(c.id, name)}>
            <FileText className="w-3 h-3" />
          </ActionBtn>
          <ActionBtn title="Inspect" onClick={() => {}}>
            <Info className="w-3 h-3" />
          </ActionBtn>
          <ActionBtn title="Delete" onClick={() => onAction(c.id, 'delete')} disabled={loading} danger>
            <Trash2 className="w-3 h-3" />
          </ActionBtn>
        </div>
      </TableCell>
    </TableRow>
  )
}

function ActionBtn({ children, title, onClick, disabled = false, danger = false, success = false }: {
  children:  React.ReactNode
  title:     string
  onClick:   () => void
  disabled?: boolean
  danger?:   boolean
  success?:  boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'w-[26px] h-[26px] flex items-center justify-center rounded-[6px]',
        'border border-transparent transition-all duration-[220ms]',
        'text-[var(--text-muted)] disabled:opacity-30 disabled:cursor-not-allowed',
        danger  && 'hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444]',
        success && 'hover:bg-[rgba(16,217,138,0.12)] hover:border-[rgba(16,217,138,0.25)] hover:text-[#10d98a]',
        !danger && !success && 'hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border)] hover:text-[var(--text-primary)]',
      )}
    >
      {children}
    </button>
  )
}
