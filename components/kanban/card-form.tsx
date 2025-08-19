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
import type { Card, CardPriority, Label as LabelType, List, ChecklistItem } from "@/lib/types"
import { X, Loader2, Calendar, Tag, User, Clock, FileText, CheckSquare, Plus, Minus, Paperclip, Trash2 } from "lucide-react"
import { ResponsiveSidebar } from "@/components/ui/responsive-sidebar"

interface CardFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CardFormData, attachments?: File[]) => Promise<void>
  card?: Card | null
  lists: List[]
  labels: LabelType[]
  defaultListId?: string
  users?: Array<{ id: string; full_name: string }>
}

export interface CardFormData {
  name: string // Changed from title to name to match API
  description?: string
  list_id: string
  priority?: CardPriority
  labels?: string[]
  due_date?: string
  assigned_to?: string
  estimated_hours?: number
  start_date?: string
  tags?: string[]
  checklist?: ChecklistItem[]
}

const priorityOptions = [
  { value: "low", label: "Thấp", color: "text-green-600" },
  { value: "medium", label: "Trung bình", color: "text-yellow-600" },
  { value: "high", label: "Cao", color: "text-red-600" },
]

export function CardForm({ isOpen, onClose, onSubmit, card, lists, labels, defaultListId, users = [] }: CardFormProps) {
  const [formData, setFormData] = useState<CardFormData>({
    name: "",
    description: "",
    list_id: defaultListId || "",
    priority: undefined,
    labels: [],
    due_date: "",
    assigned_to: "",
    estimated_hours: undefined,
    start_date: "",
    tags: [],
    checklist: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selectedListTitle, setSelectedListTitle] = useState("")
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<CardFormData | null>(null)
  const [newTag, setNewTag] = useState("")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])

  useEffect(() => {
    if (isOpen) {
      if (card) {
        // Edit mode
        const initialData = {
          name: card.name,
          description: card.description || "",
          list_id: card.list?.id || "",
          priority: card.priority,
          labels: card.labels || [],
          due_date: card.due_date || "",
          assigned_to: card.assigned_to || "",
          estimated_hours: card.estimated_hours,
          start_date: card.start_date || "",
          tags: card.tags || [],
          checklist: card.checklist || [],
        }
        setFormData(initialData)
        setOriginalFormData(initialData)
      } else {
        // Create mode
        const selectedListId = defaultListId || lists[0]?.id || ""
        const initialData = {
          name: "",
          description: "",
          list_id: selectedListId,
          priority: undefined,
          labels: [],
          due_date: "",
          assigned_to: "",
          estimated_hours: undefined,
          start_date: "",
          tags: [],
          checklist: [],
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
              setSelectedListTitle(selectedList?.name || "")
    }
  }, [defaultListId, lists, isOpen, card])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        // Send dates as YYYY-MM-DD format strings as per API requirement
        due_date: formData.due_date || undefined,
        start_date: formData.start_date || undefined,
        labels: formData.labels?.length ? formData.labels : undefined,
        tags: formData.tags?.length ? formData.tags : undefined,
        checklist: formData.checklist?.length ? formData.checklist : undefined,
      }

      // Pass attachments along so the parent can upload them after create/update
      await onSubmit(submitData, attachmentFiles)
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

  const handleTagAdd = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const handleTagRemove = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }))
  }

  const handleChecklistAdd = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: `temp-${Date.now()}`,
        content: newChecklistItem.trim(), // Changed from title to content
        is_completed: false, // Changed from completed to is_completed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setFormData(prev => ({
        ...prev,
        checklist: [...(prev.checklist || []), newItem]
      }))
      setNewChecklistItem("")
    }
  }

  const handleChecklistToggle = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist?.map(item => 
        item.id === itemId ? { ...item, is_completed: !item.is_completed } : item // Changed from completed to is_completed
      ) || []
    }))
  }

  const handleChecklistRemove = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist?.filter(item => item.id !== itemId) || []
    }))
  }

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (!originalFormData) return false
    
    return (
      formData.name !== originalFormData.name ||
      formData.description !== originalFormData.description ||
      formData.list_id !== originalFormData.list_id ||
      formData.priority !== originalFormData.priority ||
      JSON.stringify(formData.labels) !== JSON.stringify(originalFormData.labels) ||
      formData.due_date !== originalFormData.due_date ||
      formData.assigned_to !== originalFormData.assigned_to ||
      formData.estimated_hours !== originalFormData.estimated_hours ||
      formData.start_date !== originalFormData.start_date ||
      JSON.stringify(formData.tags) !== JSON.stringify(originalFormData.tags) ||
      JSON.stringify(formData.checklist) !== JSON.stringify(originalFormData.checklist)
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
    <>
      <ResponsiveSidebar
        isOpen={isOpen}
        onClose={handleClose}
        title={card ? "Chỉnh sửa card" : "Tạo card mới"}
        minWidth={500}
        maxWidth={window.innerWidth * 0.9}
        defaultWidth={Math.max(600, Math.min(window.innerWidth * 0.9, window.innerWidth * 0.7))}
        onResize={(width) => {
          // Optional: You can add resize callback here
        }}
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="name">Tiêu đề *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* List */}
                <div className="space-y-2">
                  <Label>List</Label>
                  <Select
                    key={formData.list_id}
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
                        {selectedListTitle || (formData.list_id && lists.find(list => list.id === formData.list_id)?.name)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Độ ưu tiên</Label>
                  <Select
                    value={formData.priority || "no-priority"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: value === "no-priority" ? undefined : (value as CardPriority),
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
                      <SelectItem value="no-priority">Không có</SelectItem>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className={option.color}>{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignment */}
                <div className="space-y-2">
                  <Label>Người được gán</Label>
                  <Select
                    value={formData.assigned_to || "unassigned"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigned_to: value === "unassigned" ? undefined : value,
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
                      <SelectValue placeholder="Chọn người được gán" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Không gán</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
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
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date">
                    <Calendar className="inline mr-2 h-4 w-4" />
                    Ngày bắt đầu
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                    disabled={isSubmitting}
                    style={{
                      borderColor: '#e5e7eb',
                      outline: 'none',
                    }}
                    className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                {/* Time Tracking */}
                <div className="space-y-2">
                  <Label htmlFor="estimated_hours">
                    <Clock className="inline mr-2 h-4 w-4" />
                    Giờ ước tính
                  </Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimated_hours || ""}
                    onChange={(e) => setFormData((prev) => ({ 
                      ...prev, 
                      estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.0"
                    disabled={isSubmitting}
                    style={{
                      borderColor: '#e5e7eb',
                      outline: 'none',
                    }}
                    className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tags */}
                <div className="space-y-2">
                  <Label>
                    <Tag className="inline mr-2 h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Thêm tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                      style={{
                        borderColor: '#e5e7eb',
                        outline: 'none',
                      }}
                      className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                    <Button type="button" onClick={handleTagAdd} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Thêm item..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleChecklistAdd())}
                    style={{
                      borderColor: '#e5e7eb',
                      outline: 'none',
                    }}
                    className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <Button type="button" onClick={handleChecklistAdd} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.checklist && formData.checklist.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.checklist.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={() => handleChecklistToggle(item.id)}
                          disabled={isSubmitting}
                        />
                        <span className={`flex-1 ${item.is_completed ? 'line-through text-gray-500' : ''}`}>
                          {item.content}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChecklistRemove(item.id)}
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>
                  <Paperclip className="inline mr-2 h-4 w-4" />
                  Tải lên file
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length) {
                        setAttachmentFiles((prev) => [...prev, ...files])
                      }
                    }}
                    style={{
                      borderColor: '#e5e7eb',
                      outline: 'none',
                    }}
                    className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    disabled={isSubmitting}
                  />
                </div>

                {attachmentFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachmentFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAttachmentFiles(prev => prev.filter((_, i) => i !== idx))}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
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
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </ResponsiveSidebar>

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
    </>
  )
}
