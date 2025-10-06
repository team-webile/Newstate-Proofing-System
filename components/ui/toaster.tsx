'use client'

import { Toaster as HotToaster } from 'react-hot-toast'

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
          borderRadius: '8px',
        },
        success: {
          iconTheme: {
            primary: '#fbbf24',
            secondary: '#1f2937',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1f2937',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#1f2937',
          },
        },
      }}
    />
  )
}