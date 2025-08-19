import { BaseClient } from './base-client'
import type { 
  Board, 
  CreateBoardRequest, 
  UpdateBoardRequest, 
  GetBoardResponse 
} from '../types/board.types'
import type { ApiResponse } from '../types/auth.types'

export interface GetBoardsParams {
  ids?: string
  keyword?: string
  page?: number
  limit?: number
}

export class BoardClient extends BaseClient {
  async getBoards(params?: GetBoardsParams): Promise<GetBoardResponse> {
    this.logMethodCall('getBoards', params)
    
    try {
      const endpoint = this.createUrlWithParams('/boards', params)
      const response = await this.request<GetBoardResponse>(endpoint)
      
      // Handle new response format {error_code, message, data}
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to get boards')
      }
      
      return response
    } catch (error) {
      this.logError('getBoards', error)
      throw error
    }
  }

  async getBoardById(id: string): Promise<Board> {
    this.logMethodCall('getBoardById', { id })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Board}>(`/boards/${id}`)
      
      // Handle new response format {error_code, message, data}
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to get board')
      }
      
      return response.data
    } catch (error) {
      this.logError('getBoardById', error)
      throw error
    }
  }

  async createBoard(data: CreateBoardRequest): Promise<Board> {
    this.logMethodCall('createBoard', data)
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Board}>("/boards", {
        method: "POST",
        body: JSON.stringify(data),
      })
      
      // Handle new response format {error_code, message, data}
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to create board')
      }
      
      return response.data
    } catch (error) {
      this.logError('createBoard', error)
      throw error
    }
  }

  async updateBoard(data: UpdateBoardRequest): Promise<Board> {
    this.logMethodCall('updateBoard', data)
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Board}>("/boards", {
        method: "PUT",
        body: JSON.stringify(data),
      })
      
      // Handle new response format {error_code, message, data}
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to update board')
      }
      
      return response.data
    } catch (error) {
      this.logError('updateBoard', error)
      throw error
    }
  }

  async deleteBoards(ids: string[]): Promise<ApiResponse<null>> {
    this.logMethodCall('deleteBoards', { ids })
    
    try {
      return await this.request<ApiResponse<null>>("/boards", {
        method: "DELETE",
        body: JSON.stringify({ "ids[]": ids }),
      })
    } catch (error) {
      this.logError('deleteBoards', error)
      throw error
    }
  }
} 