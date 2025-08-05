export interface Card {
  id: string
  title: string
  description?: string
  list_id: string
  board_id: string
  position: number
  assigned_to?: string
  due_date?: string
  start_date?: string
  completion_date?: string
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  checklist?: ChecklistItem[]
  attachments?: Attachment[]
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateCardRequest {
  title: string
  description?: string
  list_id: string
  board_id: string
  position?: number
  assigned_to?: string
  due_date?: string
  start_date?: string
  estimated_hours?: number
  tags?: string[]
}

export interface UpdateCardRequest {
  id: string
  title?: string
  description?: string
  list_id?: string
  position?: number
  assigned_to?: string
  due_date?: string
  start_date?: string
  completion_date?: string
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  checklist?: ChecklistItem[]
}

export interface MoveCardRequest {
  card_id: string
  list_id: string
  position: number
}

export interface GetCardResponse {
  success: boolean
  message: string
  data: {
    items: Card[]
    meta: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
}

export interface GetCardActivitiesResponse {
  success: boolean
  message: string
  data: {
    items: CardActivity[]
    meta: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
}

export interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  position: number
}

export interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  mime_type: string
  created_at: string
}

export interface CardActivity {
  id: string
  card_id: string
  user_id: string
  action: string
  details: any
  created_at: string
} 