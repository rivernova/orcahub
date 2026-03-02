import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from './store/app'
import { api } from './api'
import Layout from './components/layout/Layout'
import ToastContainer from './components/common/ToastContainer'

export default function App() {
  const { theme, setK8sAvailable, setDockerAvailable } = useAppStore()

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Detect Docker + K8s on startup
  useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const status = await api.system.status()
      setDockerAvailable(status.docker.available)
      setK8sAvailable(status.kubernetes.available)
      return status
    },
    refetchInterval: 30000,
  })

  return (
    <>
      <Layout />
      <ToastContainer />
    </>
  )
}