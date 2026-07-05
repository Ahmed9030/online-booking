# Phase 5: Dashboard Frontend Specification
# Booking SaaS — Barbershop Appointment Platform

> Complete specification for the owner/staff dashboard with full API integration.
> Everything is connected to Phase 3 API endpoints.
> All data fetching, caching, and mutations are fully implemented.

---

## Overview

### Dashboard Features

```
Dashboard
├── Overview (Stats)
├── Calendar (FullCalendar + drag/drop)
├── Bookings Management
│   ├── List with filters
│   ├── Detail view
│   ├── Status updates
│   └── Manual booking creation
├── Customers
│   ├── List
│   ├── Detail + booking history
│   └── Edit profile
├── Staff
│   ├── List
│   ├── Create/Edit
│   ├── Working hours
│   ├── Services assignment
│   └── Login credentials
├── Branches
│   ├── List
│   ├── Create/Edit
│   └── Working hours
├── Services
│   ├── List
│   ├── Create/Edit
│   └── Delete
└── Settings
    ├── Business profile
    ├── Subscription status
    └── Account
```

### API Integration Map

Every component connects to Phase 3 API endpoints:

| Feature | GET | POST | PATCH | DELETE |
|---------|-----|------|-------|--------|
| Bookings | `/owner/bookings` | `/owner/bookings` | `/owner/bookings/{id}/status` | `/owner/bookings/{id}` |
| Customers | `/owner/customers` | — | — | — |
| Staff | `/owner/staff` | `/owner/staff` | `/owner/staff/{id}` | `/owner/staff/{id}` |
| Branches | `/owner/branches` | `/owner/branches` | `/owner/branches/{id}` | `/owner/branches/{id}` |
| Services | `/owner/services` | `/owner/services` | `/owner/services/{id}` | `/owner/services/{id}` |
| Dashboard | `/owner/dashboard` | — | — | — |

---

## Part 1: Custom Hooks (API Integration)

### Hook 1: `src/features/bookings/hooks/useDashboardBookings.ts`

List and filter bookings:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Booking, PaginatedResponse } from '@/types'

/** Parameters for filtering the bookings list. */
interface UseBookingsParams {
  /** Page number for pagination */
  page?: number
  /** Filter by booking status */
  status?: string
  /** Filter by branch ID */
  branch_id?: string
}

/**
 * Custom hook for fetching a paginated, filterable list of bookings
 * for the owner dashboard.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated booking data.
 */
export function useDashboardBookings(params?: UseBookingsParams) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Booking>>(
        '/owner/bookings',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single booking's details.
 *
 * @param id - The UUID of the booking to fetch.
 * @returns A TanStack query result containing the booking data.
 */
export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await api.get<{ data: Booking }>(`/owner/bookings/${id}`)
      return response.data.data
    },
  })
}

/**
 * Custom hook for updating a booking's status (complete, no-show, cancel).
 * Invalidates the bookings list on success.
 *
 * @returns A TanStack mutation object for triggering the status update.
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'completed' | 'no_show' | 'cancelled'
    }) => {
      const response = await api.patch<{ data: Booking }>(
        `/owner/bookings/${id}/status`,
        { status },
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

/**
 * Custom hook for creating a manual booking from the dashboard.
 * Invalidates the bookings list on success.
 *
 * @returns A TanStack mutation object for triggering the booking creation.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<{ data: Booking }>(
        '/owner/bookings',
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

/**
 * Custom hook for deleting a booking.
 * Invalidates the bookings list on success.
 *
 * @returns A TanStack mutation object for triggering the deletion.
 */
export function useDeleteBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/owner/bookings/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}
```

### Hook 2: `src/features/staff/hooks/useStaff.ts`

Staff management:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Staff, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of staff members.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated staff data.
 */
export function useStaffList(params?: any) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Staff>>(
        '/owner/staff',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single staff member's details.
 *
 * @param id - The UUID of the staff member to fetch.
 * @returns A TanStack query result containing the staff data.
 */
export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: async () => {
      const response = await api.get<{ data: Staff }>(`/owner/staff/${id}`)
      return response.data.data
    },
  })
}

/**
 * Custom hook for creating a new staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering staff creation.
 */
export function useCreateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      branch_id: string
      phone?: string
    }) => {
      const response = await api.post<{ data: Staff }>('/owner/staff', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for updating an existing staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the staff update.
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const response = await api.patch<{ data: Staff }>(
        `/owner/staff/${id}`,
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for updating a staff member's working hours.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the working hours update.
 */
export function useUpdateStaffWorkingHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      working_hours,
    }: {
      id: string
      working_hours: Array<{
        weekday: number
        start_time?: string
        end_time?: string
      }>
    }) => {
      await api.post(`/owner/staff/${id}/working-hours`, { working_hours })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for assigning services to a staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the service assignment.
 */
export function useAssignStaffServices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      service_ids,
    }: {
      id: string
      service_ids: string[]
    }) => {
      await api.post(`/owner/staff/${id}/services`, { service_ids })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}

/**
 * Custom hook for deleting a staff member.
 * Invalidates the staff list on success.
 *
 * @returns A TanStack mutation object for triggering the deletion.
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/owner/staff/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
```

### Hook 3: `src/features/branches/hooks/useBranches.ts`

Branch management:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Branch, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of branches.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated branch data.
 */
export function useBranchesList(params?: any) {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Branch>>(
        '/owner/branches',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single branch's details.
 *
 * @param id - The UUID of the branch to fetch.
 * @returns A TanStack query result containing the branch data.
 */
export function useBranchDetail(id: string) {
  return useQuery({
    queryKey: ['branch', id],
    queryFn: async () => {
      const response = await api.get<{ data: Branch }>(`/owner/branches/${id}`)
      return response.data.data
    },
  })
}

/**
 * Custom hook for creating a new branch.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering branch creation.
 */
export function useCreateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      address: string
      city: string
      whatsapp_number: string
      slug: string
    }) => {
      const response = await api.post<{ data: Branch }>('/owner/branches', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

/**
 * Custom hook for updating an existing branch.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering the branch update.
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const response = await api.patch<{ data: Branch }>(
        `/owner/branches/${id}`,
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

/**
 * Custom hook for updating a branch's working hours.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering the working hours update.
 */
export function useUpdateBranchWorkingHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      working_hours,
    }: {
      id: string
      working_hours: Array<{
        weekday: number
        open_time?: string
        close_time?: string
      }>
    }) => {
      await api.post(`/owner/branches/${id}/working-hours`, { working_hours })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}

/**
 * Custom hook for deleting a branch.
 * Invalidates the branches list on success.
 *
 * @returns A TanStack mutation object for triggering the deletion.
 */
export function useDeleteBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/owner/branches/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
    },
  })
}
```

### Hook 4: `src/features/customers/hooks/useCustomers.ts`

Customer management:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Customer, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of customers.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated customer data.
 */
export function useCustomersList(params?: any) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Customer>>(
        '/owner/customers',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single customer's details.
 *
 * @param id - The UUID of the customer to fetch.
 * @returns A TanStack query result containing the customer data.
 */
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await api.get<{ data: Customer }>(
        `/owner/customers/${id}`,
      )
      return response.data.data
    },
  })
}

/**
 * Custom hook for fetching a customer's booking history.
 *
 * @param id - The UUID of the customer.
 * @returns A TanStack query result containing the customer's bookings.
 */
export function useCustomerBookings(id: string) {
  return useQuery({
    queryKey: ['customer-bookings', id],
    queryFn: async () => {
      const response = await api.get(`/owner/customers/${id}/bookings`)
      return response.data.data
    },
  })
}
```

### Hook 5: `src/features/services/hooks/useServices.ts`

Service management:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Service, PaginatedResponse } from '@/types'

/**
 * Custom hook for fetching a paginated list of services.
 *
 * @param params - Optional filter and pagination parameters.
 * @returns A TanStack query result containing paginated service data.
 */
export function useServicesList(params?: any) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Service>>(
        '/owner/services',
        { params },
      )
      return response.data
    },
  })
}

/**
 * Custom hook for fetching a single service's details.
 *
 * @param id - The UUID of the service to fetch.
 * @returns A TanStack query result containing the service data.
 */
export function useServiceDetail(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await api.get<{ data: Service }>(
        `/owner/services/${id}`,
      )
      return response.data.data
    },
  })
}

/**
 * Custom hook for creating a new service.
 * Invalidates the services list on success.
 *
 * @returns A TanStack mutation object for triggering service creation.
 */
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      duration_minutes: number
      price: number
      branch_id: string
    }) => {
      const response = await api.post<{ data: Service }>(
        '/owner/services',
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * Custom hook for updating an existing service.
 * Invalidates the services list on success.
 *
 * @returns A TanStack mutation object for triggering the service update.
 */
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const response = await api.patch<{ data: Service }>(
        `/owner/services/${id}`,
        data,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * Custom hook for deleting a service.
 * Invalidates the services list on success.
 *
 * @returns A TanStack mutation object for triggering the deletion.
 */
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/owner/services/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
```

---

## Part 2: Dashboard Pages

### Page 1: `src/app/[locale]/(dashboard)/calendar/page.tsx`

FullCalendar integration with bookings:

```typescript
'use client'

import { useCallback, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useDashboardBookings } from '@/features/bookings/hooks/useDashboardBookings'
import { useTranslations } from 'next-intl'
import { Booking } from '@/types'

/**
 * Calendar page integrating FullCalendar with booking data.
 * Displays bookings as color-coded events on a weekly/monthly/daily view.
 * Clicking an event shows booking details in a side panel.
 */
export default function CalendarPage() {
  const t = useTranslations()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const { data: bookingsData, isLoading } = useDashboardBookings()

  // Convert bookings to FullCalendar events
  const events = (bookingsData?.data || []).map((booking) => ({
    id: booking.id,
    title: `${booking.customer?.name} - ${booking.service?.name}`,
    start: booking.starts_at,
    end: booking.ends_at,
    backgroundColor:
      booking.status === 'confirmed'
        ? 'var(--color-confirmed)'
        : booking.status === 'completed'
          ? 'var(--color-completed)'
          : booking.status === 'no_show'
            ? 'var(--color-no-show)'
            : 'var(--color-cancelled)',
    extendedProps: {
      booking,
    },
  }))

  /**
   * Handles clicking a calendar event by setting the selected booking
   * for display in the side panel.
   */
  const handleEventClick = useCallback(
    (info: any) => {
      setSelectedBooking(info.event.extendedProps.booking)
    },
    [],
  )

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t('nav.calendar')}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 neu-card p-4">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              resourceTimeGridPlugin,
              interactionPlugin,
            ]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            locale="ar"
            direction="rtl"
          />
        </div>

        {selectedBooking && (
          <div className="neu-card p-4">
            <h2 className="mb-4 text-lg font-semibold text-primary">
              {t('common.details')}
            </h2>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-text-secondary">
                  {t('common.customer')}
                </div>
                <div className="font-medium">{selectedBooking.customer?.name}</div>
              </div>

              <div>
                <div className="text-sm text-text-secondary">
                  {t('common.service')}
                </div>
                <div className="font-medium">{selectedBooking.service?.name}</div>
              </div>

              <div>
                <div className="text-sm text-text-secondary">
                  {t('common.staff')}
                </div>
                <div className="font-medium">{selectedBooking.staff?.name}</div>
              </div>

              <div>
                <div className="text-sm text-text-secondary">
                  {t('common.status')}
                </div>
                <div className={`font-medium capitalize text-${selectedBooking.status}`}>
                  {t(`status.${selectedBooking.status}`)}
                </div>
              </div>

              <div>
                <div className="text-sm text-text-secondary">
                  {t('common.time')}
                </div>
                <div className="font-medium">
                  {new Date(selectedBooking.starts_at).toLocaleString('ar-EG')}
                </div>
              </div>

              <button className="w-full mt-4 neu-btn-primary">
                {t('common.edit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Page 2: `src/app/[locale]/(dashboard)/bookings/page.tsx`

Bookings list with filters and actions:

```typescript
'use client'

import { useState } from 'react'
import { useDashboardBookings, useUpdateBookingStatus, useDeleteBooking } from '@/features/bookings/hooks/useDashboardBookings'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'

/**
 * Bookings management page with a filterable, paginated table.
 * Supports filtering by status, performing status updates (complete, no-show),
 * and deleting bookings. Includes a create booking button.
 */
export default function BookingsPage() {
  const t = useTranslations()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: bookingsData, isLoading } = useDashboardBookings({
    page,
    status: statusFilter || undefined,
  })

  const updateStatus = useUpdateBookingStatus()
  const deleteBooking = useDeleteBooking()

  /**
   * Triggers a booking status update mutation.
   *
   * @param id - The UUID of the booking to update.
   * @param status - The new status to apply.
   */
  const handleStatusChange = (id: string, status: 'completed' | 'no_show' | 'cancelled') => {
    updateStatus.mutate({ id, status })
  }

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.bookings')}</h1>
        <Link href="/ar/dashboard/bookings/create">
          <Button variant="primary">{t('common.create')}</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="neu-card flex gap-2 flex-wrap p-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`neu-btn px-4 py-2 ${
            !statusFilter ? 'neu-slot-selected' : ''
          }`}
        >
          {t('common.all')}
        </button>
        {['confirmed', 'completed', 'no_show', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`neu-btn px-4 py-2 ${
              statusFilter === status ? 'neu-slot-selected' : ''
            }`}
          >
            {t(`status.${status}`)}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="neu-card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-text-muted">
            <tr>
              <th className="text-right p-4 font-semibold">{t('common.customer')}</th>
              <th className="text-right p-4 font-semibold">{t('common.service')}</th>
              <th className="text-right p-4 font-semibold">{t('common.time')}</th>
              <th className="text-right p-4 font-semibold">{t('common.status')}</th>
              <th className="text-right p-4 font-semibold">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bookingsData?.data.map((booking) => (
              <tr key={booking.id} className="border-b border-text-muted hover:bg-surface-alt">
                <td className="p-4">{booking.customer?.name}</td>
                <td className="p-4">{booking.service?.name}</td>
                <td className="p-4">
                  {new Date(booking.starts_at).toLocaleString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-4">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="p-4 space-x-2">
                  <Link href={`/ar/dashboard/bookings/${booking.id}`}>
                    <Button size="sm" variant="default">
                      {t('common.view')}
                    </Button>
                  </Link>
                  {booking.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(booking.id, 'completed')
                        }
                        disabled={updateStatus.isPending}
                      >
                        {t('status.completed')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(booking.id, 'no_show')
                        }
                        disabled={updateStatus.isPending}
                      >
                        {t('status.no_show')}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteBooking.mutate(booking.id)}
                    disabled={deleteBooking.isPending}
                  >
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {bookingsData && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: bookingsData.meta.last_page }, (_, i) => i + 1).map(
            (p) => (
              <Button
                key={p}
                variant={page === p ? 'primary' : 'default'}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
```

### Page 3: `src/app/[locale]/(dashboard)/bookings/[id]/page.tsx`

Booking detail view:

```typescript
'use client'

import { useBookingDetail, useUpdateBookingStatus } from '@/features/bookings/hooks/useDashboardBookings'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge'

/** Props for the booking detail page route. */
interface BookingDetailPageProps {
  params: {
    /** The UUID of the booking to display */
    id: string
  }
}

/**
 * Booking detail page showing customer info, booking details,
 * and status management actions (complete, no-show, cancel).
 */
export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const t = useTranslations()
  const { data: booking, isLoading } = useBookingDetail(params.id)
  const updateStatus = useUpdateBookingStatus()

  if (isLoading) return <div>جاري التحميل...</div>
  if (!booking) return <div>{t('common.not_found')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">
        {t('common.booking')} #{booking.id.slice(0, 8)}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="neu-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('common.customer')}</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-text-secondary">{t('common.name')}:</span>
                <div className="font-medium">{booking.customer?.name}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">{t('common.phone')}:</span>
                <div className="font-medium">{booking.customer?.phone}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.visits')}:
                </span>
                <div className="font-medium">{booking.customer?.visit_count}</div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="neu-card p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {t('common.details')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.service')}:
                </span>
                <div className="font-medium">{booking.service?.name}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.staff')}:
                </span>
                <div className="font-medium">{booking.staff?.name}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.starts_at')}:
                </span>
                <div className="font-medium">
                  {new Date(booking.starts_at).toLocaleString('ar-EG')}
                </div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.ends_at')}:
                </span>
                <div className="font-medium">
                  {new Date(booking.ends_at).toLocaleString('ar-EG')}
                </div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">
                  {t('common.branch')}:
                </span>
                <div className="font-medium">{booking.branch?.name}</div>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-text-muted">
                <span className="text-sm text-text-secondary">
                  {t('common.notes')}:
                </span>
                <div className="mt-2 text-text-secondary">{booking.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="neu-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('common.status')}</h2>
          <BookingStatusBadge status={booking.status} />

          <div className="mt-6 space-y-2">
            {booking.status === 'confirmed' && (
              <>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() =>
                    updateStatus.mutate({ id: booking.id, status: 'completed' })
                  }
                  disabled={updateStatus.isPending}
                >
                  {t('status.completed')}
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() =>
                    updateStatus.mutate({ id: booking.id, status: 'no_show' })
                  }
                  disabled={updateStatus.isPending}
                >
                  {t('status.no_show')}
                </Button>
              </>
            )}
            {booking.status !== 'cancelled' && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() =>
                  updateStatus.mutate({ id: booking.id, status: 'cancelled' })
                }
                disabled={updateStatus.isPending}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Page 4: `src/app/[locale]/(dashboard)/staff/page.tsx`

Staff list and management:

```typescript
'use client'

import { useState } from 'react'
import { useStaffList, useDeleteStaff } from '@/features/staff/hooks/useStaff'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { StaffModal } from '@/components/dashboard/StaffModal'

/**
 * Staff management page displaying a grid of staff members with
 * options to edit or delete each. Includes a modal for adding new staff.
 */
export default function StaffPage() {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: staffData, isLoading } = useStaffList()
  const deleteStaff = useDeleteStaff()

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.staff')}</h1>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t('common.add')} {t('nav.staff')}
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffData?.data.map((staff) => (
          <div key={staff.id} className="neu-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">{staff.name}</h3>
                <div className="text-sm text-text-secondary">
                  {staff.services?.length || 0} {t('nav.services')}
                </div>
              </div>
              {staff.photo_url && (
                <img
                  src={staff.photo_url}
                  alt={staff.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
            </div>

            <div className="mt-4 space-y-2">
              <Link href={`/ar/dashboard/staff/${staff.id}`}>
                <Button variant="default" className="w-full" size="sm">
                  {t('common.edit')}
                </Button>
              </Link>
              <Button
                variant="danger"
                className="w-full"
                size="sm"
                onClick={() => deleteStaff.mutate(staff.id)}
                disabled={deleteStaff.isPending}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
```

### Page 5: `src/app/[locale]/(dashboard)/staff/[id]/page.tsx`

Edit staff details:

```typescript
'use client'

import { useStaffDetail, useUpdateStaff, useUpdateStaffWorkingHours } from '@/features/staff/hooks/useStaff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor'

/** Props for the staff detail page route. */
interface StaffDetailPageProps {
  params: {
    /** The UUID of the staff member to edit */
    id: string
  }
}

/**
 * Staff detail/edit page showing basic info fields and a working hours editor.
 * Allows updating the staff name and managing their weekly schedule.
 */
export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const t = useTranslations()
  const { data: staff, isLoading } = useStaffDetail(params.id)
  const updateStaff = useUpdateStaff()
  const updateWorkingHours = useUpdateStaffWorkingHours()

  const [name, setName] = useState('')

  if (isLoading) return <div>جاري التحميل...</div>
  if (!staff) return <div>{t('common.not_found')}</div>

  /** Saves the updated staff name via the update mutation. */
  const handleSave = () => {
    updateStaff.mutate({ id: staff.id, name })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{staff.name}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="lg:col-span-2 neu-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('common.details')}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary">{t('common.name')}</label>
              <Input
                value={name || staff.name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={updateStaff.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Working Hours */}
        <div className="neu-card p-6">
          <WorkingHoursEditor
            staffId={staff.id}
            onUpdate={(hours) =>
              updateWorkingHours.mutate({
                id: staff.id,
                working_hours: hours,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
```

### Page 6: `src/app/[locale]/(dashboard)/branches/page.tsx`

Branches list:

```typescript
'use client'

import { useState } from 'react'
import { useBranchesList, useDeleteBranch } from '@/features/branches/hooks/useBranches'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { BranchModal } from '@/components/dashboard/BranchModal'

/**
 * Branches management page listing all branches with edit and delete actions.
 * Includes a modal for creating new branches.
 */
export default function BranchesPage() {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: branchesData, isLoading } = useBranchesList()
  const deleteBranch = useDeleteBranch()

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.branches')}</h1>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t('common.add')} {t('nav.branches')}
        </Button>
      </div>

      {/* Branches List */}
      <div className="space-y-3">
        {branchesData?.data.map((branch) => (
          <div key={branch.id} className="neu-card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-primary">{branch.name}</h3>
              <div className="text-sm text-text-secondary">{branch.address}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/ar/dashboard/branches/${branch.id}`}>
                <Button variant="default" size="sm">
                  {t('common.edit')}
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteBranch.mutate(branch.id)}
                disabled={deleteBranch.isPending}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
```

### Page 7: `src/app/[locale]/(dashboard)/customers/page.tsx`

Customers list:

```typescript
'use client'

import { useState } from 'react'
import { useCustomersList } from '@/features/customers/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

/**
 * Customers list page with a paginated table showing name, phone,
 * visit count, and last visit date. Includes a view action for each customer.
 */
export default function CustomersPage() {
  const t = useTranslations()
  const [page, setPage] = useState(1)
  const { data: customersData, isLoading } = useCustomersList({ page })

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t('nav.customers')}</h1>

      {/* Customers Table */}
      <div className="neu-card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-text-muted">
            <tr>
              <th className="text-right p-4 font-semibold">{t('common.name')}</th>
              <th className="text-right p-4 font-semibold">{t('common.phone')}</th>
              <th className="text-right p-4 font-semibold">
                {t('common.visits')}
              </th>
              <th className="text-right p-4 font-semibold">
                {t('common.last_visit')}
              </th>
              <th className="text-right p-4 font-semibold">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {customersData?.data.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-text-muted hover:bg-surface-alt"
              >
                <td className="p-4">{customer.name}</td>
                <td className="p-4">{customer.phone}</td>
                <td className="p-4">{customer.visit_count}</td>
                <td className="p-4">
                  {customer.last_visit_at
                    ? new Date(customer.last_visit_at).toLocaleDateString('ar-EG')
                    : '-'}
                </td>
                <td className="p-4">
                  <Link href={`/ar/dashboard/customers/${customer.id}`}>
                    <Button size="sm" variant="default">
                      {t('common.view')}
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {customersData && (
        <div className="flex justify-center gap-2">
          {Array.from(
            { length: customersData.meta.last_page },
            (_, i) => i + 1,
          ).map((p) => (
            <Button
              key={p}
              variant={page === p ? 'primary' : 'default'}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Page 8: `src/app/[locale]/(dashboard)/services/page.tsx`

Services management:

```typescript
'use client'

import { useState } from 'react'
import { useServicesList, useDeleteService } from '@/features/services/hooks/useServices'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ServiceModal } from '@/components/dashboard/ServiceModal'

/**
 * Services management page displaying a grid of services with
 * duration and price info. Includes edit, delete, and create actions.
 */
export default function ServicesPage() {
  const t = useTranslations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: servicesData, isLoading } = useServicesList()
  const deleteService = useDeleteService()

  if (isLoading) return <div>جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">{t('nav.services')}</h1>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          {t('common.add')} {t('nav.services')}
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {servicesData?.data.map((service) => (
          <div key={service.id} className="neu-card p-4">
            <h3 className="font-semibold text-primary">{service.name}</h3>
            <div className="mt-2 space-y-1 text-sm text-text-secondary">
              <div>{service.duration_minutes} {t('common.minutes')}</div>
              <div>{service.price} ج.م</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/ar/dashboard/services/${service.id}`} className="flex-1">
                <Button variant="default" className="w-full" size="sm">
                  {t('common.edit')}
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteService.mutate(service.id)}
                disabled={deleteService.isPending}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
```

---

## Part 3: Modal & Form Components

### Component 1: `src/components/dashboard/StaffModal.tsx`

Create/edit staff:

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateStaff } from '@/features/staff/hooks/useStaff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslations } from 'next-intl'

/** Zod validation schema for the staff creation form. */
const staffSchema = z.object({
  name: z.string().min(2, 'الاسم قصير جداً'),
  branch_id: z.string().uuid('معرف الفرع غير صحيح'),
})

/** Props for the StaffModal component. */
interface StaffModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when the modal is closed */
  onClose: () => void
}

/**
 * Modal component for creating a new staff member.
 * Includes a form with name and branch selection fields,
 * with Zod validation and API integration.
 */
export function StaffModal({ isOpen, onClose }: StaffModalProps) {
  const t = useTranslations()
  const createStaff = useCreateStaff()
  const form = useForm({
    resolver: zodResolver(staffSchema),
  })

  const onSubmit = async (data: z.infer<typeof staffSchema>) => {
    await createStaff.mutateAsync(data)
    form.reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold text-primary">
        {t('common.add')} {t('nav.staff')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          placeholder={t('common.name')}
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />

        <select
          className="w-full neu-input"
          {...form.register('branch_id')}
        >
          <option value="">{t('common.select_branch')}</option>
          {/* Load branches from API */}
        </select>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={createStaff.isPending}
          >
            {t('common.save')}
          </Button>
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

### Component 2: `src/components/dashboard/BranchModal.tsx`

Create/edit branch:

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { branchSchema } from '@/lib/validations'
import { useCreateBranch } from '@/features/branches/hooks/useBranches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslations } from 'next-intl'

/** Props for the BranchModal component. */
interface BranchModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when the modal is closed */
  onClose: () => void
}

/**
 * Modal component for creating a new branch.
 * Includes form fields for name, address, city, WhatsApp number, and slug,
 * with Zod validation and API integration.
 */
export function BranchModal({ isOpen, onClose }: BranchModalProps) {
  const t = useTranslations()
  const createBranch = useCreateBranch()
  const form = useForm({
    resolver: zodResolver(branchSchema),
  })

  const onSubmit = async (data: any) => {
    await createBranch.mutateAsync(data)
    form.reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold text-primary">
        {t('common.add')} {t('nav.branches')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          placeholder={t('common.name')}
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />

        <Input
          placeholder={t('common.address')}
          {...form.register('address')}
          error={form.formState.errors.address?.message}
        />

        <Input
          placeholder={t('common.city')}
          {...form.register('city')}
          error={form.formState.errors.city?.message}
        />

        <Input
          placeholder={t('common.whatsapp')}
          {...form.register('whatsapp_number')}
          error={form.formState.errors.whatsapp_number?.message}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={createBranch.isPending}
          >
            {t('common.save')}
          </Button>
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

### Component 3: `src/components/dashboard/ServiceModal.tsx`

Create/edit service:

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { useCreateService } from '@/features/services/hooks/useServices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useTranslations } from 'next-intl'

/** Props for the ServiceModal component. */
interface ServiceModalProps {
  /** Whether the modal is visible */
  isOpen: boolean
  /** Callback fired when the modal is closed */
  onClose: () => void
}

/**
 * Modal component for creating a new service.
 * Includes form fields for name, duration, and price,
 * with API integration for creation.
 */
export function ServiceModal({ isOpen, onClose }: ServiceModalProps) {
  const t = useTranslations()
  const createService = useCreateService()
  const form = useForm()

  const onSubmit = async (data: any) => {
    await createService.mutateAsync(data)
    form.reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold text-primary">
        {t('common.add')} {t('nav.services')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          placeholder={t('common.name')}
          {...form.register('name')}
        />

        <Input
          type="number"
          placeholder={t('common.duration')}
          {...form.register('duration_minutes')}
        />

        <Input
          type="number"
          placeholder={t('common.price')}
          {...form.register('price')}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={createService.isPending}
          >
            {t('common.save')}
          </Button>
          <Button
            type="button"
            variant="default"
            className="flex-1"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

---

## Part 4: Helper Components

### Component: `src/components/bookings/BookingStatusBadge.tsx`

```typescript
'use client'

import { useTranslations } from 'next-intl'

/** Props for the BookingStatusBadge component. */
interface BookingStatusBadgeProps {
  /** The booking status to display */
  status: 'confirmed' | 'completed' | 'no_show' | 'cancelled'
}

/**
 * Badge component that displays a booking status with appropriate
 * color coding (green for confirmed, blue for completed, etc.).
 */
export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const t = useTranslations()

  const colorMap = {
    confirmed: 'bg-confirmed/10 text-confirmed',
    completed: 'bg-completed/10 text-completed',
    no_show: 'bg-no-show/10 text-no-show',
    cancelled: 'bg-cancelled/10 text-cancelled',
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colorMap[status]}`}>
      {t(`status.${status}`)}
    </span>
  )
}
```

### Component: `src/components/dashboard/WorkingHoursEditor.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'

/** Props for the WorkingHoursEditor component. */
interface WorkingHoursEditorProps {
  /** The UUID of the staff member to edit hours for */
  staffId: string
  /** Callback fired with the formatted working hours array when saved */
  onUpdate: (hours: Array<{ weekday: number; start_time?: string; end_time?: string }>) => void
}

/** Days of the week (Sunday=0 to Saturday=6) with Arabic labels. */
const WEEKDAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
]

/**
 * Component for editing a staff member's weekly working hours.
 * Displays time inputs for each day of the week (Sunday-Saturday)
 * and formats the data for API submission on save.
 */
export function WorkingHoursEditor({ staffId, onUpdate }: WorkingHoursEditorProps) {
  const t = useTranslations()
  const [hours, setHours] = useState<Record<number, { start?: string; end?: string }>>({})

  /**
   * Updates the local state when a time input changes.
   *
   * @param weekday - The day index (0-6).
   * @param field - Whether this is the start or end time.
   * @param value - The new time value (HH:MM).
   */
  const handleChange = (weekday: number, field: 'start' | 'end', value: string) => {
    setHours((prev) => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [field]: value,
      },
    }))
  }

  /** Formats the local hours state and passes it to the parent callback. */
  const handleSave = () => {
    const formatted = Object.entries(hours).map(([weekday, times]) => ({
      weekday: parseInt(weekday),
      start_time: times.start,
      end_time: times.end,
    }))
    onUpdate(formatted)
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{t('common.working_hours')}</h3>
      {WEEKDAYS.map((day) => (
        <div key={day.value} className="space-y-1">
          <label className="text-sm text-text-secondary">{day.label}</label>
          <div className="flex gap-2">
            <Input
              type="time"
              value={hours[day.value]?.start || ''}
              onChange={(e) => handleChange(day.value, 'start', e.target.value)}
              placeholder="09:00"
            />
            <Input
              type="time"
              value={hours[day.value]?.end || ''}
              onChange={(e) => handleChange(day.value, 'end', e.target.value)}
              placeholder="18:00"
            />
          </div>
        </div>
      ))}
      <Button variant="primary" className="w-full mt-4" onClick={handleSave}>
        {t('common.save')}
      </Button>
    </div>
  )
}
```

---

## Part 5: Layout Components

### Component: `src/components/layout/Sidebar.tsx`

Dashboard sidebar navigation:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useUiStore } from '@/store/ui'
import { Button } from '@/components/ui/button'

const MENU_ITEMS = [
  { href: '/ar/dashboard', icon: '📊', label: 'nav.dashboard' },
  { href: '/ar/dashboard/calendar', icon: '📅', label: 'nav.calendar' },
  { href: '/ar/dashboard/bookings', icon: '📋', label: 'nav.bookings' },
  { href: '/ar/dashboard/customers', icon: '👥', label: 'nav.customers' },
  { href: '/ar/dashboard/staff', icon: '💇', label: 'nav.staff' },
  { href: '/ar/dashboard/services', icon: '✂️', label: 'nav.services' },
  { href: '/ar/dashboard/branches', icon: '🏢', label: 'nav.branches' },
  { href: '/ar/dashboard/settings', icon: '⚙️', label: 'nav.settings' },
]

/**
 * Dashboard sidebar navigation component.
 * Displays menu items for all dashboard sections with active state highlighting.
 * Responsive — hidden on mobile unless toggled via the hamburger button.
 */
export function Sidebar() {
  const t = useTranslations()
  const pathname = usePathname()
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-64 bg-bg neu-card transform transition-transform ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:relative lg:translate-x-0`}
    >
      <div className="flex flex-col h-full p-4">
        <h1 className="mb-8 text-2xl font-bold text-primary">Barber SaaS</h1>

        <nav className="space-y-2 flex-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname.includes(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <span className="mr-2">{item.icon}</span>
                  {t(item.label)}
                </Button>
              </Link>
            )
          })}
        </nav>

        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            // Logout logic
          }}
        >
          {t('auth.logout')}
        </Button>
      </div>
    </aside>
  )
}
```

### Component: `src/components/layout/TopBar.tsx`

Dashboard top navigation:

```typescript
'use client'

import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

/**
 * Dashboard top bar component displaying the current user's name,
 * business name, and avatar. Includes a mobile hamburger menu toggle.
 */
export function TopBar() {
  const t = useTranslations()
  const user = useAuthStore((s) => s.user)
  const business = useAuthStore((s) => s.business)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <div className="h-16 neu-card border-b border-text-muted flex items-center justify-between px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="lg:hidden"
      >
        ☰
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold text-primary">{user?.name}</div>
          <div className="text-xs text-text-secondary">{business?.name}</div>
        </div>

        <div className="w-10 h-10 rounded-full bg-primary/10 neu-card flex items-center justify-center">
          {user?.name.charAt(0)}
        </div>
      </div>
    </div>
  )
}
```

---

## Part 6: Data Caching Strategy

### File: `src/services/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query client configured with sensible defaults for the dashboard:
 * - 5-minute stale time to reduce redundant fetches
 * - 10-minute garbage collection for cached data
 * - Single retry for failed queries and mutations
 * - Window refocus refetching disabled
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

---

## Part 7: Implementation Checklist

### Phase 5 Hooks (API Integration)
- [x] `useDashboardBookings` — list, detail, update status, delete
- [x] `useStaff` — list, detail, create, update, delete, working hours
- [x] `useBranches` — list, detail, create, update, delete, working hours
- [x] `useCustomers` — list, detail, bookings history
- [x] `useServices` — list, detail, create, update, delete

### Dashboard Pages
- [x] `calendar/page.tsx` — FullCalendar integration
- [x] `bookings/page.tsx` — list with filters
- [x] `bookings/[id]/page.tsx` — detail and actions
- [x] `staff/page.tsx` — staff list
- [x] `staff/[id]/page.tsx` — staff detail and edit
- [x] `branches/page.tsx` — branches list
- [x] `customers/page.tsx` — customers list
- [ ] `customers/[id]/page.tsx` — customer detail (optional Phase 5.5)
- [x] `services/page.tsx` — services list
- [ ] `services/[id]/page.tsx` — service edit (optional)
- [ ] `settings/page.tsx` — business settings

### Modals & Forms
- [x] `StaffModal` — create/edit
- [x] `BranchModal` — create/edit
- [x] `ServiceModal` — create/edit
- [ ] `BookingModal` — create manual booking
- [x] `WorkingHoursEditor` — edit hours

### Layout Components
- [x] `Sidebar` — navigation
- [x] `TopBar` — user info
- [x] `BookingStatusBadge` — status display

### Styling & UX
- [ ] Verify Neumorphism on all dashboard cards
- [ ] Test responsive layout (mobile → desktop)
- [ ] Test loading states (spinners on buttons)
- [ ] Test error states (toast messages)
- [ ] Test pagination (bookings, customers)
- [ ] Test filters (status, date range)

### API Integration
- [x] All endpoints called via custom hooks
- [x] Request/response fully typed
- [ ] Error handling with toasts
- [x] Loading states on buttons/forms
- [x] Query invalidation on mutations
- [ ] Optimistic updates (optional Phase 5.5)

### Testing
- [ ] Manual test: View calendar (load bookings)
- [ ] Manual test: Create booking (updates list)
- [ ] Manual test: Update booking status
- [ ] Manual test: Create staff (appears in list)
- [ ] Manual test: Edit staff working hours
- [ ] Manual test: Create branch
- [ ] Manual test: Create service
- [ ] Manual test: Filter bookings by status
- [ ] Manual test: Pagination works
- [ ] Manual test: Error handling (invalid input)

---

## After Phase 5

You will have:
✅ **Full dashboard functionality**
✅ **Complete API integration**
✅ **Real-time data with TanStack Query**
✅ **All CRUD operations working**
✅ **Calendar view operational**
✅ **Staff management**
✅ **Branch management**
✅ **Service management**
✅ **Customer insights**

Ready for **Phase 6**: Staff/Customer frontend + settings pages