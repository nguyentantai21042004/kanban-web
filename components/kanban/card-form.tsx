"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Card, CardPriority, Label as LabelType, List } from "@/lib/types"
import { X, Loader2, Calendar, Tag } from "lucide-react"

interface CardFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CardFormData) => Promise<void>
  card?: Card | null
  lists: List[]
  labels: LabelType[]
  defaultListId?: string
}

export interface CardFormData {
  title: string
  description?: string
  list_id: string
  priority?: CardPriority
  labels?: string[]
  due_date?: string
}

const priorityOptions = [
  { value: "low", label: "Thấp", color: "text-green-600" },
  { value: "medium", label: "Trung bình", color: "text-yellow-600" },
  { value: "high", label: "Cao", color: "text-red-600" },
]

export function CardForm({ isOpen, onClose, onSubmit, card, lists, labels, defaultListId }: CardFormProps) {
  const [formData, setFormData] = useState<CardFormData>({
    title: "",
    description: "",
    list_id: defaultListId || "",
    priority: undefined,
    labels: [],
    due_date: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selectedListTitle, setSelectedListTitle] = useState("")
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<CardFormData | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (card) {
        // Edit mode
        const initialData = {
          title: card.title,
          description: card.description || "",
          list_id: card.list_id,
          priority: card.priority,
          labels: card.labels || [],
          due_date: card.due_date ? card.due_date.split("T")[0] : "",
        }
        setFormData(initialData)
        setOriginalFormData(initialData)
      } else {
        // Create mode
        const selectedListId = defaultListId || lists[0]?.id || ""
        const initialData = {
          title: "",
          description: "",
          list_id: selectedListId,
          priority: undefined,
          labels: [],
          due_date: "",
        }
        setFormData(initialData)
        setOriginalFormData(initialData)
      }
      setError("")
      setShowExitWarning(false)
    }
  }, [isOpen, card, defaultListId, lists])

  // Update list_id when defaultListId changes and we're in create mode
  useEffect(() => {
    if (isOpen && !card && defaultListId && lists.length > 0) {
      const selectedList = lists.find(list => list.id === defaultListId)
      setFormData(prev => ({
        ...prev,
        list_id: defaultListId
      }))
      setSelectedListTitle(selectedList?.title || "")
    }
  }, [defaultListId, lists, isOpen, card])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        labels: formData.labels?.length ? formData.labels : undefined,
      }

      await onSubmit(submitData)
      onClose()
    } catch (error: any) {
      setError(error.message || "Có lỗi xảy ra")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLabelToggle = (labelId: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels?.includes(labelId)
        ? prev.labels.filter((id) => id !== labelId)
        : [...(prev.labels || []), labelId],
    }))
  }

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (!originalFormData) return false
    
    return (
      formData.title !== originalFormData.title ||
      formData.description !== originalFormData.description ||
      formData.list_id !== originalFormData.list_id ||
      formData.priority !== originalFormData.priority ||
      JSON.stringify(formData.labels) !== JSON.stringify(originalFormData.labels) ||
      formData.due_date !== originalFormData.due_date
    )
  }

  // Handle close with warning
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowExitWarning(true)
    } else {
      onClose()
    }
  }

  // Confirm exit without saving
  const confirmExit = () => {
    setShowExitWarning(false)
    onClose()
  }

  // Cancel exit and continue editing
  const cancelExit = () => {
    setShowExitWarning(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20 transition-opacity duration-700 ease-in-out" onClick={handleClose} />

      {/* Form Panel */}
      <div className="w-96 bg-white shadow-xl border-l transition-all duration-700 ease-in-out animate-in slide-in-from-right">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">{card ? "Chỉnh sửa card" : "Tạo card mới"}</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề card..."
                required
                disabled={isSubmitting}
                style={{
                  borderColor: '#e5e7eb',
                  outline: 'none',
                }}
                className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về card..."
                rows={3}
                disabled={isSubmitting}
                style={{
                  borderColor: '#e5e7eb',
                  outline: 'none',
                }}
                className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
              />
            </div>

            {/* List */}
            <div className="space-y-2">
              <Label>List</Label>
              <Select
                key={formData.list_id} // Force re-render when list_id changes
                value={formData.list_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, list_id: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger 
                  style={{
                    borderColor: '#e5e7eb',
                    outline: 'none',
                  }}
                  className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                >
                  <SelectValue placeholder="Chọn list">
                    {selectedListTitle || (formData.list_id && lists.find(list => list.id === formData.list_id)?.title)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Độ ưu tiên</Label>
              <Select
                value={formData.priority || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: value === "none" ? undefined : (value as CardPriority),
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger 
                  style={{
                    borderColor: '#e5e7eb',
                    outline: 'none',
                  }}
                  className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                >
                  <SelectValue placeholder="Chọn độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">
                <Calendar className="inline mr-2 h-4 w-4" />
                Hạn hoàn thành
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                disabled={isSubmitting}
                style={{
                  borderColor: '#e5e7eb',
                  outline: 'none',
                }}
                className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Labels */}
            <div className="space-y-3">
              <Label>
                <Tag className="inline mr-2 h-4 w-4" />
                Labels
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {labels.map((label) => (
                  <div key={label.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`label-${label.id}`}
                      checked={formData.labels?.includes(label.id) || false}
                      onCheckedChange={() => handleLabelToggle(label.id)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor={`label-${label.id}`} className="flex items-center space-x-2 cursor-pointer">
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: label.color + "20",
                          color: label.color,
                          borderColor: label.color + "40",
                        }}
                      >
                        {label.name}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 space-y-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {card ? "Đang cập nhật..." : "Đang tạo..."}
                </>
              ) : (
                <>{card ? "Cập nhật card" : "Tạo card"}</>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
          </div>
        </form>
      </div>

      {/* Exit Warning Dialog */}
      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay đổi chưa được lưu</DialogTitle>
            <DialogDescription>
              Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi mà không lưu thay đổi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelExit}>
              Tiếp tục chỉnh sửa
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Rời khỏi không lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
