"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ResizeHandleProps {
  onResize: (width: number) => void
  minWidth?: number
  maxWidth?: number
  className?: string
  direction?: "left" | "right"
}

export function ResizeHandle({ 
  onResize, 
  minWidth = 500, 
  maxWidth, 
  className,
  direction = "left"
}: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const lastWidthRef = useRef(0)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeRef.current) {
        // Cancel previous animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          let newWidth: number
          
          if (direction === "left") {
            newWidth = window.innerWidth - e.clientX
          } else {
            newWidth = e.clientX
          }

          const maxAllowedWidth = maxWidth || window.innerWidth * 0.9
          const finalWidth = Math.max(minWidth, Math.min(maxAllowedWidth, newWidth))
          
          // Smooth interpolation between current and target width
          const currentWidth = lastWidthRef.current
          const diff = finalWidth - currentWidth
          
          if (Math.abs(diff) > 0.1) {
            // Smooth easing function
            const easing = 0.3
            const smoothedWidth = currentWidth + (diff * easing)
            lastWidthRef.current = smoothedWidth
            
            onResize(Math.round(smoothedWidth))
          }
        })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isResizing, onResize, minWidth, maxWidth, direction])

  const handleMouseDown = () => {
    setIsResizing(true)
    // Initialize last width when starting resize
    if (resizeRef.current) {
      let currentWidth: number
      if (direction === "left") {
        currentWidth = window.innerWidth - (resizeRef.current.getBoundingClientRect().left)
      } else {
        currentWidth = resizeRef.current.getBoundingClientRect().left
      }
      lastWidthRef.current = currentWidth
    }
  }

  return (
    <div
      ref={resizeRef}
      className={cn(
        // Base styles - smaller and more subtle
        "relative w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-all duration-150",
        // Hover effects - more subtle
        "hover:w-3 hover:bg-gray-400 hover:shadow-sm",
        // Active/Resizing effects - subtle
        "active:w-4 active:bg-gray-500 active:shadow-md",
        // Visual indicator dots - smaller
        "flex items-center justify-center",
        // Resizing state
        isResizing && "w-4 bg-gray-500 shadow-md",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'col-resize',
        userSelect: 'none',
      }}
      title="Kéo để thay đổi độ rộng"
    >
      {/* Visual dots indicator - smaller and more subtle */}
      <div className="flex flex-col space-y-0.5">
        <div className={cn(
          "w-0.5 h-0.5 rounded-full transition-colors duration-150",
          isResizing ? "bg-gray-300" : isHovered ? "bg-gray-500" : "bg-gray-400"
        )} />
        <div className={cn(
          "w-0.5 h-0.5 rounded-full transition-colors duration-150",
          isResizing ? "bg-gray-300" : isHovered ? "bg-gray-500" : "bg-gray-400"
        )} />
        <div className={cn(
          "w-0.5 h-0.5 rounded-full transition-colors duration-150",
          isResizing ? "bg-gray-300" : isHovered ? "bg-gray-500" : "bg-gray-400"
        )} />
      </div>
    </div>
  )
} 