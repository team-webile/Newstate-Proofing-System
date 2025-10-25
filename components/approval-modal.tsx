'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string) => Promise<void>
  projectName: string
  isApproving?: boolean
  onShowProductionNotice?: () => void
}

export function ApprovalModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  projectName,
  isApproving = false,
  onShowProductionNotice
}: ApprovalModalProps) {
  const [clientName, setClientName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clientName.trim()) {
      toast.error('Please enter your name to confirm approval')
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(clientName.trim())
      setShowConfirmation(true)
    } catch (error) {
      console.error('Error confirming approval:', error)
      toast.error('Failed to approve project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setClientName('')
    setShowConfirmation(false)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-md">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Approve Project
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                Please enter your name to confirm approval of this project.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-white font-medium">
                  Your Name *
                </Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-medium mb-1">Important Notice:</p>
                    <p className="text-yellow-300/80">
                      By approving this project, you confirm that you are satisfied with the design and no further changes are needed. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="border-neutral-600 bg-neutral-800 text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!clientName.trim() || isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Approval
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Project Approved!
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                Thank you for your approval, {clientName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-400 mb-2">
                      Project Successfully Approved
                    </p>
                    <p className="text-green-300/80">
                      <strong>{projectName}</strong> has been approved by <strong>{clientName}</strong>.
                    </p>
                    <p className="text-green-300/80 mt-2">
                      Your design team has been notified and will proceed with the next steps.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="text-sm text-blue-300">
                  <p className="font-medium text-blue-400 mb-1">What happens next?</p>
                  <ul className="text-blue-300/80 space-y-1">
                    <li>• Your design team will be notified of the approval</li>
                    <li>• Final files will be prepared for delivery</li>
                    <li>• You'll receive confirmation via email</li>
                  </ul>
                </div>
              </div>
            </div>

                          <DialogFooter className="flex gap-3">
              <Button
                onClick={handleClose}
                className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-800 border-neutral-600 bg-neutral-800 hover:bg-neutral-800"
              >
                Close
              </Button>
              {onShowProductionNotice && (
                <Button
                  onClick={() => {
                    onShowProductionNotice()
                    handleClose()
                  }}
                  className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Production Notice
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}