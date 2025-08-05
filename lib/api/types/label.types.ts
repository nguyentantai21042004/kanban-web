export interface Label {
  id: string
  name: string
  color: string
  board_id: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateLabelRequest {
  name: string
  color: string
  board_id: string
}

export interface UpdateLabelRequest {
  id: string
  name?: string
  color?: string
}

export interface GetLabelResponse {
  success: boolean
  message: string
  data: {
    items: Label[]
    meta: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
} 