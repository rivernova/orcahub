import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import type { Container, ContainerStats } from '../../types'

function fmt(bytes: number) {
  if (bytes > 1e9) return `${(bytes/1e9).toFixed(2)} GB`
  if (bytes > 1e6) return `${(bytes/1e6).toFixed(0)} MB`
  return `${(bytes/1e3).toFixed(0)} KB`
}

export default function MetricsPage() {
  const { data: containers = [] } = useQuery<Container[]>({ queryKey: ['containers'], queryFn: api.containers.list })
  const running = containers.filter(c => c.state === 'running')

  return (
    <div className="page active" id="page-metrics">
      <div className="ph">
        <div className="ph-left"><h1>Metrics</h1><p>Real-time resource usage across all containers</p></div>
      </div>

      <div className="sh" style={{marginTop:4}}><div className="sh-title">Per-container stats</div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Container</th><th>CPU %</th><th>Memory</th><th>Mem %</th><th>Net In</th><th>Net Out</th><th>Block In</th><th>Block Out</th></tr></thead>
          <tbody>
            {running.map(c => <StatsRow key={c.id} container={c} />)}
            {running.length === 0 && <tr><td colSpan={8} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>No running containers</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatsRow({ container: c }: { container: Container }) {
  const { data: stats } = useQuery<ContainerStats>({
    queryKey: ['stats', c.id],
    queryFn: () => api.containers.stats(c.id),
    refetchInterval: 5000,
  })

  return (
    <tr>
      <td><span className="mono" style={{fontSize:12.5}}>{c.name}</span></td>
      <td>{stats ? `${stats.cpu_percent.toFixed(1)}%` : '…'}</td>
      <td>{stats ? fmt(stats.memory_usage) : '…'}</td>
      <td>{stats ? `${stats.memory_percent.toFixed(1)}%` : '…'}</td>
      <td>{stats ? fmt(stats.network_in) : '…'}</td>
      <td>{stats ? fmt(stats.network_out) : '…'}</td>
      <td>{stats ? fmt(stats.block_read) : '…'}</td>
      <td>{stats ? fmt(stats.block_write) : '…'}</td>
    </tr>
  )
}