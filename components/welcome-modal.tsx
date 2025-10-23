"use client"

import { useEffect, useState } from "react"
import { User, Mail } from "lucide-react"
import Image from "next/image"
import { useSocket } from "@/contexts/SocketContext"

interface WelcomeModalProps {
  onSubmit: (name: string, email: string) => void
  projectName: string
  clientEmail?: string
  projectId?: number
}

export function WelcomeModal({ onSubmit, projectName, clientEmail, projectId }: WelcomeModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState(clientEmail || "")
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
  })
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState(false)
  const { socket, isConnected } = useSocket()
  
  // Join project room when component mounts
  useEffect(() => {
    if (socket && isConnected && projectId) {
      socket.emit('join-project', projectId);
      console.log('📡 Welcome modal joined project room:', projectId);
      
      return () => {
        socket.emit('leave-project', projectId);
        console.log('📡 Welcome modal left project room:', projectId);
      };
    }
  }, [socket, isConnected, projectId]);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
          })
          
          // Check if user is admin and set email from profile
          const adminRole = localStorage.getItem('NewStateBrandingAdminRole')
          if (adminRole === 'ADMIN' && data.email) {
            setEmail(data.email)
            setName(`${data.firstName} ${data.lastName}`.trim() || 'Admin User')
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only load profile if user is admin
    if(localStorage.getItem('NewStateBrandingAdminRole') === 'ADMIN'){
      loadProfile()
    } else {
      setIsLoading(false)
    }
  }, [])
  const handleUpdateEmail = async () => {
    if (!projectId || !email.trim()) return
    
    setIsUpdatingEmail(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/update-client-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientEmail: email.trim() }),
      })

      if (response.ok) {
        const result = await response.json()
        setEmailUpdateSuccess(true)
        setTimeout(() => setEmailUpdateSuccess(false), 5000)
        
        // Emit socket event to notify admin immediately
        if (socket && isConnected && projectId) {
          const socketData = {
            projectId: projectId,
            newEmail: email.trim(),
            oldEmail: clientEmail || '',
            updatedBy: 'Client'
          };
          
          socket.emit('client-email-updated', socketData);
          console.log('📡 Socket event emitted for client email update:', socketData);
          console.log('📡 Socket connected:', isConnected);
          console.log('📡 Socket ID:', socket.id);
        } else {
          console.log('❌ Socket not available:', { socket: !!socket, isConnected, projectId });
        }
        
        // Show success notification
        console.log('✅ Email updated successfully! You will receive a confirmation email at your new address.')
      } else {
        const error = await response.json()
        console.error('Failed to update email:', error)
        console.error('❌ Failed to update email. Please try again.')
      }
    } catch (error) {
      console.error('Error updating email:', error)
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && email.trim()) {
      // Emit socket event for client activity
      if (socket && isConnected && projectId) {
        socket.emit('client-activity', {
          projectId: projectId,
          activityType: 'welcome',
          message: `${name.trim()} joined the review session`,
          timestamp: new Date().toISOString()
        })
        console.log('📡 Socket event emitted for client welcome')
      }
      
      onSubmit(name.trim(), email.trim())
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
          <div className="mb-4">
            <label className="block text-neutral-300 text-sm font-semibold mb-3">
              Please enter your name:
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

          {/* Client Email Field */}
          {(localStorage.getItem('NewStateBrandingAdminRole') !== 'ADMIN') && (
            <div className="mb-6">
              <label className="block text-neutral-300 text-sm font-semibold mb-3">
                Client Email:
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 rounded-lg border-2 border-green-500/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Client email address"
                  className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-neutral-600"
                  required
                />
                {projectId && (
                  <button
                    type="button"
                    onClick={handleUpdateEmail}
                    disabled={isUpdatingEmail || !email.trim()}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
                  >
                    {isUpdatingEmail ? 'Updating...' : 'Update'}
                  </button>
                )}
              </div>
              {emailUpdateSuccess && (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-3 mt-2">
                  <p className="text-green-400 text-sm font-medium">
                    ✅ Email updated successfully!
                  </p>
                  <p className="text-green-300 text-xs mt-1">
                    You will receive a confirmation email at your new address.
                  </p>
                </div>
              )}
              <p className="text-green-400 text-sm mt-2">
                📧 You can update your email address if needed
              </p>
            </div>
          )}

          {/* Admin Email Field */}
          {profile.email && localStorage.getItem('NewStateBrandingAdminRole') === 'ADMIN' && (
            <div className="mb-6">
              <label className="block text-neutral-300 text-sm font-semibold mb-3">
                Admin Email (Pre-filled):
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 rounded-lg border-2 border-blue-500/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin email address"
                  className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-neutral-600"
                  disabled={true}
                  required
                />
                <div className="text-blue-400 text-sm font-medium">
                  ✓ 
                </div>
              </div>
              <p className="text-blue-400 text-sm mt-2">
                👤 Your admin email has been automatically filled from your profile
              </p>
            </div>
          )}

          {/* Manual Email Field */}
          {!clientEmail && !profile.email && (
            <div className="mb-6">
              <label className="block text-neutral-300 text-sm font-semibold mb-3">
                Please enter your email:
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 rounded-lg border-2 border-neutral-800 focus-within:border-[#fdb913] transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-neutral-600"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || !email.trim()}
            className="w-full px-6 py-4 bg-[#fdb913] text-black font-bold rounded-lg hover:bg-[#e5a711] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
          >
            Start Reviewing
          </button>

          <p className="text-xs text-neutral-500 text-center mt-4">
            Your name and email will be used to identify your comments and receive notifications
          </p>
        </form>
      </div>
    </div>
  )
}

