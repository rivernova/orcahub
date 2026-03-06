import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader } from '@/components/orcahub/PageHeader'
import { EmptyTableRow, ErrorBanner } from '@/components/orcahub/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/form'
import { api } from '@/api/client'
import { formatBytes, shortId, formatUptime } from '@/lib/utils'
import { Download, Trash2, Trash } from 'lucide-react'

export function ImagesPage() {
  const { state, loadAll, toast } = useApp()
  const [pullOpen, setPullOpen] = useState(false)
  const [pullRef, setPullRef] = useState('')
  const [pulling, setPulling] = useState(false)
  const images = state.images
  const maxSize = Math.max(...images.map(i => i.size), 1)

  const pruneImages = async () => { if (!window.confirm('Remove all unused images?')) return; try { await api.images.prune(); await loadAll(); toast('Unused images removed', 'success') } catch { toast('Prune failed', 'error') } }
  const deleteImage = async (id: string) => { if (!window.confirm('Delete this image?')) return; try { await api.images.delete(id); await loadAll(); toast('Image deleted', 'success') } catch { toast('Delete failed \u2014 image may be in use', 'error') } }
  const pullImage = async () => { if (!pullRef.trim()) return; setPulling(true); try { await api.images.pull(pullRef.trim()); await loadAll(); toast(`Image pulled: ${pullRef}`, 'success'); setPullOpen(false); setPullRef('') } catch { toast('Pull failed', 'error') } finally { setPulling(false) } }

  return (
    <div className="animate-pagein">
      <PageHeader title="Images" sub="Local Docker images and registry management" actions={<><Button variant="ghost" size="sm" onClick={pruneImages}><Trash className="w-3 h-3" /> Prune unused</Button><Button variant="primary" size="sm" onClick={() => setPullOpen(true)}><Download className="w-3 h-3" /> Pull image</Button></>} />
      {state.error && <ErrorBanner message={state.error} onRetry={loadAll} />}
      <SectionHeader title="Local images" count={images.length} />
      <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Repository</TableHead><TableHead>Tag</TableHead><TableHead>Image ID</TableHead><TableHead>Size</TableHead><TableHead>Created</TableHead><TableHead>Used by</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
        {images.length === 0 ? (<EmptyTableRow cols={7} icon="🖼️" title={state.loading ? 'Loading images\u2026' : 'No images'} description={state.loading ? undefined : 'Pull an image to get started'} />) : (images.map(img => { const [repo, tag] = (img.repo_tags[0] ?? '<none>:<none>').split(':'); const sizePct = Math.round((img.size / maxSize) * 100); return (
          <TableRow key={img.id}><TableCell><span className="font-mono text-[12px] text-[var(--text-primary)]">{repo}</span></TableCell><TableCell><Badge variant="cyan" className="font-mono">{tag ?? 'none'}</Badge></TableCell><TableCell><span className="font-mono text-[11px] text-[var(--text-muted)]">{shortId(img.id)}</span></TableCell>
          <TableCell><div className="flex items-center gap-2"><span className="font-mono text-[11.5px] w-16">{formatBytes(img.size)}</span><div className="w-16 h-1 bg-[var(--bg-raised)] rounded-full overflow-hidden"><div className="h-full bg-[#00d4ff] rounded-full" style={{ width: `${sizePct}%` }} /></div></div></TableCell>
          <TableCell><span className="text-[11.5px]">{formatUptime(img.created)} ago</span></TableCell><TableCell><span className="text-[11.5px] text-[var(--text-muted)]">{img.used_by?.length > 0 ? img.used_by.length + ' containers' : '\u2014'}</span></TableCell>
          <TableCell><button onClick={() => deleteImage(img.id)} className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444] transition-all"><Trash2 className="w-3.5 h-3.5" /></button></TableCell></TableRow>)}))}
      </TableBody></Table></Card>
      <Dialog open={pullOpen} onOpenChange={v => !v && setPullOpen(false)}><DialogContent><DialogHeader><DialogTitle>Pull Image</DialogTitle><DialogDescription>Enter a Docker image reference to pull from registry</DialogDescription></DialogHeader>
        <div className="space-y-4"><div><Label htmlFor="pullRef">Image reference</Label><Input id="pullRef" value={pullRef} onChange={e => setPullRef(e.target.value)} placeholder="nginx:latest, postgres:16, ubuntu:22.04" onKeyDown={e => e.key === 'Enter' && pullImage()} autoFocus /></div>
        <div className="flex gap-2 flex-wrap">{['nginx:latest','redis:alpine','postgres:16','node:20-alpine'].map(s => (<button key={s} onClick={() => setPullRef(s)} className="text-[11px] px-2.5 py-1 rounded-[6px] bg-[var(--bg-glass)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] transition-all">{s}</button>))}</div></div>
        <DialogFooter><Button variant="ghost" onClick={() => setPullOpen(false)}>Cancel</Button><Button variant="primary" onClick={pullImage} disabled={!pullRef.trim() || pulling}>{pulling ? 'Pulling\u2026' : 'Pull'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
