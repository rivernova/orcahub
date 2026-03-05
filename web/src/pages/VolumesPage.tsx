import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader, TableWrap } from '@/components/orcahub/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/form'
import { api } from '@/api/client'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HardDrive, Plus, Trash, Trash2 } from 'lucide-react'

export function VolumesPage() {
  const { state, loadAll, toast } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [volName, setVolName]       = useState('')
  const [creating, setCreating]     = useState(false)

  const volumes = state.volumes

  const pruneVolumes = async () => {
    if (!window.confirm('Remove all unused volumes? This action cannot be undone.')) return
    try {
      await api.volumes.prune()
      await loadAll()
      toast('Unused volumes pruned', 'success')
    } catch {
      toast('Prune failed', 'error')
    }
  }

  const deleteVolume = async (name: string) => {
    if (!window.confirm(`Delete volume "${name}"? All data will be lost.`)) return
    try {
      await api.volumes.delete(name)
      await loadAll()
      toast('Volume deleted', 'success')
    } catch {
      toast('Delete failed — volume may be in use', 'error')
    }
  }

  const createVolume = async () => {
    if (!volName.trim()) return
    setCreating(true)
    try {
      await api.volumes.create(volName.trim())
      await loadAll()
      toast(`Volume "${volName}" created`, 'success')
      setCreateOpen(false)
      setVolName('')
    } catch {
      toast('Create failed', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="animate-pagein">
      <PageHeader
        title="Volumes"
        sub="Persistent data storage management"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={pruneVolumes}>
              <Trash className="w-3 h-3" /> Prune unused
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-3 h-3" /> Create volume
            </Button>
          </>
        }
      />

      <SectionHeader title="Volumes" count={volumes.length} />

      <TableWrap>
        <table className="orca-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Driver</th>
              <th>Mount point</th>
              <th>Size</th>
              <th>Containers</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {volumes.map(v => (
              <tr key={v.name}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[9px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <HardDrive className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <span className="font-medium text-[13px]">{v.name}</span>
                  </div>
                </td>
                <td>
                  <span className="font-mono text-[11.5px] text-[var(--text-secondary)]">{v.driver}</span>
                </td>
                <td>
                  <span className="font-mono text-[11px] text-[var(--text-muted)] max-w-[220px] truncate block" title={v.mountpoint}>
                    {v.mountpoint}
                  </span>
                </td>
                <td>
                  <span className={cn('font-mono text-[11.5px]', v.size_bytes > 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]')}>
                    {v.size_bytes > 0 ? formatBytes(v.size_bytes) : '—'}
                  </span>
                </td>
                <td>
                  {v.used_by?.length > 0 ? (
                    <span className="text-[11.5px] text-[#10d98a]">{v.used_by.join(', ')}</span>
                  ) : (
                    <span className="text-[11.5px] text-[var(--text-muted)] italic">unused</span>
                  )}
                </td>
                <td>
                  <span className="text-[11.5px] text-[var(--text-muted)]">
                    {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => deleteVolume(v.name)}
                    disabled={v.used_by?.length > 0}
                    title={v.used_by?.length > 0 ? 'In use by containers' : 'Delete volume'}
                    className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {volumes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-14 text-[var(--text-muted)]">
                  <div className="text-4xl mb-3 opacity-30">💾</div>
                  <div className="text-[15px] font-semibold text-[var(--text-secondary)] mb-1">No volumes</div>
                  <div className="text-[12.5px]">Create a volume to persist data</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableWrap>

      <Dialog open={createOpen} onOpenChange={v => !v && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Volume</DialogTitle>
            <DialogDescription>Create a new Docker volume for persistent storage</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="volName">Volume name</Label>
            <Input
              id="volName"
              value={volName}
              onChange={e => setVolName(e.target.value)}
              placeholder="my-volume-data"
              onKeyDown={e => e.key === 'Enter' && createVolume()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createVolume} disabled={!volName.trim() || creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
