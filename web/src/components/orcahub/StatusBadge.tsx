import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  state: string
  className?: string
}

export function StatusBadge({ state, className }: StatusBadgeProps) {
  const s = state.toLowerCase()
  const isRunning = s === 'running'
  const isExited  = s === 'exited'
  const isPaused  = s === 'paused'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-full',
        'text-[10px] font-bold tracking-[.04em] uppercase',
        isRunning && 'pill-running',
        isExited  && 'pill-exited',
        isPaused  && 'pill-paused',
        !isRunning && !isExited && !isPaused && 'pill-stopped',
        className
      )}
    >
      <span
        className={cn(
          'w-[5.5px] h-[5.5px] rounded-full flex-shrink-0',
          isRunning && 'bg-[#10d98a] shadow-[0_0_5px_#10d98a] animate-pdot',
          isExited  && 'bg-[#ef4444]',
          isPaused  && 'bg-[#f59e0b]',
          !isRunning && !isExited && !isPaused && 'bg-[var(--text-muted)]',
        )}
      />
      {s}
    </span>
  )
}
