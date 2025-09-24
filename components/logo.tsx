import Image from "next/image"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto",
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/images/nsb-logo.png"
        alt="NewState Branding Co."
        width={40}
        height={40}
        className={sizeClasses[size]}
      />
      <span className="text-xl font-bold text-foreground">
        NEWSTATE
        <span className="block text-xs font-normal text-muted-foreground tracking-wider">BRANDING CO.</span>
      </span>
    </div>
  )
}
