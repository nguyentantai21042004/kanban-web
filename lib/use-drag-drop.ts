"use client"

import { useState, useCallback } from "react"
import type { Card } from "./types"

interface DragDropState {
  draggedCard: Card | null
  draggedOverList: string | null
  draggedOverCard: string | null
}

export function useDragDrop() {
  const [dragState, setDragState] = useState<DragDropState>({
    draggedCard: null,
    draggedOverList: null,
    draggedOverCard: null,
  })

  const handleDragStart = useCallback((card: Card) => {
    setDragState((prev) => ({
      ...prev,
      draggedCard: card,
    }))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedCard: null,
      draggedOverList: null,
      draggedOverCard: null,
    })
  }, [])

  const handleDragOver = useCallback((listId: string, cardId?: string) => {
    setDragState((prev) => ({
      ...prev,
      draggedOverList: listId,
      draggedOverCard: cardId || null,
    }))
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      draggedOverList: null,
      draggedOverCard: null,
    }))
  }, [])

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
  }
}
