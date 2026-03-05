import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[.06em] transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-[var(--bg-raised)] border-[var(--border)] text-[var(--text-secondary)]',
        running:  'bg-[rgba(16,217,138,0.12)] border-[rgba(16,217,138,0.25)] text-[#10d98a]',
        exited:   'bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.25)] text-[#ef4444]',
        paused:   'bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.25)] text-[#f59e0b]',
        stopped:  'bg-[var(--bg-raised)] border-[var(--border)] text-[var(--text-muted)]',
        cyan:     'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.22)] text-[#00d4ff]',
        purple:   'bg-[rgba(124,58,237,0.1)] border-[rgba(124,58,237,0.22)] text-[#c4b5fd]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          variant === 'running' && 'bg-[#10d98a] animate-[pdot_2s_ease-in-out_infinite]',
          variant === 'exited'  && 'bg-[#ef4444]',
          variant === 'paused'  && 'bg-[#f59e0b]',
          variant === 'stopped' && 'bg-[var(--text-muted)]',
          (!variant || variant === 'default') && 'bg-[var(--text-muted)]',
        )} />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
