"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label as LabelComponent } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { Card, List, Label } from "@/lib/types"
import { 
  X, 
  Save, 
  Calendar, 
  Tag, 
  User, 
  Clock, 
  GripVertical,
  Plus,
  Minus
} from "lucide-react"

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
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Default to 1/3 of screen width, min 400px, max 800px
    if (typeof window !== 'undefined') {
      return Math.max(400, Math.min(800, window.innerWidth / 3))
    }
    return 500
  })
  const [isResizing, setIsResizing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLabelSelector, setShowLabelSelector] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (card) {
      setEditedCard(card)
      setIsEditing(true)
      setShowLabelSelector(false)
    }
  }, [card])

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeRef.current) {
        const newWidth = window.innerWidth - e.clientX
        setSidebarWidth(Math.max(350, Math.min(1000, newWidth))) // Min 350px, Max 1000px
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Handle responsive width on window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const newWidth = Math.max(350, Math.min(1000, window.innerWidth / 3))
        setSidebarWidth(newWidth)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!card || !isOpen) return null

  const handleSave = async () => {
    if (!editedCard) return

    setIsSaving(true)
    try {
      // Lưu dữ liệu trước khi update
      const originalCard = card
      
      // Gọi API update
      await apiClient.updateCard({
        id: editedCard.id,
        title: editedCard.title,
        description: editedCard.description,
        priority: editedCard.priority,
        labels: editedCard.labels,
        due_date: editedCard.due_date,
      })

      // Tạo object card mới với dữ liệu đã update
      const updatedCard: Card = {
        ...originalCard,
        title: editedCard.title,
        description: editedCard.description,
        priority: editedCard.priority,
        labels: editedCard.labels,
        due_date: editedCard.due_date,
        updated_at: new Date().toISOString(),
      }

      onUpdate(updatedCard)
      setShowLabelSelector(false)
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
    setShowLabelSelector(false)
  }

  const handleLabelToggle = (labelId: string) => {
    if (!editedCard) return
    
    const currentLabels = editedCard.labels || []
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId]
    
    setEditedCard({ ...editedCard, labels: newLabels })
  }

  const currentList = lists.find((list) => list.id === card.list_id)
  const selectedLabels = labels.filter((label) => card.labels?.includes(label.id))
  const editedSelectedLabels = labels.filter((label) => editedCard?.labels?.includes(label.id))

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 bg-white border-l border-gray-200 shadow-xl z-50 overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'w-16' : ''
        }`}
        style={{ width: isCollapsed ? '64px' : `${sidebarWidth}px` }}
      >
        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            ref={resizeRef}
            className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}



        {!isCollapsed && (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Chi tiết Card</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto h-full">
              {/* Title Section */}
              <div className="space-y-2">
                <LabelComponent className="text-sm font-medium text-gray-700">Tiêu đề</LabelComponent>
                <Input
                  value={editedCard?.title || ""}
                  onChange={(e) =>
                    setEditedCard(prev => prev ? { ...prev, title: e.target.value } : null)
                  }
                  className="text-sm"
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <LabelComponent className="text-sm font-medium text-gray-700">Mô tả</LabelComponent>
                <Textarea
                  value={editedCard?.description || ""}
                  onChange={(e) =>
                    setEditedCard(prev => prev ? { ...prev, description: e.target.value } : null)
                  }
                  placeholder="Thêm mô tả..."
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>

              <Separator />

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* List */}
                <div className="space-y-1">
                  <LabelComponent className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Danh sách
                  </LabelComponent>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700">{currentList?.title}</span>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <LabelComponent className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Độ ưu tiên
                  </LabelComponent>
                  <Select
                    value={editedCard?.priority || "medium"}
                    onValueChange={(value) =>
                      setEditedCard(prev => prev ? { ...prev, priority: value as any } : null)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Thấp</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Labels Section - Compact */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <LabelComponent className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Nhãn
                  </LabelComponent>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLabelSelector(!showLabelSelector)}
                    className="h-6 px-2 text-xs"
                  >
                    {showLabelSelector ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  </Button>
                </div>
                
                {/* Selected Labels Display */}
                <div className="flex flex-wrap gap-1">
                  {editedSelectedLabels.length > 0 ? (
                    editedSelectedLabels.map((label) => (
                      <Badge
                        key={label.id}
                        style={{ backgroundColor: label.color }}
                        className="text-white text-xs px-2 py-1"
                      >
                        {label.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Chưa có nhãn</span>
                  )}
                </div>

                {/* Label Selector */}
                {showLabelSelector && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                    <LabelComponent className="text-xs font-medium text-gray-600">Chọn nhãn</LabelComponent>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {labels.map((label) => (
                        <div
                          key={label.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => handleLabelToggle(label.id)}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-xs text-gray-700">{label.name}</span>
                          {(editedCard?.labels || []).includes(label.id) && (
                            <div className="ml-auto">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <LabelComponent className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Hạn chót
                </LabelComponent>
                <Input
                  type="datetime-local"
                  value={editedCard?.due_date ? editedCard.due_date.slice(0, 16) : ""}
                  onChange={(e) =>
                    setEditedCard(prev => prev ? { ...prev, due_date: e.target.value } : null)
                  }
                  className="text-xs"
                />
              </div>

              <Separator />

              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Tạo: {new Date(card.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>Cập nhật: {new Date(card.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Collapsed View */}
        {isCollapsed && (
          <div className="flex flex-col items-center space-y-4 pt-8">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {card.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  )
} 