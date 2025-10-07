import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Project | Proofing System',
  description: 'Edit a project in your proofing system.',
}

export default function EditProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
