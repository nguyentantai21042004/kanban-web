import { BaseClient } from './base-client'
import { AuthUtils } from '../utils/auth'
import type { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  ApiResponse 
} from '../types/auth.types'

export class AuthClient extends BaseClient {
  async login(data: LoginRequest): Promise<LoginResponse> {
    this.logMethodCall('login', { username: data.username })
    
    try {
      const response = await this.request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        skipAuth: true, // Login doesn't need auth
      })

      // Store token
      if (response.access_token) {
        const expiresAt = Date.now() + (response.expires_in * 1000)
        AuthUtils.setStoredToken(response.access_token, expiresAt)
      }

      return response
    } catch (error) {
      this.logError('login', error)
      throw error
    }
  }

  async logout(): Promise<ApiResponse<null>> {
    this.logMethodCall('logout')
    
    try {
      const response = await this.request<ApiResponse<null>>("/auth/logout", {
        method: "POST",
      })

      // Clear stored data
      AuthUtils.clearStoredData()

      return response
    } catch (error) {
      this.logError('logout', error)
      // Clear stored data even if API call fails
      AuthUtils.clearStoredData()
      throw error
    }
  }

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    this.logMethodCall('refreshToken', { refresh_token: data.refresh_token ? "***" : "undefined" })
    
    try {
      const response = await this.request<RefreshTokenResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        skipAuth: true, // Refresh doesn't need auth
      })

      // Store new token
      if (response.access_token) {
        const expiresAt = Date.now() + (response.expires_in * 1000)
        AuthUtils.setStoredToken(response.access_token, expiresAt)
      }

      return response
    } catch (error) {
      this.logError('refreshToken', error)
      throw error
    }
  }

  isAuthenticated(): boolean {
    return AuthUtils.isTokenValid()
  }
} 