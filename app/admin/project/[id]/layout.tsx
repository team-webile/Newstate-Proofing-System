import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Project Details | Proofing System',
  description: 'View a project in your proofing system.',
}

export default function ProjectDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
