import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Archives | Proofing System',
  description: 'View your archived projects in your proofing system.',
}

export default function ArchivesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
