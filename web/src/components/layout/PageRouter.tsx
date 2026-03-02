import { useAppStore } from '../../store/app'
import OverviewPage from '../pages/OverviewPage'
import ContainersPage from '../pages/ContainersPage'
import ImagesPage from '../pages/ImagesPage'
import VolumesPage from '../pages/VolumesPage'
import NetworksPage from '../pages/NetworksPage'
import MetricsPage from '../pages/MetricsPage'
import ComposePage from '../pages/ComposePage'
import SettingsPage from '../pages/SettingsPage'
import K8sConnectPage from '../pages/K8sConnectPage'
import K8sPlaceholderPage from '../pages/K8sPlaceholderPage'

export default function PageRouter() {
  const { page } = useAppStore()

  const pages: Record<string, JSX.Element> = {
    overview: <OverviewPage />,
    containers: <ContainersPage />,
    images: <ImagesPage />,
    volumes: <VolumesPage />,
    networks: <NetworksPage />,
    metrics: <MetricsPage />,
    compose: <ComposePage />,
    settings: <SettingsPage />,
    'k8s-connect': <K8sConnectPage />,
    'k8s-overview': <K8sPlaceholderPage title="Cluster Overview" sub="Kubernetes cluster health and resource summary" icon="⎈" />,
    'k8s-workloads': <K8sPlaceholderPage title="Workloads" sub="Deployments, StatefulSets, DaemonSets and Jobs" icon="🚀" />,
    'k8s-services': <K8sPlaceholderPage title="Services & Ingress" sub="Network exposure and traffic routing" icon="🌐" />,
    'k8s-storage': <K8sPlaceholderPage title="Storage" sub="PersistentVolumes and StorageClaases" icon="💾" />,
    'k8s-config': <K8sPlaceholderPage title="Config" sub="ConfigMaps and Secrets management" icon="⚙️" />,
    'k8s-rbac': <K8sPlaceholderPage title="RBAC" sub="Roles, bindings, and service accounts" icon="🔐" />,
  }

  return <>{pages[page] ?? <OverviewPage />}</>
}