"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as LabelComponent } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/index"
import type { Card, CardPriority, Label as LabelType, List, ChecklistItem, Comment as CommentType, Attachment } from "@/lib/types"
import { 
  X, 
  Save, 
  Calendar, 
  Tag, 
  User, 
  Clock, 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  Plus,
  Trash2,
  Edit3,
  Download,
  Eye,
  Loader2,
  Upload as UploadIcon
} from "lucide-react"

interface CardDetailSidebarProps {
  card: Card | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedCard: Card) => void
  lists: List[]
  labels: LabelType[]
  users?: Array<{ id: string; full_name: string; avatar_url?: string }>
}

const priorityOptions = [
  { value: "low", label: "Thấp", color: "text-green-600" },
  { value: "medium", label: "Trung bình", color: "text-yellow-600" },
  { value: "high", label: "Cao", color: "text-red-600" },
]

export function CardDetailSidebar({ 
  card, 
  isOpen, 
  onClose, 
  onUpdate, 
  lists, 
  labels,
  users = []
}: CardDetailSidebarProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [cardComments, setCardComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "attachments" | "checklist">("details")
  
  const resizeRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (card) {
      setIsEditing(true)
      loadComments()
    }
  }, [card])

  const loadComments = async () => {
    if (!card) return
    try {
      const response = await apiClient.getCardComments(card.id)
      setCardComments(response.data?.items || [])
    } catch (error) {
      console.error("Failed to load comments:", error)
    }
  }

  const handleSave = async () => {
    if (!card) return

    setIsSubmitting(true)
    try {
      const response = await apiClient.cards.updateCard({
        id: card.id,
        title: card.title,
        description: card.description,
        priority: card.priority,
        labels: card.labels,
        due_date: card.due_date,
        assigned_to: card.assigned_to,
        estimated_hours: card.estimated_hours,
        actual_hours: card.actual_hours,
        start_date: card.start_date,
        completion_date: card.completion_date,
        tags: card.tags,
        checklist: card.checklist,
      })

      const updatedCard = (response as any).data || response
      onUpdate(updatedCard)
      toast({
        title: "Thành công",
        description: "Card đã được cập nhật",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật card",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldChange = (field: keyof Card, value: any) => {
    if (!card) return
    onUpdate({ ...card, [field]: value })
  }

  const handleLabelToggle = (labelId: string) => {
    if (!card) return
    const currentLabels = card.labels || []
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId]
    handleFieldChange("labels", newLabels)
  }

  const handleTagAdd = () => {
    if (!card || !newTag.trim()) return
    const currentTags = card.tags || []
    if (!currentTags.includes(newTag.trim())) {
      handleFieldChange("tags", [...currentTags, newTag.trim()])
    }
    setNewTag("")
  }

  const handleTagRemove = (tag: string) => {
    if (!card) return
    const currentTags = card.tags || []
    handleFieldChange("tags", currentTags.filter(t => t !== tag))
  }

  const handleChecklistAdd = () => {
    if (!card || !newChecklistItem.trim()) return
    const currentChecklist = card.checklist || []
    const newItem: ChecklistItem = {
      id: `temp-${Date.now()}`,
      title: newChecklistItem.trim(),
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    handleFieldChange("checklist", [...currentChecklist, newItem])
    setNewChecklistItem("")
  }

  const handleChecklistToggle = (itemId: string) => {
    if (!card) return
    const currentChecklist = card.checklist || []
    const updatedChecklist = currentChecklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    handleFieldChange("checklist", updatedChecklist)
  }

  const handleChecklistRemove = (itemId: string) => {
    if (!card) return
    const currentChecklist = card.checklist || []
    handleFieldChange("checklist", currentChecklist.filter(item => item.id !== itemId))
  }

  const handleAddComment = async () => {
    if (!card || !newComment.trim()) return
    setIsAddingComment(true)
    try {
      const response = await apiClient.createComment({
        card_id: card.id,
        content: newComment.trim(),
      })
      setCardComments(prev => [response, ...prev])
      setNewComment("")
      toast({
        title: "Thành công",
        description: "Comment đã được thêm",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm comment",
        variant: "destructive",
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUploadAttachment = async () => {
    if (!card || !selectedFile) return
    setIsUploading(true)
    try {
      const response = await apiClient.cards.addAttachment(card.id, selectedFile)
      const updatedCard = { ...card, attachments: [...(card.attachments || []), response] }
      onUpdate(updatedCard)
      setSelectedFile(null)
      toast({
        title: "Thành công",
        description: "File đã được tải lên",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải lên file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!card) return
    try {
      await apiClient.cards.removeAttachment(card.id, attachmentId)
      const updatedCard = {
        ...card,
        attachments: card.attachments?.filter(att => att.id !== attachmentId) || []
      }
      onUpdate(updatedCard)
      toast({
        title: "Thành công",
        description: "File đã được xóa",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa file",
        variant: "destructive",
      })
    }
  }

  const handleAssignCard = async (userId: string) => {
    if (!card) return
    try {
      const response = await apiClient.cards.assignCard(card.id, userId)
      const updatedCard = (response as any).data || response
      onUpdate(updatedCard)
      toast({
        title: "Thành công",
        description: "Card đã được gán",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể gán card",
        variant: "destructive",
      })
    }
  }

  const handleUnassignCard = async () => {
    if (!card) return
    try {
      const response = await apiClient.cards.unassignCard(card.id)
      const updatedCard = (response as any).data || response
      onUpdate(updatedCard)
      toast({
        title: "Thành công",
        description: "Đã bỏ gán card",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể bỏ gán card",
        variant: "destructive",
      })
    }
  }

  // Resize functionality
  useEffect(() => {
    let animationFrameId: number

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeRef.current) {
        animationFrameId = requestAnimationFrame(() => {
          const newWidth = window.innerWidth - e.clientX
          setSidebarWidth(Math.max(350, Math.min(1000, newWidth)))
        })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isResizing])

  if (!card || !isOpen) return null

  const assignedUser = users.find(user => user.id === card.assigned_to)
  const completedChecklistItems = card.checklist?.filter(item => item.completed).length || 0
  const totalChecklistItems = card.checklist?.length || 0

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/20 transition-opacity duration-700 ease-in-out" 
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="bg-white shadow-xl border-l flex flex-col transition-all duration-700 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chi tiết card</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "details" 
                ? "border-b-2 border-blue-500 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Chi tiết
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "comments" 
                ? "border-b-2 border-blue-500 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bình luận ({cardComments.length})
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "attachments" 
                ? "border-b-2 border-blue-500 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            File ({card.attachments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === "checklist" 
                ? "border-b-2 border-blue-500 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Checklist ({completedChecklistItems}/{totalChecklistItems})
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <LabelComponent>Tiêu đề</LabelComponent>
                  <Input
                    value={card.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    style={{
                      borderColor: '#e5e7eb',
                      outline: 'none',
                    }}
                    className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <LabelComponent>Mô tả</LabelComponent>
                  <Textarea
                    value={card.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    rows={3}
                    style={{
                      borderColor: '#e5e7eb',
                      outline: 'none',
                    }}
                    className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                  />
                </div>

                {/* Assignment */}
                <div className="space-y-2">
                  <LabelComponent>
                    <User className="inline mr-2 h-4 w-4" />
                    Người được gán
                  </LabelComponent>
                  <div className="flex items-center gap-2">
                    {assignedUser ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={assignedUser.avatar_url} />
                          <AvatarFallback>{assignedUser.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{assignedUser.full_name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUnassignCard}
                          disabled={isSubmitting}
                        >
                          Bỏ gán
                        </Button>
                      </>
                    ) : (
                      <Select
                        value=""
                        onValueChange={handleAssignCard}
                      >
                        <SelectTrigger 
                          style={{
                            borderColor: '#e5e7eb',
                            outline: 'none',
                          }}
                          className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        >
                          <SelectValue placeholder="Gán cho..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {user.full_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <LabelComponent>Độ ưu tiên</LabelComponent>
                  <Select
                    value={card.priority || "none"}
                    onValueChange={(value) =>
                      handleFieldChange("priority", value === "none" ? undefined : value)
                    }
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

                {/* Time Tracking */}
                <div className="space-y-2">
                  <LabelComponent>
                    <Clock className="inline mr-2 h-4 w-4" />
                    Thời gian
                  </LabelComponent>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <LabelComponent className="text-xs">Ước tính (giờ)</LabelComponent>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={card.estimated_hours || ""}
                        onChange={(e) => handleFieldChange("estimated_hours", e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="0.0"
                        style={{
                          borderColor: '#e5e7eb',
                          outline: 'none',
                        }}
                        className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <LabelComponent className="text-xs">Thực tế (giờ)</LabelComponent>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={card.actual_hours || ""}
                        onChange={(e) => handleFieldChange("actual_hours", e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="0.0"
                        style={{
                          borderColor: '#e5e7eb',
                          outline: 'none',
                        }}
                        className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2">
                  <LabelComponent>
                    <Calendar className="inline mr-2 h-4 w-4" />
                    Ngày tháng
                  </LabelComponent>
                  <div className="space-y-2">
                    <div>
                      <LabelComponent className="text-xs">Ngày bắt đầu</LabelComponent>
                      <Input
                        type="date"
                        value={card.start_date ? card.start_date.split("T")[0] : ""}
                        onChange={(e) => handleFieldChange("start_date", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                        style={{
                          borderColor: '#e5e7eb',
                          outline: 'none',
                        }}
                        className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <LabelComponent className="text-xs">Hạn hoàn thành</LabelComponent>
                      <Input
                        type="date"
                        value={card.due_date ? card.due_date.split("T")[0] : ""}
                        onChange={(e) => handleFieldChange("due_date", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                        style={{
                          borderColor: '#e5e7eb',
                          outline: 'none',
                        }}
                        className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <LabelComponent className="text-xs">Ngày hoàn thành</LabelComponent>
                      <Input
                        type="date"
                        value={card.completion_date ? card.completion_date.split("T")[0] : ""}
                        onChange={(e) => handleFieldChange("completion_date", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                        style={{
                          borderColor: '#e5e7eb',
                          outline: 'none',
                        }}
                        className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <LabelComponent>
                    <Tag className="inline mr-2 h-4 w-4" />
                    Tags
                  </LabelComponent>
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
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag) => (
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

                {/* Labels */}
                <div className="space-y-3">
                  <LabelComponent>
                    <Tag className="inline mr-2 h-4 w-4" />
                    Labels
                  </LabelComponent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {labels.map((label) => (
                      <div key={label.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`label-${label.id}`}
                          checked={card.labels?.includes(label.id) || false}
                          onCheckedChange={() => handleLabelToggle(label.id)}
                        />
                        <LabelComponent htmlFor={`label-${label.id}`} className="flex items-center space-x-2 cursor-pointer">
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
                        </LabelComponent>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-4">
                {/* Add Comment */}
                <div className="space-y-2">
                  <LabelComponent>Thêm bình luận</LabelComponent>
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Viết bình luận..."
                      rows={3}
                      style={{
                        borderColor: '#e5e7eb',
                        outline: 'none',
                      }}
                      className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || isAddingComment}
                    size="sm"
                  >
                    {isAddingComment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang thêm...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Thêm bình luận
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {cardComments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">User</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cardComments.length === 0 && (
                    <p className="text-center text-gray-500 text-sm">Chưa có bình luận nào</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <div className="space-y-4">
                {/* Upload File */}
                <div className="space-y-2">
                  <LabelComponent>
                    <Paperclip className="inline mr-2 h-4 w-4" />
                    Tải lên file
                  </LabelComponent>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      style={{
                        borderColor: '#e5e7eb',
                        outline: 'none',
                      }}
                      className="focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                    <Button 
                      onClick={handleUploadAttachment} 
                      disabled={!selectedFile || isUploading}
                      size="sm"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                                                 <>
                           <UploadIcon className="mr-2 h-4 w-4" />
                           Tải lên
                         </>
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Attachments List */}
                <div className="space-y-2">
                  {card.attachments && card.attachments.length > 0 ? (
                    card.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{attachment.original_name}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm">Chưa có file nào</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "checklist" && (
              <div className="space-y-4">
                {/* Add Checklist Item */}
                <div className="space-y-2">
                  <LabelComponent>
                    <CheckSquare className="inline mr-2 h-4 w-4" />
                    Thêm item
                  </LabelComponent>
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
                </div>

                <Separator />

                {/* Checklist Items */}
                <div className="space-y-2">
                  {card.checklist && card.checklist.length > 0 ? (
                    card.checklist.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleChecklistToggle(item.id)}
                        />
                        <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                          {item.title}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChecklistRemove(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm">Chưa có item nào</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <Button onClick={handleSave} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-colors duration-200"
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  )
} 