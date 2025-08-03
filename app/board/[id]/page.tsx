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
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { wsClient } from "@/lib/websocket"
import type { Board, List, Card, Label } from "@/lib/types"
import { ArrowLeft, Plus, Loader2, RefreshCw } from "lucide-react"

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

  // Drag and drop
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

  // Load data
  useEffect(() => {
    if (boardId) {
      loadBoardData()
      connectWebSocket()
    }

    return () => {
      wsClient.disconnect()
    }
  }, [boardId])

  const loadBoardData = async () => {
    try {
      setIsLoading(true)
      setError("")

      const [boardData, listsData, cardsData, labelsData] = await Promise.all([
        apiClient.getBoardById(boardId),
        apiClient.getLists(),
        apiClient.getCards(),
        apiClient.getLabels(),
      ])

      setBoard(boardData)
      setLists(listsData.data?.items?.filter((list) => list.board_id === boardId) || [])
      setCards(cardsData.data?.items || [])
      setLabels(labelsData.data?.items?.filter((label) => label.board_id === boardId) || [])
    } catch (error: any) {
      setError("Không thể tải dữ liệu board")
      console.error("Load board error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const connectWebSocket = async () => {
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
    } catch (error) {
      console.error("WebSocket connection failed:", error)
    }
  }

  // WebSocket event handlers
  const handleCardCreated = useCallback(
    (card: Card) => {
      setCards((prev) => [...prev, card])
      toast({
        title: "Card mới được tạo",
        description: `"${card.title}" đã được thêm vào board`,
      })
    },
    [toast],
  )

  const handleCardUpdated = useCallback((card: Card) => {
    setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
  }, [])

  const handleCardMoved = useCallback((card: Card) => {
    console.log(`📥 Received card_moved event:`, card)
    
    setCards((prev) => {
      // Remove card from current position first
      const withoutCard = prev.filter((c) => c.id !== card.id)
      // Add card to new position
      return [...withoutCard, card]
    })
  }, [])

  const handleCardDeleted = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId))
  }, [])

  const handleListCreated = useCallback((list: List) => {
    setLists((prev) => [...prev, list])
  }, [])

  const handleListUpdated = useCallback((list: List) => {
    setLists((prev) => prev.map((l) => (l.id === list.id ? list : l)))
  }, [])

  const handleListDeleted = useCallback((listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId))
    setCards((prev) => prev.filter((c) => c.list_id !== listId))
  }, [])

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
        const updatedCard = await apiClient.updateCard({
          id: editingCard.id,
          ...data,
        })
        setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)))
        
        // Send websocket event for real-time updates
        wsClient.send({
          type: "card_updated",
          data: {
            id: updatedCard.id,
            list_id: updatedCard.list_id,
            position: updatedCard.position,
            title: updatedCard.title,
            description: updatedCard.description,
            priority: updatedCard.priority,
            labels: updatedCard.labels,
            due_date: updatedCard.due_date,
            is_archived: updatedCard.is_archived,
            created_by: updatedCard.created_by,
            created_at: updatedCard.created_at,
            updated_at: updatedCard.updated_at,
          },
        })
        
        toast({
          title: "Cập nhật thành công",
          description: "Card đã được cập nhật",
        })
      } else {
        // Create new card
        const newCard = await apiClient.createCard(data)
        setCards((prev) => [...prev, newCard])
        
        // Send websocket event for real-time updates
        wsClient.send({
          type: "card_created",
          data: {
            id: newCard.id,
            list_id: newCard.list_id,
            position: newCard.position,
            title: newCard.title,
            description: newCard.description,
            priority: newCard.priority,
            labels: newCard.labels,
            due_date: newCard.due_date,
            is_archived: newCard.is_archived,
            created_by: newCard.created_by,
            created_at: newCard.created_at,
            updated_at: newCard.updated_at,
          },
        })
        
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
      await apiClient.deleteCards([cardId])
      setCards((prev) => prev.filter((c) => c.id !== cardId))
      
      // Send websocket event for real-time updates
      wsClient.send({
        type: "card_deleted",
        data: {
          id: cardId,
        },
      })
      
      toast({
        title: "Xóa thành công",
        description: "Card đã được xóa",
      })
    } catch (error: any) {
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
      const newList = await apiClient.createList({
        board_id: boardId,
        title: newListTitle,
        position: lists.length + 1,
      })

      setLists((prev) => [...prev, newList])
      setNewListTitle("")
      setIsCreateListDialogOpen(false)
      
      // Send websocket event for real-time updates
      wsClient.send({
        type: "list_created",
        data: {
          id: newList.id,
          board_id: newList.board_id,
          title: newList.title,
          position: newList.position,
          is_archived: newList.is_archived,
          created_by: newList.created_by,
          created_at: newList.created_at,
          updated_at: newList.updated_at,
        },
      })

      toast({
        title: "Tạo thành công",
        description: "List mới đã được tạo",
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
      const updatedList = await apiClient.updateList({
        id: list.id,
        title: list.title,
        position: list.position,
      })

      setLists((prev) => prev.map((l) => (l.id === updatedList.id ? updatedList : l)))
      
      // Send websocket event for real-time updates
      wsClient.send({
        type: "list_updated",
        data: {
          id: updatedList.id,
          board_id: updatedList.board_id,
          title: updatedList.title,
          position: updatedList.position,
          is_archived: updatedList.is_archived,
          created_by: updatedList.created_by,
          created_at: updatedList.created_at,
          updated_at: updatedList.updated_at,
        },
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật list",
        variant: "destructive",
      })
    }
  }

  const handleDeleteList = async (listId: string) => {
    try {
      await apiClient.deleteLists([listId])
      setLists((prev) => prev.filter((l) => l.id !== listId))
      setCards((prev) => prev.filter((c) => c.list_id !== listId))
      
      // Send websocket event for real-time updates
      wsClient.send({
        type: "list_deleted",
        data: {
          id: listId,
        },
      })

      toast({
        title: "Xóa thành công",
        description: "List đã được xóa",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa list",
        variant: "destructive",
      })
    }
  }

  // Drag and drop
  const handleDrop = async (listId: string, position: number) => {
    if (!draggedCard) return

    console.log(`🎯 Drop - Card: ${draggedCard.title}, List: ${listId}, Position: ${position}`)

    try {
      // Optimistic update - update UI immediately
      const isSameList = draggedCard.list_id === listId
      
      // Store original state for rollback
      const originalCards = [...cards]
      
      // Remove card from current position
      setCards((prev) => prev.filter((c) => c.id !== draggedCard.id))
      
      // Add card to new position
      setCards((prev) => {
        const cardsInList = prev.filter((c) => c.list_id === listId)
        const otherCards = prev.filter((c) => c.list_id !== listId)
        
        // Validate position bounds
        const validPosition = Math.max(0, Math.min(position, cardsInList.length))
        
        // Insert card at new position
        const newCardsInList = [...cardsInList]
        newCardsInList.splice(validPosition, 0, {
          ...draggedCard,
          list_id: listId,
          position: validPosition,
        })
        
        // Update positions for cards after the inserted position
        for (let i = validPosition + 1; i < newCardsInList.length; i++) {
          newCardsInList[i] = {
            ...newCardsInList[i],
            position: i,
          }
        }
        
        // Update positions for cards in source list (if different list)
        if (!isSameList) {
          const cardsInSourceList = otherCards.filter((c) => c.list_id === draggedCard.list_id)
          const updatedCardsInSourceList = cardsInSourceList.map((card, index) => ({
            ...card,
            position: index,
          }))
          const otherCardsWithoutSource = otherCards.filter((c) => c.list_id !== draggedCard.list_id)
          return [...otherCardsWithoutSource, ...updatedCardsInSourceList, ...newCardsInList]
        }
        
        return [...otherCards, ...newCardsInList]
      })

      // Call API to update server with calculated position
      const updatedCard = await apiClient.moveCard({
        id: draggedCard.id,
        list_id: listId,
        position: position, // Send the target position, BE will calculate actual position
      })

      console.log(`📥 API Response:`, updatedCard)

      // Update with server response (which has the actual calculated position)
      setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)))

      // Send websocket event for real-time updates
      wsClient.send({
        type: "card_moved",
        data: {
          id: updatedCard.id,
          list_id: updatedCard.list_id,
          position: updatedCard.position,
          title: updatedCard.title,
          description: updatedCard.description,
          priority: updatedCard.priority,
          labels: updatedCard.labels,
          due_date: updatedCard.due_date,
          is_archived: updatedCard.is_archived,
          created_by: updatedCard.created_by,
          created_at: updatedCard.created_at,
          updated_at: updatedCard.updated_at,
        },
      })

      console.log(`✅ Card moved successfully: ${updatedCard.title} to position ${updatedCard.position}`)
    } catch (error: any) {
      console.error(`❌ Failed to move card:`, error)
      
      // Revert optimistic update on error
      setCards(originalCards)
      
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

            <Button variant="ghost" size="sm" onClick={loadBoardData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      {/* Board content */}
      <div className="p-6">
        <div className="flex space-x-6 overflow-x-auto pb-6 board-container">
          {lists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              cards={cards.filter((card) => card.list_id === list.id)}
              labels={labels}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              onEditList={handleEditList}
              onDeleteList={handleDeleteList}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              draggedCard={draggedCard}
              draggedOverList={draggedOverList}
              onCardClick={handleCardClick}
              isDraggingOver={isDraggingOver}
              getDropPosition={getDropPosition}
            />
          ))}

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
      />
    </div>
  )
}
