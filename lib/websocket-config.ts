export enum WebSocketMode {
  LOCAL_ONLY = 'local_only',
  PRODUCTION_ONLY = 'production_only', 
  LOCAL_WITH_FALLBACK = 'local_with_fallback',
  DISABLED = 'disabled'
}

export class WebSocketConfig {
  // Change this to test different modes
  static readonly MODE = WebSocketMode.LOCAL_WITH_FALLBACK

  static isLocalOnly(): boolean {
    return this.MODE === WebSocketMode.LOCAL_ONLY
  }

  static isProductionOnly(): boolean {
    return this.MODE === WebSocketMode.PRODUCTION_ONLY
  }

  static isLocalWithFallback(): boolean {
    return this.MODE === WebSocketMode.LOCAL_WITH_FALLBACK
  }

  static isDisabled(): boolean {
    return this.MODE === WebSocketMode.DISABLED
  }

  static getLocalUrl(boardId: string, token: string): string {
    return `ws://localhost:8080/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
  }

  static getProductionUrl(boardId: string, token: string): string {
    return `wss://kanban-api.ngtantai.pro/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
  }
}