export interface List {
  id: string
  name: string // Changed from title to name to match swagger
  board_id: string
  position: number
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateListRequest {
  name: string // Changed from title to name to match swagger
  board_id: string
  position?: number
}

export interface UpdateListRequest {
  id: string
  name?: string // Changed from title to name to match swagger
  position?: number
}

export interface GetListResponse {
  error_code: number // Changed from success to error_code to match swagger
  message: string
  data: {
    items: List[]
    meta: {
      count: number
      current_page: number
      per_page: number
      total: number
      total_pages: number
    }
  }
} 