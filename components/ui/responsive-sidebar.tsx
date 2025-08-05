"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ResizeHandle } from "./resize-handle"

interface ResponsiveSidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  onResize?: (width: number) => void
  mobileBreakpoint?: number
}

export function ResponsiveSidebar({
  isOpen,
  onClose,
  children,
  title,
  className,
  minWidth = 500,
  maxWidth,
  defaultWidth,
  onResize,
  mobileBreakpoint = 768
}: ResponsiveSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (defaultWidth) return defaultWidth
    // Default to 70% of screen width, min 600px, max 90%
    return Math.max(600, Math.min(window.innerWidth * 0.9, window.innerWidth * 0.7))
  })

  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint])

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 1500) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleResize = (width: number) => {
    setSidebarWidth(width)
    onResize?.(width)
  }

  // Update width on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      const maxAllowedWidth = maxWidth || window.innerWidth * 0.9
      setSidebarWidth(prev => Math.min(prev, maxAllowedWidth))
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [maxWidth])

  if (!isVisible) return null

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 transition-opacity duration-1500",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />
        
        {/* Mobile Sidebar */}
        <div
          className={cn(
            "fixed right-0 top-0 h-full bg-background shadow-lg transition-transform duration-1500 ease-in-out",
            isOpen ? "translate-x-0" : "translate-x-full",
            className
          )}
          style={{ width: "100%" }}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b bg-background">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Desktop Sidebar
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity duration-1500",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-background shadow-lg transition-transform duration-1500 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
        style={{ width: sidebarWidth }}
      >
        {/* Resize Handle - Positioned on the left edge */}
        <div className="absolute left-0 top-0 h-full flex items-center justify-center -ml-1 z-20">
          <ResizeHandle
            onResize={handleResize}
            minWidth={minWidth}
            maxWidth={maxWidth || window.innerWidth * 0.9}
            direction="left"
            className="h-full"
          />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
} 