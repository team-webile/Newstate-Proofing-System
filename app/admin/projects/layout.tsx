import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects | Proofing System',
  description: 'View your projects in your proofing system.',
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
