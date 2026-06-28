import { api } from '@/services/api'
import { Branch, Service } from '@/types'
import { BookingForm } from '@/components/forms/BookingForm'

/** Props for the booking page route. */
interface BookingPageProps {
  params: Promise<{ locale: string; businessSlug: string; branchSlug: string }>
}

/**
 * Server-side rendered booking page that fetches branch details and
 * services for the given business and branch slugs.
 * Renders the BookingForm component with the fetched services.
 */
export default async function BookingPage({ params }: BookingPageProps) {
  const { businessSlug, branchSlug } = await params

  const branchResponse = await api.get<{ data: Branch }>(
    `/public/business/${businessSlug}/branches/${branchSlug}`,
  )
  const branch = branchResponse.data.data

  const servicesResponse = await api.get<{ data: Service[] }>(
    `/public/branches/${branch.id}/services`,
  )
  const services = servicesResponse.data.data

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">{branch.name}</h1>
          <p className="text-sm text-text-secondary mt-1">{branch.address}</p>
        </div>
        <BookingForm branch={branch} services={services} />
      </div>
    </div>
  )
}
