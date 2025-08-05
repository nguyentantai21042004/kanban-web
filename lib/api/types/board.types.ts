export interface Board {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateBoardRequest {
  title: string
  description?: string
}

export interface UpdateBoardRequest {
  id: string
  title?: string
  description?: string
}

export interface GetBoardResponse {
  success: boolean
  message: string
  data: {
    items: Board[]
    meta: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
} 