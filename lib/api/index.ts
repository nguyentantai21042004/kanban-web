import { AuthClient } from './client/auth-client'
import { BoardClient } from './client/board-client'
import { CardClient } from './client/card-client'
import { ListClient } from './client/list-client'
import { LabelClient } from './client/label-client'

// TODO: Import remaining clients
// import { CommentClient } from './client/comment-client'
// import { UserClient } from './client/user-client'

export class ApiClient {
  public auth: AuthClient
  public boards: BoardClient
  public cards: CardClient
  public lists: ListClient
  public labels: LabelClient
  
  // TODO: Add remaining clients
  // public comments: CommentClient
  // public users: UserClient

  constructor() {
    this.auth = new AuthClient()
    this.boards = new BoardClient()
    this.cards = new CardClient()
    this.lists = new ListClient()
    this.labels = new LabelClient()
    
    // TODO: Initialize remaining clients
    // this.comments = new CommentClient()
    // this.users = new UserClient()
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
export * from './utils/auth'
export * from './utils/logger'
export * from './utils/request' 