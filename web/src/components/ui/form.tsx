import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-[11px] bg-[var(--input-bg)] border border-[var(--border)]',
        'px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
        'outline-none transition-all duration-[220ms]',
        'focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-glow)]',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-[11px] bg-[var(--input-bg)] border border-[var(--border)]',
        'px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
        'outline-none transition-all duration-[220ms] resize-none',
        'focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-glow)]',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-[11.5px] font-semibold text-[var(--text-secondary)] mb-1.5 block', className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      'peer inline-flex h-6 w-[42px] shrink-0 cursor-pointer items-center rounded-full border border-[var(--border)]',
      'bg-[var(--bg-raised)] transition-all duration-[220ms]',
      'data-[state=checked]:bg-[rgba(0,212,255,0.15)] data-[state=checked]:border-[rgba(0,212,255,0.4)]',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-[var(--text-muted)] shadow-sm',
        'transition-all duration-[220ms] translate-x-[3px]',
        'data-[state=checked]:translate-x-[21px] data-[state=checked]:bg-[#00d4ff] data-[state=checked]:shadow-[0_0_8px_rgba(0,212,255,0.4)]'
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectGroup = SelectPrimitive.Group

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-9 w-full items-center justify-between rounded-[11px] border border-[var(--border)]',
      'bg-[var(--input-bg)] px-3 py-2 text-[13px] text-[var(--text-primary)]',
      'outline-none transition-all duration-[220ms] cursor-pointer',
      'focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-glow)]',
      'data-[placeholder]:text-[var(--text-muted)]',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-[11px]',
        'border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-hover)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' && 'translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-[7px] py-1.5 pl-8 pr-3',
      'text-[12.5px] text-[var(--text-secondary)] outline-none',
      'focus:bg-[var(--bg-glass-hover)] focus:text-[var(--text-primary)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[#00d4ff]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Input, Textarea, Label, Switch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup }
