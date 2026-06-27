import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'neu-input flex h-11 w-full rounded-xl bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && '!border-danger',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger pr-1">{error}</p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
