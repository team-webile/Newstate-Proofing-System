'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import AdminLayout from '../../../components/AdminLayout'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
           
  const [formData, setFormData] = useState({
    projectNumber: "",
    name: "",
    description: "",
    clientEmail: "",
    downloadEnabled: false,
    archived: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const project = await response.json()
        setFormData({
          projectNumber: project.projectNumber || "",
          name: project.name || "",
          description: project.description || "",
          clientEmail: project.clientEmail || "",
          downloadEnabled: project.downloadEnabled || false,
          archived: project.archived || false,
        })
      } else {
        setError("Project not found")
      }
    } catch (error) {
      console.error("Error loading project:", error)
      setError("Failed to load project")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Project updated successfully!')
        router.push(`/admin/project/${projectId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update project")
        toast.error(errorData.error || "Failed to update project")
      }
    } catch (error) {
      console.error("Error updating project:", error)
      setError("Network error. Please try again.")
      toast.error("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Project Edit" description="Project Edit" icon={<Save className="h-8 w-8 text-brand-yellow" />}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-yellow border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xl text-gray-300">Loading Data...</p>
        </div>
      </div>
    </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Edit Project" description="Update project details" icon={<Save className="h-8 w-8 text-brand-yellow" />}>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/projects')}
            className="mb-4 border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-brand-yellow bg-neutral-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Project</h1>
          <p className="text-neutral-400">Update project information and settings</p>
        </div>

        {/* Form */}
        <Card className="bg-neutral-900 border-neutral-800 hover:border-brand-yellow/30 transition-colors">
          <CardHeader>
            <CardTitle className="text-white text-xl">Project Details</CardTitle>
            <CardDescription className="text-neutral-400">
              Update the project information below. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectNumber" className="text-neutral-300">
                    Project Number *
                  </Label>
                  <Input
                    id="projectNumber"
                    type="text"
                    required
                    value={formData.projectNumber}
                    onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
                    placeholder="e.g., 16994"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-300">
                    Project Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Atlantic Spa"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-neutral-300">
                  Description / Message to Client
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add any notes or instructions for the client..."
                  rows={4}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail" className="text-neutral-300">
                  Client Email 
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@example.com"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="downloadEnabled" className="text-neutral-300">
                    Download Enabled
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="downloadEnabled"
                      checked={formData.downloadEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, downloadEnabled: checked })}
                      className="data-[state=checked]:bg-brand-yellow"
                    />
                    <span className="text-sm text-neutral-400">
                      {formData.downloadEnabled ? 'Clients can download files' : 'Download disabled for clients'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="archived" className="text-neutral-300">
                    Archive Project
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="archived"
                      checked={formData.archived}
                      onCheckedChange={(checked) => setFormData({ ...formData, archived: checked })}
                      className="data-[state=checked]:bg-red-500"
                    />
                    <span className="text-sm text-neutral-400">
                      {formData.archived ? 'Project is archived' : 'Project is active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Project
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/projects')}
                  disabled={isSubmitting}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white bg-neutral-900"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}