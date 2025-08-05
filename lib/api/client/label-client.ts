import { BaseClient } from './base-client'
import type { 
  Label, 
  CreateLabelRequest, 
  UpdateLabelRequest, 
  GetLabelResponse 
} from '../types/label.types'
import type { ApiResponse } from '../types/auth.types'

export interface GetLabelsParams {
  ids?: string
  label_id?: string
  keyword?: string
  page?: number
  limit?: number
}

export class LabelClient extends BaseClient {
  async getLabels(params?: GetLabelsParams): Promise<GetLabelResponse> {
    this.logMethodCall('getLabels', params)
    
    try {
      const endpoint = this.createUrlWithParams('/labels', params)
      return await this.request<GetLabelResponse>(endpoint)
    } catch (error) {
      this.logError('getLabels', error)
      throw error
    }
  }

  async createLabel(data: CreateLabelRequest): Promise<Label> {
    this.logMethodCall('createLabel', data)
    
    try {
      return await this.request<Label>("/labels", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('createLabel', error)
      throw error
    }
  }

  async updateLabel(data: UpdateLabelRequest): Promise<Label> {
    this.logMethodCall('updateLabel', data)
    
    try {
      return await this.request<Label>("/labels", {
        method: "PUT",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('updateLabel', error)
      throw error
    }
  }

  async deleteLabels(ids: string[]): Promise<ApiResponse<null>> {
    this.logMethodCall('deleteLabels', { ids })
    
    try {
      return await this.request<ApiResponse<null>>("/labels", {
        method: "DELETE",
        body: JSON.stringify({ "ids[]": ids }),
      })
    } catch (error) {
      this.logError('deleteLabels', error)
      throw error
    }
  }
} 