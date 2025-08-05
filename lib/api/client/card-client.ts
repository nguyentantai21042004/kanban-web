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
      return await this.request<Card>(`/cards/${id}`)
    } catch (error) {
      this.logError('getCardById', error)
      throw error
    }
  }

  async createCard(data: CreateCardRequest): Promise<Card> {
    this.logMethodCall('createCard', data)
    
    try {
      return await this.request<Card>("/cards", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('createCard', error)
      throw error
    }
  }

  async updateCard(data: UpdateCardRequest): Promise<Card> {
    this.logMethodCall('updateCard', data)
    
    try {
      return await this.request<Card>("/cards", {
        method: "PUT",
        body: JSON.stringify(data),
      })
    } catch (error) {
      this.logError('updateCard', error)
      throw error
    }
  }

  async moveCard(data: MoveCardRequest): Promise<Card> {
    this.logMethodCall('moveCard', data)
    
    try {
      return await this.request<Card>("/cards/move", {
        method: "POST",
        body: JSON.stringify(data),
      })
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
      return await this.request<Card>("/cards/assign", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, user_id: userId }),
      })
    } catch (error) {
      this.logError('assignCard', error)
      throw error
    }
  }

  async unassignCard(cardId: string): Promise<Card> {
    this.logMethodCall('unassignCard', { cardId })
    
    try {
      return await this.request<Card>("/cards/unassign", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId }),
      })
    } catch (error) {
      this.logError('unassignCard', error)
      throw error
    }
  }

  // Card Attachments APIs
  async addAttachment(cardId: string, file: File): Promise<Attachment> {
    this.logMethodCall('addAttachment', { cardId, filename: file.name })
    
    try {
      const formData = new FormData()
      formData.append("card_id", cardId)
      formData.append("file", file)
      
      return await this.request<Attachment>("/cards/attachments/add", {
        method: "POST",
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      })
    } catch (error) {
      this.logError('addAttachment', error)
      throw error
    }
  }

  async removeAttachment(cardId: string, attachmentId: string): Promise<ApiResponse<null>> {
    this.logMethodCall('removeAttachment', { cardId, attachmentId })
    
    try {
      return await this.request<ApiResponse<null>>("/cards/attachments/remove", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, attachment_id: attachmentId }),
      })
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
      return await this.request<Card>("/cards/time-tracking", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, ...data }),
      })
    } catch (error) {
      this.logError('updateTimeTracking', error)
      throw error
    }
  }

  // Card Checklist APIs
  async updateChecklist(cardId: string, checklist: ChecklistItem[]): Promise<Card> {
    this.logMethodCall('updateChecklist', { cardId, checklist })
    
    try {
      return await this.request<Card>("/cards/checklist", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, checklist }),
      })
    } catch (error) {
      this.logError('updateChecklist', error)
      throw error
    }
  }

  // Card Tags APIs
  async addTag(cardId: string, tag: string): Promise<Card> {
    this.logMethodCall('addTag', { cardId, tag })
    
    try {
      return await this.request<Card>("/cards/tags/add", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, tag }),
      })
    } catch (error) {
      this.logError('addTag', error)
      throw error
    }
  }

  async removeTag(cardId: string, tag: string): Promise<Card> {
    this.logMethodCall('removeTag', { cardId, tag })
    
    try {
      return await this.request<Card>("/cards/tags/remove", {
        method: "POST",
        body: JSON.stringify({ card_id: cardId, tag }),
      })
    } catch (error) {
      this.logError('removeTag', error)
      throw error
    }
  }

  // Card Date APIs
  async setStartDate(cardId: string, startDate: string): Promise<Card> {
    this.logMethodCall('setStartDate', { cardId, startDate })
    
    try {
      return await this.request<Card>("/cards/start-date", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, start_date: startDate }),
      })
    } catch (error) {
      this.logError('setStartDate', error)
      throw error
    }
  }

  async setCompletionDate(cardId: string, completionDate: string): Promise<Card> {
    this.logMethodCall('setCompletionDate', { cardId, completionDate })
    
    try {
      return await this.request<Card>("/cards/completion-date", {
        method: "PUT",
        body: JSON.stringify({ card_id: cardId, completion_date: completionDate }),
      })
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