'use client'

import Image from 'next/image'
import { useLogo } from '@/contexts/LogoContext'

interface LogoImageProps {
  alt?: string
  width?: number
  height?: number
  className?: string
  href?: string
}

export default function LogoImage({ 
  alt = "Newstate Branding Co.", 
  width = 180, 
  height = 50, 
  className = "h-12 w-auto",
  href 
}: LogoImageProps) {
  const { logoUrl } = useLogo()

  const logoElement = (
    <Image
      src='https://newstatebranding.b-cdn.net/nsb-logo.png'
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={true}
    />
  )

  if (href) {
    return (
      <a href={href} className="block">
        {logoElement}
      </a>
    )
  }

  return logoElement
}
