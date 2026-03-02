import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../store/app'
import { api } from '../../api'
import type { Image } from '../../types'

function fmtSize(bytes: number) {
  if (bytes > 1e9) return `${(bytes/1e9).toFixed(2)} GB`
  return `${(bytes/1e6).toFixed(0)} MB`
}

export default function ImagesPage() {
  const { addToast } = useAppStore()
  const qc = useQueryClient()
  const [pullName, setPullName] = useState('')
  const [pulling, setPulling] = useState(false)

  const { data: images = [], isLoading } = useQuery<Image[]>({ queryKey: ['images'], queryFn: api.images.list, refetchInterval: 15000 })

  const pruneMut = useMutation({
    mutationFn: api.images.prune,
    onSuccess: r => { qc.invalidateQueries({queryKey:['images']}); addToast(`Pruned ${r.deleted?.length ?? 0} images, freed ${fmtSize(r.space_reclaimed)}`, 'success') },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  const removeMut = useMutation({
    mutationFn: (id: string) => api.images.remove(id, true),
    onSuccess: () => { qc.invalidateQueries({queryKey:['images']}); addToast('Image removed', 'success') },
    onError: (e: Error) => addToast(e.message, 'error'),
  })

  const handlePull = async () => {
    if (!pullName.trim()) return
    setPulling(true)
    try {
      await api.images.pull(pullName.trim())
      qc.invalidateQueries({queryKey:['images']})
      addToast(`Pulled ${pullName}`, 'success')
      setPullName('')
    } catch(e: any) {
      addToast(e.message, 'error')
    } finally { setPulling(false) }
  }

  return (
    <div className="page active" id="page-images">
      <div className="ph">
        <div className="ph-left"><h1>Images</h1><p>Local Docker images and registry management</p></div>
        <div className="ph-right">
          <button className="btn btn-ghost btn-sm" onClick={() => pruneMut.mutate()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Prune unused
          </button>
        </div>
      </div>

      <div className="sh" style={{marginBottom:12}}>
        <div className="sh-title">Pull image</div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <input
          type="text" className="input" value={pullName}
          onChange={e => setPullName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePull()}
          placeholder="nginx:latest, redis:7, ghcr.io/org/image:tag"
          style={{flex:1,background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'8px 12px',color:'var(--text-primary)',fontSize:13}}
        />
        <button className="btn btn-primary btn-sm" onClick={handlePull} disabled={pulling}>
          {pulling ? 'Pulling…' : 'Pull'}
        </button>
      </div>

      <div className="sh">
        <div className="sh-title">Local images <span className="sh-count">{images.length}</span></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Repository</th><th>Tag</th><th>Image ID</th><th>Size</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>Loading…</td></tr>}
            {images.map(img => {
              const tag = img.tags?.[0] ?? ''
              const [repo, t] = tag.includes(':') ? tag.split(':') : [tag, 'latest']
              return (
                <tr key={img.id}>
                  <td><span className="mono" style={{fontSize:12.5}}>{repo || '<none>'}</span></td>
                  <td><span className="badge-num">{t || '<none>'}</span></td>
                  <td><span className="mono" style={{fontSize:11.5,color:'var(--text-muted)'}}>{img.id.replace('sha256:','').slice(0,12)}</span></td>
                  <td>{fmtSize(img.size)}</td>
                  <td style={{color:'var(--text-muted)',fontSize:12}}>{new Date(img.created*1000).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-ghost btn-xs" style={{color:'var(--accent-red)'}} onClick={() => removeMut.mutate(img.id)}>Remove</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}