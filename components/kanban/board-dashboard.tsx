"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Card as CardType, List, Label } from "@/lib/types"
import { 
  Calendar, 
  Clock, 
  User, 
  CheckSquare, 
  Paperclip, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  FileText,
  MessageCircle
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface BoardDashboardProps {
  cards: CardType[]
  lists: List[]
  labels: Label[]
  users?: Array<{ id: string; full_name: string; avatar_url?: string }>
}

export function BoardDashboard({ 
  cards, 
  lists, 
  labels, 
  users = [] 
}: BoardDashboardProps) {
  // Calculate statistics
  const totalCards = cards.length
  const completedCards = cards.filter(card => card.completion_date).length
  const overdueCards = cards.filter(card => 
    card.due_date && new Date(card.due_date) < new Date() && !card.completion_date
  ).length
  const dueTodayCards = cards.filter(card => 
    card.due_date && format(new Date(card.due_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ).length

  // Assignment statistics
  const assignedCards = cards.filter(card => card.assigned_to).length
  const unassignedCards = totalCards - assignedCards

  // Time tracking statistics
  const cardsWithTimeTracking = cards.filter(card => card.estimated_hours || card.actual_hours).length
  const totalEstimatedHours = cards.reduce((sum, card) => sum + (card.estimated_hours || 0), 0)
  const totalActualHours = cards.reduce((sum, card) => sum + (card.actual_hours || 0), 0)

  // Checklist statistics
  const cardsWithChecklist = cards.filter(card => card.checklist && card.checklist.length > 0).length
  const totalChecklistItems = cards.reduce((sum, card) => 
    sum + (card.checklist?.length || 0), 0
  )
  const completedChecklistItems = cards.reduce((sum, card) => 
    sum + (card.checklist?.filter(item => item.completed).length || 0), 0
  )

  // Attachments and comments
  const totalAttachments = cards.reduce((sum, card) => 
    sum + (card.attachments?.length || 0), 0
  )
  const totalComments = cards.reduce((sum, card) => 
    sum + (card.comments?.length || 0), 0
  )

  // User assignment breakdown
  const userAssignments = users.map(user => ({
    user,
    assignedCards: cards.filter(card => card.assigned_to === user.id).length
  })).filter(item => item.assignedCards > 0)

  // Priority breakdown
  const priorityBreakdown = {
    high: cards.filter(card => card.priority === 'high').length,
    medium: cards.filter(card => card.priority === 'medium').length,
    low: cards.filter(card => card.priority === 'low').length,
    none: cards.filter(card => !card.priority).length
  }

  // List breakdown
  const listBreakdown = lists.map(list => ({
    list,
    cardCount: cards.filter(card => {
      // Handle both card.list.id and card.list_id formats
      const cardListId = card.list?.id || card.list_id
      return cardListId === list.id
    }).length
  }))

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số card</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards}</div>
            <p className="text-xs text-muted-foreground">
              {completedCards} đã hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCards}</div>
            <p className="text-xs text-muted-foreground">
              {dueTodayCards} đến hạn hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã gán</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedCards}</div>
            <p className="text-xs text-muted-foreground">
              {unassignedCards} chưa gán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActualHours}h</div>
            <p className="text-xs text-muted-foreground">
              Ước tính: {totalEstimatedHours}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiến độ hoàn thành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hoàn thành</span>
                <span>{completedCards}/{totalCards}</span>
              </div>
              <Progress 
                value={totalCards > 0 ? (completedCards / totalCards) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Checklist</span>
                <span>{completedChecklistItems}/{totalChecklistItems}</span>
              </div>
              <Progress 
                value={totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoạt động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-blue-500" />
                <span className="text-sm">File đính kèm</span>
              </div>
              <Badge variant="secondary">{totalAttachments}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Bình luận</span>
              </div>
              <Badge variant="secondary">{totalComments}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Card có checklist</span>
              </div>
              <Badge variant="secondary">{cardsWithChecklist}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Card có time tracking</span>
              </div>
              <Badge variant="secondary">{cardsWithTimeTracking}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Assignments */}
      {userAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân công theo người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAssignments.map(({ user, assignedCards }) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.full_name}</span>
                  </div>
                  <Badge variant="outline">{assignedCards} card</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phân bố độ ưu tiên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{priorityBreakdown.high}</div>
              <div className="text-sm text-muted-foreground">Cao</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{priorityBreakdown.medium}</div>
              <div className="text-sm text-muted-foreground">Trung bình</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{priorityBreakdown.low}</div>
              <div className="text-sm text-muted-foreground">Thấp</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{priorityBreakdown.none}</div>
              <div className="text-sm text-muted-foreground">Không có</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phân bố theo list</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {listBreakdown.map(({ list, cardCount }) => (
              <div key={list.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{list.name}</span>
                <Badge variant="outline">{cardCount} card</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 