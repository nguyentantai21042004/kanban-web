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

  // List drag and drop
  const [isDraggingList, setIsDraggingList] = useState(false)
  const [draggedList, setDraggedList] = useState<List | null>(null)



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
    if (typeof window !== 'undefined') {
      positionConfigManager.updateConfig({ enableDebugLogging: true })
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
      // Load board error
    } finally {
      setIsLoading(false)
    }
  }, [boardId])

  const connectWebSocket = useCallback(async () => {
    try {
      await wsClient.connect(boardId)
      
      // Listen for real-time updates
      wsClient.on("card_created", handleCardCreated)
      wsClient.on("card_updated", handleCardUpdated)
      wsClient.on("card_moved", handleCardMoved)
      wsClient.on("card_deleted", handleCardDeleted)
      wsClient.on("list_created", handleListCreated)
      wsClient.on("list_updated", handleListUpdated)
      wsClient.on("list_deleted", handleListDeleted)
      wsClient.on("list_moved", handleListMoved)
    } catch (error) {
      // WebSocket is optional for the app to work
    }
  }, [boardId])

  // WebSocket event handlers
  const handleCardCreated = useCallback((card: Card) => {
    setCards((prev) => {
      // Check if card already exists to prevent duplicates
      const existingCard = prev.find((c) => c.id === card.id)
      
      if (existingCard) {
        return prev
      }
      
      // Normalize card to ensure list_id is available
      const normalizedCard = {
        ...card,
        list_id: card.list_id || card.list?.id
      }
      
      return [...prev, normalizedCard]
    })
  }, [])

  const handleCardUpdated = useCallback((card: Card) => {
    setCards((prev) => {
      const existingCard = prev.find((c) => c.id === card.id)
      if (!existingCard) {
        // Normalize card before adding
        const normalizedCard = {
          ...card,
          list_id: card.list_id || card.list?.id
        }
        return [...prev, normalizedCard]
      }
      
      return prev.map((c) => (c.id === card.id ? card : c))
    })
  }, [])

  const handleCardMoved = useCallback((card: Card) => {
    setCards((prev) => {
      // Find existing card
      const existingCard = prev.find((c) => c.id === card.id)
      
      if (!existingCard) {
        // Normalize card before adding
        const normalizedCard: Card = {
          ...card,
          list_id: card.list_id || card.list?.id,
          list: card.list || { id: card.list_id || 'unknown', name: 'Unknown List' }
        }
        return [...prev, normalizedCard]
      }
      
      // Update existing card with new data, preserving any missing fields
      const updatedCard: Card = {
        ...existingCard,
        ...card,
        // FIXED: Always update list object to match new list_id
        list: card.list_id ? { id: card.list_id, name: card.list?.name || existingCard.list?.name || 'Unknown List' } : (card.list || existingCard.list),
        list_id: card.list_id || card.list?.id || existingCard.list_id
      }
      
      return prev.map((c) => (c.id === card.id ? updatedCard : c))
    })
  }, [])

  const handleCardDeleted = useCallback((data: any) => {
    // Handle both data formats: string or {id: string}
    const cardId = typeof data === 'string' ? data : data.id
    
    setCards((prev) => {
      const existingCard = prev.find((c) => c.id === cardId)
      if (!existingCard) {
        return prev
      }
      
      return prev.filter((c) => c.id !== cardId)
    })
  }, [])

  const handleListCreated = useCallback((list: List) => {
    setLists((prev) => {
      // Check if list already exists to prevent duplicates
      const exists = prev.some((l) => l.id === list.id)
      if (exists) {
        return prev
      }
      
      // Fix title if API returns "string" instead of actual title
      const fixedList = {
        ...list,
        name: list.name === "string" ? "Untitled List" : list.name
      }
      
      return [...prev, fixedList]
    })
  }, [])

  const handleListUpdated = useCallback((list: List) => {
    setLists((prev) => {
      const existingList = prev.find((l) => l.id === list.id)
      if (!existingList) {
        return [...prev, list]
      }
      
      return prev.map((l) => (l.id === list.id ? list : l))
    })
  }, [])

  const handleListDeleted = useCallback((data: any) => {
    // Handle both data formats: string or {id: string}
    const listId = typeof data === 'string' ? data : data.id
    
    setLists((prev) => {
      const existingList = prev.find((l) => l.id === listId)
      if (!existingList) {
        return prev
      }
      
      return prev.filter((l) => l.id !== listId)
    })
    
    setCards((prev) => {
      return prev.filter((c) => {
        // Handle both card.list.id and card.list_id formats
        const cardListId = c.list?.id || c.list_id
        return cardListId !== listId
      })
    })
  }, [])

  const handleListMoved = useCallback((data: any) => {
    if (data.board_id === boardId) {
      setLists(prevLists => {
        const updatedLists = prevLists.map(list => {
          if (list.id === data.id) {
            return {
              ...list,
              position: data.position
            }
          }
          return list
        })
        
        // Sort lists by position (a > ab > b logic)
        const sortedLists = updatedLists.sort((a, b) => {
          if (a.position === b.position) return 0
          if (a.position < b.position) return -1
          return 1
        })
        
        return sortedLists
      })
    }
  }, [boardId])

  // Load data - useEffect placed after all handlers to avoid dependency issues
  useEffect(() => {

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

          // Cleanup WebSocket listeners
          wsClient.off("card_created", handleCardCreated)
          wsClient.off("card_updated", handleCardUpdated)
          wsClient.off("card_moved", handleCardMoved)
          wsClient.off("card_deleted", handleCardDeleted)
          wsClient.off("list_created", handleListCreated)
          wsClient.off("list_updated", handleListUpdated)
          wsClient.off("list_deleted", handleListDeleted)
          wsClient.off("list_moved", handleListMoved)
          wsClient.disconnect()
        } else {

        }
      }
    }
  }, [boardId, loadBoardData, connectWebSocket]) // Only include callbacks as deps

  // Card operations
  const handleAddCard = (listId: string) => {

    setDefaultListId(listId)
    setEditingCard(null)
    setIsCardFormOpen(true)
  }

  const handleEditCard = (card: Card) => {

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
        // Extract card data from response
        const newCard = (response as any).data || response
        
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
    try {
      await apiClient.cards.deleteCards([cardId])
      
      // Don't update state here - let WebSocket handle it
      // This prevents conflicts when both API response and WebSocket update state
      // The WebSocket event will be received and handleCardDeleted will remove the card
      
      toast({
        title: "Xóa thành công",
        description: "Card đang được xóa...",
      })
    } catch (error: any) {
      // Delete card error
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
      const response = await apiClient.lists.updateList({
        id: list.id,
        name: list.name,
        position: list.position,
      })
      
      // Don't update state here - let WebSocket handle it
      // This prevents conflicts when both API response and WebSocket update state
      // The WebSocket event will be received and handleListUpdated will update the list
      
      toast({
        title: "Cập nhật thành công",
        description: "List đang được cập nhật...",
      })
    } catch (error: any) {
      // Error updating list
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

  // List drag and drop handlers
  const handleListDragStart = (list: List) => {
    setIsDraggingList(true)
    setDraggedList(list)
  }

  const handleListDragEnd = () => {
    setIsDraggingList(false)
    setDraggedList(null)
  }

  const handleListDrop = async (targetList: List, position: 'before' | 'after') => {
    if (!draggedList || draggedList.id === targetList.id) return

    try {
      // Get current sorted lists to determine correct position
      const sortedLists = lists.sort((a, b) => {
        const posA = String(a.position || "0")
        const posB = String(b.position || "0")
        return posA.localeCompare(posB)
      })

      // Find target list index in sorted array
      const targetIndex = sortedLists.findIndex(l => l.id === targetList.id)
      
      let moveData: any = {
        id: draggedList.id,
        board_id: boardId
      }

      if (position === 'before') {
        // Want to place BEFORE target list
        if (targetIndex > 0) {
          // Not the first list - use after_id of previous list
          const previousList = sortedLists[targetIndex - 1]
          moveData.after_id = previousList.id
        } else {
          // Target is first list - use before_id of target
          moveData.before_id = targetList.id
        }
      } else {
        // Want to place AFTER target list
        if (targetIndex < sortedLists.length - 1) {
          // Not the last list - use before_id of next list
          const nextList = sortedLists[targetIndex + 1]
          moveData.before_id = nextList.id
        } else {
          // Target is last list - use after_id of target
          moveData.after_id = targetList.id
        }
      }

      const response = await apiClient.lists.moveList(moveData)
      
      toast({
        title: "Di chuyển thành công",
        description: `List "${draggedList.name}" đã được di chuyển`,
      })
    } catch (error: any) {
      // List move failed
      toast({
        title: "Lỗi",
        description: "Không thể di chuyển list",
        variant: "destructive",
      })
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

    try {
      // Calculate optimal position using enhanced algorithm
      const positionResult = calculateDropPosition(listId, dropIndex, cards)
      
      if (!positionResult) {
        throw new Error("Failed to calculate drop position")
      }

      // API call function - convert fractional position to number for API compatibility
      const apiCall = async (optimisticCard: Card) => {
        // Convert fractional position to decimal number for API
        const numericPosition = PositionManager.positionToNumber(positionResult.position)
        
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
        toast({
          title: "Di chuyển thành công",
          description: `"${result.name}" đã được di chuyển`,
        })
      }

    } catch (error: any) {
      // Enhanced move failed
      
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

    const currentListId = draggedCard.list_id || draggedCard.list?.id
    
    // Calculate the actual position considering other cards
    const targetListCards = cards.filter(card => 
      (card.list_id || card.list?.id) === listId && card.id !== draggedCard.id
    )
    
    // Sort cards by position to get correct ordering
    targetListCards.sort((a, b) => (a.position || 0) - (b.position || 0))
    
    let finalPosition: number
    
    if (targetListCards.length === 0) {
      // Empty list - use position 1000
      finalPosition = 1000
    } else if (position === 0) {
      // Drop at beginning - position before first card
      finalPosition = Math.max(0, (targetListCards[0]?.position || 1000) - 1000)
    } else if (position >= targetListCards.length) {
      // Drop at end - position after last card
      finalPosition = (targetListCards[targetListCards.length - 1]?.position || 0) + 1000
    } else {
      // Drop between cards - position between two cards
      const prevCard = targetListCards[position - 1]
      const nextCard = targetListCards[position]
      finalPosition = ((prevCard?.position || 0) + (nextCard?.position || 1000)) / 2
    }

    // Check if this is the same position and list (no actual change)
    if (currentListId === listId && Math.abs((draggedCard.position || 0) - finalPosition) < 1) {
      handleDragEnd()
      return
    }

    try {
      // Call API to update server with calculated position
      const response = await apiClient.cards.moveCard({
        id: draggedCard.id,
        list_id: listId,
        position: finalPosition,
      })

      // DON'T update state here - let WebSocket event handle it to avoid conflicts
      // The card will be updated via handleCardMoved when WebSocket event is received

    } catch (error: any) {
      // Failed to move card
      
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
          {lists
            .sort((a, b) => {
              // Sort lists by position using base-36 logic (same as Go)
              const posA = String(a.position || "0")
              const posB = String(b.position || "0")
              return posA.localeCompare(posB)
            })
                        .map((list) => {
              const listCards = cards
              .filter((card) => {
                const cardListId = card.list_id || card.list?.id
                return cardListId === list.id
              })
              .sort((a, b) => (a.position || 0) - (b.position || 0))
            
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
                // List drag and drop props
                isDraggingList={isDraggingList}
                draggedList={draggedList}
                onListDragStart={handleListDragStart}
                onListDragEnd={handleListDragEnd}
                onListDrop={handleListDrop}
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
