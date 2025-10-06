"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CopyLinkButtonProps {
  shareLink: string
  variant?: "default" | "small" | "large"
  showUrl?: boolean
}

export function CopyLinkButton({ shareLink, variant = "default", showUrl = false }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/review/${shareLink}`
    : `http://localhost:3000/review/${shareLink}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (variant === "small") {
    return (
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700 transition-colors flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-green-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </button>
    )
  }

  if (variant === "large") {
    return (
      <div className="flex items-center gap-3">
        {showUrl && (
          <input
            type="text"
            value={fullUrl}
            readOnly
            className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 text-sm w-80"
          />
        )}
        <button
          onClick={handleCopy}
          className="px-6 py-2.5 bg-transparent border-2 border-white text-white font-bold rounded hover:bg-white hover:text-black transition-all uppercase tracking-wide text-sm flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    )
  }

  // Default variant
  return (
    <div className="flex items-center gap-2">
      {showUrl && (
        <input
          type="text"
          value={fullUrl}
          readOnly
          className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 text-sm w-64"
        />
      )}
      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy Link</span>
          </>
        )}
      </button>
    </div>
  )
}

