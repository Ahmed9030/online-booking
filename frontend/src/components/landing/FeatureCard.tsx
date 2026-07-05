'use client'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
  delay?: number
}

/**
 * Animated feature card for the landing page features showcase.
 * Displays an icon, title, and description with a staggered fade-in-up animation.
 *
 * @param icon - Emoji or icon string to display at the top of the card.
 * @param title - The feature title text.
 * @param description - A short description of the feature.
 * @param delay - Animation delay in seconds for staggered entrance (default 0).
 */
export function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: FeatureCardProps) {
  return (
    <div
      className="neu-card p-6 hover:neu-card-hover transition-all transform hover:scale-105 animate-fade-in-up"
      style={{
        animationDelay: `${delay}s`,
        animationFillMode: 'both',
      }}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}
