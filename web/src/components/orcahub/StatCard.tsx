import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label:    string
  value:    string | number
  sub?:     ReactNode
  color?:   'green' | 'cyan' | 'amber' | 'red' | 'default'
  sparkline?: number[]
  className?: string
}

const colorMap = {
  green:   'text-[#10d98a]',
  cyan:    'text-[#00d4ff]',
  amber:   'text-[#f59e0b]',
  red:     'text-[#ef4444]',
  default: 'text-[var(--text-primary)]',
}

export function StatCard({ label, value, sub, color = 'default', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)] border border-[var(--border)] rounded-[16px] px-5 py-[18px]',
        'relative overflow-hidden transition-all duration-[220ms] cursor-default',
        'hover:border-[var(--border-bright)] hover:-translate-y-px hover:shadow-[var(--shadow-hover)]',
        'after:content-[\"\"] after:absolute after:top-0 after:left-0 after:right-0 after:h-px',
        'after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent',
        className
      )}
    >
      <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[var(--text-muted)] mb-[9px]">
        {label}
      </div>
      <div className={cn('text-[30px] font-extrabold tracking-[-0.02em] leading-none mb-[7px]', colorMap[color])}>
        {value}
      </div>
      {sub && (
        <div className="text-[11.5px] text-[var(--text-muted)] flex items-center gap-[5px]">
          {sub}
        </div>
      )}
    </div>
  )
}
