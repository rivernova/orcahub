import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/form'
import { api } from '@/api/client'
import { Plus, Trash2 } from 'lucide-react'

interface DeployDialogProps {
  open:    boolean
  onClose: () => void
  onDone:  () => void
  toast:   (msg: string, type?: 'success' | 'error' | 'info') => void
}

interface PortRow { host: string; container: string; proto: string }

export function DeployDialog({ open, onClose, onDone, toast }: DeployDialogProps) {
  const [name,          setName]          = useState('')
  const [image,         setImage]         = useState('')
  const [restartPolicy, setRestartPolicy] = useState('unless-stopped')
  const [ports,         setPorts]         = useState<PortRow[]>([{ host: '', container: '', proto: 'tcp' }])
  const [envVars,       setEnvVars]       = useState<string[]>([''])
  const [loading,       setLoading]       = useState(false)

  const reset = () => {
    setName(''); setImage(''); setRestartPolicy('unless-stopped')
    setPorts([{ host: '', container: '', proto: 'tcp' }]); setEnvVars([''])
  }

  const handleClose = () => { reset(); onClose() }

  const setPort = (i: number, field: keyof PortRow, val: string) =>
    setPorts(p => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const setEnv = (i: number, val: string) =>
    setEnvVars(e => e.map((v, idx) => idx === i ? val : v))

  const deploy = async () => {
    if (!image.trim()) { toast('Image is required', 'error'); return }
    setLoading(true)
    try {
      const portBindings = ports
        .filter(p => p.host && p.container)
        .map(p => ({ host_port: p.host, container_port: p.container, protocol: p.proto }))
      const env = envVars.filter(e => e.includes('='))

      await api.containers.create({
        name:           name.trim() || undefined,
        image:          image.trim(),
        ports:          portBindings,
        env,
        restart_policy: restartPolicy,
      })
      toast(`Deployed: ${image.trim()}`, 'success')
      reset(); onDone(); onClose()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Deploy failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const quickImages = ['nginx:latest', 'redis:alpine', 'postgres:16', 'node:20-alpine', 'python:3.12-slim', 'ubuntu:22.04']

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Deploy Container</DialogTitle>
          <DialogDescription>Create and start a new Docker container</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Image */}
          <div>
            <Label htmlFor="img">Image <span className="text-[#ef4444]">*</span></Label>
            <Input id="img" value={image} onChange={e => setImage(e.target.value)}
              placeholder="nginx:latest" autoFocus />
            <div className="flex gap-1.5 flex-wrap mt-2">
              {quickImages.map(q => (
                <button key={q} onClick={() => setImage(q)}
                  className="text-[10.5px] px-2 py-0.5 rounded-[5px] bg-[var(--bg-glass)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="cname">
              Name <span className="text-[var(--text-muted)] font-normal text-[11px]">(optional)</span>
            </Label>
            <Input id="cname" value={name} onChange={e => setName(e.target.value)} placeholder="my-container" />
          </div>

          {/* Restart policy */}
          <div>
            <Label>Restart policy</Label>
            <Select value={restartPolicy} onValueChange={setRestartPolicy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">no</SelectItem>
                <SelectItem value="always">always</SelectItem>
                <SelectItem value="unless-stopped">unless-stopped</SelectItem>
                <SelectItem value="on-failure">on-failure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Port bindings */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Port bindings</Label>
              <button onClick={() => setPorts(p => [...p, { host: '', container: '', proto: 'tcp' }])}
                className="text-[11px] text-[var(--text-muted)] hover:text-[#00d4ff] flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {ports.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={p.host} onChange={e => setPort(i, 'host', e.target.value)}
                    placeholder="8080" className="w-20" />
                  <span className="text-[var(--text-muted)] text-[12px] flex-shrink-0">→</span>
                  <Input value={p.container} onChange={e => setPort(i, 'container', e.target.value)}
                    placeholder="80" className="w-20" />
                  <Select value={p.proto} onValueChange={v => setPort(i, 'proto', v)}>
                    <SelectTrigger className="w-[72px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">tcp</SelectItem>
                      <SelectItem value="udp">udp</SelectItem>
                    </SelectContent>
                  </Select>
                  {ports.length > 1 && (
                    <button onClick={() => setPorts(p => p.filter((_, idx) => idx !== i))}
                      className="text-[var(--text-muted)] hover:text-[#ef4444] transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Environment variables */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Environment variables <span className="text-[var(--text-muted)] font-normal text-[11px]">(KEY=value)</span></Label>
              <button onClick={() => setEnvVars(e => [...e, ''])}
                className="text-[11px] text-[var(--text-muted)] hover:text-[#00d4ff] flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {envVars.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={v} onChange={e => setEnv(i, e.target.value)}
                    placeholder="DATABASE_URL=postgres://..." className="flex-1 font-mono text-[12px]" />
                  {envVars.length > 1 && (
                    <button onClick={() => setEnvVars(e => e.filter((_, idx) => idx !== i))}
                      className="text-[var(--text-muted)] hover:text-[#ef4444] transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={deploy} disabled={!image.trim() || loading}>
            {loading ? 'Deploying…' : '▶ Deploy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
