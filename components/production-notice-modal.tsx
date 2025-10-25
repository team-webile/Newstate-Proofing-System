'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, Package, AlertCircle, Mail, ExternalLink } from 'lucide-react'

interface ProductionNoticeModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
}

export function ProductionNoticeModal({ 
  isOpen, 
  onClose, 
  projectName 
}: ProductionNoticeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-7 w-7 text-green-500" />
            Your Order is Being Processed
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Important information about your approved project: {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Confirmation Message */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-green-400 font-medium mb-1">
                  Order Confirmed
                </p>
                <p className="text-green-300/80">
                  We'll process your order and add it to our production queue. 
                  You'll receive an email update once production begins.
                </p>
              </div>
            </div>
          </div>

          {/* Production Time */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                  Production Time
                </p>
                <ul className="text-blue-300/80 space-y-1 list-disc list-inside">
                  <li>Usually takes <strong>7-10 business days</strong> to produce the order after artwork approval</li>
                  <li>If you mentioned an urgent event, we'll try our best to meet that timeline</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                  Shipping Information
                </p>
                <ul className="text-purple-300/80 space-y-1 list-disc list-inside">
                  <li>All shipments are handled by <strong>FedEx, UPS, or DHL</strong>, depending on which has the best rate</li>
                  <li>If an order has multiple boxes, they might arrive on different days</li>
                  <li>Please check tracking numbers to see if all boxes are delivered or still in transit</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          {/* <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-orange-400 font-medium mb-2 flex items-center gap-2">
                  Setup Instructions
                </p>
                <ul className="text-orange-300/80 space-y-1 list-disc list-inside">
                  <li>Inside the package, there will be a flyer with a <strong>QR code</strong> linking to a resources page</li>
                  <li>This page provides setup instructions for popular items</li>
                  <li>
                    <a 
                      href="https://your-resources-page.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300 underline"
                    >
                      Click here to access the resources page
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div> */}

          {/* Checking Your Order */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                  Checking Your Order
                </p>
                <ul className="text-yellow-300/80 space-y-1 list-disc list-inside">
                  <li>Please check all items when the package arrives to ensure nothing is missing</li>
                  <li>If anything is damaged during shipping, please <strong>take photos and contact us within 7-10 days</strong> for help</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Customer Support */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-cyan-400 font-medium mb-2 flex items-center gap-2">
                  Customer Support
                </p>
                <p className="text-cyan-300/80">
                  If you have any questions, please don't hesitate to reach out to our support team. 
                  We're here to help!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-neutral-700">
          <Button
            onClick={onClose}
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-black font-semibold"
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
