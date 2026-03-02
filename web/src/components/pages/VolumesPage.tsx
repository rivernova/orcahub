import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../store/app'
import { api } from '../../api'
import type { Volume } from '../../types'

export default function VolumesPage() {
  const { addToast } = useAppStore()
  const qc = useQueryClient()
  const [createName, setCreateName] = useState('')

  const { data: volumes = [], isLoading } = useQuery<Volume[]>({ queryKey: ['volumes'], queryFn: api.volumes.list })

  const pruneMut = useMutation({
    mutationFn: api.volumes.prune,
    onSuccess: r => { qc.invalidateQueries({queryKey:['volumes']}); addToast(`Pruned ${r.deleted?.length ?? 0} volumes`, 'success') },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  const removeMut = useMutation({
    mutationFn: (name: string) => api.volumes.remove(name),
    onSuccess: () => { qc.invalidateQueries({queryKey:['volumes']}); addToast('Volume removed', 'success') },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  const createMut = useMutation({
    mutationFn: () => api.volumes.create({ name: createName }),
    onSuccess: () => { qc.invalidateQueries({queryKey:['volumes']}); addToast('Volume created', 'success'); setCreateName('') },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  return (
    <div className="page active" id="page-volumes">
      <div className="ph">
        <div className="ph-left"><h1>Volumes</h1><p>Docker volumes and persistent storage</p></div>
        <div className="ph-right">
          <button className="btn btn-ghost btn-sm" onClick={() => pruneMut.mutate()}>Prune unused</button>
          <button className="btn btn-primary btn-sm" onClick={() => createName && createMut.mutate()}>Create volume</button>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <input
          type="text" value={createName}
          onChange={e => setCreateName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createName && createMut.mutate()}
          placeholder="Volume name…"
          style={{width:280,background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'7px 12px',color:'var(--text-primary)',fontSize:13}}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Driver</th><th>Mountpoint</th><th>Scope</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>Loading…</td></tr>}
            {volumes.map(v => (
              <tr key={v.name}>
                <td><span className="mono" style={{fontSize:12.5}}>{v.name}</span></td>
                <td>{v.driver}</td>
                <td><span className="mono" style={{fontSize:11,color:'var(--text-muted)'}}>{v.mountpoint}</span></td>
                <td>{v.scope}</td>
                <td><button className="btn btn-ghost btn-xs" style={{color:'var(--accent-red)'}} onClick={() => removeMut.mutate(v.name)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}