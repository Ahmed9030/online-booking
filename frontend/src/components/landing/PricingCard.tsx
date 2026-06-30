'use client'

import { Button } from '@/components/ui/button'

interface PricingCardProps {
  name: string
  price: string
  duration: string
  features: string[]
  highlighted?: boolean
}

/**
 * Pricing plan card for the landing page pricing section.
 * Displays the plan name, price, duration, feature list, and a CTA button.
 * Optionally renders with a highlighted border for the recommended plan.
 *
 * @param name - The plan name (e.g. "Professional").
 * @param price - The price string (e.g. "100 ج.م" or "Free").
 * @param duration - The billing period (e.g. "monthly" or "14 days").
 * @param features - Array of feature strings to display as a checklist.
 * @param highlighted - When true, renders with a primary border highlight.
 */
export function PricingCard({
  name,
  price,
  duration,
  features,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={`neu-card p-8 transition-all transform hover:scale-105 ${
        highlighted ? 'neu-card-highlighted border-2 border-primary' : ''
      }`}
    >
      <h3 className="text-2xl font-bold text-primary mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-primary">{price}</span>
        <span className="text-text-secondary"> / {duration}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="text-accent">✓</span>
            <span className="text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={highlighted ? 'primary' : 'default'}
        className="w-full"
      >
        Start Now
      </Button>
    </div>
  )
}
