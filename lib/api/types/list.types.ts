export interface List {
  id: string
  title: string
  board_id: string
  position: number
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateListRequest {
  title: string
  board_id: string
  position?: number
}

export interface UpdateListRequest {
  id: string
  title?: string
  position?: number
}

export interface GetListResponse {
  success: boolean
  message: string
  data: {
    items: List[]
    meta: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
} 