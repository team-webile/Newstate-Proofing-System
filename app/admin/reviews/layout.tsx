import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reviews | Proofing System',
  description: 'View your reviews in your proofing system.',
}

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
