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
      // Cleanup WebSocket listeners
      wsClient.off("card_created", handleCardCreated)
      wsClient.off("card_updated", handleCardUpdated)
      wsClient.off("card_moved", handleCardMoved)
      wsClient.off("card_deleted", handleCardDeleted)
      wsClient.off("list_created", handleListCreated)
      wsClient.off("list_updated", handleListUpdated)
      wsClient.off("list_deleted", handleListDeleted)
      wsClient.disconnect()
    }
  }, [boardId]) // Only depend on boardId

  const loadBoardData = async () => {
    try {
      setIsLoading(true)
      setError("")

      const [boardData, listsData, cardsData, labelsData] = await Promise.all([
        apiClient.boards.getBoardById(boardId),
        apiClient.lists.getLists(),
        apiClient.cards.getCards(),
        apiClient.labels.getLabels(),
      ])

      setBoard(boardData)
      setLists(listsData.data?.items?.filter((list) => list.board_id === boardId) || [])
      setCards(cardsData.data?.items || [])
      setLabels(labelsData.data?.items?.filter((label) => label.board_id === boardId) || [])
      // Remove users API call since endpoint doesn't exist
      setUsers([])
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
      console.log("ℹ️ WebSocket connection skipped (optional for development)")
      // Don't show error to user, just log it
      // WebSocket is optional for the app to work
    }
  }

  // WebSocket event handlers
  const handleCardCreated = useCallback(
    (card: Card) => {
      console.log("📥 Received card_created WebSocket event:", card)
      setCards((prev) => {
        // Check if card already exists to prevent duplicates
        const exists = prev.some((c) => c.id === card.id)
        if (exists) {
          console.log("⚠️ Card already exists, skipping:", card.id)
          return prev
        }
        console.log("✅ Adding card from WebSocket:", card)
        return [...prev, card]
      })
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
    setLists((prev) => {
      // Check if list already exists to prevent duplicates
      const exists = prev.some((l) => l.id === list.id)
      if (exists) {
        return prev
      }
      
      // Fix title if API returns "string" instead of actual title
      const fixedList = {
        ...list,
        title: list.title === "string" ? "Untitled List" : list.title
      }
      
      return [...prev, fixedList]
    })
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
        const updatedCard = (response as any).data || response
        setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)))
        
        // Note: Don't send WebSocket event here because we already updated the card in state
        // The WebSocket event will be handled by handleCardUpdated if other users update cards
        
        toast({
          title: "Cập nhật thành công",
          description: "Card đã được cập nhật",
        })
      } else {
        // Create new card
        const response = await apiClient.cards.createCard(data)
        console.log("✅ Card created successfully:", response)
        
        // Extract card data from response
        const newCard = (response as any).data || response
        console.log("📝 Extracted card data:", newCard)
        
        // Add to state immediately for optimistic update
        setCards((prev) => {
          console.log("📝 Adding card to state:", newCard)
          return [...prev, newCard]
        })
        
        // Send WebSocket event for real-time updates
        if (wsClient.isConnected()) {
          console.log("📤 Sending WebSocket card_created event")
          wsClient.send({
            type: "card_created",
            data: newCard,
            board_id: boardId,
            user_id: user?.id || "",
            timestamp: new Date().toISOString()
          })
        } else {
          console.log("❌ WebSocket not connected")
        }
        
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
      setCards((prev) => {
        console.log("📝 Removing card from state:", cardId)
        return prev.filter((c) => c.id !== cardId)
      })
      
      // Note: Don't send WebSocket event here because we already removed the card from state
      // The WebSocket event will be handled by handleCardDeleted if other users delete cards
      
      toast({
        title: "Xóa thành công",
        description: "Card đã được xóa",
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
      const response = await apiClient.lists.createList({
        board_id: boardId,
        title: newListTitle,
        position: lists.length + 1,
      })
      const newList = (response as any).data || response

      // Use the title from form instead of API response (in case API returns "string")
      const listWithCorrectTitle = {
        ...newList,
        title: newListTitle.trim()
      }

      setLists((prev) => {
        const updatedLists = [...prev, listWithCorrectTitle]
        return updatedLists
      })
      setNewListTitle("")
      setIsCreateListDialogOpen(false)
      
      // Note: Don't send WebSocket event here because we already added the list to state
      // The WebSocket event will be handled by handleListCreated if other users create lists

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
      const response = await apiClient.lists.updateList({
        id: list.id,
        title: list.title,
        position: list.position,
      })
      const updatedList = (response as any).data || response

      setLists((prev) => prev.map((l) => (l.id === updatedList.id ? updatedList : l)))
      
      // Note: Don't send WebSocket event here because we already updated the list in state
      // The WebSocket event will be handled by handleListUpdated if other users update lists
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
      await apiClient.lists.deleteLists([listId])
      setLists((prev) => prev.filter((l) => l.id !== listId))
      setCards((prev) => prev.filter((c) => c.list_id !== listId))
      
      // Note: Don't send WebSocket event here because we already removed the list from state
      // The WebSocket event will be handled by handleListDeleted if other users delete lists

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

  // Drag and drop
  const handleDrop = async (listId: string, position: number) => {
    if (!draggedCard) return

    try {
      // Store original state for rollback
      const originalCards = [...cards]
      
      // Optimistic update - just move the card visually without calculating positions
      setCards((prev) => {
        const updatedCards = prev.map((c) => 
          c.id === draggedCard.id 
            ? { ...c, list_id: listId }
            : c
        )
        return updatedCards
      })

      // Call API to update server - let backend calculate the actual position
      const response = await apiClient.cards.moveCard({
        id: draggedCard.id,
        list_id: listId,
        position: 0, // Send 0 to let backend calculate the best position
      })
      const updatedCard = (response as any).data || response

      // Update with server response (which has the actual calculated position)
      setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)))

      // Send websocket event for real-time updates
      if (wsClient.isConnected()) {
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
            created_at: updatedCard.created_at,
            updated_at: updatedCard.updated_at,
          },
          board_id: boardId,
          user_id: user?.id || "",
          timestamp: new Date().toISOString(),
        })
      } else {
        console.warn("WebSocket not connected, cannot send message")
      }
    } catch (error: any) {
      console.error(`❌ Failed to move card:`, error)
      
      // Revert optimistic update on error - reload data from server
      loadBoardData()
      
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
          {lists.map((list) => (
            <ListColumn
              key={list.id || `list-${list.position}-${list.title}`}
              list={list}
              cards={cards.filter((card) => card.list_id === list.id)}
              labels={labels}
              users={users}
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
