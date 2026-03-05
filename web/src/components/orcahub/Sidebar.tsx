import { useApp } from '@/context/AppContext'
import type { Route } from '@/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Box, HardDrive, Network, BarChart2,
  Layers, Settings, ChevronLeft, Boxes, GitBranch,
  Server, Globe, FolderKanban,
} from 'lucide-react'

interface NavItem {
  label:   string
  icon:    React.ReactNode
  route:   Route
  badge?:  number
  soon?:   boolean
}

const dockerNav: { group: string; items: NavItem[] }[] = [
  {
    group: 'Docker',
    items: [
      { label: 'Overview',    icon: <LayoutDashboard className="w-4 h-4" />, route: 'overview' },
      { label: 'Containers',  icon: <Box             className="w-4 h-4" />, route: 'containers' },
      { label: 'Images',      icon: <Layers          className="w-4 h-4" />, route: 'images' },
      { label: 'Volumes',     icon: <HardDrive       className="w-4 h-4" />, route: 'volumes' },
      { label: 'Networks',    icon: <Network         className="w-4 h-4" />, route: 'networks' },
    ],
  },
  {
    group: 'Monitoring',
    items: [
      { label: 'Metrics',   icon: <BarChart2 className="w-4 h-4" />, route: 'metrics' },
      { label: 'Compose',   icon: <Boxes     className="w-4 h-4" />, route: 'compose' },
    ],
  },
]

const k8sNav: { group: string; items: NavItem[] }[] = [
  {
    group: 'Kubernetes',
    items: [
      { label: 'Overview',     icon: <LayoutDashboard className="w-4 h-4" />, route: 'k8s-overview' },
      { label: 'Pods',         icon: <Box             className="w-4 h-4" />, route: 'k8s-pods' },
      { label: 'Deployments',  icon: <GitBranch       className="w-4 h-4" />, route: 'k8s-deployments' },
      { label: 'Services',     icon: <Globe           className="w-4 h-4" />, route: 'k8s-services' },
      { label: 'Namespaces',   icon: <FolderKanban    className="w-4 h-4" />, route: 'k8s-namespaces' },
      { label: 'Nodes',        icon: <Server          className="w-4 h-4" />, route: 'k8s-overview', soon: true },
    ],
  },
]

const bottomNav: NavItem[] = [
  { label: 'Settings', icon: <Settings className="w-4 h-4" />, route: 'settings' },
]

export function Sidebar() {
  const { state, dispatch, navigate } = useApp()
  const { sidebarOpen, env, route, containers } = state
  const collapsed = !sidebarOpen

  const runningCount = containers.filter(c => c.state === 'running').length

  const navGroups = env === 'k8s' ? k8sNav : dockerNav

  return (
    <aside
      className={cn(
        'bg-[var(--bg-void)] border-r border-[var(--border)] flex flex-col py-3 overflow-hidden',
        'transition-all duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        collapsed ? 'w-14' : 'w-[232px]',
      )}
    >
      {/* Env badge */}
      <div
        className={cn(
          'flex items-center gap-2 mx-2 mb-1 rounded-[11px] border text-[10px] font-bold tracking-[.1em] uppercase',
          'transition-all duration-[320ms]',
          collapsed ? 'p-1.5 justify-center' : 'px-3.5 py-2',
          env === 'docker'
            ? 'bg-[rgba(0,212,255,0.06)] border-[rgba(0,212,255,0.14)] text-[#00d4ff]'
            : 'bg-[rgba(124,58,237,0.07)] border-[rgba(124,58,237,0.18)] text-[#a78bfa]',
        )}
      >
        <span className="flex-shrink-0 text-[14px]">{env === 'docker' ? '🐳' : '⎈'}</span>
        {!collapsed && <span>{env === 'docker' ? 'Docker' : 'Kubernetes'}</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {navGroups.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <div className="px-4 mt-3.5 mb-[3px] text-[9px] font-bold tracking-[.14em] uppercase text-[var(--text-muted)]">
                {group.group}
              </div>
            )}
            {group.items.map(item => (
              <NavBtn
                key={item.route + item.label}
                item={item}
                active={route === item.route}
                collapsed={collapsed}
                badge={item.route === 'containers' ? runningCount : item.badge}
                onClick={() => !item.soon && navigate(item.route)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] pt-2.5">
        {bottomNav.map(item => (
          <NavBtn
            key={item.route}
            item={item}
            active={route === item.route}
            collapsed={collapsed}
            onClick={() => navigate(item.route)}
          />
        ))}

        {/* Collapse btn */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className={cn(
            'flex items-center gap-2.5 w-full text-[12.5px] font-medium text-[var(--text-muted)]',
            'transition-all duration-[220ms] hover:text-[var(--text-secondary)]',
            collapsed ? 'px-2 py-2 justify-center' : 'px-4 py-2',
          )}
        >
          <ChevronLeft
            className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-[320ms]', collapsed && 'rotate-180')}
          />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}

function NavBtn({
  item, active, collapsed, badge, onClick,
}: {
  item:     NavItem
  active:   boolean
  collapsed:boolean
  badge?:   number
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      disabled={item.soon}
      className={cn(
        'relative flex items-center gap-2.5 w-full text-[13px] font-medium',
        'transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'overflow-hidden whitespace-nowrap select-none',
        collapsed ? 'px-2 py-2 justify-center' : 'px-4 py-2',
        active
          ? 'nav-active'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)]',
        item.soon && 'opacity-30 cursor-not-allowed',
      )}
    >
      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="transition-all duration-[180ms] overflow-hidden">{item.label}</span>
          {item.soon && (
            <span className="ml-auto text-[8.5px] font-bold tracking-[.07em] px-1.5 py-px rounded bg-[rgba(124,58,237,0.13)] border border-[rgba(124,58,237,0.22)] text-[#c4b5fd]">
              SOON
            </span>
          )}
          {badge !== undefined && !item.soon && (
            <span className={cn(
              'ml-auto font-mono text-[10px] px-[7px] py-px rounded-full',
              badge > 0
                ? 'bg-[rgba(16,217,138,0.15)] text-[#10d98a]'
                : 'bg-[var(--bg-glass)] text-[var(--text-muted)]',
            )}>
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}
