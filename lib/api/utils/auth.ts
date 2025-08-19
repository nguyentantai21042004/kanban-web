export interface TokenData {
  token: string
  expiresAt?: number
}

export class AuthUtils {
  private static readonly TOKEN_KEY = 'access_token'
  private static readonly USER_DATA_KEY = 'user_data'

  static getStoredToken(): string | null {
    try {
      const tokenData = localStorage.getItem(this.TOKEN_KEY)
      if (!tokenData) return null
      
      const parsed: TokenData = JSON.parse(tokenData)
      
      // Check if token is expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        console.log(`⚠️ Token expired, removing...`)
        this.clearStoredData()
        return null
      }
      
      return parsed.token
    } catch (error) {
      console.error(`❌ Failed to get stored token:`, error)
      return null
    }
  }

  static setStoredToken(token: string, expiresAt?: number): void {
    try {
      const tokenData: TokenData = { token, expiresAt }
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData))
    } catch (error) {
      console.error(`❌ Failed to store token:`, error)
    }
  }

  static clearStoredData(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY)
      localStorage.removeItem(this.USER_DATA_KEY)
    } catch (error) {
      console.error(`❌ Failed to clear stored data:`, error)
    }
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getStoredToken()
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }
  }

  static isTokenValid(): boolean {
    const token = this.getStoredToken()
    return !!token
  }
} 