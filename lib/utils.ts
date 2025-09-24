import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function safeParseDate(date: unknown): Date | null {
  if (!date) return null
  
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date
  }
  
  if (typeof date === 'string') {
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? null : parsed
  }
  
  return null
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  
  let dateObj: Date
  
  if (typeof date === 'string') {
    // Handle various date string formats, including ISO strings
    dateObj = new Date(date)
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    return 'N/A'
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date received:', date)
    return 'Invalid Date'
  }
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC' // Use UTC to avoid timezone issues
    }).format(dateObj)
  } catch (error) {
    console.warn('Date formatting error:', error, 'Date:', date)
    return 'Format Error'
  }
}

export function generateShareLink(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'NEEDS_REVISION':
      return 'bg-orange-100 text-orange-800'
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-800'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
