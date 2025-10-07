'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FullScreenLoading } from '@/components/ui/loading'
import toast from 'react-hot-toast'
import LogoImage from '@/components/LogoImage'
import { Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin/projects'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()   
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })

      const data = await response.json()
      console.log(data, 'data')
      if (data.success) {
        toast.success('Login successful!')
        // Login successful, redirect to intended page or default dashboard
        router.push(redirectTo)
        router.refresh()
      } else {
        setError(data.error || 'Login failed')
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <LogoImage width={200} height={60} className="h-12 w-auto" />
        </div>

        {/* Login Card */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Admin Login
            </CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to access the proofing system dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 pr-10 focus:border-yellow-500 focus:ring-yellow-500"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-700 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <div className="text-center mt-6">
          <p className="text-sm text-gray-300">
            Default admin credentials:
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Email: admin@proofing-system.com<br />
            Password: AdminPass123!
          </p>
        </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 NewState Branding Co. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<FullScreenLoading text="Loading login page..." />}>
      <LoginForm />
    </Suspense>
  )
}
