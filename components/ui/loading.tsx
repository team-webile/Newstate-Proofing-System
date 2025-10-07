import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
  fullScreen?: boolean
  variant?: "default" | "minimal" | "dots" | "pulse"
}

export function Loading({ 
  size = "md", 
  text = "Loading...", 
  className,
  fullScreen = false,
  variant = "default"
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  }

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
          </div>
        )
      
      case "pulse":
        return (
          <div className={cn("bg-yellow-500 rounded-full animate-pulse", sizeClasses[size])}></div>
        )
        
      case "minimal":
        return (
          <div className={cn("border-2 border-gray-300 border-t-yellow-500 rounded-full animate-spin", sizeClasses[size])}></div>
        )
        
      default:
        return (
          <div className={cn("border-2 border-gray-300 border-t-yellow-500 rounded-full animate-spin", sizeClasses[size])}></div>
        )
    }
  }

  const content = (
    <div className={cn("text-center", className)}>
      {renderSpinner()}
      {text && (
        <p className={cn("text-gray-400 mt-4", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

// Pre-configured loading components for common use cases
export function FullScreenLoading({ text = "Loading..." }: { text?: string }) {
  return <Loading fullScreen text={text} variant="default" />
}

export function InlineLoading({ text, size = "sm" }: { text?: string; size?: "sm" | "md" | "lg" }) {
  return <Loading text={text} size={size} variant="minimal" />
}

export function ButtonLoading({ size = "sm" }: { size?: "sm" | "md" }) {
  return <Loading size={size} variant="dots" className="text-yellow-500" />
}

export function PageLoading({ text = "Loading page..." }: { text?: string }) {
  return <Loading fullScreen text={text} size="lg" variant="default" />
}

export function CardLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loading text={text} size="md" variant="minimal" />
    </div>
  )
}
