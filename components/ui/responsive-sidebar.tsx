"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ResizeHandle } from "./resize-handle"

interface ResponsiveSidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  mobileBreakpoint?: number
  onResize?: (width: number) => void
}

export function ResponsiveSidebar({
  isOpen,
  onClose,
  children,
  className,
  minWidth = 500,
  maxWidth,
  defaultWidth,
  mobileBreakpoint = 768,
  onResize
}: ResponsiveSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (defaultWidth) return defaultWidth
    // Default to 70% of screen width, min 600px, max 90%
    return Math.max(600, Math.min(window.innerWidth * 0.9, window.innerWidth * 0.7))
  })
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const handleResize = (width: number) => {
    if (!isMobile) {
      setSidebarWidth(width)
      onResize?.(width)
    }
  }

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      // Delay hiding to allow for exit animation
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 1500) // Increased delay for smoother animation
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint])

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

  // Mobile layout - full screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-1500 ease-in-out",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />

        {/* Mobile Sidebar */}
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl",
            "transform transition-transform duration-1500 ease-in-out",
            isOpen ? "translate-x-0" : "translate-x-full",
            className
          )}
        >
          {children}
        </div>
      </div>
    )
  }

  // Desktop layout - resizable sidebar
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className={cn(
          "flex-1 bg-black/20 transition-opacity duration-1500 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "bg-white shadow-xl border-l flex flex-col transition-all duration-1500 ease-in-out",
          "transform",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
        style={{ width: sidebarWidth }}
      >
        {/* Resize Handle - Positioned on the left edge of sidebar */}
        <div className="absolute left-0 top-0 h-full flex items-center justify-center -ml-1 z-20">
          <ResizeHandle
            onResize={handleResize}
            minWidth={minWidth}
            maxWidth={maxWidth || window.innerWidth * 0.9}
            direction="left"
            className="h-full"
          />
        </div>
        {children}
      </div>
    </div>
  )
} 