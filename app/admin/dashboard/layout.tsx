import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Proofing System',
  description: 'Manage your proofing system efficiently with admin tools for projects, reviews, and settings.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
