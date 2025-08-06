import { BaseClient } from './base-client'
import type { 
  List, 
  CreateListRequest, 
  UpdateListRequest, 
  GetListResponse 
} from '../types/list.types'
import type { ApiResponse } from '../types/auth.types'

export interface GetListsParams {
  ids?: string
  list_id?: string
  board_id?: string  // Added board_id filter parameter
  keyword?: string
  page?: number
  limit?: number
}

export class ListClient extends BaseClient {
  async getLists(params?: GetListsParams): Promise<GetListResponse> {
    this.logMethodCall('getLists', params)
    
    try {
      const endpoint = this.createUrlWithParams('/lists', params)
      return await this.request<GetListResponse>(endpoint)
    } catch (error) {
      this.logError('getLists', error)
      throw error
    }
  }

  async getListById(id: string): Promise<List> {
    this.logMethodCall('getListById', { id })
    
    try {
      return await this.request<List>(`/lists/${id}`)
    } catch (error) {
      this.logError('getListById', error)
      throw error
    }
  }

  async createList(data: CreateListRequest): Promise<List> {
    this.logMethodCall('createList', data)
    
    try {
      return await this.request<List>("/lists", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('createList', error)
      throw error
    }
  }

  async updateList(data: UpdateListRequest): Promise<List> {
    this.logMethodCall('updateList', data)
    
    try {
      return await this.request<List>("/lists", {
        method: "PUT",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('updateList', error)
      throw error
    }
  }

  async deleteLists(ids: string[]): Promise<ApiResponse<null>> {
    this.logMethodCall('deleteLists', { ids })
    
    try {
      return await this.request<ApiResponse<null>>("/lists", {
        method: "DELETE",
        body: JSON.stringify({ "ids[]": ids }),
      })
    } catch (error) {
      this.logError('deleteLists', error)
      throw error
    }
  }
} 