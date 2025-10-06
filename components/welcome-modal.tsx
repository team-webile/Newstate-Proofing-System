"use client"

import { useState } from "react"
import { User } from "lucide-react"
import Image from "next/image"

interface WelcomeModalProps {
  onSubmit: (name: string) => void
  projectName: string
}

export function WelcomeModal({ onSubmit, projectName }: WelcomeModalProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full border-2 border-[#fdb913] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#fdb913] to-orange-500 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome! 👋</h2>
          <p className="text-neutral-400 text-sm">
            You're reviewing: <span className="text-[#fdb913] font-semibold">{projectName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-neutral-300 text-sm font-semibold mb-3">
              Please enter your name to continue:
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 rounded-lg border-2 border-neutral-800 focus-within:border-[#fdb913] transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name..."
                className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-neutral-600"
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full px-6 py-4 bg-[#fdb913] text-black font-bold rounded-lg hover:bg-[#e5a711] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
          >
            Start Reviewing
          </button>

          <p className="text-xs text-neutral-500 text-center mt-4">
            Your name will be used to identify your comments and feedback
          </p>
        </form>
      </div>
    </div>
  )
}

