'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Check, X } from 'lucide-react'

interface ToastProps {
  type?: 'success' | 'error'
  title?: string
  description?: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

const Toast = React.memo(({
  type = 'success',
  title = 'Link Updated',
  description = 'Changes to the short link will take effect immediately',
  onClose,
  autoClose = true,
  duration = 3000
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    onClose?.()
  }, [onClose])

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, handleClose])

  const isSuccess = type === 'success'
  const iconBgColor = useMemo(() => isSuccess ? '#1DC91D' : '#DC2626', [isSuccess])

  const iconContent = useMemo(() => (
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
  ), [isSuccess, iconBgColor])

  const iconContainer = useMemo(() => (
    <div 
      className="flex-shrink-0 p-2 rounded-md"
      style={{ 
        backgroundColor: '#28282B',
        border: '1px solid #2E2E2E'
      }}
    >
      {iconContent}
    </div>
  ), [iconContent])

  if (!isVisible) return null

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
      {iconContainer}

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
})

Toast.displayName = 'Toast'

export default Toast
