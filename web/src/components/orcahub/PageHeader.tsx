import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title:    string
  sub?:     string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, sub, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-[21px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">{title}</h1>
        {sub && <p className="text-[12.5px] text-[var(--text-secondary)] mt-[3px]">{sub}</p>}
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  )
}

export function SectionHeader({
  title,
  count,
  right,
  className,
}: {
  title: ReactNode
  count?: number | string
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between mb-[14px]', className)}>
      <div className="text-[13.5px] font-bold flex items-center gap-[9px] text-[var(--text-primary)]">
        {title}
        {count !== undefined && (
          <span className="font-mono text-[10.5px] px-2 py-px bg-[var(--bg-glass)] border border-[var(--border)] rounded-full text-[var(--text-muted)]">
            {count}
          </span>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] overflow-hidden mb-4', className)}>
      {children}
    </div>
  )
}
