'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  FileText,
  Plus,
  Archive,
  Home, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useLogo } from '@/contexts/LogoContext'

interface AdminHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export default function AdminHeader({ title, description, icon }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logoUrl } = useLogo()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Since we're in admin area, user is admin
  const isAdmin = true

  const handleLogout = async () => {
    try {
      // Call logout endpoint to properly clear httpOnly cookie
      await fetch('/api/admin/logout', { method: 'POST' })
      
      // Redirect to login page
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navigationItems = [
    { path: '/admin/projects', label: 'Projects', icon: Home },
    { path: '/admin/projects', label: 'All Projects', icon: FileText },
    { path: '/admin/new-project', label: 'New Project', icon: Plus },
    { path: '/admin/archives', label: 'Archives', icon: Archive },
  ]

  return (
    <header className="border-b border-neutral-800 bg-black">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          {/* Mobile Header with Logo and Hamburger */}
          <div className="flex items-center justify-between">
            <Link href="/admin/projects" onClick={closeMobileMenu}>
              <Image
                src={logoUrl}
                alt="Newstate Branding Co."
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-white hover:text-brand-yellow transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <Link 
                href="/admin/projects" 
                onClick={closeMobileMenu}
                className="block text-white hover:text-brand-yellow transition-colors text-center py-3 px-4 bg-neutral-900 rounded-lg"
              >
                📊 Dashboard
              </Link>
              <Link 
                href="/admin/new-project" 
                onClick={closeMobileMenu}
                className="block text-white hover:text-brand-yellow transition-colors text-center py-3 px-4 bg-neutral-900 rounded-lg"
              >
                ➕ New Project
              </Link>
              <Link 
                href="/admin/archives" 
                onClick={closeMobileMenu}
                className="block text-neutral-400 hover:text-brand-yellow transition-colors text-center py-3 px-4 bg-neutral-900 rounded-lg"
              >
                📁 Archives
              </Link>
              <Link 
                href="/admin/settings" 
                onClick={closeMobileMenu}
                className="block text-neutral-400 hover:text-brand-yellow transition-colors text-center py-3 px-4 bg-neutral-900 rounded-lg"
              >
                ⚙️ Settings
              </Link>
              {isAdmin && (
                <button
                  onClick={() => {
                    closeMobileMenu()
                    handleLogout()
                  }}
                  className="w-full text-neutral-400 hover:text-brand-yellow transition-colors cursor-pointer flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <Link href="/admin/projects">
            <Image
              src={logoUrl}
              alt="Newstate Branding Co."
              width={200}
              height={60}
              className="h-10 lg:h-12 w-auto"
            />
          </Link>

          <nav className="flex items-center gap-4 lg:gap-6 text-sm">
            <Link href="/admin/projects" className="text-white hover:text-brand-yellow transition-colors">
              Dashboard
            </Link>
            <span className="text-neutral-600">|</span>
            <Link href="/admin/new-project" className="text-white hover:text-brand-yellow transition-colors">
              New Project
            </Link>
            <span className="text-neutral-600">|</span>
            <Link href="/admin/archives" className="text-neutral-400 hover:text-brand-yellow transition-colors">
              Archives
            </Link>
            <span className="text-neutral-600">|</span>
            <Link href="/admin/settings" className="text-neutral-400 hover:text-brand-yellow transition-colors">
              Settings
            </Link>
            <span className="text-neutral-600">|</span>
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="text-neutral-400 hover:text-brand-yellow transition-colors cursor-pointer flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
