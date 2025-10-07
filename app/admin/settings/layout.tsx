import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | Proofing System',
  description: 'Manage your proofing system settings.',
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
