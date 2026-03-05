import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { AppState, AppAction, Route, Env } from '@/types'
import {
  api,
  getMockContainers, getMockImages, getMockVolumes, getMockNetworks
} from '@/api/client'

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState: AppState = {
  route:        'overview',
  theme:        (localStorage.getItem('oh_theme') as 'dark' | 'light') ?? 'dark',
  env:          (localStorage.getItem('oh_env') as Env) ?? 'docker',
  k8sConnected: localStorage.getItem('oh_k8s') === 'true',
  sidebarOpen:  true,
  aiOpen:       false,
  containers:   [],
  images:       [],
  volumes:      [],
  networks:     [],
  loading:      false,
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROUTE':       return { ...state, route: action.payload }
    case 'SET_THEME':       return { ...state, theme: action.payload }
    case 'SET_ENV':         return { ...state, env: action.payload }
    case 'SET_K8S':         return { ...state, k8sConnected: action.payload }
    case 'TOGGLE_SIDEBAR':  return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'TOGGLE_AI':       return { ...state, aiOpen: !state.aiOpen }
    case 'SET_CONTAINERS':  return { ...state, containers: action.payload }
    case 'SET_IMAGES':      return { ...state, images: action.payload }
    case 'SET_VOLUMES':     return { ...state, volumes: action.payload }
    case 'SET_NETWORKS':    return { ...state, networks: action.payload }
    case 'SET_LOADING':     return { ...state, loading: action.payload }
    default:                return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state:    AppState
  dispatch: React.Dispatch<AppAction>
  navigate: (route: Route) => void
  loadAll:  () => Promise<void>
  toast:    (msg: string, type?: 'success' | 'error' | 'info') => void
}

const AppContext = createContext<AppContextValue | null>(null)

// ─── Toast system (simple global) ────────────────────────────────────────────
type ToastItem = { id: string; msg: string; type: 'success' | 'error' | 'info' }
const toastListeners: ((t: ToastItem) => void)[] = []
export function emitToast(item: ToastItem) { toastListeners.forEach(fn => fn(item)) }
export function onToast(fn: (t: ToastItem) => void) {
  toastListeners.push(fn)
  return () => { const i = toastListeners.indexOf(fn); if (i !== -1) toastListeners.splice(i, 1) }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Persist theme
  useEffect(() => {
    document.documentElement.className = state.theme === 'light' ? 'light' : ''
    localStorage.setItem('oh_theme', state.theme)
  }, [state.theme])

  // Persist env
  useEffect(() => {
    localStorage.setItem('oh_env', state.env)
  }, [state.env])

  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    emitToast({ id: Math.random().toString(36).slice(2), msg, type })
  }, [])

  const navigate = useCallback((route: Route) => {
    dispatch({ type: 'SET_ROUTE', payload: route })
  }, [])

  const loadAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const ctrs = await api.containers.list().catch(() => getMockContainers())
      dispatch({ type: 'SET_CONTAINERS', payload: ctrs })
      const imgs = await api.images.list().catch(() => getMockImages())
      dispatch({ type: 'SET_IMAGES', payload: imgs })
      const vols = await api.volumes.list().catch(() => getMockVolumes())
      dispatch({ type: 'SET_VOLUMES', payload: vols })
      const nets = await api.networks.list().catch(() => getMockNetworks())
      dispatch({ type: 'SET_NETWORKS', payload: nets })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Initial load + env detection
  useEffect(() => {
    loadAll()
    api.system.detect()
      .then(d => {
        if (d.k8s) {
          dispatch({ type: 'SET_K8S', payload: true })
          localStorage.setItem('oh_k8s', 'true')
        }
      })
      .catch(() => {})
    // Refresh every 10s
    const interval = setInterval(loadAll, 10_000)
    return () => clearInterval(interval)
  }, [loadAll])

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, loadAll, toast }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
