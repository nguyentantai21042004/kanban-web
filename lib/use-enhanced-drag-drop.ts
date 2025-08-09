"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ClientPositionCalculator } from "./client-position-calculator"
import { OptimisticUpdateManager } from "./optimistic-update-manager"
import { positionConfigManager } from "./config/position-config"
import type { Card } from "@/lib/types"

interface DragDropState {
  draggedCard: Card | null
  draggedOverList: string | null
  draggedOverIndex: number | null
  isDragging: boolean
  dragStartTime: number | null
  dragOffset: { x: number; y: number } | null
  mousePosition: { x: number; y: number } | null
}

interface DragDropConfig {
  enableOptimisticUpdates: boolean
  debounceMs: number
  showDropIndicators: boolean
  enableBatchMoves: boolean
}

export function useEnhancedDragDrop(config: Partial<DragDropConfig> = {}) {
  // Load optimized config from position config manager
  const positionConfig = positionConfigManager.getConfig()
  const performanceConfig = positionConfigManager.getPerformanceConfig()
  
  const defaultConfig: DragDropConfig = {
    enableOptimisticUpdates: positionConfig.enableOptimisticUpdates,
    debounceMs: performanceConfig.dragDebounceMs,
    showDropIndicators: true,
    enableBatchMoves: positionConfig.enableBatchMoves,
  }

  const finalConfig = { ...defaultConfig, ...config }
  
  const [dragState, setDragState] = useState<DragDropState>({
    draggedCard: null,
    draggedOverList: null,
    draggedOverIndex: null,
    isDragging: false,
    dragStartTime: null,
    dragOffset: null,
    mousePosition: null,
  })

  const positionCalculator = useRef(new ClientPositionCalculator())
  const optimisticManager = useRef(new OptimisticUpdateManager())
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      optimisticManager.current.cleanup()
    }
  }, [])

  const handleDragStart = useCallback((card: Card, event?: React.DragEvent) => {
    console.log(`🎯 Enhanced drag started: ${card.name}`)
    
    setDragState({
      draggedCard: card,
      draggedOverList: null,
      draggedOverIndex: null,
      isDragging: true,
      dragStartTime: Date.now(),
      dragOffset: null,
      mousePosition: null,
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    const dragDuration = dragState.dragStartTime ? Date.now() - dragState.dragStartTime : 0
    console.log(`🎯 Enhanced drag ended (duration: ${dragDuration}ms)`)
    
    setDragState({
      draggedCard: null,
      draggedOverList: null,
      draggedOverIndex: null,
      isDragging: false,
      dragStartTime: null,
      dragOffset: null,
      mousePosition: null,
    })

    // Clear any pending debounced operations
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
  }, [dragState.dragStartTime])

  const handleDragOver = useCallback((
    listId: string, 
    index?: number,
    event?: React.DragEvent
  ) => {
    // Debounce drag over events for performance
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDragState((prev) => ({
        ...prev,
        draggedOverList: listId,
        draggedOverIndex: index ?? null,
        mousePosition: null,
      }))
    }, finalConfig.debounceMs)
  }, [finalConfig.debounceMs])

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      draggedOverList: null,
      draggedOverIndex: null,
    }))
  }, [])

  const calculateDropPosition = useCallback((
    listId: string,
    dropIndex: number,
    allCards: Card[]
  ) => {
    if (!dragState.draggedCard) return null

    const result = positionCalculator.current.calculateDropPosition(
      allCards,
      listId,
      dropIndex,
      dragState.draggedCard.id
    )

    // Log position calculation for debugging if enabled
    if (positionConfigManager.isFeatureEnabled('enableDebugLogging')) {
      console.log(`🎯 Position calculation result:`, {
        listId,
        dropIndex,
        cardId: dragState.draggedCard.id,
        result
      })
    }

    return result
  }, [dragState.draggedCard])

  const executeOptimisticMove = useCallback((
    targetListId: string,
    dropIndex: number,
    allCards: Card[],
    apiCall: (card: Card) => Promise<Card>
  ) => {
    if (!dragState.draggedCard || !finalConfig.enableOptimisticUpdates) {
      return null
    }

    return optimisticManager.current.executeOptimisticMove(
      dragState.draggedCard,
      targetListId,
      dropIndex,
      allCards,
      apiCall
    )
  }, [dragState.draggedCard, finalConfig.enableOptimisticUpdates])

  const rollbackFailedMove = useCallback((cardId: string) => {
    return optimisticManager.current.rollbackMove(cardId)
  }, [])

  const rollbackAllPendingMoves = useCallback(() => {
    return optimisticManager.current.rollbackAllPendingMoves()
  }, [])

  // Enhanced helper functions
  const isDraggingOver = useCallback((listId: string) => {
    return dragState.draggedOverList === listId
  }, [dragState.draggedOverList])

  const getDropIndex = useCallback((listId: string) => {
    if (dragState.draggedOverList !== listId) return null
    return dragState.draggedOverIndex
  }, [dragState.draggedOverList, dragState.draggedOverIndex])

  const getDragPreview = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedCard) return null
    
    return {
      card: dragState.draggedCard,
      offset: dragState.dragOffset,
      mousePosition: dragState.mousePosition,
      duration: dragState.dragStartTime ? Date.now() - dragState.dragStartTime : 0,
      isVisible: dragState.isDragging
    }
  }, [dragState])

  const hasPendingMove = useCallback((cardId: string) => {
    return optimisticManager.current.hasPendingMove(cardId)
  }, [])

  const getPendingMoves = useCallback(() => {
    return optimisticManager.current.getAllPendingMoves()
  }, [])

  const validateDropTarget = useCallback((
    listId: string,
    dropIndex: number,
    allCards: Card[]
  ) => {
    if (!dragState.draggedCard) return false

    // Can't drop on same position
    const currentListId = dragState.draggedCard.list?.id || dragState.draggedCard.list_id
    if (
      currentListId === listId && 
      Math.abs(dropIndex - getCurrentCardIndex(dragState.draggedCard, allCards, listId)) <= 1
    ) {
      return false
    }

    return true
  }, [dragState.draggedCard])

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const pendingMoves = optimisticManager.current.getAllPendingMoves()
    
    return {
      isDragging: dragState.isDragging,
      dragDuration: dragState.dragStartTime ? Date.now() - dragState.dragStartTime : 0,
      pendingMovesCount: pendingMoves.length,
      averageConfidence: pendingMoves.length > 0 
        ? pendingMoves.reduce((sum, move) => {
            const confidence = move.confidence === 'high' ? 1 : move.confidence === 'medium' ? 0.6 : 0.3
            return sum + confidence
          }, 0) / pendingMoves.length
        : 1,
    }
  }, [dragState])

  return {
    // State
    draggedCard: dragState.draggedCard,
    draggedOverList: dragState.draggedOverList,
    draggedOverIndex: dragState.draggedOverIndex,
    isDragging: dragState.isDragging,
    dragStartTime: dragState.dragStartTime,
    
    // Basic handlers
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    
    // Enhanced functionality
    calculateDropPosition,
    executeOptimisticMove,
    rollbackFailedMove,
    rollbackAllPendingMoves,
    
    // Helpers
    isDraggingOver,
    getDropIndex,
    getDragPreview,
    hasPendingMove,
    getPendingMoves,
    validateDropTarget,
    getPerformanceMetrics,
    
    // Managers (for advanced usage)
    positionCalculator: positionCalculator.current,
    optimisticManager: optimisticManager.current,
  }
}

// Helper function
function getCurrentCardIndex(card: Card, allCards: Card[], listId: string): number {
  const listCards = allCards
    .filter(c => (c.list?.id || c.list_id) === listId)
    .sort((a, b) => (a.position || 0) - (b.position || 0))
  
  return listCards.findIndex(c => c.id === card.id)
}