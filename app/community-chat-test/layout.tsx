import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Chat Test',
  description: 'Test page for community messaging functionality',
}

export default function CommunityTestLayout({
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
