import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Project | Proofing System',
  description: 'Create a new project in your proofing system.',
}

export default function NewProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
