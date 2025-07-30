"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { Card, List, Label } from "@/lib/types"
import { X, Edit, Save, Calendar, Tag, User, Clock } from "lucide-react"

interface CardDetailSidebarProps {
  card: Card | null
  lists: List[]
  labels: Label[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedCard: Card) => void
}

export function CardDetailSidebar({
  card,
  lists,
  labels,
  isOpen,
  onClose,
  onUpdate,
}: CardDetailSidebarProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editedCard, setEditedCard] = useState<Card | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (card) {
      setEditedCard(card)
      setIsEditing(false)
    }
  }, [card])

  if (!card || !isOpen) return null

  const handleSave = async () => {
    if (!editedCard) return

    setIsSaving(true)
    try {
      const updatedCard = await apiClient.updateCard({
        id: editedCard.id,
        title: editedCard.title,
        description: editedCard.description,
        priority: editedCard.priority,
        labels: editedCard.labels,
        due_date: editedCard.due_date,
      })

      onUpdate(updatedCard)
      setIsEditing(false)
      toast({
        title: "Cập nhật thành công",
        description: "Card đã được cập nhật",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật card",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedCard(card)
    setIsEditing(false)
  }

  const currentList = lists.find((list) => list.id === card.list_id)
  const selectedLabels = labels.filter((label) => card.labels?.includes(label.id))

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Chi tiết Card</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Tiêu đề</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          {isEditing ? (
            <Input
              value={editedCard?.title || ""}
              onChange={(e) =>
                setEditedCard(prev => prev ? { ...prev, title: e.target.value } : null)
              }
              className="mb-2"
            />
          ) : (
            <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
          )}
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Mô tả</Label>
          {isEditing ? (
            <Textarea
              value={editedCard?.description || ""}
              onChange={(e) =>
                setEditedCard(prev => prev ? { ...prev, description: e.target.value } : null)
              }
              placeholder="Thêm mô tả..."
              rows={4}
            />
          ) : (
            <p className="text-gray-600">
              {card.description || "Chưa có mô tả"}
            </p>
          )}
        </div>

        <Separator />

        {/* List */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Danh sách</Label>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-700">{currentList?.title}</span>
          </div>
        </div>

        {/* Priority */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Độ ưu tiên</Label>
          {isEditing ? (
            <select
              value={editedCard?.priority || "medium"}
              onChange={(e) =>
                setEditedCard(prev => prev ? { ...prev, priority: e.target.value as any } : null)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          ) : (
            <Badge
              variant={
                card.priority === "high" ? "destructive" :
                card.priority === "medium" ? "default" : "secondary"
              }
            >
              {card.priority === "high" ? "Cao" :
               card.priority === "medium" ? "Trung bình" : "Thấp"}
            </Badge>
          )}
        </div>

        {/* Labels */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Nhãn</Label>
          <div className="flex flex-wrap gap-2">
            {selectedLabels.map((label) => (
              <Badge
                key={label.id}
                style={{ backgroundColor: label.color }}
                className="text-white"
              >
                {label.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Hạn chót</Label>
          {isEditing ? (
            <Input
              type="datetime-local"
              value={editedCard?.due_date || ""}
              onChange={(e) =>
                setEditedCard(prev => prev ? { ...prev, due_date: e.target.value } : null)
              }
            />
          ) : (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {card.due_date ? new Date(card.due_date).toLocaleDateString() : "Chưa có"}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Created/Updated Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Tạo lúc: {new Date(card.created_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>Cập nhật: {new Date(card.updated_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleCancel} variant="outline" className="flex-1">
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 