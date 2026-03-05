import { Badge } from '@/components/ui/badge'

type State = 'running' | 'exited' | 'paused' | 'stopped' | string

interface StatusBadgeProps {
  state: State
}

function getVariant(state: string): 'running' | 'exited' | 'paused' | 'stopped' {
  if (state === 'running') return 'running'
  if (state === 'exited')  return 'exited'
  if (state === 'paused')  return 'paused'
  return 'stopped'
}

export function StatusBadge({ state }: StatusBadgeProps) {
  return (
    <Badge variant={getVariant(state)} dot>
      {state}
    </Badge>
  )
}
