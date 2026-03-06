import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader } from '@/components/orcahub/PageHeader'
import { EmptyTableRow, ErrorBanner } from '@/components/orcahub/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/form'
import { api } from '@/api/client'
import { formatBytes } from '@/lib/utils'
import { HardDrive, Plus, Trash, Trash2 } from 'lucide-react'

export function VolumesPage() {
  const { state, loadAll, toast } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [volName, setVolName] = useState('')
  const [creating, setCreating] = useState(false)
  const volumes = state.volumes
  const pruneVolumes = async () => { if (!window.confirm('Remove all unused volumes? This action cannot be undone.')) return; try { await api.volumes.prune(); await loadAll(); toast('Unused volumes pruned', 'success') } catch { toast('Prune failed', 'error') } }
  const deleteVolume = async (name: string) => { if (!window.confirm(`Delete volume "${name}"? All data will be lost.`)) return; try { await api.volumes.delete(name); await loadAll(); toast('Volume deleted', 'success') } catch { toast('Delete failed \u2014 volume may be in use', 'error') } }
  const createVolume = async () => { if (!volName.trim()) return; setCreating(true); try { await api.volumes.create(volName.trim()); await loadAll(); toast(`Volume "${volName}" created`, 'success'); setCreateOpen(false); setVolName('') } catch { toast('Create failed', 'error') } finally { setCreating(false) } }

  return (
    <div className="animate-pagein">
      <PageHeader title="Volumes" sub="Persistent data storage management" actions={<><Button variant="ghost" size="sm" onClick={pruneVolumes}><Trash className="w-3 h-3" /> Prune unused</Button><Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> Create volume</Button></>} />
      {state.error && <ErrorBanner message={state.error} onRetry={loadAll} />}
      <SectionHeader title="Volumes" count={volumes.length} />
      <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Driver</TableHead><TableHead>Mount point</TableHead><TableHead>Size</TableHead><TableHead>Containers</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
        {volumes.length === 0 ? (<EmptyTableRow cols={7} icon="💾" title={state.loading ? 'Loading volumes\u2026' : 'No volumes'} description={state.loading ? undefined : 'Create a volume to persist container data'} />) : (volumes.map(v => (
          <TableRow key={v.name}><TableCell><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-[7px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0"><HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)]" /></div><span className="font-mono text-[12.5px] text-[var(--text-primary)]">{v.name.length > 24 ? v.name.slice(0,24) + '\u2026' : v.name}</span></div></TableCell>
          <TableCell><span className="text-[11.5px]">{v.driver}</span></TableCell><TableCell><span className="font-mono text-[10.5px] text-[var(--text-muted)] max-w-[180px] truncate block">{v.mountpoint}</span></TableCell>
          <TableCell><span className="font-mono text-[11.5px]">{v.size_bytes > 0 ? formatBytes(v.size_bytes) : '\u2014'}</span></TableCell>
          <TableCell>{v.used_by?.length > 0 ? <span className="text-[11.5px] text-[#10d98a]">{v.used_by.join(', ')}</span> : <span className="text-[11.5px] text-[var(--text-muted)] italic">unused</span>}</TableCell>
          <TableCell><span className="text-[11.5px]">{v.created_at ? new Date(v.created_at).toLocaleDateString() : '\u2014'}</span></TableCell>
          <TableCell><button onClick={() => deleteVolume(v.name)} disabled={v.used_by?.length > 0} title={v.used_by?.length > 0 ? 'In use by containers' : 'Delete volume'} className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444] transition-all disabled:opacity-25 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /></button></TableCell></TableRow>)))}
      </TableBody></Table></Card>
      <Dialog open={createOpen} onOpenChange={v => !v && setCreateOpen(false)}><DialogContent><DialogHeader><DialogTitle>Create Volume</DialogTitle><DialogDescription>Create a new Docker volume for persistent storage</DialogDescription></DialogHeader>
        <div><Label htmlFor="volName">Volume name</Label><Input id="volName" value={volName} onChange={e => setVolName(e.target.value)} placeholder="my-volume-data" onKeyDown={e => e.key === 'Enter' && createVolume()} autoFocus /></div>
        <DialogFooter><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={createVolume} disabled={!volName.trim() || creating}>{creating ? 'Creating\u2026' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
