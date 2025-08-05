"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface ResizeHandleProps {
  onResize: (width: number) => void
  minWidth?: number
  maxWidth?: number
  className?: string
  direction?: "left" | "right"
}

// Smooth interpolation function
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
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
  const targetWidthRef = useRef(0)
  const animationFrameRef = useRef<number>()
  const velocityRef = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeRef.current) {
        const currentTime = performance.now()
        const deltaTime = currentTime - lastTimeRef.current
        lastTimeRef.current = currentTime

        // Calculate target width
        let newWidth: number
        if (direction === "left") {
          newWidth = window.innerWidth - e.clientX
        } else {
          newWidth = e.clientX
        }

        const maxAllowedWidth = maxWidth || window.innerWidth * 0.9
        const clampedWidth = Math.max(minWidth, Math.min(maxAllowedWidth, newWidth))
        
        targetWidthRef.current = clampedWidth

        // Calculate velocity for smooth interpolation
        const currentWidth = lastWidthRef.current
        const widthDiff = clampedWidth - currentWidth
        velocityRef.current = widthDiff / Math.max(deltaTime, 1) // Prevent division by zero

        // Smooth interpolation with easing
        if (Math.abs(widthDiff) > 0.1) {
          const easing = 0.15 // Reduced for smoother feel
          const smoothedWidth = lerp(currentWidth, clampedWidth, easing)
          lastWidthRef.current = smoothedWidth
          
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }

          animationFrameRef.current = requestAnimationFrame(() => {
            onResize(Math.round(smoothedWidth))
          })
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      velocityRef.current = 0
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    lastTimeRef.current = performance.now()
    velocityRef.current = 0
    
    if (resizeRef.current) {
      let currentWidth: number
      if (direction === "left") {
        currentWidth = window.innerWidth - (resizeRef.current.getBoundingClientRect().left)
      } else {
        currentWidth = resizeRef.current.getBoundingClientRect().left
      }
      lastWidthRef.current = currentWidth
      targetWidthRef.current = currentWidth
    }
  }

  return (
    <div
      ref={resizeRef}
      className={cn(
        "relative w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-all duration-200",
        "hover:w-3 hover:bg-gray-400 hover:shadow-sm",
        "active:w-4 active:bg-gray-500 active:shadow-md",
        "flex items-center justify-center",
        isResizing && "w-4 bg-gray-500 shadow-md",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'col-resize',
        userSelect: 'none',
        touchAction: 'none',
      }}
      title="Kéo để thay đổi độ rộng"
    >
      <div className="flex flex-col space-y-0.5">
        <div className={cn(
          "w-0.5 h-0.5 rounded-full transition-colors duration-200",
          isResizing ? "bg-gray-300" : isHovered ? "bg-gray-500" : "bg-gray-400"
        )} />
        <div className={cn(
          "w-0.5 h-0.5 rounded-full transition-colors duration-200",
          isResizing ? "bg-gray-300" : isHovered ? "bg-gray-500" : "bg-gray-400"
        )} />
        <div className={cn(
          "w-0.5 h-0.5 rounded-full transition-colors duration-200",
          isResizing ? "bg-gray-300" : isHovered ? "bg-gray-500" : "bg-gray-400"
        )} />
      </div>
    </div>
  )
} 