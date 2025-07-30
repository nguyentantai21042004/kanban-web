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
  role: string
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
  alias?: string
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
  title: string
  board_id: string
  position: number
}

export interface CreateListRequest {
  title: string
  board_id: string
  position: number
}

export interface UpdateListRequest {
  id: string
  title: string
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

export interface Card {
  id: string
  title: string
  description?: string
  list_id: string
  position: number
  priority?: CardPriority
  labels?: string[]
  due_date?: string
  is_archived: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface CreateCardRequest {
  title: string
  description?: string
  list_id: string
  priority?: CardPriority
  labels?: string[]
  due_date?: string
}

export interface UpdateCardRequest {
  id: string
  title?: string
  description?: string
  priority?: CardPriority
  labels?: string[]
  due_date?: string
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
