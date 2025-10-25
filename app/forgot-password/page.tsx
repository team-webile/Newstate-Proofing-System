'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FullScreenLoading } from '@/components/ui/loading'
import { ArrowLeft, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import LogoImage from '@/components/LogoImage'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSent(true)
        toast.success('Password reset email sent!')
      } else {
        setError(data.error || 'Failed to send reset email')
        toast.error(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
      console.error('Forgot password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <LogoImage width={200} height={60} className="h-12 w-auto" />
          </div>

          {/* Success Card */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-gray-400">
                We've sent a password reset link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-900/30 border-green-800 text-green-300">
                <AlertDescription>
                  If you don't see the email in your inbox, check your spam folder.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/admin/login')}
                  className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
                
                <Button
                  onClick={() => {
                    setIsSent(false)
                    setEmail('')
                  }}
                  variant="outline"
                  className="w-full border-gray-700 bg-gray-800 text-white hover:bg-gray-800 hover:text-white cursor-pointer"
                >
                  Try Another Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Newstate Branding Co. All rights reserved.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <LogoImage width={200} height={60} className="h-12 w-auto" />
        </div>

        {/* Forgot Password Card */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your email address and we'll send you a link to reset your password
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
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
                  disabled={isLoading}
                  placeholder="admin@example.com"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-gray-400 hover:text-yellow-400 text-sm"
                  onClick={() => router.push('/admin/login')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 Newstate Branding Co. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<FullScreenLoading text="Loading..." />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
