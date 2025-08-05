export interface LogLevel {
  DEBUG: 'debug'
  INFO: 'info'
  WARN: 'warn'
  ERROR: 'error'
}

export class Logger {
  private static instance: Logger
  private isDevelopment = process.env.NODE_ENV === 'development'

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`🔍 DEBUG: ${message}`, data || '')
    }
  }

  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ INFO: ${message}`, data || '')
    }
  }

  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`⚠️ WARN: ${message}`, data || '')
    }
  }

  error(message: string, error?: any): void {
    if (this.isDevelopment) {
      console.error(`❌ ERROR: ${message}`, error || '')
    }
  }

  apiRequest(method: string, url: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`🚀 API Request: ${method} ${url}`)
      if (data) {
        console.log(`📦 Request Data:`, data)
      }
    }
  }

  apiResponse(status: number, data?: any): void {
    if (this.isDevelopment) {
      console.log(`📥 Response Status: ${status}`)
      if (data) {
        console.log(`📥 Response Data:`, data)
      }
    }
  }

  curlCommand(command: string): void {
    if (this.isDevelopment) {
      console.log(`📋 CURL Command:`)
      console.log(command)
    }
  }
}

export const logger = Logger.getInstance() 