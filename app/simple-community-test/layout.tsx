import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simple Community Test',
  description: 'Simple test page for community messaging',
}

export default function SimpleCommunityTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  )
}
