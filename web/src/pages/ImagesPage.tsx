import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader, TableWrap } from '@/components/orcahub/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/form'
import { api } from '@/api/client'
import { formatBytes, shortId, formatUptime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Download, Trash2, Trash } from 'lucide-react'
import type { DockerImage } from '@/types'

export function ImagesPage() {
  const { state, loadAll, toast } = useApp()
  const [pullOpen, setPullOpen]   = useState(false)
  const [pullRef, setPullRef]     = useState('')
  const [pulling, setPulling]     = useState(false)

  const images = state.images
  const maxSize = Math.max(...images.map(i => i.size), 1)

  const pruneImages = async () => {
    if (!window.confirm('Remove all unused images?')) return
    try {
      await api.images.prune()
      await loadAll()
      toast('Unused images removed', 'success')
    } catch {
      toast('Prune failed', 'error')
    }
  }

  const deleteImage = async (id: string) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await api.images.delete(id)
      await loadAll()
      toast('Image deleted', 'success')
    } catch {
      toast('Delete failed — image may be in use', 'error')
    }
  }

  const pullImage = async () => {
    if (!pullRef.trim()) return
    setPulling(true)
    try {
      await api.images.pull(pullRef.trim())
      await loadAll()
      toast(`Image pulled: ${pullRef}`, 'success')
      setPullOpen(false)
      setPullRef('')
    } catch {
      toast('Pull failed', 'error')
    } finally {
      setPulling(false)
    }
  }

  return (
    <div className="animate-pagein">
      <PageHeader
        title="Images"
        sub="Local Docker images and registry management"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={pruneImages}>
              <Trash className="w-3 h-3" /> Prune unused
            </Button>
            <Button variant="primary" size="sm" onClick={() => setPullOpen(true)}>
              <Download className="w-3 h-3" /> Pull image
            </Button>
          </>
        }
      />

      <SectionHeader title="Local images" count={images.length} />

      <TableWrap>
        <table className="orca-table">
          <thead>
            <tr>
              <th>Repository</th>
              <th>Tag</th>
              <th>Image ID</th>
              <th>Size</th>
              <th>Created</th>
              <th>Used by</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {images.map(img => (
              <ImageRow
                key={img.id}
                image={img}
                maxSize={maxSize}
                onDelete={() => deleteImage(img.id)}
              />
            ))}
            {images.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-14 text-[var(--text-muted)]">
                  <div className="text-4xl mb-3 opacity-30">🖼</div>
                  <div className="text-[15px] font-semibold text-[var(--text-secondary)] mb-1">No images</div>
                  <div className="text-[12.5px]">Pull an image to get started</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableWrap>

      {/* Pull dialog */}
      <Dialog open={pullOpen} onOpenChange={v => !v && setPullOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pull Image</DialogTitle>
            <DialogDescription>Enter a Docker image reference to pull from registry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pullRef">Image reference</Label>
              <Input
                id="pullRef"
                value={pullRef}
                onChange={e => setPullRef(e.target.value)}
                placeholder="e.g. nginx:latest, postgres:16, ubuntu:22.04"
                onKeyDown={e => e.key === 'Enter' && pullImage()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['nginx:latest','redis:alpine','postgres:16','node:20-alpine'].map(s => (
                <button
                  key={s}
                  onClick={() => setPullRef(s)}
                  className="text-[11px] px-2.5 py-1 rounded-[6px] bg-[var(--bg-glass)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPullOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={pullImage} disabled={!pullRef.trim() || pulling}>
              {pulling ? 'Pulling…' : 'Pull'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ImageRow({
  image: img, maxSize, onDelete,
}: {
  image:     DockerImage
  maxSize:   number
  onDelete:  () => void
}) {
  const [repo, tag] = (img.repo_tags[0] ?? '<none>:<none>').split(':')
  const sizePct = Math.round((img.size / maxSize) * 100)

  return (
    <tr>
      <td>
        <span className="font-mono text-[12px] text-[var(--text-primary)]">{repo}</span>
      </td>
      <td>
        <span className="px-[7px] py-[3px] rounded-[5px] bg-[var(--bg-glass)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)]">
          {tag ?? 'latest'}
        </span>
      </td>
      <td>
        <span className="font-mono text-[11.5px] text-[var(--text-muted)]">{shortId(img.id)}</span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11.5px] text-[var(--text-secondary)] w-16">{formatBytes(img.size)}</span>
          <div className="w-20 h-[3px] bg-[var(--bg-raised)] rounded-full overflow-hidden inline-block">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]')}
              style={{ width: `${sizePct}%` }}
            />
          </div>
        </div>
      </td>
      <td>
        <span className="text-[11.5px] text-[var(--text-muted)]">{formatUptime(img.created)} ago</span>
      </td>
      <td>
        {img.used_by?.length > 0 ? (
          <span className="text-[11.5px] text-[#10d98a]">{img.used_by.join(', ')}</span>
        ) : (
          <span className="text-[11.5px] text-[var(--text-muted)] italic">unused</span>
        )}
      </td>
      <td>
        <button
          onClick={onDelete}
          title="Delete image"
          className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444] transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}
