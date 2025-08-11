"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ListColumn } from "@/components/kanban/list-column"
import { CardForm, type CardFormData } from "@/components/kanban/card-form"
import { CardDetailSidebar } from "@/components/kanban/card-detail-sidebar"

import { useDragDrop } from "@/lib/use-drag-drop"
import { useEnhancedDragDrop } from "@/lib/use-enhanced-drag-drop"
import { PositionManager } from "@/lib/position-manager"
import { positionConfigManager } from "@/lib/config/position-config"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api/index"
import { wsClient } from "@/lib/websocket"
import type { Board, List, Card, Label } from "@/lib/types"
import { ArrowLeft, Plus, Loader2, Trash2 } from "lucide-react"

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const boardId = params.id as string

  // State
  const [board, setBoard] = useState<Board | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; avatar_url?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Form states
  const [isCardFormOpen, setIsCardFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [defaultListId, setDefaultListId] = useState<string>("")
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [isCreatingList, setIsCreatingList] = useState(false)
  
  // Card detail sidebar
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isCardDetailOpen, setIsCardDetailOpen] = useState(false)

  // Delete board dialog
  const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false)
  const [isDeletingBoard, setIsDeletingBoard] = useState(false)

  // Delete list dialog
  const [isDeleteListDialogOpen, setIsDeleteListDialogOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<List | null>(null)
  const [isDeletingList, setIsDeletingList] = useState(false)



  // Enhanced drag and drop with advanced position management
  const {
    handleDragStart: enhancedDragStart,
    handleDragEnd: enhancedDragEnd,
    handleDragOver: enhancedDragOver,
    handleDragLeave: enhancedDragLeave,
    isDraggingOver: enhancedIsDraggingOver,
    isDragging: enhancedIsDragging,
    draggedCard: enhancedDraggedCard,
    draggedOverList: enhancedDraggedOverList,
    calculateDropPosition,
    executeOptimisticMove,
    rollbackFailedMove,
    getPerformanceMetrics,
    hasPendingMove
  } = useEnhancedDragDrop({
    // Load optimal configuration from position config
    enableOptimisticUpdates: true,
    showDropIndicators: true
    // debounceMs will be auto-loaded from position config
  })

  // Fallback to simple drag drop for backward compatibility
  const { 
    handleDragStart, 
    handleDragEnd, 
    handleDragOver, 
    handleDragLeave,
    isDraggingOver,
    getDropPosition,
    draggedCard,
    draggedOverList
  } = useDragDrop()

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
    setIsCardDetailOpen(true)
  }

  const handleCardUpdate = (updatedCard: Card) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)))
    setSelectedCard(updatedCard)
  }



  const loadBoardData = useCallback(async () => {
    console.log(`🔄 loadBoardData called for boardId: ${boardId}`)
    
    // Enable debug logging for enhanced position calculation
    if (typeof window !== 'undefined') {
      positionConfigManager.updateConfig({ enableDebugLogging: true })
      console.log('🎯 Enhanced position system activated with debug logging')
    }
    
    try {
      setIsLoading(true)
      setError("")

      const [boardData, listsData, cardsData, labelsData] = await Promise.all([
        apiClient.boards.getBoardById(boardId),
        apiClient.lists.getLists({ board_id: boardId }), // Only get lists for this board
        apiClient.cards.getCards({ board_id: boardId }),  // Only get cards for this board
        apiClient.labels.getLabels({ board_id: boardId }), // Only get labels for this board
      ])

      setBoard(boardData)
      setLists(listsData.data?.items || []) // No need to filter, already filtered by API
      
      const cards = cardsData.data?.items || []
      console.log("🔍 Raw cards from API:", cards)
      console.log("🔍 First card structure:", cards[0])
      
      // Normalize cards to ensure they have list_id for consistent access
      const normalizedCards = cards.map(card => ({
        ...card,
        list_id: card.list_id || card.list?.id
      }))
      
      setCards(normalizedCards)
      setLabels(labelsData.data?.items || []) // No need to filter, already filtered by API
      // Remove users API call since endpoint doesn't exist
      setUsers([])
    } catch (error: any) {
      setError("Không thể tải dữ liệu board")
      console.error("Load board error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [boardId])

  const connectWebSocket = useCallback(async () => {
    console.log(`🌐 connectWebSocket called for boardId: ${boardId}`)
    try {
      await wsClient.connect(boardId)
      console.log(`✅ WebSocket connected successfully`)
      
      console.log(`🔍 Registering WebSocket event listeners...`)
      
      // Listen for real-time updates
      wsClient.on("card_created", handleCardCreated)
      wsClient.on("card_updated", handleCardUpdated)
      wsClient.on("card_moved", handleCardMoved)
      wsClient.on("card_deleted", handleCardDeleted)
      wsClient.on("list_created", handleListCreated)
      wsClient.on("list_updated", handleListUpdated)
      wsClient.on("list_deleted", handleListDeleted)
      
      console.log(`✅ All WebSocket event listeners registered`)
      console.log(`📡 Listening for events: card_created, card_updated, card_moved, card_deleted, list_created, list_updated, list_deleted`)
    } catch (error) {
      console.log("ℹ️ WebSocket connection skipped (optional for development)")
      // Don't show error to user, just log it
      // WebSocket is optional for the app to work
    }
  }, [boardId]) // Only depend on boardId to avoid circular dependencies

  // WebSocket event handlers
  const handleCardCreated = useCallback((card: Card) => {
    console.log(`📥 Received card_created WebSocket event:`, card)
    
    setCards((prev) => {
      // Check if card already exists to prevent duplicates
      const existingCard = prev.find((c) => c.id === card.id)
      
      if (existingCard) {
        console.log(`⚠️ Card already exists in state, skipping:`, card.id)
        return prev
      }
      
      // Normalize card to ensure list_id is available
      const normalizedCard = {
        ...card,
        list_id: card.list_id || card.list?.id
      }
      
      console.log(`✅ Adding card from WebSocket:`, normalizedCard)
      return [...prev, normalizedCard]
    })
  }, [])

  const handleCardUpdated = useCallback((card: Card) => {
    console.log(`📥 Received card_updated WebSocket event:`, card)
    
    setCards((prev) => {
      const existingCard = prev.find((c) => c.id === card.id)
      if (!existingCard) {
        console.log(`⚠️ Card not found in state, adding new card:`, card.id)
        // Normalize card before adding
        const normalizedCard = {
          ...card,
          list_id: card.list_id || card.list?.id
        }
        return [...prev, normalizedCard]
      }
      
      console.log(`🔄 Updating existing card:`, card.id)
      return prev.map((c) => (c.id === card.id ? card : c))
    })
  }, [])

  const handleCardMoved = useCallback((card: Card) => {
    console.log(`📥 Received card_moved event:`, card)
    console.log(`📋 Card details - ID: ${card.id}, Name: ${card.name}, New List: ${card.list_id || card.list?.id}`)
    
    // WebSocket event received - no timeout clearing needed since we removed fallback timeout
    
    setCards((prev) => {
      // Find existing card
      const existingCard = prev.find((c) => c.id === card.id)
      
      if (!existingCard) {
        console.log(`⚠️ Card not found in state, adding new card:`, card.id)
        // Normalize card before adding
        const normalizedCard: Card = {
          ...card,
          list_id: card.list_id || card.list?.id,
          list: card.list || { id: card.list_id || 'unknown', name: 'Unknown List' }
        }
        return [...prev, normalizedCard]
      }
      
      // Update existing card with new data, preserving any missing fields
      console.log(`🔄 Updating existing card:`, card.id)
      console.log(`📍 Moving from list ${existingCard.list_id || existingCard.list?.id} to list ${card.list_id || card.list?.id}`)
      
      const updatedCard: Card = {
        ...existingCard,
        ...card,
        // FIXED: Always update list object to match new list_id
        list: card.list_id ? { id: card.list_id, name: card.list?.name || existingCard.list?.name || 'Unknown List' } : (card.list || existingCard.list),
        list_id: card.list_id || card.list?.id || existingCard.list_id
      }
      
      console.log(`✅ Card updated successfully:`, updatedCard)
      console.log(`🔍 Updated card list_id:`, updatedCard.list_id)
      console.log(`🔍 Updated card list:`, updatedCard.list)
      
      return prev.map((c) => (c.id === card.id ? updatedCard : c))
    })
  }, [])

  const handleCardDeleted = useCallback((data: any) => {
    // Handle both data formats: string or {id: string}
    const cardId = typeof data === 'string' ? data : data.id
    console.log(`📥 Received card_deleted WebSocket event for cardId:`, cardId)
    
    setCards((prev) => {
      const existingCard = prev.find((c) => c.id === cardId)
      if (!existingCard) {
        console.log(`⚠️ Card not found in state, nothing to delete:`, cardId)
        return prev
      }
      
      console.log(`🗑️ Removing card from state:`, cardId)
      return prev.filter((c) => c.id !== cardId)
    })
  }, [])

  const handleListCreated = useCallback((list: List) => {
    console.log(`📥 Received list_created WebSocket event:`, list)
    
    setLists((prev) => {
      // Check if list already exists to prevent duplicates
      const exists = prev.some((l) => l.id === list.id)
      if (exists) {
        console.log(`⚠️ List already exists in state, skipping:`, list.id)
        return prev
      }
      
      // Fix title if API returns "string" instead of actual title
      const fixedList = {
        ...list,
        name: list.name === "string" ? "Untitled List" : list.name
      }
      
      console.log(`✅ Adding list from WebSocket:`, fixedList)
      return [...prev, fixedList]
    })
  }, [])

  const handleListUpdated = useCallback((list: List) => {
    console.log(`📥 Received list_updated WebSocket event:`, list)
    console.log(`🔍 List data structure:`, {
      id: list.id,
      name: list.name,
      position: list.position,
      board_id: list.board_id
    })
    
    setLists((prev) => {
      console.log(`📋 Current lists in state:`, prev.map(l => ({ id: l.id, name: l.name })))
      
      const existingList = prev.find((l) => l.id === list.id)
      if (!existingList) {
        console.log(`⚠️ List not found in state, adding new list:`, list.id)
        return [...prev, list]
      }
      
      console.log(`🔄 Updating existing list:`, {
        old: { id: existingList.id, name: existingList.name, position: existingList.position },
        new: { id: list.id, name: list.name, position: list.position }
      })
      
      const updatedLists = prev.map((l) => (l.id === list.id ? list : l))
      console.log(`✅ Updated lists state:`, updatedLists.map(l => ({ id: l.id, name: l.name })))
      return updatedLists
    })
  }, [])

  const handleListDeleted = useCallback((data: any) => {
    // Handle both data formats: string or {id: string}
    const listId = typeof data === 'string' ? data : data.id
    console.log(`📥 Received list_deleted WebSocket event for listId:`, listId)
    
    setLists((prev) => {
      const existingList = prev.find((l) => l.id === listId)
      if (!existingList) {
        console.log(`⚠️ List not found in state, nothing to delete:`, listId)
        return prev
      }
      
      console.log(`🗑️ Removing list from state:`, listId)
      return prev.filter((l) => l.id !== listId)
    })
    
    setCards((prev) => {
      const cardsToRemove = prev.filter((c) => {
        // Handle both card.list.id and card.list_id formats
        const cardListId = c.list?.id || c.list_id
        return cardListId === listId
      })
      
      if (cardsToRemove.length > 0) {
        console.log(`🗑️ Removing ${cardsToRemove.length} cards from deleted list:`, listId)
        return prev.filter((c) => {
          const cardListId = c.list?.id || c.list_id
          return cardListId !== listId
        })
      }
      
      return prev
    })
  }, [])

  // Load data - useEffect placed after all handlers to avoid dependency issues
  useEffect(() => {
    console.log(`🔁 useEffect triggered for boardId: ${boardId}`)
    if (boardId) {
      loadBoardData()
      
      // Add a small delay in development mode to prevent immediate cleanup
      const connectTimeout = setTimeout(() => {
        connectWebSocket()
      }, process.env.NODE_ENV === 'development' ? 100 : 0)

      return () => {
        clearTimeout(connectTimeout)
        
        // Only disconnect if WebSocket is actually connected
        if (wsClient.isConnected()) {
          console.log(`🔍 [WEBSOCKET DEBUG] Component unmounting, disconnecting WebSocket`)
          // Cleanup WebSocket listeners
          wsClient.off("card_created", handleCardCreated)
          wsClient.off("card_updated", handleCardUpdated)
          wsClient.off("card_moved", handleCardMoved)
          wsClient.off("card_deleted", handleCardDeleted)
          wsClient.off("list_created", handleListCreated)
          wsClient.off("list_updated", handleListUpdated)
          wsClient.off("list_deleted", handleListDeleted)
          wsClient.disconnect()
        } else {
          console.log(`🔍 [WEBSOCKET DEBUG] Component unmounting, WebSocket not connected, skipping disconnect`)
        }
      }
    }
  }, [boardId, loadBoardData, connectWebSocket]) // Only include callbacks as deps

  // Card operations
  const handleAddCard = (listId: string) => {
    console.log("➕ Opening add card form for list:", listId)
    setDefaultListId(listId)
    setEditingCard(null)
    setIsCardFormOpen(true)
  }

  const handleEditCard = (card: Card) => {
    console.log("✏️ Opening edit card form for card:", card.id)
    setEditingCard(card)
    setDefaultListId("")
    setIsCardFormOpen(true)
  }

  const handleCardFormSubmit = async (data: CardFormData) => {
    try {
      if (editingCard) {
        // Update existing card
        const response = await apiClient.cards.updateCard({
          id: editingCard.id,
          ...data,
        })
        
        // Don't update state here - let WebSocket handle it
        // This prevents conflicts when both API response and WebSocket update state
        // The WebSocket event will be received and handleCardUpdated will update the card
        
        toast({
          title: "Cập nhật thành công",
          description: "Card đang được cập nhật...",
        })
      } else {
        // Create new card
        const response = await apiClient.cards.createCard({
          ...data,
          board_id: boardId, // Add board_id to create request
        })
        console.log("✅ Card created successfully:", response)
        
        // Extract card data from response
        const newCard = (response as any).data || response
        console.log("📝 Extracted card data:", newCard)
        
        // DON'T add to state here - let WebSocket event handle it to avoid duplicates
        // The card will be added via handleCardCreated when WebSocket event is received
        
        // Note: Backend will broadcast the card_created event automatically
        
        toast({
          title: "Tạo thành công",
          description: "Card mới đã được tạo",
        })
      }
    } catch (error: any) {
      throw new Error(error.message || "Có lỗi xảy ra")
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    console.log("🗑️ Deleting card:", cardId)
    try {
      await apiClient.cards.deleteCards([cardId])
      console.log("✅ Card deleted from API")
      
      // Don't update state here - let WebSocket handle it
      // This prevents conflicts when both API response and WebSocket update state
      // The WebSocket event will be received and handleCardDeleted will remove the card
      
      toast({
        title: "Xóa thành công",
        description: "Card đang được xóa...",
      })
    } catch (error: any) {
      console.error("❌ Delete card error:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa card",
        variant: "destructive",
      })
    }
  }

  // List operations
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim()) return

    try {
      setIsCreatingList(true)
      
      // Don't add list to state immediately - wait for WebSocket event
      // This prevents duplicate lists when both API response and WebSocket update state
      
      const response = await apiClient.lists.createList({
        board_id: boardId,
        name: newListTitle,
        position: lists.length + 1,
      })
      
      // Don't update state here - let WebSocket handle it
      // The WebSocket event will be received and handleListCreated will add the list
      
      setNewListTitle("")
      setIsCreateListDialogOpen(false)
      
      toast({
        title: "Tạo thành công",
        description: "List mới đang được tạo...",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo list",
        variant: "destructive",
      })
    } finally {
      setIsCreatingList(false)
    }
  }

  const handleEditList = async (list: List) => {
    try {
      console.log(`🔄 Updating list via API:`, { id: list.id, name: list.name, position: list.position })
      console.log(`🔍 WebSocket connection status:`, wsClient.isConnected())
      
      const response = await apiClient.lists.updateList({
        id: list.id,
        name: list.name,
        position: list.position,
      })
      
      console.log(`✅ API response received:`, response)
      console.log(`⏳ Waiting for WebSocket list_updated event...`)
      
      // Don't update state here - let WebSocket handle it
      // This prevents conflicts when both API response and WebSocket update state
      // The WebSocket event will be received and handleListUpdated will update the list
      
      toast({
        title: "Cập nhật thành công",
        description: "List đang được cập nhật...",
      })
    } catch (error: any) {
      console.error(`❌ Error updating list:`, error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật list",
        variant: "destructive",
      })
    }
  }

  const handleDeleteList = (listId: string) => {
    // Find the list by ID to show in confirmation dialog
    const list = lists.find(l => l.id === listId)
    if (!list) return
    
    // Open delete confirmation dialog instead of deleting immediately
    setListToDelete(list)
    setIsDeleteListDialogOpen(true)
  }

  const confirmDeleteList = async () => {
    if (!listToDelete) return
    
    try {
      setIsDeletingList(true)
      await apiClient.lists.deleteLists([listToDelete.id])
      
      // Don't update state here - let WebSocket handle it
      // This prevents conflicts when both API response and WebSocket update state
      // The WebSocket event will be received and handleListDeleted will remove the list
      
      toast({
        title: "Xóa thành công",
        description: "List đang được xóa...",
      })
      
      // Close dialog
      setIsDeleteListDialogOpen(false)
      setListToDelete(null)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa list",
        variant: "destructive",
      })
    } finally {
      setIsDeletingList(false)
    }
  }

  // Board operations
  const handleDeleteBoard = async () => {
    try {
      setIsDeletingBoard(true)
      await apiClient.boards.deleteBoards([boardId])
      
      toast({
        title: "Xóa thành công",
        description: "Board đã được xóa",
      })
      
      // Redirect to boards page
      router.push("/boards")
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa board",
        variant: "destructive",
      })
    } finally {
      setIsDeletingBoard(false)
      setIsDeleteBoardDialogOpen(false)
    }
  }

  // Enhanced drag and drop
  const handleDropEnhanced = async (listId: string, dropIndex: number) => {
    if (!enhancedDraggedCard) return

    console.log(`🎯 Enhanced drop handler:`, {
      cardId: enhancedDraggedCard.id,
      targetListId: listId,
      dropIndex,
      totalCards: cards.length
    })

    try {
      // Calculate optimal position using enhanced algorithm
      console.log(`🎯 Calling calculateDropPosition with:`, {
        listId,
        dropIndex,
        cardsCount: cards.length,
        draggedCardId: enhancedDraggedCard.id
      })
      
      const positionResult = calculateDropPosition(listId, dropIndex, cards)
      console.log(`📍 Position result:`, positionResult)
      
      if (!positionResult) {
        console.error(`❌ Position calculation failed for:`, {
          listId,
          dropIndex,
          draggedCardId: enhancedDraggedCard.id,
          cards: cards.map(c => ({ 
            id: c.id, 
            name: c.name, 
            listId: c.list?.id || c.list_id, 
            position: c.position 
          }))
        })
        throw new Error("Failed to calculate drop position")
      }

      console.log(`📍 Calculated position:`, {
        position: positionResult.position,
        confidence: positionResult.confidence,
        needsValidation: positionResult.needsServerValidation
      })

      // API call function - convert fractional position to number for API compatibility
      const apiCall = async (optimisticCard: Card) => {
        // Convert fractional position to decimal number for API
        const numericPosition = PositionManager.positionToNumber(positionResult.position)
        
        console.log(`🔢 Position conversion:`, {
          fractionalPosition: positionResult.position,
          numericPosition,
          confidence: positionResult.confidence
        })
        
        const response = await apiClient.cards.moveCard({
          id: optimisticCard.id,
          list_id: listId,
          position: numericPosition
        })
        return (response as any).data || response
      }

      // Execute with optimistic updates
      const result = await executeOptimisticMove(
        listId,
        dropIndex,
        cards,
        apiCall
      )

      if (result) {
        console.log(`✅ Enhanced move completed:`, {
          cardId: result.id,
          fractionalPosition: positionResult.position,
          finalNumericPosition: result.position,
          confidence: positionResult.confidence,
          needsServerValidation: positionResult.needsServerValidation,
          performance: getPerformanceMetrics()
        })

        toast({
          title: "Di chuyển thành công",
          description: `"${result.name}" đã được di chuyển`,
        })
      }

    } catch (error: any) {
      console.error(`❌ Enhanced move failed:`, error)
      
      // Rollback failed move
      const rolledBackCard = rollbackFailedMove(enhancedDraggedCard.id)
      if (rolledBackCard) {
        setCards((prev) => prev.map((c) => (c.id === rolledBackCard.id ? rolledBackCard : c)))
      }
      
      toast({
        title: "Lỗi",
        description: "Không thể di chuyển card",
        variant: "destructive",
      })
    }

    enhancedDragEnd()
  }

  // Legacy drag and drop (current implementation)
  const handleDrop = async (listId: string, position: number) => {
    if (!draggedCard) return

    console.log(`🎯 handleDrop called - Card: ${draggedCard.name}`)
    console.log(`🔍 Full draggedCard structure:`, draggedCard)
    console.log(`📍 From: ${draggedCard.list_id || draggedCard.list?.id || 'UNDEFINED'}, To: ${listId}`)
    console.log(`📍 Position: ${position}`)

    const currentListId = draggedCard.list_id || draggedCard.list?.id
    
    // Calculate the actual position considering other cards
    const targetListCards = cards.filter(card => 
      (card.list_id || card.list?.id) === listId && card.id !== draggedCard.id
    )
    
    // Sort cards by position to get correct ordering
    targetListCards.sort((a, b) => (a.position || 0) - (b.position || 0))
    
    console.log(`📍 Target list cards:`, targetListCards.map(c => ({ 
      id: c.id, 
      name: c.name, 
      position: c.position 
    })))
    console.log(`📍 Drop position: ${position} (out of ${targetListCards.length})`)
    
    let finalPosition: number
    
    if (targetListCards.length === 0) {
      // Empty list - use position 1000
      finalPosition = 1000
      console.log(`📍 Empty list -> position: ${finalPosition}`)
    } else if (position === 0) {
      // Drop at beginning - position before first card
      finalPosition = Math.max(0, (targetListCards[0]?.position || 1000) - 1000)
      console.log(`📍 Drop at beginning -> position: ${finalPosition}`)
    } else if (position >= targetListCards.length) {
      // Drop at end - position after last card
      finalPosition = (targetListCards[targetListCards.length - 1]?.position || 0) + 1000
      console.log(`📍 Drop at end -> position: ${finalPosition}`)
    } else {
      // Drop between cards - position between two cards
      const prevCard = targetListCards[position - 1]
      const nextCard = targetListCards[position]
      finalPosition = ((prevCard?.position || 0) + (nextCard?.position || 1000)) / 2
      console.log(`📍 Drop between cards -> prev: ${prevCard?.position}, next: ${nextCard?.position}, final: ${finalPosition}`)
    }

    // Check if this is the same position and list (no actual change)
    if (currentListId === listId && Math.abs((draggedCard.position || 0) - finalPosition) < 1) {
      console.log("📍 Same position - no movement needed")
      handleDragEnd()
      return
    }

    try {
      // Call API to update server with calculated position
      console.log(`📡 Calling moveCard API:`, {
        id: draggedCard.id,
        list_id: listId,
        position: finalPosition
      })
      
      const response = await apiClient.cards.moveCard({
        id: draggedCard.id,
        list_id: listId,
        position: finalPosition,
      })
      console.log("✅ Card moved successfully via API:", response)

      // DON'T update state here - let WebSocket event handle it to avoid conflicts
      // The card will be updated via handleCardMoved when WebSocket event is received
      
      // Note: Backend will broadcast the card_moved event automatically
      console.log("⏳ Waiting for WebSocket card_moved event...")
      
      // DON'T use fallback timeout since WebSocket is working properly
      // The card will be updated via handleCardMoved when WebSocket event is received

    } catch (error: any) {
      console.error(`❌ Failed to move card:`, error)
      
      toast({
        title: "Lỗi",
        description: "Không thể di chuyển card",
        variant: "destructive",
      })
    }

    handleDragEnd()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/boards")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>

              <div>
                <h1 className="text-lg font-semibold text-gray-900">{board?.name}</h1>
                {board?.description && <p className="text-sm text-gray-600">{board.description}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsDeleteBoardDialogOpen(true)}
                className="h-8 px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Board content */}
      <div className="p-6">
        <div className="flex space-x-6 overflow-x-auto pb-6 board-container">
          {lists.map((list) => {
            const listCards = cards
              .filter((card) => {
                // FIXED: Prioritize card.list_id over card.list?.id because list_id is always up-to-date
                const cardListId = card.list_id || card.list?.id
                const matches = cardListId === list.id
                
                // Debug logging removed - position logic now handles card movements properly
                
                return matches
              })
              .sort((a, b) => (a.position || 0) - (b.position || 0)) // Sort by position
            
            console.log(`📋 List ${list.name} (${list.id}) has ${listCards.length} cards:`, 
              listCards.map(c => ({ id: c.id, name: c.name, position: c.position })))
            
            return (
              <ListColumn
                key={list.id || `list-${list.position}-${list.name}`}
                list={list}
                cards={listCards}
                labels={labels}
                users={users}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onEditList={handleEditList}
                onDeleteList={handleDeleteList}
                onDragStart={enhancedDragStart}
                onDragEnd={enhancedDragEnd}
                onDragOver={(listId, cardId, position) => enhancedDragOver(listId, position)}
                onDragLeave={enhancedDragLeave}
                onDrop={handleDropEnhanced}
                draggedCard={enhancedDraggedCard}
                draggedOverList={enhancedDraggedOverList}
                onCardClick={handleCardClick}
                isDraggingOver={enhancedIsDraggingOver}
                getDropPosition={(listId) => enhancedIsDraggingOver(listId) ? 0 : null}
              />
            )
          })}

          {/* Add List Button */}
          <div className="w-80 flex-shrink-0">
            <Button
              variant="outline"
              className="w-full h-10 border-dashed bg-transparent"
              onClick={() => setIsCreateListDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm list
            </Button>
          </div>
        </div>
      </div>

      {/* Card Form */}
      <CardForm
        isOpen={isCardFormOpen}
        onClose={() => setIsCardFormOpen(false)}
        onSubmit={handleCardFormSubmit}
        card={editingCard}
        lists={lists}
        labels={labels}
        defaultListId={defaultListId}
        users={users}
      />

      {/* Create List Dialog */}
      <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateList}>
            <DialogHeader>
              <DialogTitle>Tạo List Mới</DialogTitle>
              <DialogDescription>Tạo một list mới để tổ chức các card</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Input
                placeholder="Tên list..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                required
                disabled={isCreatingList}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateListDialogOpen(false)}
                disabled={isCreatingList}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isCreatingList}>
                {isCreatingList ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Card Detail Sidebar */}
      <CardDetailSidebar
        card={selectedCard}
        lists={lists}
        labels={labels}
        isOpen={isCardDetailOpen}
        onClose={() => {
          setIsCardDetailOpen(false)
          setSelectedCard(null)
        }}
        onUpdate={handleCardUpdate}
        users={users}
      />



      {/* Delete List Dialog */}
      <Dialog open={isDeleteListDialogOpen} onOpenChange={setIsDeleteListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa list</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa list <strong>"{listToDelete?.name}"</strong> không? 
              Hành động này sẽ xóa tất cả các card trong list và không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteListDialogOpen(false)
              setListToDelete(null)
            }}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmDeleteList} disabled={isDeletingList}>
              {isDeletingList ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Board Dialog */}
      <Dialog open={isDeleteBoardDialogOpen} onOpenChange={setIsDeleteBoardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa board</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa board này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteBoardDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteBoard} disabled={isDeletingBoard}>
              {isDeletingBoard ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
