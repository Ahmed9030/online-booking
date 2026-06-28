'use client'

import { forwardRef, useId } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null
  label?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const t = useTranslations('validation')
    const translatedError = error ? t(error) : null
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'neu-input flex h-11 w-full rounded-xl bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && '!border-danger',
            className,
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {translatedError && (
          <p id={errorId} className="text-xs text-danger pr-1" role="alert">
            {translatedError}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
