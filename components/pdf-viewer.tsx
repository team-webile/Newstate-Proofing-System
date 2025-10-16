'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import { Button } from './ui/button'

// Configure PDF.js worker - using CDN for version 4.4.168
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`
}

interface PDFViewerProps {
  fileUrl: string
  onPageChange?: (page: number) => void
  currentPage?: number
  className?: string
  enableAnnotations?: boolean
  annotationOverlay?: React.ReactNode
}

export function PDFViewer({
  fileUrl,
  onPageChange,
  currentPage = 1,
  className = '',
  enableAnnotations = false,
  annotationOverlay
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(currentPage)
  const [scale, setScale] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPageNumber(currentPage)
  }, [currentPage])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully:', { numPages, fileUrl })
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error)
    console.error('PDF URL:', fileUrl)
    setError(`Failed to load PDF: ${error.message}`)
    setIsLoading(false)
  }

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage)
      if (onPageChange) {
        onPageChange(newPage)
      }
    }
  }

  const previousPage = () => changePage(-1)
  const nextPage = () => changePage(1)

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page)
      if (onPageChange) {
        onPageChange(page)
      }
    }
  }

  // Memoize PDF.js options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/standard_fonts/',
    disableWorker: false,
    disableAutoFetch: false,
    disableStream: false,
  }), [])

  return (
    <div className={`flex flex-col h-full ${className}`} style={{ overscrollBehavior: 'contain' }}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between bg-neutral-900 border-b border-neutral-800 p-3 lg:p-4 flex-shrink-0" style={{ overscrollBehavior: 'contain' }}>
        <div className="flex items-center gap-2">
          <Button
            onClick={previousPage}
            disabled={pageNumber <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-300">
              Page
            </span>
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-12 px-2 py-1 text-sm bg-neutral-800 border border-neutral-700 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow"
            />
            <span className="text-sm text-neutral-400">
              of {numPages || '?'}
            </span>
          </div>

          <Button
            onClick={nextPage}
            disabled={pageNumber >= numPages || isLoading}
            variant="outline"
            size="sm"
            className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={zoomOut}
            disabled={scale <= 0.5 || isLoading}
            variant="outline"
            size="sm"
            className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-neutral-300 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            onClick={zoomIn}
            disabled={scale >= 3.0 || isLoading}
            variant="outline"
            size="sm"
            className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Display Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-neutral-950 flex items-center justify-center p-4"
        style={{ overscrollBehavior: 'contain' }}
      >
        {isLoading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
            <p className="text-neutral-400 text-sm">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="text-red-400 text-4xl mb-3">⚠️</div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="relative" style={{ overscrollBehavior: 'contain' }}>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            error=""
            className="pdf-document"
            options={pdfOptions}
          >
            <div ref={pageRef} className="relative" style={{ overscrollBehavior: 'contain' }}>
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading=""
                error=""
                className="pdf-page shadow-2xl"
                onLoadSuccess={() => {
                  console.log(`PDF page ${pageNumber} loaded successfully`);
                }}
                onLoadError={(error) => {
                  console.error(`Error loading PDF page ${pageNumber}:`, error);
                }}
              />
              
              {/* Annotation Overlay */}
              {annotationOverlay && (
                <div className="absolute inset-0 pointer-events-auto" style={{ overscrollBehavior: 'contain' }}>
                  {annotationOverlay}
                </div>
              )}
            </div>
          </Document>
        </div>
      </div>

      {/* Page Navigation Thumbnails (Optional - for multi-page PDFs) */}
      {numPages > 1 && (
        <div className="bg-neutral-900 border-t border-neutral-800 p-2 lg:p-3 flex-shrink-0" style={{ overscrollBehavior: 'contain' }}>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin" style={{ overscrollBehavior: 'contain' }}>
            {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs rounded transition-colors ${
                  page === pageNumber
                    ? 'bg-brand-yellow text-black font-semibold'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

