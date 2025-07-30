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
  onAddCard: (listId: string) => void
  onEditCard: (card: CardType) => void
  onDeleteCard: (cardId: string) => void
  onEditList: (list: List) => void
  onDeleteList: (listId: string) => void
  onDragStart: (card: CardType) => void
  onDragEnd: () => void
  onDragOver: (listId: string, cardId?: string) => void
  onDragLeave: () => void
  onDrop: (listId: string, position: number) => void
  draggedCard: CardType | null
  draggedOverList: string | null
}

export function ListColumn({
  list,
  cards,
  labels,
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
}: ListColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)

  const sortedCards = [...cards].sort((a, b) => a.position - b.position)
  const isDraggedOver = draggedOverList === list.id

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    onDragOver(list.id)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const newPosition = cards.length
    onDrop(list.id, newPosition)
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
      setEditTitle(list.title)
      setIsEditingTitle(false)
    }
  }

  return (
    <Card
      className={`w-80 flex-shrink-0 transition-all ${isDraggedOver ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
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
              className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              onClick={() => setIsEditingTitle(true)}
            >
              {list.title} ({cards.length})
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
              <DropdownMenuItem onClick={() => onDeleteList(list.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {sortedCards.map((card) => (
          <div key={card.id} className="group">
            <CardItem
              card={card}
              labels={labels}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggedCard?.id === card.id}
            />
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 h-8"
          onClick={() => onAddCard(list.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm card
        </Button>
      </CardContent>
    </Card>
  )
}
