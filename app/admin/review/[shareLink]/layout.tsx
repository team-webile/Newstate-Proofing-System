import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Review | Proofing System',
  description: 'View a review in your proofing system.',
}

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
