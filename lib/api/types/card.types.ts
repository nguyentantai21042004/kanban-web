export type CardPriority = "low" | "medium" | "high"

export interface Card {
  id: string
  name: string // Changed from title to name to match swagger
  alias: string
  description?: string
  list?: {
    id: string
    name: string
  }
  list_id?: string // Optional field for API responses that use list_id instead of list object
  position: number
  priority?: CardPriority
  assigned_to?: string
  due_date?: string
  start_date?: string
  completion_date?: string
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  labels?: string[]
  checklist?: ChecklistItem[]
  attachments?: string[]
  is_archived: boolean
  last_activity_at: string
  created_at: string
  updated_at: string
  created_by: {
    id: string
    name: string
  }
  updated_by?: {
    id: string
    name: string
  }
}

export interface CreateCardRequest {
  name: string // Changed from title to name to match swagger
  description?: string
  list_id: string
  board_id: string // Added board_id as required field
  assigned_to?: string
  checklist?: ChecklistItem[]
  due_date?: string
  start_date?: string
  estimated_hours?: number
  labels?: string[]
  priority?: CardPriority
  tags?: string[]
}

export interface UpdateCardRequest {
  id: string
  name?: string // Changed from title to name to match swagger
  description?: string
  assigned_to?: string
  checklist?: ChecklistItem[]
  completion_date?: string
  due_date?: string
  start_date?: string
  estimated_hours?: number
  actual_hours?: number
  labels?: string[]
  priority?: CardPriority
  tags?: string[]
}

export interface MoveCardRequest {
  id: string // Changed from card_id to id to match swagger
  list_id: string
  position: number
}

export interface GetCardResponse {
  error_code: number
  message: string
  data: {
    items: Card[]
    meta: {
      count: number
      current_page: number
      per_page: number
      total: number
      total_pages: number
    }
  }
}

export interface GetCardActivitiesResponse {
  error_code: number
  message: string
  data: {
    items: CardActivity[]
    meta: {
      count: number
      current_page: number
      per_page: number
      total: number
      total_pages: number
    }
  }
}

export interface ChecklistItem {
  id: string
  content: string // Changed from title to content to match swagger
  is_completed: boolean // Changed from completed to is_completed to match swagger
  created_at: string
  updated_at: string
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
  action_type: "created" | "moved" | "updated" | "commented"
  old_data?: any
  new_data?: any
  created_at: string
  updated_at: string
} 