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
      return await this.request<GetBoardResponse>(endpoint)
    } catch (error) {
      this.logError('getBoards', error)
      throw error
    }
  }

  async getBoardById(id: string): Promise<Board> {
    this.logMethodCall('getBoardById', { id })
    
    try {
      return await this.request<Board>(`/boards/${id}`)
    } catch (error) {
      this.logError('getBoardById', error)
      throw error
    }
  }

  async createBoard(data: CreateBoardRequest): Promise<Board> {
    this.logMethodCall('createBoard', data)
    
    try {
      return await this.request<Board>("/boards", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('createBoard', error)
      throw error
    }
  }

  async updateBoard(data: UpdateBoardRequest): Promise<Board> {
    this.logMethodCall('updateBoard', data)
    
    try {
      return await this.request<Board>("/boards", {
        method: "PUT",
        body: JSON.stringify(data),
      })
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