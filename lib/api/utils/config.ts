export class Config {
  static readonly API_BASE_URL = "https://kanban-api.tantai.dev/api/v1"

  static readonly WS_BASE_URL = 'wss://kanban-api.tantai.dev'

  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  static getApiUrl(endpoint: string): string {
    return `${this.API_BASE_URL}${endpoint}`
  }
} 