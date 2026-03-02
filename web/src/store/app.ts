import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Page =
  | 'overview' | 'containers' | 'images' | 'volumes' | 'networks'
  | 'metrics' | 'compose' | 'settings'
  | 'k8s-overview' | 'k8s-workloads' | 'k8s-services' | 'k8s-storage'
  | 'k8s-config' | 'k8s-rbac' | 'k8s-namespaces' | 'k8s-configmaps'
  | 'k8s-secrets' | 'k8s-connect'

export type Env = 'docker' | 'k8s'
type Theme = 'dark' | 'light'

interface Toast {
  id: number
  msg: string
  type: 'success' | 'info' | 'warn' | 'error'
}

interface AppState {
  page: Page
  env: Env
  theme: Theme
  sidebarCollapsed: boolean
  aiOpen: boolean
  k8sAvailable: boolean
  dockerAvailable: boolean
  toasts: Toast[]
  drawerContainerId: string | null
  drawerTab: 'info' | 'logs' | 'env' | 'mounts' | 'exec'

  setPage: (p: Page) => void
  setEnv: (e: Env) => void
  setTheme: (t: Theme) => void
  toggleSidebar: () => void
  toggleAI: () => void
  setK8sAvailable: (v: boolean) => void
  setDockerAvailable: (v: boolean) => void
  addToast: (msg: string, type?: Toast['type']) => void
  removeToast: (id: number) => void
  openDrawer: (id: string, tab?: AppState['drawerTab']) => void
  closeDrawer: () => void
  setDrawerTab: (tab: AppState['drawerTab']) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      page: 'overview',
      env: 'docker',
      theme: 'dark',
      sidebarCollapsed: false,
      aiOpen: false,
      k8sAvailable: false,
      dockerAvailable: false,
      toasts: [],
      drawerContainerId: null,
      drawerTab: 'info',

      setPage: (page) => set({ page }),
      setEnv: (env) => set({ env }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleAI: () => set((s) => ({ aiOpen: !s.aiOpen })),
      setK8sAvailable: (k8sAvailable) => set({ k8sAvailable }),
      setDockerAvailable: (dockerAvailable) => set({ dockerAvailable }),
      addToast: (msg, type = 'info') =>
        set((s) => ({
          toasts: [...s.toasts, { id: Date.now(), msg, type }].slice(-5),
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      openDrawer: (drawerContainerId, drawerTab = 'info') =>
        set({ drawerContainerId, drawerTab }),
      closeDrawer: () => set({ drawerContainerId: null }),
      setDrawerTab: (drawerTab) => set({ drawerTab }),
    }),
    {
      name: 'orcahub-store',
      partialize: (s) => ({ env: s.env, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)