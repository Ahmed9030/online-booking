'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useBookingStore } from '@/store/booking'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useParams } from 'next/navigation'

/**
 * Staff selection page allowing the user to choose a specific staff member
 * or opt for "any available" auto-assignment.
 */
export default function StaffSelectPage() {
  const t = useTranslations()
  const router = useRouter()
  const { businessSlug } = useParams()
  const branch = useBookingStore((s) => s.branch)
  const service = useBookingStore((s) => s.service)
  const selectStaff = useBookingStore((s) => s.selectStaff)

  const { data: staffList, isLoading } = useQuery({
    queryKey: ['staff', branch?.id, service?.id],
    queryFn: async () => {
      if (!branch?.id || !service?.id) return []
      const res = await api.get<{ data: { id: string; name: string }[] }>(
        `/public/branches/${branch.id}/staff?service_id=${service.id}`,
      )
      return res.data.data
    },
    enabled: !!branch?.id && !!service?.id,
  })

  const handleAnyAvailable = () => {
    selectStaff(null)
    router.push(`/book/${businessSlug}/${branch?.slug}/time-select`)
  }

  const handleSelect = (s: { id: string; name: string }) => {
    selectStaff({ id: s.id, name: s.name, is_active: true, services: [] })
    router.push(`/book/${businessSlug}/${branch?.slug}/time-select`)
  }

  if (!branch || !service) {
    router.push('/')
    return null
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-text-primary">
        {t('booking.select_staff')}
      </h1>

      <div className="grid gap-3">
        <button
          onClick={handleAnyAvailable}
          className="neu-card flex items-center gap-4 p-4 w-full text-right cursor-pointer hover:scale-[1.01]"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
            ✨
          </div>
          <div>
            <div className="font-semibold text-text-primary">{t('booking.any_available')}</div>
            <div className="text-xs text-text-muted mt-0.5">اختيار تلقائي</div>
          </div>
        </button>

        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="neu-card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-text-muted/20" />
                  <div className="h-4 w-24 bg-text-muted/20 rounded" />
                </div>
              </div>
            ))}
          </>
        ) : (
          staffList?.map((s: { id: string; name: string }) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className="neu-card flex items-center gap-4 p-4 w-full text-right cursor-pointer hover:scale-[1.01]"
            >
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-lg shrink-0 neu-btn">
                👤
              </div>
              <div>
                <div className="font-semibold text-text-primary">{s.name}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
