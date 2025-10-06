"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"

export function NewProjectForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    projectNumber: "",
    name: "",
    description: "",
    clientEmail: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const project = await response.json()
        router.push(`/admin/project/${project.id}`)
      }
    } catch (error) {
      console.error("[v0] Error creating project:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-neutral-900 rounded-lg p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Pencil className="w-6 h-6 text-neutral-400" />
          <h1 className="text-3xl font-bold">NAME PROJECT</h1>
        </div>
        <div className="flex items-center gap-3 text-neutral-400">
          <Pencil className="w-5 h-5" />
          <p>ADD PROJECT DESCRIPTION OR MESSAGE TO CLIENTS.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="projectNumber" className="block text-sm font-medium mb-2">
            Project Number *
          </label>
          <input
            type="text"
            id="projectNumber"
            required
            value={formData.projectNumber}
            onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
            placeholder="e.g., 16994"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Project Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Atlantic Spa"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description / Message to Client
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add any notes or instructions for the client..."
            rows={4}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
          />
        </div>

        <div>
          <label htmlFor="clientEmail" className="block text-sm font-medium mb-2">
            Client Email (Optional)
          </label>
          <input
            type="email"
            id="clientEmail"
            value={formData.clientEmail}
            onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            placeholder="client@example.com"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-brand-yellow text-black font-semibold rounded hover:bg-brand-yellow-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-neutral-800 text-white font-semibold rounded hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
