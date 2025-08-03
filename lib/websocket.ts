import type { WebSocketMessage, WebSocketAuthMessage } from "./types"

export class WebSocketClient {
  private ws: WebSocket | null = null
  private boardId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  connect(boardId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.boardId = boardId
      const tokenData = localStorage.getItem("access_token")

      console.log(`🔌 WEBSOCKET CONNECT`)
      console.log(`📝 Board ID:`, boardId)
      console.log(`📝 Token data:`, tokenData ? "***" : "undefined")

      if (!tokenData) {
        console.error(`❌ No access token found for WebSocket`)
        reject(new Error("No access token found"))
        return
      }

      // Parse token data and extract JWT token
      let token: string
      try {
        const parsed = JSON.parse(tokenData)
        token = parsed.token
        if (!token) {
          throw new Error("Token not found in stored data")
        }
      } catch (error) {
        console.error(`❌ Failed to parse token data:`, error)
        reject(new Error("Invalid token data"))
        return
      }

      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
        : `ws://localhost:8080/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
      console.log(`🔗 WebSocket URL:`, wsUrl)

      try {
        this.ws = new WebSocket(wsUrl)

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            console.error(`❌ WebSocket connection timeout`)
            this.ws.close()
            reject(new Error("Connection timeout"))
          }
        }, 10000) // 10 seconds timeout

        // Send auth token after connection
        this.ws.onopen = () => {
          console.log(`✅ WebSocket connected successfully`)
          console.log(`📤 Sending auth message`)
          clearTimeout(connectionTimeout)
          this.reconnectAttempts = 0

          // Send authentication confirmation
          this.sendAuth({
            type: "auth",
            data: {
              token: token,
            },
          })

          resolve()
        }

        this.ws.onmessage = (event) => {
          console.log(`📥 WebSocket message received:`, event.data)
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            console.log(`📥 Parsed message:`, message)
            this.handleMessage(message)
          } catch (error) {
            console.error("❌ Failed to parse WebSocket message:", error)
          }
        }

        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocket disconnected:`, event.code, event.reason)
          clearTimeout(connectionTimeout)
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error)
          clearTimeout(connectionTimeout)
          reject(error)
        }
      } catch (error) {
        console.error("❌ WebSocket connection failed:", error)
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach((callback) => callback(message.data))
    }

    // Also trigger generic listeners
    const allListeners = this.listeners.get("*")
    if (allListeners) {
      allListeners.forEach((callback) => callback(message))
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`📤 WebSocket sending message:`, message)
      this.ws.send(JSON.stringify(message))
    } else {
      console.error(`❌ WebSocket not connected, cannot send message:`, message)
    }
  }

  sendAuth(message: WebSocketAuthMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`📤 WebSocket sending auth message:`, message)
      this.ws.send(JSON.stringify(message))
    } else {
      console.error(`❌ WebSocket not connected, cannot send auth message:`, message)
    }
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)
  }

  off(eventType: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  disconnect(): void {
    console.log(`🔌 WebSocket disconnecting`)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.boardId = null
    this.reconnectAttempts = 0
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 WebSocket reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      setTimeout(() => {
        if (this.boardId) {
          this.connect(this.boardId).catch((error) => {
            console.error(`❌ WebSocket reconnection failed:`, error)
          })
        }
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error(`❌ WebSocket max reconnection attempts reached`)
    }
  }
}

export const wsClient = new WebSocketClient()
