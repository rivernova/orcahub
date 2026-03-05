import { useApp } from '@/context/AppContext'
import { PageHeader } from '@/components/orcahub/PageHeader'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { ChevronRight, Upload } from 'lucide-react'
import { useState } from 'react'

// ─── Compose ────────────────────────────────────────────────────────────────

const mockStacks = [
  {
    name: 'monitoring',
    services: ['grafana', 'prometheus', 'node-exporter'],
    status: 'running',
    file: 'docker-compose.monitoring.yml',
  },
  {
    name: 'app',
    services: ['app-backend', 'postgres-main', 'redis-cache', 'nginx-proxy'],
    status: 'running',
    file: 'docker-compose.yml',
  },
]

export function ComposePage() {
  const { toast } = useApp()
  const [openStack, setOpenStack] = useState<string | null>('app')

  return (
    <div className="animate-pagein">
      <PageHeader
        title="Compose Stacks"
        sub="Manage Docker Compose applications"
        actions={
          <Button variant="primary" size="sm" onClick={() => toast('Deploy Compose stack coming soon', 'info')}>
            <Upload className="w-3 h-3" /> Deploy stack
          </Button>
        }
      />

      <div className="space-y-3">
        {mockStacks.map(stack => (
          <div
            key={stack.name}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] overflow-hidden transition-all hover:border-[var(--border-bright)]"
          >
            <div
              className="flex items-center gap-3 px-[18px] py-3.5 cursor-pointer select-none"
              onClick={() => setOpenStack(openStack === stack.name ? null : stack.name)}
            >
              <ChevronRight
                className={cn(
                  'w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0',
                  openStack === stack.name && 'rotate-90',
                )}
              />
              <div className="w-8 h-8 rounded-[9px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-sm flex-shrink-0">
                🐙
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[13.5px]">{stack.name}</div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">{stack.file}</div>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">{stack.services.length} services</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-[rgba(16,217,138,0.15)] text-[#10d98a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10d98a] animate-pdot" />
                {stack.status}
              </span>
            </div>

            {openStack === stack.name && (
              <div className="px-[18px] pb-4 border-t border-[var(--border)]">
                <div className="pt-3 grid grid-cols-2 gap-2">
                  {stack.services.map(svc => (
                    <div
                      key={svc}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] bg-[var(--bg-raised)] border border-[var(--border)]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#10d98a] shadow-[0_0_4px_#10d98a] animate-pdot flex-shrink-0" />
                      <span className="text-[12.5px] font-medium">{svc}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="ghost" size="sm">↑ Scale</Button>
                  <Button variant="ghost" size="sm">⟳ Restart</Button>
                  <Button variant="danger" size="sm">■ Down</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings ───────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { state, dispatch, toast } = useApp()

  return (
    <div className="animate-pagein">
      <PageHeader title="Settings" sub="Configure OrcaHub preferences" />

      <div className="max-w-2xl space-y-6">
        <SettingsSection title="Appearance" description="Customize the look and feel">
          <SettingRow
            title="Dark mode"
            description="Use the dark theme"
            control={
              <Switch
                checked={state.theme === 'dark'}
                onCheckedChange={c => dispatch({ type: 'SET_THEME', payload: c ? 'dark' : 'light' })}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Data" description="Control data fetching behavior">
          <SettingRow
            title="Auto-refresh"
            description="Refresh container data every 10 seconds"
            control={<Switch defaultChecked />}
          />
          <SettingRow
            title="Mock data fallback"
            description="Use mock data when backend is unavailable"
            control={<Switch defaultChecked />}
          />
        </SettingsSection>

        <SettingsSection title="Backend" description="API connection settings">
          <SettingRow
            title="API endpoint"
            description="Go backend URL"
            control={
              <span className="font-mono text-[11.5px] text-[var(--text-muted)] px-2.5 py-1.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[7px]">
                localhost:8080
              </span>
            }
          />
        </SettingsSection>

        <SettingsSection title="Danger Zone" description="Irreversible system actions">
          <SettingRow
            title="System prune"
            description="Remove all stopped containers, unused images, volumes, and networks"
            control={
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (window.confirm('This will remove all unused Docker resources. Continue?')) {
                    toast('System pruned successfully', 'success')
                  }
                }}
              >
                Prune all
              </Button>
            }
          />
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-[16px] font-bold">{title}</h2>
        <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">{description}</p>
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  )
}

function SettingRow({ title, description, control }: { title: string; description: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{description}</div>
      </div>
      <div className="ml-5 flex-shrink-0">{control}</div>
    </div>
  )
}

// ─── K8s pages ──────────────────────────────────────────────────────────────

function K8sPlaceholder({ title, icon, features }: { title: string; icon: string; features: string[] }) {
  return (
    <div className="animate-pagein">
      <div className="bg-[var(--bg-surface)] border border-[rgba(124,58,237,0.15)] rounded-[22px] p-12 flex items-center gap-8 mt-2">
        <div className="w-28 h-28 rounded-full flex-shrink-0 bg-[radial-gradient(circle,rgba(124,58,237,0.2),rgba(124,58,237,0.03))] border border-[rgba(124,58,237,0.2)] flex items-center justify-center text-5xl animate-orb">
          {icon}
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold mb-2">{title}</h2>
          <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed mb-5 max-w-md">
            Full Kubernetes management coming soon. Connect your cluster to unlock complete orchestration capabilities.
          </p>
          <div className="flex gap-2 flex-wrap">
            {features.map(f => (
              <span key={f} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.18)] text-[#c4b5fd]">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function K8sOverviewPage() {
  return (
    <div className="animate-pagein">
      <PageHeader title="Kubernetes Overview" sub="Cluster health at a glance" />
      <K8sPlaceholder
        title="Cluster Overview"
        icon="⎈"
        features={['Node status','Resource quotas','Namespace summary','Event stream','Workload health']}
      />
    </div>
  )
}

export function K8sPodsPage() {
  return (
    <div className="animate-pagein">
      <PageHeader title="Pods" sub="Running and pending workloads" />
      <K8sPlaceholder title="Pod Management" icon="📦" features={['Pod listing','Log streaming','Shell exec','Resource limits','Restart policy']} />
    </div>
  )
}

export function K8sDeploymentsPage() {
  return (
    <div className="animate-pagein">
      <PageHeader title="Deployments" sub="Workload deployments and rollouts" />
      <K8sPlaceholder title="Deployments" icon="🚀" features={['Rolling updates','Rollback','Scale replicas','Strategy config','History']} />
    </div>
  )
}

export function K8sServicesPage() {
  return (
    <div className="animate-pagein">
      <PageHeader title="Services" sub="Kubernetes services and ingress" />
      <K8sPlaceholder title="Services & Ingress" icon="🌐" features={['ClusterIP','NodePort','LoadBalancer','Ingress rules','DNS resolution']} />
    </div>
  )
}

export function K8sNamespacesPage() {
  return (
    <div className="animate-pagein">
      <PageHeader title="Namespaces" sub="Kubernetes namespace management" />
      <K8sPlaceholder title="Namespaces" icon="📁" features={['Namespace CRUD','Resource quotas','RBAC','Context switching','Label management']} />
    </div>
  )
}
