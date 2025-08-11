"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CardItem } from "./card-item"
import type { List, Card as CardType, Label } from "@/lib/types"
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"

interface ListColumnProps {
  list: List
  cards: CardType[]
  labels: Label[]
  users?: Array<{ id: string; full_name: string; avatar_url?: string }>
  onAddCard: (listId: string) => void
  onEditCard: (card: CardType) => void
  onDeleteCard: (cardId: string) => void
  onEditList: (list: List) => void
  onDeleteList: (listId: string) => void
  onDragStart: (card: CardType) => void
  onDragEnd: () => void
  onDragOver: (listId: string, cardId?: string, position?: number) => void
  onDragLeave: () => void
  onDrop: (listId: string, position: number) => void
  draggedCard: CardType | null
  draggedOverList: string | null
  onCardClick: (card: CardType) => void
  isDraggingOver: (listId: string) => boolean
  getDropPosition: (listId: string) => number | null
  // List drag and drop props
  isDraggingList?: boolean
  draggedList?: List | null
  onListDragStart?: (list: List) => void
  onListDragEnd?: () => void
  onListDrop?: (targetList: List, position: 'before' | 'after') => void
}

export function ListColumn({
  list,
  cards,
  labels,
  users = [],
  onAddCard,
  onEditCard,
  onDeleteCard,
  onEditList,
  onDeleteList,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedCard,
  draggedOverList,
  onCardClick,
  isDraggingOver,
  getDropPosition,
  // List drag and drop props
  isDraggingList = false,
  draggedList = null,
  onListDragStart,
  onListDragEnd,
  onListDrop,
}: ListColumnProps) {
  
  // Debug logging for list drag and drop props
  console.log(`🔍 ListColumn props for "${list.name}":`, {
    isDraggingList,
    draggedList: draggedList?.name,
    onListDragStart: !!onListDragStart,
    onListDragEnd: !!onListDragEnd,
    onListDrop: !!onListDrop
  })
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(list.name || "Untitled List")

  const sortedCards = [...cards].sort((a, b) => a.position - b.position)
  const isDraggedOverThis = isDraggingOver(list.id)
  const dropPosition = getDropPosition(list.id)

  // Fallback title if API doesn't return title
  const displayTitle = list.name || "Untitled List"

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    
    // Handle list drag over
    if (isDraggingList && draggedList && draggedList.id !== list.id) {
      console.log(`🎯 List drag over on entire ${list.name} area`)
      return
    }
    
    // Handle card drag over
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const headerHeight = 80 // Card header height
    const cardSpacing = 24 // Increased spacing between cards
    const cardHeight = 140 // Increased card height for better targeting
    const totalCardHeight = cardHeight + cardSpacing
    
    // Calculate position with enhanced drop zones
    let position = 0
    if (y > headerHeight) {
      const cardAreaY = y - headerHeight
      
      // Create larger drop zones between cards
      const rawPosition = cardAreaY / totalCardHeight
      
      // Expand drop zone around each position (±0.3 range)
      const dropZoneSize = 0.3
      position = Math.round(rawPosition - dropZoneSize) + dropZoneSize
      position = Math.max(0, Math.min(position, cards.length))
      position = Math.round(position)
    }
    
    onDragOver(list.id, undefined, position)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    // Handle list drop
    if (isDraggingList && draggedList && draggedList.id !== list.id) {
      console.log(`🎯 List drop on entire ${list.name} area`)
      // Default to 'after' when dropping on the main area
      onListDrop?.(list, 'after')
      return
    }
    
    // Handle card drop
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const headerHeight = 80 // Card header height (consistent with dragOver)
    const cardSpacing = 24 // Spacing between cards (consistent with dragOver)
    const cardHeight = 140 // Card height (consistent with dragOver)
    const totalCardHeight = cardHeight + cardSpacing
    
    // Calculate position with same logic as dragOver
    let position = 0
    if (y > headerHeight) {
      const cardAreaY = y - headerHeight
      
      // Use same enhanced drop zone calculation
      const rawPosition = cardAreaY / totalCardHeight
      const dropZoneSize = 0.3
      position = Math.round(rawPosition - dropZoneSize) + dropZoneSize
      position = Math.max(0, Math.min(position, cards.length))
      position = Math.round(position)
    }
    
    onDrop(list.id, position)
  }

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editTitle.trim() && editTitle !== list.name) {
      onEditList({ ...list, name: editTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditTitle(list.name || "Untitled List")
      setIsEditingTitle(false)
    }
  }

  // List drag and drop handlers
  const handleListDragStart = (e: React.DragEvent) => {
    if (!onListDragStart) {
      return
    }
    
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", list.id)
    
    console.log(`🎯 List drag start: ${list.name}`)
    onListDragStart(list)
  }

  const handleListDragEnd = (e: React.DragEvent) => {
    console.log(`🎯 List drag end triggered for:`, list.name)
    console.log(`🔍 onListDragEnd exists:`, !!onListDragEnd)
    
    if (!onListDragEnd) {
      console.log(`❌ onListDragEnd is undefined`)
      return
    }
    
    console.log(`🎯 List drag end:`, list.name)
    onListDragEnd()
  }

  const handleListDragOver = (e: React.DragEvent) => {
    console.log(`🎯 List drag over triggered for:`, list.name)
    console.log(`🔍 onListDrop exists:`, !!onListDrop)
    console.log(`🔍 draggedList exists:`, !!draggedList)
    console.log(`🔍 is same list:`, draggedList?.id === list.id)
    
    if (!onListDrop || !draggedList || draggedList.id === list.id) {
      console.log(`❌ Cannot handle drag over`)
      return
    }
    
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    console.log(`✅ List drag over handled for:`, list.name)
  }

  const handleListDrop = (e: React.DragEvent) => {
    console.log(`🎯 List drop triggered for:`, list.name)
    console.log(`🔍 onListDrop exists:`, !!onListDrop)
    console.log(`🔍 draggedList exists:`, !!draggedList)
    console.log(`🔍 is same list:`, draggedList?.id === list.id)
    
    if (!onListDrop || !draggedList || draggedList.id === list.id) {
      console.log(`❌ Cannot handle drop`)
      return
    }
    
    e.preventDefault()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const centerX = rect.width / 2
    
    // Determine if drop is before or after this list
    const position = x < centerX ? 'before' : 'after'
    
    console.log(`🎯 List drop: ${draggedList.name} ${position} ${list.name}`)
    console.log(`📍 Drop coordinates: x=${x}, centerX=${centerX}, position=${position}`)
    onListDrop(list, position)
  }

  return (
    <Card
      className={`w-80 flex-shrink-0 transition-all duration-200 ${
        isDraggedOverThis 
          ? "ring-2 ring-blue-400 bg-blue-50 shadow-lg" 
          : isDraggingList && draggedList?.id !== list.id
          ? "ring-2 ring-orange-400 bg-orange-50 shadow-lg"
          : "hover:shadow-md"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                className="text-sm font-medium border-none p-0 h-auto focus-visible:ring-0"
                autoFocus
              />
            </form>
          ) : (
            <div
              className={`text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors font-semibold select-none ${
                isDraggingList && draggedList?.id === list.id ? 'opacity-50' : ''
              }`}
              onClick={() => setIsEditingTitle(true)}
              draggable={!!onListDragStart}
              onDragStart={handleListDragStart}
              onDragEnd={handleListDragEnd}
              onDragOver={handleListDragOver}
              onDrop={handleListDrop}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {displayTitle} ({cards.length})
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Đổi tên
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteList(list.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {/* List drop zone indicator - TOP */}
        {isDraggingList && draggedList && draggedList.id !== list.id && (
          <div 
            className="h-3 bg-orange-500 rounded mb-3 mx-2 transition-all duration-200 cursor-pointer"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => {
              e.preventDefault()
              console.log(`🎯 List drop on TOP of ${list.name} (BEFORE)`)
              onListDrop?.(list, 'before')
            }}
          ></div>
        )}

        {/* Enhanced top drop zone indicator for cards */}
        {isDraggedOverThis && dropPosition === 0 && (
          <div className="h-3 bg-blue-500 rounded mb-3 mx-2 transition-all duration-200"></div>
        )}

        <div className="space-y-4">
          {sortedCards.map((card, index) => (
            <div key={card.id} className="relative">
              <CardItem
                card={card}
                labels={labels}
                users={users}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onCardClick={onCardClick}
                isDragging={draggedCard?.id === card.id}
                isDraggedOver={isDraggedOverThis && dropPosition === index + 1}
              />
              
              {/* Enhanced drop zone between cards */}
              {isDraggedOverThis && dropPosition === index + 1 && (
                <div className="h-3 bg-blue-500 rounded my-3 transition-all duration-200 mx-2"></div>
              )}
              
              {/* Invisible drop zone extender for better UX */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-6 transform translate-y-full pointer-events-none"
                style={{ zIndex: -1 }}
              />
            </div>
          ))}
        </div>

        {/* Enhanced bottom drop zone indicator for cards */}
        {isDraggedOverThis && dropPosition === cards.length && (
          <div className="h-3 bg-blue-500 rounded mt-3 mx-2 transition-all duration-200"></div>
        )}

        {/* List drop zone indicator - BOTTOM */}
        {isDraggingList && draggedList && draggedList.id !== list.id && (
          <div 
            className="h-3 bg-orange-500 rounded mt-3 mx-2 transition-all duration-200 cursor-pointer"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => {
              e.preventDefault()
              console.log(`🎯 List drop on BOTTOM of ${list.name} (AFTER)`)
              onListDrop?.(list, 'after')
            }}
          ></div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => onAddCard(list.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm card
        </Button>
      </CardContent>
    </Card>
  )
}
