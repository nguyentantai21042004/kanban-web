import { logger } from './logger'
import { AuthUtils } from './auth'

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean
  skipLogging?: boolean
}

export class RequestUtils {
  private static readonly API_BASE_URL = "https://kanban-api.ngtantai.pro/api/v1"
  // private static readonly API_BASE_URL = "http://localhost:8080/api/v1"

  static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      headers: options.skipAuth ? {} : AuthUtils.getAuthHeaders(),
      ...options,
    }

    // Log request details
    if (!options.skipLogging) {
      logger.apiRequest(config.method || 'GET', url, config.body)
      const curlCommand = this.generateCurlCommand(url, config)
      logger.curlCommand(curlCommand)
    }

    try {
      const response = await fetch(url, config)
      const responseText = await response.text()
      let responseData: any
      
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      if (!options.skipLogging) {
        logger.apiResponse(response.status, responseData)
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`)
      }

      return responseData
    } catch (error) {
      logger.error("API request failed:", error)
      throw error
    }
  }

  private static generateCurlCommand(url: string, config: RequestInit): string {
    const method = config.method || 'GET'
    const headers = config.headers as Record<string, string> || {}
    
    let curl = `curl -X ${method} "${url}"`
    
    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        curl += ` \\\n  -H "${key}: ${value}"`
      }
    })
    
    // Add body
    if (config.body) {
      curl += ` \\\n  -d '${config.body}'`
    }
    
    return curl
  }

  static buildQueryParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })
    
    return searchParams.toString()
  }

  static createUrlWithParams(endpoint: string, params?: Record<string, any>): string {
    if (!params) return endpoint
    
    const query = this.buildQueryParams(params)
    return query ? `${endpoint}?${query}` : endpoint
  }
} 