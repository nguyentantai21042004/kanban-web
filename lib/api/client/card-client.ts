import { BaseClient } from './base-client'
import type { 
  Card, 
  CreateCardRequest, 
  UpdateCardRequest, 
  MoveCardRequest,
  GetCardResponse,
  GetCardActivitiesResponse,
  ChecklistItem,
  Attachment
} from '../types/card.types'
import type { ApiResponse } from '../types/auth.types'

export interface GetCardsParams {
  ids?: string
  list_id?: string
  board_id?: string  // Added board_id filter parameter
  keyword?: string
  page?: number
  limit?: number
}

export interface GetCardActivitiesParams {
  page?: number
  limit?: number
}

export class CardClient extends BaseClient {
  async getCards(params?: GetCardsParams): Promise<GetCardResponse> {
    this.logMethodCall('getCards', params)
    
    try {
      const endpoint = this.createUrlWithParams('/cards', params)
      return await this.request<GetCardResponse>(endpoint)
    } catch (error) {
      this.logError('getCards', error)
      throw error
    }
  }

  async getCardById(id: string): Promise<Card> {
    this.logMethodCall('getCardById', { id })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>(`/cards/${id}`)
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to get card')
      }
      return response.data
    } catch (error) {
      this.logError('getCardById', error)
      throw error
    }
  }

  async createCard(data: CreateCardRequest): Promise<Card> {
    this.logMethodCall('createCard', data)
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards", {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to create card')
      }
      return response.data
    } catch (error) {
      this.logError('createCard', error)
      throw error
    }
  }

  async updateCard(data: UpdateCardRequest): Promise<Card> {
    this.logMethodCall('updateCard', data)
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards", {
        method: "PUT",
        body: JSON.stringify(data),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to update card')
      }
      return response.data
    } catch (error) {
      this.logError('updateCard', error)
      throw error
    }
  }

  async moveCard(data: MoveCardRequest): Promise<Card> {
    this.logMethodCall('moveCard', data)
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/move", {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to move card')
      }
      return response.data
    } catch (error) {
      this.logError('moveCard', error)
      throw error
    }
  }

  async deleteCards(ids: string[]): Promise<ApiResponse<null>> {
    this.logMethodCall('deleteCards', { ids })
    
    try {
      return await this.request<ApiResponse<null>>("/cards", {
        method: "DELETE",
        body: JSON.stringify({ "ids[]": ids }),
      })
    } catch (error) {
      this.logError('deleteCards', error)
      throw error
    }
  }

  // Card Assignment APIs
  async assignCard(cardId: string, userId: string): Promise<Card> {
    this.logMethodCall('assignCard', { cardId, userId })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/assign", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, assigned_to: userId }), // Changed user_id to assigned_to to match swagger
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to assign card')
      }
      return response.data
    } catch (error) {
      this.logError('assignCard', error)
      throw error
    }
  }

  async unassignCard(cardId: string): Promise<Card> {
    this.logMethodCall('unassignCard', { cardId })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/unassign", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to unassign card')
      }
      return response.data
    } catch (error) {
      this.logError('unassignCard', error)
      throw error
    }
  }

  // Card Attachments APIs
  async addAttachment(cardId: string, attachmentId: string): Promise<Card> {
    this.logMethodCall('addAttachment', { cardId, attachmentId })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/attachments/add", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, attachment_id: attachmentId }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to add attachment')
      }
      return response.data
    } catch (error) {
      this.logError('addAttachment', error)
      throw error
    }
  }

  async removeAttachment(cardId: string, attachmentId: string): Promise<Card> {
    this.logMethodCall('removeAttachment', { cardId, attachmentId })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/attachments/remove", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, attachment_id: attachmentId }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to remove attachment')
      }
      return response.data
    } catch (error) {
      this.logError('removeAttachment', error)
      throw error
    }
  }

  // Card Time Tracking APIs
  async updateTimeTracking(cardId: string, data: {
    estimated_hours?: number
    actual_hours?: number
  }): Promise<Card> {
    this.logMethodCall('updateTimeTracking', { cardId, ...data })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/time-tracking", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, ...data }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to update time tracking')
      }
      return response.data
    } catch (error) {
      this.logError('updateTimeTracking', error)
      throw error
    }
  }

  // Card Checklist APIs
  async updateChecklist(cardId: string, checklist: ChecklistItem[]): Promise<Card> {
    this.logMethodCall('updateChecklist', { cardId, checklist })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/checklist", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, checklist }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to update checklist')
      }
      return response.data
    } catch (error) {
      this.logError('updateChecklist', error)
      throw error
    }
  }

  // Card Tags APIs
  async addTag(cardId: string, tag: string): Promise<Card> {
    this.logMethodCall('addTag', { cardId, tag })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/tags/add", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, tag }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to add tag')
      }
      return response.data
    } catch (error) {
      this.logError('addTag', error)
      throw error
    }
  }

  async removeTag(cardId: string, tag: string): Promise<Card> {
    this.logMethodCall('removeTag', { cardId, tag })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/tags/remove", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, tag }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to remove tag')
      }
      return response.data
    } catch (error) {
      this.logError('removeTag', error)
      throw error
    }
  }

  // Card Date APIs
  async setStartDate(cardId: string, startDate: string): Promise<Card> {
    this.logMethodCall('setStartDate', { cardId, startDate })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/start-date", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, start_date: startDate }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to set start date')
      }
      return response.data
    } catch (error) {
      this.logError('setStartDate', error)
      throw error
    }
  }

  async setCompletionDate(cardId: string, completionDate: string): Promise<Card> {
    this.logMethodCall('setCompletionDate', { cardId, completionDate })
    
    try {
      const response = await this.request<{error_code: number, message: string, data: Card}>("/cards/completion-date", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, completion_date: completionDate }),
      })
      if (response.error_code !== 0) {
        throw new Error(response.message || 'Failed to set completion date')
      }
      return response.data
    } catch (error) {
      this.logError('setCompletionDate', error)
      throw error
    }
  }

  // Card Activities APIs
  async getCardActivities(
    cardId: string,
    params?: GetCardActivitiesParams
  ): Promise<GetCardActivitiesResponse> {
    this.logMethodCall('getCardActivities', { cardId, params })
    
    try {
      const searchParams = { card_id: cardId, ...params }
      const endpoint = this.createUrlWithParams('/cards/activities', searchParams)
      return await this.request<GetCardActivitiesResponse>(endpoint)
    } catch (error) {
      this.logError('getCardActivities', error)
      throw error
    }
  }
} 