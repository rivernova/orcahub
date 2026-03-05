import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/api/client'
import { FileText, RefreshCw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LogsDialogProps {
  open:          boolean
  onClose:       () => void
  containerId:   string
  containerName: string
}

const TAIL_OPTIONS = [50, 100, 200, 500] as const

export function LogsDialog({ open, onClose, containerId, containerName }: LogsDialogProps) {
  const [logs, setLogs]       = useState<string[]>([])
  const [tail, setTail]       = useState<number>(200)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const r = await api.containers.logs(containerId, tail)
      setLogs(r.logs)
    } catch {
      // Mock logs when backend unavailable
      setLogs(generateMockLogs(containerName, tail))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchLogs()
  }, [open, tail]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const colorLine = (line: string) => {
    if (/error|err|fatal|exception/i.test(line)) return 'log-err'
    if (/warn|warning/i.test(line)) return 'log-warn'
    return ''
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-raised)]">
          <div className="w-8 h-8 rounded-[9px] bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.25)] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-[#a78bfa]" />
          </div>
          <DialogHeader className="mb-0">
            <DialogTitle className="text-[14px] font-bold">
              Logs — <span className="text-[#a78bfa]">{containerName}</span>
            </DialogTitle>
            <p className="text-[11px] text-[var(--text-muted)]">{logs.length} lines</p>
          </DialogHeader>
          <div className="ml-auto flex items-center gap-3 mr-6">
            <Tabs value={String(tail)} onValueChange={v => setTail(Number(v))}>
              <TabsList>
                {TAIL_OPTIONS.map(n => (
                  <TabsTrigger key={n} value={String(n)}>{n}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Log output */}
        <div className="h-96 overflow-y-auto p-4 bg-[rgba(0,0,0,0.3)]">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm gap-2">
              <span className="animate-spin-orca inline-block w-4 h-4 border border-[#00d4ff] border-t-transparent rounded-full" />
              Loading logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
              No logs available
            </div>
          ) : (
            logs.map((line, i) => {
              // Try to extract timestamp prefix
              const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s(.*)$/)
              return (
                <div key={i} className={`log-line ${colorLine(line)}`}>
                  {tsMatch ? (
                    <>
                      <span className="log-ts">{tsMatch[1].slice(11, 19)}</span>
                      {tsMatch[2]}
                    </>
                  ) : line}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function generateMockLogs(name: string, count: number): string[] {
  const now = Date.now()
  const messages = [
    `Starting ${name}...`,
    'Initializing configuration',
    'Connecting to database...',
    'Database connection established',
    'Server listening on port 3000',
    'GET /health 200 0.4ms',
    'GET /api/users 200 12ms',
    'POST /api/auth 200 45ms',
    'GET /api/data 200 8ms',
    'Background job: processing queue',
    'Cache invalidated for key: session:*',
    'Metrics exported successfully',
    'WARN: High memory usage detected (72%)',
    'GET /api/metrics 200 3ms',
    'Connection pool: 8/20 active',
  ]
  return Array.from({ length: count }, (_, i) => {
    const ts = new Date(now - (count - i) * 5000).toISOString()
    const msg = messages[i % messages.length]
    return `${ts} ${msg}`
  })
}
