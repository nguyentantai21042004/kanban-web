"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { UserInfo } from "./types"
import { apiClient } from "./api"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: UserInfo | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Cải thiện cơ chế lưu trữ token
  const saveTokenSecurely = (accessToken: string, user: UserInfo) => {
    try {
      // Lưu token với timestamp để track
      const tokenData = {
        token: accessToken,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
      
      localStorage.setItem("access_token", JSON.stringify(tokenData))
      localStorage.setItem("user_data", JSON.stringify(user))
      
      console.log(`💾 Token saved with timestamp:`, {
        timestamp: new Date(tokenData.timestamp).toISOString(),
        expiresAt: new Date(tokenData.expiresAt).toISOString()
      })
    } catch (error) {
      console.error(`❌ Failed to save token:`, error)
      throw error
    }
  }

  const saveTokenToCookies = (accessToken: string) => {
    try {
      // Lưu token vào cookies với httpOnly và secure flags
      const cookieOptions = [
        `access_token=${accessToken}`,
        'path=/',
        'max-age=86400', // 24 hours
        'SameSite=Strict'
      ]
      
      // Thêm secure flag nếu đang ở HTTPS
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        cookieOptions.push('Secure')
      }
      
      document.cookie = cookieOptions.join('; ')
    } catch (error) {
      console.error(`❌ Failed to save token to cookies:`, error)
    }
  }

  const getStoredToken = (): string | null => {
    try {
      const tokenData = localStorage.getItem("access_token")
      if (!tokenData) return null
      
      const parsed = JSON.parse(tokenData)
      
      // Kiểm tra token có expired không
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        console.log(`⚠️ Token expired, removing...`)
        clearStoredTokens()
        return null
      }
      
      return parsed.token
    } catch (error) {
      console.error(`❌ Failed to get stored token:`, error)
      return null
    }
  }

  const clearStoredTokens = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_data")
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  useEffect(() => {
    // Check if user is logged in on mount
    const token = getStoredToken()
    const userData = localStorage.getItem("user_data")

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("Failed to parse user data:", error)
        clearStoredTokens()
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    console.log(`🔐 AUTH CONTEXT: LOGIN`)
    console.log(`📝 Username:`, username)
    console.log(`📝 Password:`, password ? "***" : "undefined")
    
    try {
      const response = await apiClient.login({ username, password })
      console.log(`✅ Login successful:`, response)

      // Kiểm tra response format
      if (response.error_code !== 0) {
        throw new Error(response.message || "Login failed")
      }

      const { access_token, user } = response.data
      console.log(`📝 Access Token:`, access_token ? "***" : "undefined")
      console.log(`📝 User:`, user)

      // Lưu token vào localStorage với cơ chế bảo mật
      saveTokenSecurely(access_token, user)
      console.log(`💾 Tokens saved securely`)

      // Lưu vào cookies cho middleware
      saveTokenToCookies(access_token)
      console.log(`🍪 Token saved to cookies`)

      setUser(user)
      router.push("/") // Redirect to home page after login
    } catch (error) {
      console.error(`❌ Login failed:`, error)
      throw error
    }
  }

  const logout = async () => {
    console.log(`🚪 AUTH CONTEXT: LOGOUT`)
    try {
      await apiClient.logout()
      console.log(`✅ Logout API call successful`)
    } catch (error) {
      console.error("❌ Logout API error:", error)
    } finally {
      clearStoredTokens()
      console.log(`🗑️ Tokens removed from localStorage and cookies`)

      setUser(null)
      router.push("/login") // Redirect to login page after logout
    }
  }

  const refreshToken = async () => {
    console.log(`🔄 AUTH CONTEXT: REFRESH TOKEN`)
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      console.log(`📝 Refresh token:`, refreshToken ? "***" : "undefined")
      
      if (!refreshToken) {
        throw new Error("No refresh token found")
      }

      const response = await apiClient.refreshToken({ refresh_token: refreshToken })
      console.log(`✅ Token refresh successful:`, response)

      localStorage.setItem("access_token", response.access_token)
      localStorage.setItem("refresh_token", response.refresh_token)
      console.log(`💾 New tokens saved to localStorage`)
    } catch (error) {
      console.error("❌ Token refresh failed:", error)
      logout()
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
