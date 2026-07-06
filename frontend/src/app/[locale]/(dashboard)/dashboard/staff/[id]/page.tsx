'use client'

import {
  useStaffDetail,
  useUpdateStaff,
  useUpdateStaffWorkingHours,
  useCreateStaffLoginCredentials,
  useAssignStaffServices,
} from '@/features/staff/hooks/useStaff'
import { useServicesList } from '@/features/services/hooks/useServices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { useState, use, useEffect, useMemo, useCallback, useRef } from 'react'
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor'
import { useUiStore } from '@/store/ui'

/** Props for the staff detail page route. */
interface StaffDetailPageProps {
  params: Promise<{
    /** The UUID of the staff member to edit */
    id: string
  }>
}

/**
 * Staff detail/edit page showing basic info fields, working hours editor,
 * login credentials creator, and service assignment checkboxes.
 */
export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { id } = use(params)
  const t = useTranslations()
  const { data: staff, isLoading } = useStaffDetail(id)
  const updateStaff = useUpdateStaff()
  const updateWorkingHours = useUpdateStaffWorkingHours()
  const createLoginCredentials = useCreateStaffLoginCredentials()
  const assignServices = useAssignStaffServices()
  const { data: servicesData } = useServicesList()

  const showToast = useUiStore((s) => s.showToast)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const stableStaffId = useRef(staff?.id)
  stableStaffId.current = staff?.id ?? stableStaffId.current

  const editorInitialHours = useMemo(
    () =>
      staff?.working_hours?.map((h) => ({
        weekday: h.weekday,
        open_time: h.start_time,
        close_time: h.end_time,
      })) ?? [],
    [staff?.working_hours],
  )

  const editorOnUpdate = useCallback(
    (hours: Array<{ weekday: number; start_time?: string | null; end_time?: string | null }>) =>
      updateWorkingHours.mutate(
        { id: stableStaffId.current!, working_hours: hours },
        {
          onSuccess: () => showToast('تم حفظ مواعيد العمل بنجاح', 'success'),
          onError: () => showToast('حدث خطأ أثناء الحفظ', 'error'),
        },
      ),
    [updateWorkingHours, showToast],
  )

  useEffect(() => {
    if (staff?.services) {
      setSelectedServiceIds(staff.services.map((s) => s.id))
    }
    if (staff?.name) {
      setName(staff.name)
    }
  }, [staff])

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!staff) return <div>{t('common.not_found')}</div>

  /** Saves the updated staff name via the update mutation. */
  const handleSave = () => {
    if (!name.trim()) return
    setError(null)
    updateStaff.mutate(
      { id: staff.id, name },
      {
        onError: () => setError(t('common.save_error')),
      },
    )
  }

  /** Creates login credentials for the staff member. */
  const handleCreateCredentials = () => {
    setError(null)
    createLoginCredentials.mutate(
      { id: staff.id, username, password },
      {
        onSuccess: () => {
          setUsername('')
          setPassword('')
        },
        onError: () => setError(t('common.save_error')),
      },
    )
  }

  /** Toggles a service ID in the selected services set. */
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId],
    )
  }

  /** Assigns the selected services to the staff member. */
  const handleAssignServices = () => {
    setError(null)
    assignServices.mutate(
      { id: staff.id, service_ids: selectedServiceIds },
      { onError: () => setError(t('common.save_error')) },
    )
  }

  const branchServices = servicesData?.data.filter(
    (service) => service.branch_id === staff.branch_id,
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{staff.name}</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="lg:col-span-2 neu-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('common.details')}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary">{t('common.name')}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={updateStaff.isPending || !name.trim()}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Working Hours */}
        <div className="neu-card p-6">
          <WorkingHoursEditor
            staffId={staff.id}
            initialHours={editorInitialHours}
            onUpdate={editorOnUpdate}
          />
        </div>
      </div>

      {/* Login Credentials */}
      <div className="neu-card p-6 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">{t('common.login_credentials')}</h2>
        <div className="space-y-4">
          <Input
            label={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="primary"
            onClick={handleCreateCredentials}
            disabled={createLoginCredentials.isPending || !username || !password}
          >
            {t('common.create')}
          </Button>
        </div>
      </div>

      {/* Service Assignment */}
      <div className="neu-card p-6 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">{t('common.assign_services')}</h2>
        <div className="space-y-2">
          {branchServices?.map((service) => (
            <label
              key={service.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedServiceIds.includes(service.id)}
                onChange={() => toggleService(service.id)}
                className="h-4 w-4"
              />
              <span className="text-sm">
                {service.name} — {service.duration_minutes} {t('common.minutes')} — {service.price} {t('admin.egp')}
              </span>
            </label>
          ))}
        </div>
        <Button
          variant="primary"
          className="mt-4"
          onClick={handleAssignServices}
          disabled={assignServices.isPending}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
