export class Config {
  // API Configuration
  static readonly API_BASE_URL = "https://kanban-api.ngtantai.pro/api/v1"
  // static readonly API_BASE_URL = "http://localhost:8080/api/v1" // For local development

  // WebSocket Configuration
  static readonly WS_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'wss://kanban-api.ngtantai.pro'
    : 'ws://localhost:8080'

  // Environment helpers
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  // URL builders
  static getApiUrl(endpoint: string): string {
    return `${this.API_BASE_URL}${endpoint}`
  }

  static getWebSocketUrl(boardId: string, token: string): string {
    return `${this.WS_BASE_URL}/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
  }
} 