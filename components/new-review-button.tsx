"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface NewReviewButtonProps {
  projectId: number
  variant?: "default" | "large"
}

export function NewReviewButton({ projectId, variant = "default" }: NewReviewButtonProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateReview = async () => {
    setIsCreating(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error creating review:", error)
    } finally {
      setIsCreating(false)
    }
  }

  if (variant === "large") {
    return (
      <button
        onClick={handleCreateReview}
        disabled={isCreating}
        className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-[#fdb913] text-[#fdb913] font-bold rounded hover:bg-[#fdb913] hover:text-black transition-all disabled:opacity-50 uppercase tracking-wide"
      >
        <Plus className="w-5 h-5" />
        {isCreating ? "Creating..." : "New Review"}
      </button>
    )
  }

  return (
    <button
      onClick={handleCreateReview}
      disabled={isCreating}
      className="flex items-center gap-2 px-6 py-2.5 bg-transparent border-2 border-[#fdb913] text-[#fdb913] font-bold rounded hover:bg-[#fdb913] hover:text-black transition-all disabled:opacity-50 uppercase tracking-wide text-sm"
    >
      <Plus className="w-4 h-4" />
      {isCreating ? "Creating..." : "New Review"}
    </button>
  )
}
