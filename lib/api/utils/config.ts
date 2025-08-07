export class Config {
  static readonly API_BASE_URL = "http://localhost:8080/api/v1"

  static readonly WS_BASE_URL = 'ws://localhost:8080'

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