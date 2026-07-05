'use client'

import { useTranslations } from 'next-intl'

interface BookingStatusBadgeProps {
  status: 'confirmed' | 'completed' | 'no_show' | 'cancelled'
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: 'bg-confirmed/10', text: 'text-confirmed', dot: 'bg-confirmed' },
  completed: { bg: 'bg-completed/10', text: 'text-completed', dot: 'bg-completed' },
  no_show: { bg: 'bg-no-show/10', text: 'text-no-show', dot: 'bg-no-show' },
  cancelled: { bg: 'bg-cancelled/10', text: 'text-cancelled', dot: 'bg-cancelled' },
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const t = useTranslations()
  const style = STATUS_STYLES[status] || STATUS_STYLES.no_show

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {t(`status.${status}`)}
    </span>
  )
}
