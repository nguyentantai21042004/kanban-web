"use client"

import type React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import type { Card as CardType, Label } from "@/lib/types"
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  CheckSquare, 
  Paperclip, 
  MessageSquare,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface CardPreviewProps {
  card: CardType
  labels: Label[]
  users?: Array<{ id: string; full_name: string; avatar_url?: string }>
  onClick?: () => void
  className?: string
}

const priorityColors = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
}

const priorityLabels = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
}

export function CardPreview({ 
  card, 
  labels, 
  users = [], 
  onClick,
  className = ""
}: CardPreviewProps) {
  const cardLabels = labels.filter((label) => card.labels?.includes(label.id))
  const assignedUser = users.find(user => user.id === card.assigned_to)
  const completedChecklistItems = card.checklist?.filter(item => item.completed).length || 0
  const totalChecklistItems = card.checklist?.length || 0
  const checklistProgress = totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0

  const isOverdue = card.due_date && new Date(card.due_date) < new Date()
  const isDueToday = card.due_date && format(new Date(card.due_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-tight flex-1">{card.title}</h4>
          
          {/* Priority Badge */}
          {card.priority && (
            <Badge className={`${priorityColors[card.priority]} text-xs px-2 py-0`}>
              {priorityLabels[card.priority]}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Description */}
        {card.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>
        )}

        {/* Assignment */}
        {assignedUser && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignedUser.avatar_url} />
              <AvatarFallback className="text-xs">{assignedUser.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600">{assignedUser.full_name}</span>
          </div>
        )}

        {/* Time Tracking */}
        {(card.estimated_hours || card.actual_hours) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <div className="flex gap-1">
              {card.estimated_hours && <span>Ước: {card.estimated_hours}h</span>}
              {card.actual_hours && <span>Thực: {card.actual_hours}h</span>}
            </div>
          </div>
        )}

        {/* Due Date with Status */}
        {card.due_date && (
          <div className={`flex items-center gap-2 text-xs ${
            isOverdue ? 'text-red-600' : 
            isDueToday ? 'text-orange-600' : 
            'text-gray-500'
          }`}>
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(card.due_date), "dd/MM/yyyy", { locale: vi })}</span>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
            {isDueToday && !isOverdue && <span className="text-orange-600">Hôm nay</span>}
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
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                <span>Checklist</span>
              </div>
              <span className="text-gray-500">{completedChecklistItems}/{totalChecklistItems}</span>
            </div>
            <Progress value={checklistProgress} className="h-1" />
            {completedChecklistItems === totalChecklistItems && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Hoàn thành</span>
              </div>
            )}
          </div>
        )}

        {/* Attachments & Comments */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {card.attachments && card.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{card.attachments.length}</span>
            </div>
          )}
          
          {card.comments && card.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{card.comments.length}</span>
            </div>
          )}
        </div>

        {/* Completion Status */}
        {card.completion_date && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Hoàn thành: {format(new Date(card.completion_date), "dd/MM/yyyy", { locale: vi })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 