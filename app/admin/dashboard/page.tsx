'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AdminLayout from '../components/AdminLayout'
import { Settings } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <AdminLayout title="Admin Dashboard" description="Proofing System Administration" icon={<Settings className="h-8 w-8 text-brand-yellow" />}>
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400">Welcome back! Manage your proofing system efficiently.</p>
        </div>

        <div className="space-y-8">

          {/* Welcome Card */}
          <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-xl">Welcome to Your Dashboard</CardTitle>
              <CardDescription className="text-neutral-400">
                You have successfully authenticated as an admin user.
                Use the tools below to manage your proofing system efficiently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/projects" className="p-6 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-brand-yellow/50 transition-colors group">
                  <h3 className="font-semibold text-brand-yellow group-hover:text-brand-yellow/90">Projects</h3>
                  <p className="text-sm text-neutral-400 mt-1">Manage design projects and client work</p>
                </Link>
                <Link href="/admin/reviews" className="p-6 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-green-500/50 transition-colors group">
                  <h3 className="font-semibold text-green-400 group-hover:text-green-300">Reviews</h3>
                  <p className="text-sm text-neutral-400 mt-1">Monitor client reviews and feedback</p>
                </Link>
                <Link href="/admin/settings" className="p-6 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-blue-500/50 transition-colors group">
                  <h3 className="font-semibold text-blue-400 group-hover:text-blue-300">Settings</h3>
                  <p className="text-sm text-neutral-400 mt-1">Configure system settings and preferences</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}