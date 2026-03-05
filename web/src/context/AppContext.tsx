import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { AppState, AppAction, Route, Env } from '@/types'
import { api } from '@/api/client'

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
  error:        null,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROUTE':      return { ...state, route: action.payload }
    case 'SET_THEME':      return { ...state, theme: action.payload }
    case 'SET_ENV':        return { ...state, env: action.payload }
    case 'SET_K8S':        return { ...state, k8sConnected: action.payload }
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'TOGGLE_AI':      return { ...state, aiOpen: !state.aiOpen }
    case 'SET_CONTAINERS': return { ...state, containers: action.payload }
    case 'SET_IMAGES':     return { ...state, images: action.payload }
    case 'SET_VOLUMES':    return { ...state, volumes: action.payload }
    case 'SET_NETWORKS':   return { ...state, networks: action.payload }
    case 'SET_LOADING':    return { ...state, loading: action.payload }
    case 'SET_ERROR':      return { ...state, error: action.payload }
    default:               return state
  }
}

interface AppContextValue {
  state:    AppState
  dispatch: React.Dispatch<AppAction>
  navigate: (route: Route) => void
  loadAll:  () => Promise<void>
  toast:    (msg: string, type?: 'success' | 'error' | 'info') => void
}

const AppContext = createContext<AppContextValue | null>(null)

type ToastItem = { id: string; msg: string; type: 'success' | 'error' | 'info' }
const toastListeners: ((t: ToastItem) => void)[] = []
export function emitToast(item: ToastItem) { toastListeners.forEach(fn => fn(item)) }
export function onToast(fn: (t: ToastItem) => void) {
  toastListeners.push(fn)
  return () => { const i = toastListeners.indexOf(fn); if (i !== -1) toastListeners.splice(i, 1) }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    document.documentElement.className = state.theme === 'light' ? 'light' : ''
    localStorage.setItem('oh_theme', state.theme)
  }, [state.theme])

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

    const [ctrs, imgs, vols, nets] = await Promise.allSettled([
      api.containers.list(),
      api.images.list(),
      api.volumes.list(),
      api.networks.list(),
    ])

    // Only update state on success — existing data stays visible on failure (no glitch)
    if (ctrs.status === 'fulfilled') dispatch({ type: 'SET_CONTAINERS', payload: ctrs.value })
    if (imgs.status === 'fulfilled') dispatch({ type: 'SET_IMAGES',     payload: imgs.value })
    if (vols.status === 'fulfilled') dispatch({ type: 'SET_VOLUMES',    payload: vols.value })
    if (nets.status === 'fulfilled') dispatch({ type: 'SET_NETWORKS',   payload: nets.value })

    const anyFailed = [ctrs, imgs, vols, nets].some(r => r.status === 'rejected')
    if (anyFailed) dispatch({ type: 'SET_ERROR', payload: 'Some resources could not be loaded' })
    else           dispatch({ type: 'SET_ERROR', payload: null })

    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

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
