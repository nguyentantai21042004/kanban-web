import { AuthClient } from './client/auth-client'
import { BoardClient } from './client/board-client'
import { CardClient } from './client/card-client'
import { ListClient } from './client/list-client'
import { LabelClient } from './client/label-client'
import { CommentClient } from './client/comment-client'
import { AdminClient } from './client/admin-client'

// TODO: Import remaining clients
// import { UserClient } from './client/user-client'

export class ApiClient {
  public auth: AuthClient
  public boards: BoardClient
  public cards: CardClient
  public lists: ListClient
  public labels: LabelClient
  public comments: CommentClient
  public admin: AdminClient
  
  // TODO: Add remaining clients
  // public users: UserClient

  constructor() {
    this.auth = new AuthClient()
    this.boards = new BoardClient()
    this.cards = new CardClient()
    this.lists = new ListClient()
    this.labels = new LabelClient()
    this.comments = new CommentClient()
    this.admin = new AdminClient()
    
    // TODO: Initialize remaining clients
    // this.users = new UserClient()
  }

  // Convenience methods for backward compatibility
  async getCardComments(cardId: string) {
    return this.comments.getCardComments(cardId)
  }

  async createComment(data: any) {
    return this.comments.createComment(data)
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export types for convenience
export * from './types/auth.types'
export * from './types/board.types'
export * from './types/card.types'
export * from './types/list.types'
export * from './types/label.types'
export * from './types/comment.types'
export * from './types/admin.types'
export * from './utils/auth'
export * from './utils/logger'
export * from './utils/request'
export * from './utils/config' 