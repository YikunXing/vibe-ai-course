'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

interface ToastProps {
  type?: 'success' | 'error'
  title?: string
  description?: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export default function Toast({
  type = 'success',
  title = 'Link Updated',
  description = 'Changes to the short link will take effect immediately',
  onClose,
  autoClose = true,
  duration = 3000
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  const isSuccess = type === 'success'
  const iconBgColor = isSuccess ? '#1DC91D' : '#DC2626'

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex items-start gap-3 p-4 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-300"
      style={{ 
        backgroundColor: '#161618',
        border: '1px solid #2E2E2E',
        minWidth: '320px',
        maxWidth: '400px'
      }}
    >
      {/* Icon container */}
      <div 
        className="flex-shrink-0 p-2 rounded-md"
        style={{ 
          backgroundColor: '#28282B',
          border: '1px solid #2E2E2E'
        }}
      >
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          {isSuccess ? (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          ) : (
            <X className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-5">
          {title}
        </p>
        <p className="text-sm leading-5 mt-1" style={{ color: '#797979' }}>
          {description}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" style={{ color: '#797979' }} />
      </button>
    </div>
  )
}
