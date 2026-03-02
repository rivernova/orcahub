import { useAppStore, type Page } from '../../store/app'
import {
  LayoutDashboard, Box, Image, HardDrive, Network, Activity,
  Layers, Settings, ChevronLeft, Globe, Lock, Database, Shield
} from 'lucide-react'

interface NavItem { label: string; page: Page; icon: JSX.Element; badge?: string }

const dockerNav: NavItem[] = [
  { label: 'Overview',   page: 'overview',   icon: <LayoutDashboard size={15} /> },
  { label: 'Containers', page: 'containers', icon: <Box size={15} /> },
  { label: 'Images',     page: 'images',     icon: <Image size={15} /> },
  { label: 'Volumes',    page: 'volumes',    icon: <HardDrive size={15} /> },
  { label: 'Networks',   page: 'networks',   icon: <Network size={15} /> },
  { label: 'Metrics',    page: 'metrics',    icon: <Activity size={15} /> },
  { label: 'Compose',    page: 'compose',    icon: <Layers size={15} /> },
]

const k8sNav: NavItem[] = [
  { label: 'Overview',    page: 'k8s-overview',   icon: <LayoutDashboard size={15} /> },
  { label: 'Workloads',   page: 'k8s-workloads',  icon: <Box size={15} /> },
  { label: 'Services',    page: 'k8s-services',   icon: <Globe size={15} /> },
  { label: 'Storage',     page: 'k8s-storage',    icon: <Database size={15} /> },
  { label: 'Config',      page: 'k8s-config',     icon: <Settings size={15} /> },
  { label: 'RBAC',        page: 'k8s-rbac',       icon: <Shield size={15} /> },
]

export default function Sidebar() {
  const { env, page, sidebarCollapsed, toggleSidebar, setPage } = useAppStore()
  const items = env === 'docker' ? dockerNav : k8sNav

  return (
    <aside className={`sidebar env-${env}`} id="sidebar">
      <div className={`sidebar-env-badge ${env}`}>
        {env === 'docker'
          ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span>Docker</span></>
          : <><span style={{fontSize:13}}>⎈</span><span>Kubernetes</span></>
        }
      </div>

      <div className="nav-group-label">
        {env === 'docker' ? 'Overview' : 'Cluster'}
      </div>

      {items.map(item => (
        <button
          key={item.page}
          className={`nav-item ${page === item.page ? 'active' : ''}`}
          data-route={item.page}
          onClick={() => setPage(item.page)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
          {item.badge && <span className="nav-badge g">{item.badge}</span>}
        </button>
      ))}

      <div className="sidebar-footer">
        <button
          className={`nav-item ${page === 'settings' ? 'active' : ''}`}
          onClick={() => setPage('settings')}
        >
          <span className="nav-icon"><Settings size={15} /></span>
          <span className="nav-label">Settings</span>
        </button>
        <button className="collapse-btn" onClick={toggleSidebar}>
          <span className="nav-icon collapse-icon">
            <ChevronLeft size={15} />
          </span>
          <span className="nav-label">Collapse</span>
        </button>
      </div>
    </aside>
  )
}