"use client"

import type React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Card as CardType, Label } from "@/lib/types"
import { MoreHorizontal, Trash2, Edit, Calendar, User, Clock, Tag, CheckSquare, Paperclip, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface CardItemProps {
  card: CardType
  labels: Label[]
  users?: Array<{ id: string; full_name: string; avatar_url?: string }>
  onEdit: (card: CardType) => void
  onDelete: (cardId: string) => void
  onDragStart: (card: CardType) => void
  onDragEnd: () => void
  isDragging: boolean
  isDraggedOver?: boolean
  onCardClick: (card: CardType) => void
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

export function CardItem({ 
  card, 
  labels, 
  users = [],
  onEdit, 
  onDelete, 
  onDragStart, 
  onDragEnd, 
  isDragging, 
  isDraggedOver = false,
  onCardClick 
}: CardItemProps) {
  const cardLabels = labels.filter((label) => card.labels?.includes(label.id))
  const assignedUser = users.find(user => user.id === card.assigned_to)
  const completedChecklistItems = card.checklist?.filter(item => item.completed).length || 0
  const totalChecklistItems = card.checklist?.length || 0

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", card.id)
    onDragStart(card)
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-sm group ${
        isDragging 
          ? "opacity-50 rotate-1 scale-95 shadow-xl border-blue-300" 
          : isDraggedOver
          ? "ring-2 ring-purple-500 bg-purple-50 shadow-xl scale-105 border-purple-300"
          : "hover:shadow-md hover:scale-[1.02]"
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onCardClick(card)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium leading-tight pr-2">{card.name}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

        {/* Assignment */}
        {assignedUser && (
          <div className="flex items-center gap-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={assignedUser.avatar_url} />
              <AvatarFallback className="text-xs">{assignedUser.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600">{assignedUser.full_name}</span>
          </div>
        )}

        {/* Time Tracking */}
        {(card.estimated_hours || card.actual_hours) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {card.estimated_hours && <span>Ước: {card.estimated_hours}h</span>}
            {card.actual_hours && <span>Thực: {card.actual_hours}h</span>}
          </div>
        )}

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {card.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{card.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

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

        {/* Checklist Progress */}
        {totalChecklistItems > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CheckSquare className="h-3 w-3" />
            <span>{completedChecklistItems}/{totalChecklistItems}</span>
            {completedChecklistItems === totalChecklistItems && (
              <span className="text-green-600">✓</span>
            )}
          </div>
        )}

        {/* Attachments */}
        {card.attachments && card.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Paperclip className="h-3 w-3" />
            <span>{card.attachments.length} file</span>
          </div>
        )}

        {/* Comments */}
        {card.comments && card.comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageSquare className="h-3 w-3" />
            <span>{card.comments.length} bình luận</span>
          </div>
        )}

        {/* Priority and Due Date */}
        <div className="flex items-center justify-between text-xs">
          {card.priority && (
            <Badge className={`${priorityColors[card.priority]} text-xs px-2 py-0`}>
              {priorityLabels[card.priority]}
            </Badge>
          )}
          {card.due_date && (
            <div className="flex items-center text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(card.due_date), "dd/MM", { locale: vi })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
