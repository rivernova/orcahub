import { useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { StatCard } from '@/components/orcahub/StatCard'
import { PageHeader, SectionHeader } from '@/components/orcahub/PageHeader'
import { StatusBadge } from '@/components/orcahub/StatusBadge'
import { EmptyState, ErrorBanner } from '@/components/orcahub/EmptyState'
import { DeployDialog } from '@/components/orcahub/DeployDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/api/client'
import { formatUptime, formatPorts } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { RefreshCw, Plus } from 'lucide-react'
import type { Container } from '@/types'

export function OverviewPage() {
  const { state, loadAll, toast } = useApp()
  const [filter, setFilter]       = useState<'all' | 'running' | 'stopped'>('all')
  const [deployOpen, setDeployOpen] = useState(false)

  const containers = state.containers
  const running = containers.filter(c => c.state === 'running')
  const stopped = containers.filter(c => c.state !== 'running')

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
            <Button variant="ghost" size="sm" onClick={loadAll} disabled={state.loading}>
              <RefreshCw className={cn('w-3 h-3', state.loading && 'animate-spin')} /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setDeployOpen(true)}>
              <Plus className="w-3 h-3" /> Deploy
            </Button>
          </>
        }
      />

      {state.error && <ErrorBanner message={state.error} onRetry={loadAll} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Running"  value={running.length}         color="green" sub={`${running.length} of ${containers.length} healthy`} />
        <StatCard label="Stopped"  value={stopped.length}         sub={`${containers.length} total`} />
        <StatCard label="Images"   value={state.images.length}    color="cyan"  sub="available locally" />
        <StatCard label="Volumes"  value={state.volumes.length}   sub={`${state.networks.length} networks`} />
      </div>

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

      {filtered.length === 0 && !state.loading ? (
        <Card>
          <EmptyState
            icon="📦"
            title="No containers"
            description={filter !== 'all' ? `No ${filter} containers` : 'Deploy a container to get started'}
            action={{ label: '+ Deploy', onClick: () => setDeployOpen(true) }}
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => <ContainerCard key={c.id} container={c} />)}
        </div>
      )}

      {/* K8s teaser */}
      <div className="mt-6 p-6 bg-[var(--bg-surface)] border border-[rgba(124,58,237,0.18)] rounded-[22px] flex items-center gap-[18px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.04)] to-transparent pointer-events-none" />
        <div className="w-12 h-12 rounded-[11px] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.22)] flex items-center justify-center text-xl flex-shrink-0">⎈</div>
        <div className="flex-1">
          <div className="text-[14.5px] font-bold mb-1">Kubernetes support</div>
          <div className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
            Full cluster management, pod inspection, workload scaling, and AI-powered anomaly detection.
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {['Pod Management','Deployments','Services & Ingress','RBAC','Helm Charts'].map(f => (
              <span key={f} className="text-[10.5px] font-medium px-2 py-1 rounded-[5px] bg-[rgba(167,139,250,0.07)] border border-[rgba(167,139,250,0.14)] text-[#c4b5fd]">{f}</span>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => toast('Added to waitlist!', 'success')}>Notify me</Button>
      </div>

      <DeployDialog
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        onDone={loadAll}
        toast={toast}
      />
    </div>
  )
}

function ContainerCard({ container: c }: { container: Container }) {
  const { toast, loadAll } = useApp()
  const [actLoading, setActLoading] = useState(false)
  const isRunning = c.state === 'running'
  const isPaused  = c.state === 'paused'
  const name = c.name.replace(/^\//, '')

  const act = async (action: 'start' | 'stop' | 'restart' | 'pause' | 'unpause') => {
    setActLoading(true)
    try {
      await api.containers[action](c.id)
      await loadAll()
      toast(`Container ${action}ed`, 'success')
    } catch {
      toast(`Failed to ${action} container`, 'error')
    } finally {
      setActLoading(false)
    }
  }

  return (
    <Card className={cn(
      'px-5 py-4 hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-hover)]',
      'grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4',
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-[9px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-sm">📦</div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-[var(--text-primary)] truncate">{name}</div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono truncate">{c.image}</div>
        </div>
      </div>

      <StatusBadge state={c.state} />

      <div className="text-[11.5px] text-[var(--text-muted)] font-mono hidden xl:block">
        {formatPorts(c.ports) || '—'}
      </div>

      <div className="text-[11.5px] text-[var(--text-muted)] hidden lg:block">
        {formatUptime(c.created)} ago
      </div>

      <div className="flex items-center gap-1.5">
        {isPaused ? (
          <Button variant="success" size="xs" onClick={() => act('unpause')} disabled={actLoading}>▶ Resume</Button>
        ) : isRunning ? (
          <>
            <Button variant="ghost"  size="xs" onClick={() => act('pause')}   disabled={actLoading}>⏸ Pause</Button>
            <Button variant="ghost"  size="xs" onClick={() => act('restart')} disabled={actLoading}>↺ Restart</Button>
            <Button variant="danger" size="xs" onClick={() => act('stop')}    disabled={actLoading}>■ Stop</Button>
          </>
        ) : (
          <Button variant="success" size="xs" onClick={() => act('start')} disabled={actLoading}>▶ Start</Button>
        )}
      </div>
    </Card>
  )
}
