import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { StatCard } from '@/components/orcahub/StatCard'
import { PageHeader, SectionHeader } from '@/components/orcahub/PageHeader'
import { StatusBadge } from '@/components/orcahub/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/api/client'
import { formatUptime, formatBytes, formatPorts } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, RefreshCw } from 'lucide-react'
import type { Container } from '@/types'

export function OverviewPage() {
  const { state, loadAll, toast } = useApp()
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')

  const containers = state.containers
  const running  = containers.filter(c => c.state === 'running')
  const stopped  = containers.filter(c => c.state !== 'running')
  const totalCpu = running.length * 12.4 // mock aggregate
  const totalMem = running.reduce((_acc, _c) => _acc + 256, 0)

  const filtered = useMemo(() => {
    if (filter === 'running') return running
    if (filter === 'stopped') return stopped
    return containers
  }, [containers, filter, running, stopped])

  return (
    <div className="animate-pagein">
      <PageHeader
        title="Overview"
        sub="System-wide container health at a glance"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={loadAll}>
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast('Deploy dialog coming soon', 'info')}>
              <Plus className="w-3 h-3" /> Deploy
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Running"
          value={running.length}
          color="green"
          sub={<span className="text-[#10d98a]">↑ {running.length} of {containers.length} healthy</span>}
        />
        <StatCard
          label="Total Containers"
          value={containers.length}
          sub={`${stopped.length} stopped`}
        />
        <StatCard
          label="CPU Usage"
          value={`${totalCpu.toFixed(1)}%`}
          color="cyan"
          sub="across all containers"
        />
        <StatCard
          label="Memory Used"
          value={formatBytes(totalMem * 1024 * 1024)}
          sub={`${running.length} running containers`}
        />
      </div>

      {/* Container list */}
      <SectionHeader
        title="Containers"
        count={filtered.length}
        right={
          <Tabs value={filter} onValueChange={v => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="stopped">Stopped</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-3">
        {filtered.map(c => (
          <ContainerCard key={c.id} container={c} />
        ))}
      </div>

      {/* K8s teaser */}
      <div className="mt-6 p-6 bg-[var(--bg-surface)] border border-[rgba(124,58,237,0.18)] rounded-[22px] flex items-center gap-[18px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.04)] to-transparent pointer-events-none" />
        <div className="w-12 h-12 rounded-[11px] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.22)] flex items-center justify-center text-xl flex-shrink-0">
          ⎈
        </div>
        <div className="flex-1">
          <div className="text-[14.5px] font-bold mb-1">Kubernetes support</div>
          <div className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
            Full cluster management, pod inspection, workload scaling, service mesh visualization, and AI-powered anomaly detection.
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {['Pod Management','Deployments','Services & Ingress','RBAC','Helm Charts','Cost Analysis'].map(f => (
              <span key={f} className="text-[10.5px] font-medium px-2 py-1 rounded-[5px] bg-[rgba(167,139,250,0.07)] border border-[rgba(167,139,250,0.14)] text-[#c4b5fd]">{f}</span>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => toast('Added to waitlist!', 'success')}>
          Notify me
        </Button>
      </div>
    </div>
  )
}

function ContainerCard({ container: c }: { container: Container }) {
  const { toast, loadAll } = useApp()
  const [actLoading, setActLoading] = useState(false)

  const act = async (action: 'start' | 'stop' | 'restart') => {
    setActLoading(true)
    try {
      if (action === 'start')   await api.containers.start(c.id)
      if (action === 'stop')    await api.containers.stop(c.id)
      if (action === 'restart') await api.containers.restart(c.id)
      await loadAll()
      toast(`Container ${action}ed`, 'success')
    } catch {
      toast(`Failed to ${action} container`, 'error')
    } finally {
      setActLoading(false)
    }
  }

  const isRunning = c.state === 'running'

  return (
    <div className={cn(
      'bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] px-5 py-4',
      'transition-all duration-[220ms] hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-hover)]',
      'grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4',
    )}>
      {/* Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-[9px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-sm">
          📦
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-[var(--text-primary)] truncate">{c.name.replace(/^\//, '')}</div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono truncate">{c.image}</div>
        </div>
      </div>

      {/* Status */}
      <StatusBadge state={c.state} />

      {/* Ports */}
      <div className="text-[11.5px] text-[var(--text-muted)] font-mono hidden xl:block">
        {formatPorts(c.ports)}
      </div>

      {/* Uptime */}
      <div className="text-[11.5px] text-[var(--text-muted)] hidden lg:block">
        {formatUptime(c.created)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {isRunning ? (
          <>
            <Button variant="ghost" size="xs" onClick={() => act('restart')} disabled={actLoading}>↺ Restart</Button>
            <Button variant="danger" size="xs" onClick={() => act('stop')} disabled={actLoading}>■ Stop</Button>
          </>
        ) : (
          <Button variant="success" size="xs" onClick={() => act('start')} disabled={actLoading}>▶ Start</Button>
        )}
      </div>
    </div>
  )
}
