"use client"

import { useState, useCallback } from "react"
import type { Card } from "@/lib/types"

interface DragDropState {
  draggedCard: Card | null
  draggedOverList: string | null
  isDragging: boolean
  dragStartTime: number | null
}

export function useDragDrop() {
  const [dragState, setDragState] = useState<DragDropState>({
    draggedCard: null,
    draggedOverList: null,
    isDragging: false,
    dragStartTime: null,
  })

  const handleDragStart = useCallback((card: Card) => {
    console.log(`🎯 Drag started: ${card.name || 'Untitled'}`)
    setDragState({
      draggedCard: card,
      draggedOverList: null,
      isDragging: true,
      dragStartTime: Date.now(),
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    console.log(`🎯 Drag ended`)
    setDragState({
      draggedCard: null,
      draggedOverList: null,
      isDragging: false,
      dragStartTime: null,
    })
  }, [])

  const handleDragOver = useCallback((listId: string, cardId?: string, position?: number) => {
    setDragState((prev) => ({
      ...prev,
      draggedOverList: listId,
    }))
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      draggedOverList: null,
    }))
  }, [])

  const handleDrop = useCallback((listId: string, position: number) => {
    setDragState((prev) => ({
      ...prev,
      draggedOverList: null,
    }))
  }, [])

  // Helper functions for UI state
  const isDraggingOver = useCallback((listId: string) => {
    return dragState.draggedOverList === listId
  }, [dragState.draggedOverList])

  const getDropPosition = useCallback((listId: string) => {
    if (dragState.draggedOverList !== listId) return null
    // This will be calculated in the component based on mouse position
    return null
  }, [dragState.draggedOverList])

  const isDragging = dragState.isDragging
  const draggedCard = dragState.draggedCard

  return {
    draggedCard,
    draggedOverList: dragState.draggedOverList,
    isDragging,
    dragStartTime: dragState.dragStartTime,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDraggingOver,
    getDropPosition,
  }
}
