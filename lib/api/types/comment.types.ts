export interface CommentUser {
  id: string
  name: string
}

export interface Comment {
  id: string
  card_id: string
  content: string
  parent_id?: string
  created_at: string
  updated_at: string
  is_edited: boolean
  edited_at?: string
  edited_by?: CommentUser
  user: CommentUser
}

export interface CreateCommentRequest {
  card_id: string
  content: string
  parent_id?: string
}

export interface UpdateCommentRequest {
  id: string
  content: string
}

export interface GetCommentsResponse {
  error_code: number
  message: string
  data: {
    items: Comment[]
    meta: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
  errors?: any
} 