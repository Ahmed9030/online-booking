import { ReactNode } from 'react'

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      {children}
    </div>
  )
}
