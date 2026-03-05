import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-[11px] text-[12.5px] font-semibold transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] border disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-br from-[rgba(0,212,255,0.18)] to-[rgba(0,180,220,0.12)]',
          'border-[rgba(0,212,255,0.38)] text-[#00d4ff]',
          'hover:from-[rgba(0,212,255,0.28)] hover:to-[rgba(0,180,220,0.22)]',
          'hover:border-[#00d4ff] hover:shadow-[0_0_18px_rgba(0,212,255,0.18)]',
        ],
        ghost: [
          'bg-[var(--bg-glass)] border-[var(--border)] text-[var(--text-secondary)]',
          'hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-bright)] hover:text-[var(--text-primary)]',
        ],
        danger: [
          'bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)] text-[#ef4444]',
          'hover:bg-[rgba(239,68,68,0.2)] hover:border-[#ef4444]',
        ],
        success: [
          'bg-[rgba(16,217,138,0.15)] border-[rgba(16,217,138,0.3)] text-[#10d98a]',
          'hover:bg-[rgba(16,217,138,0.2)] hover:border-[#10d98a]',
        ],
        amber: [
          'bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.3)] text-[#f59e0b]',
          'hover:bg-[rgba(245,158,11,0.2)] hover:border-[#f59e0b]',
        ],
        // Fixed: explicit color so SVG icons are always visible
        icon: [
          'w-[34px] h-[34px] p-0 rounded-[7px] border-transparent bg-transparent',
          'text-[rgba(240,244,255,0.55)]',
          'hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border)] hover:text-[rgba(240,244,255,0.9)]',
        ],
        'icon-active': [
          'w-[34px] h-[34px] p-0 rounded-[7px]',
          'bg-[rgba(0,212,255,0.15)] border-[rgba(0,212,255,0.35)] text-[#00d4ff]',
        ],
      },
      size: {
        default: 'px-4 py-2',
        sm:      'px-[11px] py-[5px] text-[11.5px] rounded-[7px]',
        xs:      'px-[8px] py-[3px] text-[11px] rounded-[6px]',
        icon:    'w-[34px] h-[34px] p-0',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size:    'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
