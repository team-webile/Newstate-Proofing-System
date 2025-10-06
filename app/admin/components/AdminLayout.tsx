'use client'

import { ReactNode } from 'react'
import AdminHeader from './AdminHeader'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  description?: string
  icon?: React.ReactNode
}

export default function AdminLayout({ children, title, description, icon }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <AdminHeader title={title} description={description} icon={icon} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
