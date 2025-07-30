"use client"

import type React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Card as CardType, Label } from "@/lib/types"
import { MoreHorizontal, Trash2, Edit, Calendar } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface CardItemProps {
  card: CardType
  labels: Label[]
  onEdit: (card: CardType) => void
  onDelete: (cardId: string) => void
  onDragStart: (card: CardType) => void
  onDragEnd: () => void
  isDragging: boolean
  onClick: (card: CardType) => void
}

const priorityColors = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
}

const priorityLabels = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
}

export function CardItem({ card, labels, onEdit, onDelete, onDragStart, onDragEnd, isDragging, onClick }: CardItemProps) {
  const cardLabels = labels.filter((label) => card.labels?.includes(label.id))

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", card.id)
    onDragStart(card)
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-sm group ${isDragging ? "opacity-50 rotate-1" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onClick(card)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium leading-tight pr-2">{card.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(card)}>
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(card.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {card.description && <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>}

        {/* Labels */}
        {cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cardLabels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="text-xs px-2 py-0"
                style={{
                  backgroundColor: label.color + "20",
                  color: label.color,
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Priority and Due Date */}
        <div className="flex items-center justify-between text-xs">
          {card.priority && (
            <Badge variant="outline" className={priorityColors[card.priority]}>
              {priorityLabels[card.priority]}
            </Badge>
          )}

          {card.due_date && (
            <div className="flex items-center text-gray-500">
              <Calendar className="mr-1 h-3 w-3" />
              {format(new Date(card.due_date), "dd/MM", { locale: vi })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
