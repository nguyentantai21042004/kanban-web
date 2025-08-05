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
}: ListColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title || "Untitled List")

  const sortedCards = [...cards].sort((a, b) => a.position - b.position)
  const isDraggedOverThis = isDraggingOver(list.id)
  const dropPosition = getDropPosition(list.id)

  // Fallback title if API doesn't return title
  const displayTitle = list.title || "Untitled List"

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const headerHeight = 60 // Card header height
    const cardSpacing = 12 // Space between cards
    const cardHeight = 100 // Card height including spacing
    const totalCardHeight = cardHeight + cardSpacing
    
    // Calculate position based on actual card positions
    let position = 0
    if (y > headerHeight) {
      const cardAreaY = y - headerHeight
      position = Math.floor(cardAreaY / totalCardHeight)
      position = Math.max(0, Math.min(position, cards.length))
    }
    
    // Enhanced visual feedback for top position
    const isNearTop = y < headerHeight + 30
    const isNearBottom = y > rect.height - 30
    
    // Auto-scroll when near edges
    if (isNearTop) {
      const container = e.currentTarget.closest('.board-container')
      if (container) {
        container.scrollLeft -= 10
      }
    } else if (isNearBottom) {
      const container = e.currentTarget.closest('.board-container')
      if (container) {
        container.scrollLeft += 10
      }
    }
    
    onDragOver(list.id, undefined, position)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const headerHeight = 60 // Card header height
    const cardSpacing = 12 // Space between cards
    const cardHeight = 100 // Card height including spacing
    const totalCardHeight = cardHeight + cardSpacing
    
    // Calculate position based on actual card positions
    let position = 0
    if (y > headerHeight) {
      const cardAreaY = y - headerHeight
      position = Math.floor(cardAreaY / totalCardHeight)
      position = Math.max(0, Math.min(position, cards.length))
    }
    
    onDrop(list.id, position)
  }

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editTitle.trim() && editTitle !== list.title) {
      onEditList({ ...list, title: editTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditTitle(list.title || "Untitled List")
      setIsEditingTitle(false)
    }
  }

  return (
    <Card
      className={`w-80 flex-shrink-0 transition-all duration-300 ${
        isDraggedOverThis 
          ? "ring-2 ring-blue-500 bg-blue-50 shadow-xl scale-105 border-blue-300" 
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
            <CardTitle
              className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {displayTitle} ({cards.length})
            </CardTitle>
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
        {/* Top drop zone indicator */}
        {isDraggedOverThis && dropPosition === 0 && (
          <div className="h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-90 animate-pulse mb-3 transition-all duration-300 shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-ping" />
          </div>
        )}

        <div className="space-y-2">
          {sortedCards.map((card, index) => (
            <div key={card.id}>
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
              
              {/* Drop zone indicator between cards */}
              {isDraggedOverThis && dropPosition === index + 1 && (
                <div className="h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-90 animate-pulse my-2 transition-all duration-300 shadow-lg relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-ping" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom drop zone indicator */}
        {isDraggedOverThis && dropPosition === cards.length && cards.length > 0 && (
          <div className="h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-90 animate-pulse mt-3 transition-all duration-300 shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-ping" />
          </div>
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
