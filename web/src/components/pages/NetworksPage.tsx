import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../store/app'
import { api } from '../../api'
import type { Network } from '../../types'

export default function NetworksPage() {
  const { addToast } = useAppStore()
  const qc = useQueryClient()
  const [createName, setCreateName] = useState('')
  const [driver, setDriver] = useState('bridge')

  const { data: networks = [], isLoading } = useQuery<Network[]>({ queryKey: ['networks'], queryFn: api.networks.list })

  const removeMut = useMutation({
    mutationFn: (id: string) => api.networks.remove(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['networks']}); addToast('Network removed', 'success') },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  const createMut = useMutation({
    mutationFn: () => api.networks.create({ name: createName, driver }),
    onSuccess: () => { qc.invalidateQueries({queryKey:['networks']}); addToast('Network created', 'success'); setCreateName('') },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  return (
    <div className="page active" id="page-networks">
      <div className="ph">
        <div className="ph-left"><h1>Networks</h1><p>Docker networks and connectivity</p></div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => createName && createMut.mutate()}>Create network</button>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Network name…"
          style={{width:240,background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'7px 12px',color:'var(--text-primary)',fontSize:13}} />
        <select value={driver} onChange={e => setDriver(e.target.value)}
          style={{background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'7px 12px',color:'var(--text-primary)',fontSize:13}}>
          <option>bridge</option><option>host</option><option>overlay</option><option>macvlan</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>ID</th><th>Driver</th><th>Scope</th><th>Subnet</th><th>Containers</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>Loading…</td></tr>}
            {networks.map(n => (
              <tr key={n.id}>
                <td><span className="mono" style={{fontSize:12.5}}>{n.name}</span></td>
                <td><span className="mono" style={{fontSize:11,color:'var(--text-muted)'}}>{n.id.slice(0,12)}</span></td>
                <td>{n.driver}</td>
                <td>{n.scope}</td>
                <td>{n.subnet ?? '—'}</td>
                <td>{Object.keys(n.containers ?? {}).length}</td>
                <td>
                  {!['bridge','host','none'].includes(n.name) && (
                    <button className="btn btn-ghost btn-xs" style={{color:'var(--accent-red)'}} onClick={() => removeMut.mutate(n.id)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}