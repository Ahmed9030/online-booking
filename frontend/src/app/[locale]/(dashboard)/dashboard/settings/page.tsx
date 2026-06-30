'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/auth'
import { useState, useEffect } from 'react'
import { User } from '@/types'

/** Business profile data returned from the settings API. */
interface BusinessProfile {
  id: string
  name: string
  slug: string
  logo_url?: string
  description?: string
  subscription_status: 'trial' | 'active' | 'expired' | 'suspended'
  subscription_expires_at?: string
  subscription_days_remaining?: number
}

/** Form data for editing the business profile settings. */
interface SettingsFormData {
  name: string
  logo_url: string
  description: string
}

/**
 * Settings page for viewing and updating business profile information,
 * subscription status, owner password, and logo.
 */
export default function SettingsPage() {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const business = useAuthStore((s) => s.business)
  const isOwner = useAuthStore((s) => s.isOwner())
  const isStaff = useAuthStore((s) => s.isStaff())
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const settingsEndpoint = isOwner ? '/owner/settings' : '/staff/settings'
  const passwordEndpoint = isOwner ? '/owner/settings/password' : '/staff/settings/password'

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', { role: isOwner ? 'owner' : 'staff' }],
    queryFn: async () => {
      if (isOwner) {
        const response = await api.get<{ data: BusinessProfile }>(settingsEndpoint)
        return { type: 'owner' as const, data: response.data.data }
      }
      const response = await api.get<{ data: User }>(settingsEndpoint)
      return { type: 'staff' as const, data: response.data.data }
    },
  })

  const staffForm = useForm<{ username: string }>()
  const { register: registerStaff, handleSubmit: handleStaffSubmit, reset: resetStaff, formState: { errors: staffErrors } } = staffForm

  useEffect(() => {
    if (settings?.type === 'owner') {
      reset({
        name: settings.data.name,
        logo_url: (settings.data as BusinessProfile).logo_url || '',
        description: (settings.data as BusinessProfile).description || '',
      })
    } else if (settings?.type === 'staff') {
      resetStaff({ username: (settings.data as User).username || '' })
    }
  }, [settings, reset, resetStaff])

  const updateSettings = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const payload: Record<string, unknown> = { name: data.name }
      if (data.logo_url) payload.logo_url = data.logo_url
      if (data.description) payload.description = data.description
      const response = await api.patch('/owner/settings', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const updateUsername = useMutation({
    mutationFn: async (data: { username: string }) => {
      const response = await api.patch<{ data: User }>('/staff/settings', data)
      return response.data.data
    },
    onSuccess: (updatedUser) => {
      const currentUser = useAuthStore.getState().user
      setUser(currentUser ? { ...currentUser, username: updatedUser.username } : null)
    },
  })

  const updatePassword = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const response = await api.patch(passwordEndpoint, data)
      return response.data
    },
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
    },
  })

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t('nav.settings')}</h1>

      {isOwner && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Business Profile */}
          <div className="lg:col-span-2 neu-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('common.details')}</h2>

            <form onSubmit={handleSubmit((data) => updateSettings.mutate(data))} className="space-y-4">
              <Input
                label={t('auth.barbershop_name')}
                {...register('name', { required: true })}
                error={errors.name ? 'validation.required' : null}
              />

              <Input
                label={t('common.logo_url')}
                {...register('logo_url')}
                placeholder="https://example.com/logo.png"
              />

              <Input
                label={t('common.description')}
                {...register('description')}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={updateSettings.isPending}
              >
                {t('common.save')}
              </Button>
            </form>
          </div>

          {/* Subscription Status */}
          <div className="neu-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('admin.subscription')}</h2>
            {settings?.type === 'owner' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-secondary">{t('admin.subscription_status')}</div>
                  <div className={`font-medium capitalize px-2 py-0.5 rounded text-xs ${
                    settings.data.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                    settings.data.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                    settings.data.subscription_status === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {t(`admin.${settings.data.subscription_status}`)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">{t('admin.subscription_expires')}</div>
                  <div className="font-medium">
                    {settings.data.subscription_expires_at
                      ? new Date(settings.data.subscription_expires_at).toLocaleDateString('ar-EG')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">{t('admin.days_remaining')}</div>
                  <div className="font-medium text-primary">
                    {settings.data.subscription_days_remaining != null ? settings.data.subscription_days_remaining : '-'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-text-secondary">{t('common.loading')}</div>
            )}
          </div>
        </div>
      )}

      {/* Staff: Username */}
      {isStaff && (
        <div className="neu-card p-6 max-w-2xl">
          <h2 className="mb-4 text-lg font-semibold">{t('auth.username')}</h2>
          <form onSubmit={handleStaffSubmit((data) => updateUsername.mutate(data))} className="space-y-4">
            <Input
              label={t('auth.username')}
              placeholder={user?.username || ''}
              {...registerStaff('username', { required: true })}
              error={staffErrors.username ? 'validation.required' : null}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={updateUsername.isPending}
            >
              {t('common.save')}
            </Button>
          </form>
        </div>
      )}

      {/* Password Change */}
      <div className="neu-card p-6 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">{t('auth.change_password')}</h2>
        <div className="space-y-4">
          <Input
            label={t('auth.current_password')}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label={t('auth.new_password')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            variant="primary"
            onClick={() =>
              updatePassword.mutate({
                current_password: currentPassword,
                new_password: newPassword,
              })
            }
            disabled={updatePassword.isPending || !currentPassword || !newPassword}
          >
            {t('common.update')}
          </Button>
        </div>
      </div>
    </div>
  )
}
