export interface Board {
  id: string
  name: string // Changed from title to name to match swagger
  alias: string
  description?: string
  created_by: {
    id: string
    name: string
  }
}

export interface CreateBoardRequest {
  name: string // Changed from title to name to match swagger
  description?: string
}

export interface UpdateBoardRequest {
  id: string
  name?: string // Changed from title to name to match swagger
  description?: string
}

export interface GetBoardResponse {
  error_code: number // Changed from success to error_code to match swagger
  message: string
  data: {
    items: Board[]
    meta: {
      count: number
      current_page: number
      per_page: number
      total: number
      total_pages: number
    }
  }
} 