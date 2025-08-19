import { BaseClient } from './base-client'
import type { 
  Comment, 
  CreateCommentRequest, 
  UpdateCommentRequest,
  GetCommentsResponse
} from '../types/comment.types'

export interface GetCommentsParams {
  card_id?: string
  page?: number
  limit?: number
}

export class CommentClient extends BaseClient {
  async getComments(params?: GetCommentsParams): Promise<GetCommentsResponse> {
    this.logMethodCall('getComments', params)
    
    try {
      const endpoint = this.createUrlWithParams('/comments', params)
      return await this.request<GetCommentsResponse>(endpoint)
    } catch (error) {
      this.logError('getComments', error)
      throw error
    }
  }

  async getCardComments(cardId: string): Promise<GetCommentsResponse> {
    this.logMethodCall('getCardComments', { cardId })
    
    try {
      return await this.request<GetCommentsResponse>(`/cards/${cardId}/comments`)
    } catch (error) {
      this.logError('getCardComments', error)
      throw error
    }
  }

  async createComment(data: CreateCommentRequest): Promise<Comment> {
    this.logMethodCall('createComment', data)
    
    try {
      return await this.request<Comment>("/comments", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('createComment', error)
      throw error
    }
  }

  async updateComment(data: UpdateCommentRequest): Promise<Comment> {
    this.logMethodCall('updateComment', data)
    
    try {
      return await this.request<Comment>(`/comments/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('updateComment', error)
      throw error
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    this.logMethodCall('deleteComment', { commentId })
    
    try {
      return await this.request<void>("/comments", {
        method: "DELETE",
        body: JSON.stringify({ "ids[]": [commentId] }),
      })
    } catch (error) {
      this.logError('deleteComment', error)
      throw error
    }
  }
} 