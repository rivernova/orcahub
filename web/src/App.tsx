import { useApp } from '@/context/AppContext'
import { Header } from '@/components/orcahub/Header'
import { Sidebar } from '@/components/orcahub/Sidebar'
import { AIPanel } from '@/components/orcahub/AIPanel'
import { ToastContainer } from '@/components/ui/toast'
import { OverviewPage } from '@/pages/OverviewPage'
import { ContainersPage } from '@/pages/ContainersPage'
import { ImagesPage } from '@/pages/ImagesPage'
import { VolumesPage } from '@/pages/VolumesPage'
import { NetworksPage } from '@/pages/NetworksPage'
import { MetricsPage } from '@/pages/MetricsPage'
import {
  ComposePage, SettingsPage,
  K8sOverviewPage, K8sPodsPage, K8sDeploymentsPage,
  K8sServicesPage, K8sNamespacesPage,
} from '@/pages/OtherPages'

function PageRouter() {
  const { state } = useApp()

  switch (state.route) {
    case 'overview':         return <OverviewPage />
    case 'containers':       return <ContainersPage />
    case 'images':           return <ImagesPage />
    case 'volumes':          return <VolumesPage />
    case 'networks':         return <NetworksPage />
    case 'metrics':          return <MetricsPage />
    case 'compose':          return <ComposePage />
    case 'settings':         return <SettingsPage />
    case 'k8s-overview':     return <K8sOverviewPage />
    case 'k8s-pods':         return <K8sPodsPage />
    case 'k8s-deployments':  return <K8sDeploymentsPage />
    case 'k8s-services':     return <K8sServicesPage />
    case 'k8s-namespaces':   return <K8sNamespacesPage />
    default:                 return <OverviewPage />
  }
}

export function App() {
  const { state } = useApp()

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{
        gridTemplateColumns: [
          state.sidebarOpen ? '232px' : '56px',
          '1fr',
          state.aiOpen ? '360px' : '0px',
        ].join(' '),
        gridTemplateRows: '58px 1fr',
        transition: 'grid-template-columns 0.32s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Header spans full width */}
      <header style={{ gridColumn: '1 / -1', gridRow: '1' }}>
        <Header />
      </header>

      {/* Sidebar */}
      <div style={{ gridColumn: '1', gridRow: '2', overflow: 'hidden', display: 'flex' }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        style={{
          gridColumn: '2',
          gridRow: '2',
          background: 'var(--bg-deep)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div className="px-7 py-[26px] min-h-full">
          <PageRouter />
        </div>
      </main>

      {/* AI panel */}
      {state.aiOpen && (
        <div style={{ gridColumn: '3', gridRow: '2', overflow: 'hidden', display: 'flex' }}>
          <AIPanel />
        </div>
      )}

      <ToastContainer />
    </div>
  )
}
