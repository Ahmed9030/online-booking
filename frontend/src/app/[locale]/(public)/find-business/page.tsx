'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/routing'
import { api } from '@/services/api'
import { useBookingStore } from '@/store/booking'
import { Branch } from '@/types'

interface BusinessItem {
  id: string
  name: string
  slug: string
  logo_url?: string
  subscription_status: string
}

export default function FindBusinessPage() {
  const t = useTranslations()
  const router = useRouter()
  const selectBranch = useBookingStore((s) => s.selectBranch)

  const [businesses, setBusinesses] = useState<BusinessItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [branchesLoading, setBranchesLoading] = useState(false)

  useEffect(() => {
    api
      .get<{ data: BusinessItem[] }>('/public/businesses')
      .then((res) => setBusinesses(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleBusinessChange = async (slug: string) => {
    setSelectedBusiness(slug)
    setSelectedBranch('')
    setBranches([])
    if (!slug) return
    setBranchesLoading(true)
    try {
      const res = await api.get<{
        data: { business: BusinessItem; branches: Branch[] }
      }>(`/public/business/${slug}`)
      setBranches(res.data.data.branches)
    } catch {
      setBranches([])
    } finally {
      setBranchesLoading(false)
    }
  }

  const handleBook = () => {
    const branch = branches.find((b) => b.id === selectedBranch)
    if (!branch || !selectedBusiness) return
    selectBranch(branch)
    router.push(`/book/${selectedBusiness}/${branch.slug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-text-secondary">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4" dir="rtl">
      <div className="neu-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('booking.find_business')}
          </h1>
          <p className="text-text-secondary">
            {t('booking.find_business_description')}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('booking.business_slug')}
            </label>
            <select
              value={selectedBusiness}
              onChange={(e) => handleBusinessChange(e.target.value)}
              className="neu-input flex h-12 w-full rounded-xl bg-surface px-4 text-sm text-text-primary appearance-none cursor-pointer"
            >
              <option value="">-- {t('booking.select_business')} --</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBusiness && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('booking.select_branch')}
              </label>
              {branchesLoading ? (
                <div className="h-12 rounded-xl bg-text-muted/10 animate-pulse" />
              ) : (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="neu-input flex h-12 w-full rounded-xl bg-surface px-4 text-sm text-text-primary appearance-none cursor-pointer"
                >
                  <option value="">-- {t('booking.select_branch')} --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} - {b.address}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <Button
            variant="primary"
            className="w-full h-12 text-base"
            disabled={!selectedBranch}
            onClick={handleBook}
          >
            {t('auth.book_now')}
          </Button>
        </div>
      </div>
    </div>
  )
}
