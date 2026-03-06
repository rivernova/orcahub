import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { api } from '@/api/client'
import { shortId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ContainerInspect } from '@/types'

interface InspectDialogProps { open: boolean; onClose: () => void; containerId: string; containerName: string }

export function InspectDialog({ open, onClose, containerId, containerName }: InspectDialogProps) {
  const [data, setData] = useState<ContainerInspect | null>(null)
  const [top, setTop] = useState<{ titles: string[]; processes: string[][] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!open || !containerId) return
    setLoading(true); setData(null); setTop(null)
    Promise.all([api.containers.inspect(containerId), api.containers.top(containerId).catch(() => null)])
      .then(([inspect, topResult]) => { setData(inspect); setTop(topResult) })
      .finally(() => setLoading(false))
  }, [open, containerId])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>\ud83d\udce6</span><span>{containerName}</span>
            {data && (<Badge variant={data.state === 'running' ? 'running' : 'exited'} dot>{data.state}</Badge>)}
          </DialogTitle>
        </DialogHeader>
        {loading && (<div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-[13px]">Loading\u2026</div>)}
        {!loading && data && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="env">Env</TabsTrigger>
              <TabsTrigger value="mounts">Mounts</TabsTrigger>
              <TabsTrigger value="networks">Networks</TabsTrigger>
              {top && <TabsTrigger value="processes">Processes</TabsTrigger>}
            </TabsList>
            <TabsContent value="overview" className="space-y-3 max-h-[55vh] overflow-y-auto">
              <Row label="ID" value={shortId(data.id)} mono />
              <Row label="Image" value={data.image} mono />
              <Row label="Status" value={data.status} />
              <Row label="Network mode" value={data.network_mode} />
              <Row label="Restart policy" value={data.restart_policy || 'no'} />
              <Row label="Working dir" value={data.working_dir || '/'} mono />
              <Row label="Hostname" value={data.hostname} mono />
              {data.user && <Row label="User" value={data.user} mono />}
              {data.started_at && <Row label="Started" value={new Date(data.started_at).toLocaleString()} />}
              {data.finished_at && data.state !== 'running' && <Row label="Finished" value={new Date(data.finished_at).toLocaleString()} />}
              {data.exit_code !== 0 && <Row label="Exit code" value={String(data.exit_code)} />}
              {data.cmd?.length > 0 && <Row label="Command" value={data.cmd.join(' ')} mono />}
              {data.entrypoint?.length > 0 && <Row label="Entrypoint" value={data.entrypoint.join(' ')} mono />}
              {data.ports?.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-[11.5px] text-[var(--text-muted)] w-28 flex-shrink-0 pt-0.5">Ports</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {data.ports.map((p, i) => (<Badge key={i} variant="cyan" className="font-mono text-[10.5px]">{p.public_port ? `${p.public_port}\u2192` : ''}{p.private_port}/{p.type}</Badge>))}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="env" className="max-h-[55vh] overflow-y-auto">
              {data.env?.length > 0 ? (
                <div className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-[9px] p-3 space-y-1">
                  {data.env.map((e, i) => { const [key, ...rest] = e.split('='); const val = rest.join('='); return (
                    <div key={i} className="flex gap-2 text-[11.5px] font-mono"><span className="text-[#00d4ff] flex-shrink-0 min-w-[120px]">{key}</span><span className="text-[var(--text-secondary)] break-all">{val}</span></div>
                  )})}
                </div>
              ) : (<div className="text-center text-[var(--text-muted)] text-[13px] py-8">No environment variables</div>)}
            </TabsContent>
            <TabsContent value="mounts" className="max-h-[55vh] overflow-y-auto space-y-2">
              {data.mounts?.length > 0 ? data.mounts.map((m, i) => (
                <div key={i} className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-[9px] p-3 text-[12px]">
                  <div className="flex items-center gap-2 mb-2"><Badge variant={m.type === 'volume' ? 'cyan' : 'default'} className="text-[10px]">{m.type}</Badge><Badge variant={m.rw ? 'running' : 'default'} className="text-[10px]">{m.rw ? 'rw' : 'ro'}</Badge></div>
                  <div className="font-mono space-y-0.5"><div><span className="text-[var(--text-muted)]">src: </span><span className="text-[var(--text-secondary)] break-all">{m.source}</span></div><div><span className="text-[var(--text-muted)]">dst: </span><span className="text-[var(--text-secondary)] break-all">{m.destination}</span></div></div>
                </div>
              )) : (<div className="text-center text-[var(--text-muted)] text-[13px] py-8">No mounts</div>)}
            </TabsContent>
            <TabsContent value="networks" className="max-h-[55vh] overflow-y-auto space-y-2">
              {data.networks && Object.keys(data.networks).length > 0 ? (
                Object.entries(data.networks).map(([netName, ep]) => (
                  <div key={netName} className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-[9px] p-3 text-[12px] font-mono">
                    <div className="text-[13px] font-semibold text-[var(--text-primary)] font-sans mb-2">{netName}</div>
                    <Row label="IP" value={ep.ip_address} mono small /><Row label="Gateway" value={ep.gateway} mono small /><Row label="MAC" value={ep.mac_address} mono small /><Row label="Network ID" value={shortId(ep.network_id)} mono small />
                  </div>
                ))
              ) : (<div className="text-center text-[var(--text-muted)] text-[13px] py-8">No networks</div>)}
            </TabsContent>
            {top && (
              <TabsContent value="processes" className="max-h-[55vh] overflow-y-auto">
                <div className="overflow-x-auto"><table className="w-full text-[11.5px]"><thead><tr className="border-b border-[var(--border)]">{top.titles.map((t, i) => (<th key={i} className="text-left px-2 py-1.5 text-[var(--text-muted)] font-semibold tracking-wide">{t}</th>))}</tr></thead>
                <tbody>{top.processes.map((row, i) => (<tr key={i} className={cn('border-b border-[var(--border)]', i % 2 === 0 && 'bg-[var(--bg-glass)]')}>{row.map((cell, j) => (<td key={j} className="px-2 py-1.5 font-mono text-[var(--text-secondary)] whitespace-nowrap">{cell}</td>))}</tr>))}</tbody></table></div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, mono = false, small = false }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  if (!value) return null
  return (
    <div className={cn('flex items-start gap-3', small && 'gap-2')}>
      <span className={cn('text-[var(--text-muted)] flex-shrink-0', small ? 'text-[10.5px] w-20' : 'text-[11.5px] w-28')}>{label}</span>
      <span className={cn('break-all text-[var(--text-secondary)]', small ? 'text-[10.5px]' : 'text-[12.5px]', mono && 'font-mono')}>{value}</span>
    </div>
  )
}
