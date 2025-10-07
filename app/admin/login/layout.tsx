import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Proofing System',
  description: 'Login to your proofing system to manage your projects, reviews, and settings.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
