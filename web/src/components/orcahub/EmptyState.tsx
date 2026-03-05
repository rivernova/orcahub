import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  icon?:        string
  title:        string
  description?: string
  action?:      { label: string; onClick: () => void }
  className?:   string
  error?:       boolean
}

export function EmptyState({ icon, title, description, action, className, error }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-8 text-center',
      className
    )}>
      {error ? (
        <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#ef4444]" />
        </div>
      ) : icon ? (
        <div className="text-4xl mb-4 opacity-25">{icon}</div>
      ) : null}
      <div className={cn(
        'text-[14px] font-semibold mb-1',
        error ? 'text-[#ef4444]' : 'text-[var(--text-secondary)]'
      )}>
        {title}
      </div>
      {description && (
        <div className="text-[12.5px] text-[var(--text-muted)] max-w-xs leading-relaxed">
          {description}
        </div>
      )}
      {action && (
        <Button variant="ghost" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Compact version for table rows
export function EmptyTableRow({ cols, icon, title, description }: {
  cols:         number
  icon?:        string
  title:        string
  description?: string
}) {
  return (
    <tr>
      <td colSpan={cols}>
        <EmptyState icon={icon} title={title} description={description} />
      </td>
    </tr>
  )
}

// Error banner for top of pages
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-[11px] bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.2)]">
      <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
      <span className="text-[12.5px] text-[#ef4444] flex-1">{message}</span>
      {onRetry && (
        <Button variant="danger" size="xs" onClick={onRetry}>Retry</Button>
      )}
    </div>
  )
}
