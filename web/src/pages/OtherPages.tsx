import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader } from '@/components/orcahub/PageHeader'
import { EmptyState } from '@/components/orcahub/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/form'
import { api } from '@/api/client'
import { Upload } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

export function ComposePage() {
  const { toast } = useApp()
  return (<div className="animate-pagein"><PageHeader title="Compose Stacks" sub="Manage Docker Compose applications" actions={<Button variant="primary" size="sm" onClick={() => toast('Deploy Compose stack coming soon', 'info')}><Upload className="w-3 h-3" /> Deploy stack</Button>} /><Card><EmptyState icon="🐙" title="No Compose stacks detected" description="Deploy a Docker Compose stack or point OrcaHub to your compose files to manage them here." /></Card></div>)
}

export function SettingsPage() {
  const { state, dispatch, toast } = useApp()
  const [pruning, setPruning] = useState(false)
  const [pruneResult, setPruneResult] = useState<{ reclaimed: number; containers_deleted: string[]; images_deleted: number; volumes_deleted: string[]; networks_deleted: string[] } | null>(null)
  const systemPrune = async () => { if (!window.confirm('This will remove all stopped containers, unused images, volumes and networks. Continue?')) return; setPruning(true); setPruneResult(null); try { const result = await api.system.prune(); setPruneResult(result); toast(`Pruned \u2014 freed ${formatBytes(result.reclaimed)}`, 'success') } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Prune failed', 'error') } finally { setPruning(false) } }

  return (
    <div className="animate-pagein"><PageHeader title="Settings" sub="Configure OrcaHub preferences" />
      <div className="max-w-2xl space-y-6">
        <SettingsSection title="Appearance" description="Customize the look and feel"><SettingRow title="Dark mode" description="Use the dark theme" control={<Switch checked={state.theme === 'dark'} onCheckedChange={c => dispatch({ type: 'SET_THEME', payload: c ? 'dark' : 'light' })} />} /></SettingsSection>
        <SettingsSection title="Data" description="Control data fetching behavior"><SettingRow title="Auto-refresh" description="Refresh container data every 10 seconds" control={<Switch defaultChecked disabled />} /></SettingsSection>
        <SettingsSection title="Backend" description="API connection settings"><SettingRow title="API endpoint" description="Go backend URL (same origin)" control={<span className="font-mono text-[11.5px] text-[var(--text-muted)] px-2.5 py-1.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[7px]">/api/v1</span>} /></SettingsSection>
        <SettingsSection title="Danger Zone" description="Irreversible system actions">
          <SettingRow title="System prune" description="Remove all stopped containers, unused images, volumes, and networks" control={<Button variant="danger" size="sm" onClick={systemPrune} disabled={pruning}>{pruning ? 'Pruning\u2026' : 'Prune all'}</Button>} />
          {pruneResult && (<div className="px-5 pb-4"><div className="rounded-[9px] bg-[rgba(16,217,138,0.06)] border border-[rgba(16,217,138,0.15)] p-3 text-[12px] text-[var(--text-secondary)] space-y-1"><div className="font-semibold text-[#10d98a] mb-1">\u2713 Prune complete \u2014 freed {formatBytes(pruneResult.reclaimed)}</div>{pruneResult.containers_deleted.length > 0 && <div>Containers removed: {pruneResult.containers_deleted.length}</div>}{pruneResult.images_deleted > 0 && <div>Images removed: {pruneResult.images_deleted}</div>}{pruneResult.volumes_deleted.length > 0 && <div>Volumes removed: {pruneResult.volumes_deleted.length}</div>}{pruneResult.networks_deleted.length > 0 && <div>Networks removed: {pruneResult.networks_deleted.length}</div>}</div></div>)}
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (<Card className="overflow-hidden"><CardHeader><CardTitle className="text-[15px]">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><div className="divide-y divide-[var(--border)]">{children}</div></Card>)
}
function SettingRow({ title, description, control }: { title: string; description: string; control: React.ReactNode }) {
  return (<div className="flex items-center justify-between px-5 py-3.5"><div><div className="text-[13.5px] font-semibold text-[var(--text-primary)]">{title}</div><div className="text-[12px] text-[var(--text-muted)] mt-0.5">{description}</div></div><div className="ml-5 flex-shrink-0">{control}</div></div>)
}

function K8sPlaceholder({ title, icon, features }: { title: string; icon: string; features: string[] }) {
  return (<Card className="border-[rgba(124,58,237,0.15)] p-12 flex items-center gap-8 mt-2"><div className="w-28 h-28 rounded-full flex-shrink-0 bg-[radial-gradient(circle,rgba(124,58,237,0.2),rgba(124,58,237,0.03))] border border-[rgba(124,58,237,0.2)] flex items-center justify-center text-5xl">{icon}</div><div><h2 className="text-[20px] font-extrabold mb-2 text-[var(--text-primary)]">{title}</h2><p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed mb-5 max-w-md">Full Kubernetes management coming soon. Connect your cluster to unlock complete orchestration capabilities.</p><div className="flex gap-2 flex-wrap">{features.map(f => (<span key={f} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.18)] text-[#c4b5fd]">{f}</span>))}</div></div></Card>)
}

export function K8sOverviewPage() { return <div className="animate-pagein"><PageHeader title="Kubernetes Overview" sub="Cluster health at a glance" /><K8sPlaceholder title="Cluster Overview" icon="📊" features={['Node status','Resource quotas','Namespace summary','Event stream','Workload health']} /></div> }
export function K8sPodsPage() { return <div className="animate-pagein"><PageHeader title="Pods" sub="Running and pending workloads" /><K8sPlaceholder title="Pod Management" icon="🐙" features={['Pod listing','Log streaming','Shell exec','Resource limits','Restart policy']} /></div> }
export function K8sDeploymentsPage() { return <div className="animate-pagein"><PageHeader title="Deployments" sub="Workload deployments and rollouts" /><K8sPlaceholder title="Deployments" icon="🚀" features={['Rolling updates','Rollback','Scale replicas','Strategy config','History']} /></div> }
export function K8sServicesPage() { return <div className="animate-pagein"><PageHeader title="Services" sub="Kubernetes services and ingress" /><K8sPlaceholder title="Services & Ingress" icon="🌐" features={['ClusterIP','NodePort','LoadBalancer','Ingress rules','DNS resolution']} /></div> }
export function K8sNamespacesPage() { return <div className="animate-pagein"><PageHeader title="Namespaces" sub="Kubernetes namespace management" /><K8sPlaceholder title="Namespaces" icon="📂" features={['Namespace CRUD','Resource quotas','RBAC','Context switching','Label management']} /></div> }
