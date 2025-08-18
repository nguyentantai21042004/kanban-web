// API Response Types
export interface ApiResponse<T> {
  data?: T
  error_code?: number
  errors?: any
  message?: string
}

export interface PaginatorResponse {
  count: number
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

// Auth Types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  error_code: number
  message: string
  data: {
    access_token: string
    user: UserInfo
  }
}

export interface UserInfo {
  id: string
  username: string
  full_name: string
  role: {
    id: string
    name: string
    alias: string
  }
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
}

// Board Types
export interface Board {
  id: string
  name: string
  description?: string
  alias: string
  created_by?: {
    id: string
    name: string
  }
  created_at?: string
  updated_at?: string
}

export interface CreateBoardRequest {
  name: string
  description?: string
}

export interface UpdateBoardRequest {
  id: string
  name: string
  description?: string
}

export interface GetBoardResponse {
  error_code: number
  message: string
  data: {
    items: Board[]
    meta: PaginatorResponse
  }
  errors?: any
}

// List Types
export interface List {
  id: string
  name: string // Changed from title to name to match swagger
  board_id: string
  position: number
}

export interface CreateListRequest {
  name: string // Changed from title to name to match swagger
  board_id: string
  position: number
}

export interface UpdateListRequest {
  id: string
  name: string // Changed from title to name to match swagger
  position: number
}

export interface GetListResponse {
  error_code: number
  message: string
  data: {
    items: List[]
    meta: PaginatorResponse
  }
  errors?: any
}

// Card Types
export type CardPriority = "low" | "medium" | "high"
export type CardActionType = "created" | "moved" | "updated" | "commented"

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
  original_name: string
  file_size: number
  mime_type: string
  url: string
  uploaded_by: string
  created_at: string
}

export interface Comment {
  id: string
  card_id: string
  content: string
  created_by: string
  parent_id?: string
  replies?: Comment[]
  created_at: string
  updated_at: string
}

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
  labels?: string[]
  due_date?: string
  assigned_to?: string
  estimated_hours?: number
  actual_hours?: number
  start_date?: string
  completion_date?: string
  tags?: string[]
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
  id: string
  list_id: string
  position: number
}

export interface GetCardResponse {
  error_code: number
  message: string
  data: {
    items: Card[]
    meta: PaginatorResponse
  }
  errors?: any
}

export interface CardActivity {
  id: string
  card_id: string
  action_type: CardActionType
  old_data?: any
  new_data?: any
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface GetCardActivitiesResponse {
  items: CardActivity[]
  meta: PaginatorResponse
}

// Label Types
export interface Label {
  id: string
  name: string
  color: string
  board_id: string
}

export interface CreateLabelRequest {
  name: string
  color: string
  board_id: string
}

export interface UpdateLabelRequest {
  id: string
  name: string
  color: string
}

export interface GetLabelResponse {
  error_code: number
  message: string
  data: {
    items: Label[]
    meta: PaginatorResponse
  }
  errors?: any
}

// User Types
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  full_name: string
  avatar_url?: string
}

// WebSocket Types
export interface WebSocketAuthMessage {
  type: "auth"
  data: {
    token: string
  }
}

export interface WebSocketMessage {
  type:
    | "card_created"
    | "card_updated"
    | "card_moved"
    | "card_deleted"
    | "list_created"
    | "list_updated"
    | "list_deleted"
    | "board_updated"
    | "user_joined"
    | "user_left"
  data: any
  board_id: string
  user_id: string
  timestamp: string
}
