import type { WebSocketMessage } from "./types"

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
      const token = localStorage.getItem("access_token")

      console.log(`🔌 WEBSOCKET CONNECT`)
      console.log(`📝 Board ID:`, boardId)
      console.log(`📝 Token:`, token ? "***" : "undefined")

      if (!token) {
        console.error(`❌ No access token found for WebSocket`)
        reject(new Error("No access token found"))
        return
      }

      const wsUrl = `ws://localhost:8080/api/v1/websocket/ws/${boardId}`
      console.log(`🔗 WebSocket URL:`, wsUrl)

      try {
        this.ws = new WebSocket(wsUrl)

        // Send auth token after connection
        this.ws.onopen = () => {
          console.log(`✅ WebSocket connected successfully`)
          console.log(`📤 Sending auth message`)
          this.reconnectAttempts = 0

          // Send authentication
          this.send({
            type: "auth",
            token: token,
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
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error)
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
