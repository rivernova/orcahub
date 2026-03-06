import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader } from '@/components/orcahub/PageHeader'
import { EmptyTableRow, ErrorBanner } from '@/components/orcahub/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/form'
import { api } from '@/api/client'
import { Plus, Trash2, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NetworksPage() {
  const { state, loadAll, toast } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [netName, setNetName] = useState('')
  const [netDriver, setNetDriver] = useState('bridge')
  const [creating, setCreating] = useState(false)
  const networks = state.networks
  const deleteNetwork = async (id: string, name: string) => { if (['bridge','host','none'].includes(name)) { toast('Cannot delete default networks', 'error'); return }; if (!window.confirm(`Delete network "${name}"?`)) return; try { await api.networks.delete(id); await loadAll(); toast('Network deleted', 'success') } catch { toast('Delete failed \u2014 network may have active endpoints', 'error') } }
  const createNetwork = async () => { if (!netName.trim()) return; setCreating(true); try { await api.networks.create(netName.trim(), netDriver); await loadAll(); toast(`Network "${netName}" created`, 'success'); setCreateOpen(false); setNetName('') } catch { toast('Create failed', 'error') } finally { setCreating(false) } }
  function driverVariant(driver: string): 'cyan' | 'running' | 'purple' | 'default' { if (driver === 'bridge') return 'cyan'; if (driver === 'host') return 'running'; if (driver === 'overlay') return 'purple'; return 'default' }

  return (
    <div className="animate-pagein">
      <PageHeader title="Networks" sub="Docker network configuration and inspection" actions={<Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> Create network</Button>} />
      {state.error && <ErrorBanner message={state.error} onRetry={loadAll} />}
      <SectionHeader title="Networks" count={networks.length} />
      <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Driver</TableHead><TableHead>Scope</TableHead><TableHead>Subnet</TableHead><TableHead>Containers</TableHead><TableHead>Internal</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
        {networks.length === 0 ? (<EmptyTableRow cols={7} icon="🌐" title={state.loading ? 'Loading networks\u2026' : 'No networks'} />) : (networks.map(n => { const subnet = n.ipam_config?.[0]?.subnet ?? '\u2014'; const containerCount = Object.keys(n.containers ?? {}).length; const isDefault = ['bridge','host','none'].includes(n.name); return (
          <TableRow key={n.id}><TableCell><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-[9px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0"><Network className="w-3.5 h-3.5 text-[var(--text-muted)]" /></div><div><div className="font-medium text-[13px] text-[var(--text-primary)]">{n.name}</div><div className="font-mono text-[10.5px] text-[var(--text-muted)]">{n.id.slice(0,12)}</div></div></div></TableCell>
          <TableCell><Badge variant={driverVariant(n.driver)} className="font-mono">{n.driver}</Badge></TableCell><TableCell>{n.scope}</TableCell><TableCell><span className="font-mono text-[11.5px]">{subnet}</span></TableCell>
          <TableCell><span className={cn('text-[11.5px]', containerCount > 0 ? 'text-[#10d98a]' : 'text-[var(--text-muted)]')}>{containerCount > 0 ? `${containerCount} connected` : '\u2014'}</span></TableCell>
          <TableCell><span className={cn('text-[11.5px]', n.internal ? 'text-[#f59e0b]' : 'text-[var(--text-muted)]')}>{n.internal ? 'Yes' : 'No'}</span></TableCell>
          <TableCell><button onClick={() => deleteNetwork(n.id, n.name)} disabled={isDefault} title={isDefault ? 'Cannot delete default network' : 'Delete network'} className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444] transition-all disabled:opacity-25 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /></button></TableCell></TableRow>)}))}
      </TableBody></Table></Card>
      <Dialog open={createOpen} onOpenChange={v => !v && setCreateOpen(false)}><DialogContent><DialogHeader><DialogTitle>Create Network</DialogTitle><DialogDescription>Create a new Docker network</DialogDescription></DialogHeader>
        <div className="space-y-4"><div><Label htmlFor="netName">Network name</Label><Input id="netName" value={netName} onChange={e => setNetName(e.target.value)} placeholder="my-network" autoFocus /></div>
        <div><Label>Driver</Label><Select value={netDriver} onValueChange={setNetDriver}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bridge">bridge</SelectItem><SelectItem value="overlay">overlay</SelectItem><SelectItem value="macvlan">macvlan</SelectItem><SelectItem value="ipvlan">ipvlan</SelectItem></SelectContent></Select></div></div>
        <DialogFooter><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={createNetwork} disabled={!netName.trim() || creating}>{creating ? 'Creating\u2026' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
