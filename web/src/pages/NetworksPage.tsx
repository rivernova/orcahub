import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PageHeader, SectionHeader, TableWrap } from '@/components/orcahub/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/form'
import { api } from '@/api/client'
import { Plus, Trash2, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NetworksPage() {
  const { state, loadAll, toast } = useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [netName, setNetName]       = useState('')
  const [netDriver, setNetDriver]   = useState('bridge')
  const [creating, setCreating]     = useState(false)

  const networks = state.networks

  const deleteNetwork = async (id: string, name: string) => {
    if (['bridge','host','none'].includes(name)) {
      toast('Cannot delete default networks', 'error')
      return
    }
    if (!window.confirm(`Delete network "${name}"?`)) return
    try {
      await api.networks.delete(id)
      await loadAll()
      toast('Network deleted', 'success')
    } catch {
      toast('Delete failed — network may have active endpoints', 'error')
    }
  }

  const createNetwork = async () => {
    if (!netName.trim()) return
    setCreating(true)
    try {
      await api.networks.create(netName.trim(), netDriver)
      await loadAll()
      toast(`Network "${netName}" created`, 'success')
      setCreateOpen(false)
      setNetName('')
    } catch {
      toast('Create failed', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="animate-pagein">
      <PageHeader
        title="Networks"
        sub="Docker network configuration and inspection"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3 h-3" /> Create network
          </Button>
        }
      />

      <SectionHeader title="Networks" count={networks.length} />

      <TableWrap>
        <table className="orca-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Driver</th>
              <th>Scope</th>
              <th>Subnet</th>
              <th>Containers</th>
              <th>Internal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(n => {
              const subnet = n.ipam_config?.[0]?.subnet ?? '—'
              const containerCount = Object.keys(n.containers ?? {}).length
              const isDefault = ['bridge','host','none'].includes(n.name)
              return (
                <tr key={n.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[9px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <Network className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <div className="font-medium text-[13px]">{n.name}</div>
                        <div className="font-mono text-[10.5px] text-[var(--text-muted)]">{n.id.slice(0,12)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      'font-mono text-[11.5px] px-2 py-0.5 rounded-[5px] border',
                      n.driver === 'bridge'  && 'bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.18)] text-[#00d4ff]',
                      n.driver === 'host'    && 'bg-[rgba(16,217,138,0.08)] border-[rgba(16,217,138,0.18)] text-[#10d98a]',
                      n.driver === 'overlay' && 'bg-[rgba(124,58,237,0.08)] border-[rgba(124,58,237,0.18)] text-[#a78bfa]',
                      !['bridge','host','overlay'].includes(n.driver) && 'bg-[var(--bg-glass)] border-[var(--border)] text-[var(--text-secondary)]',
                    )}>
                      {n.driver}
                    </span>
                  </td>
                  <td><span className="text-[11.5px] text-[var(--text-muted)]">{n.scope}</span></td>
                  <td><span className="font-mono text-[11.5px] text-[var(--text-secondary)]">{subnet}</span></td>
                  <td>
                    <span className={cn('text-[11.5px]', containerCount > 0 ? 'text-[#10d98a]' : 'text-[var(--text-muted)]')}>
                      {containerCount > 0 ? `${containerCount} connected` : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={cn('text-[11.5px]', n.internal ? 'text-[#f59e0b]' : 'text-[var(--text-muted)]')}>
                      {n.internal ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteNetwork(n.id, n.name)}
                      disabled={isDefault}
                      title={isDefault ? 'Cannot delete default network' : 'Delete network'}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] hover:text-[#ef4444] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {networks.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-14 text-[var(--text-muted)]">
                  <div className="text-4xl mb-3 opacity-30">🌐</div>
                  <div className="text-[15px] font-semibold text-[var(--text-secondary)] mb-1">No networks</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableWrap>

      <Dialog open={createOpen} onOpenChange={v => !v && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Network</DialogTitle>
            <DialogDescription>Create a new Docker network</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="netName">Network name</Label>
              <Input
                id="netName"
                value={netName}
                onChange={e => setNetName(e.target.value)}
                placeholder="my-network"
                autoFocus
              />
            </div>
            <div>
              <Label>Driver</Label>
              <Select value={netDriver} onValueChange={setNetDriver}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bridge">bridge</SelectItem>
                  <SelectItem value="overlay">overlay</SelectItem>
                  <SelectItem value="macvlan">macvlan</SelectItem>
                  <SelectItem value="ipvlan">ipvlan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createNetwork} disabled={!netName.trim() || creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
