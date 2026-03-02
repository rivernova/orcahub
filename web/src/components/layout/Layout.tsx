import { useAppStore } from '../../store/app'
import Header from './Header'
import Sidebar from './Sidebar'
import PageRouter from './PageRouter'
import ContainerDrawer from '../containers/ContainerDrawer'
import AIPanel from '../ai/AIPanel'

export default function Layout() {
  const { sidebarCollapsed, aiOpen } = useAppStore()

  const appClass = [
    'app',
    sidebarCollapsed ? 'collapsed' : '',
    aiOpen ? 'ai-open' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={appClass} id="app">
      <Header />
      <Sidebar />
      <main className="main">
        <div className="main-inner" id="mainInner">
          <PageRouter />
        </div>
      </main>
      <ContainerDrawer />
      {aiOpen && <AIPanel />}
    </div>
  )
}