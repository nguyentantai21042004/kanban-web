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

      if (!token) {
        reject(new Error("No access token found"))
        return
      }

      const wsUrl = `wss://kanban-api.ngtantai.pro/api/v1/websocket/ws/${boardId}`

      try {
        this.ws = new WebSocket(wsUrl)

        // Send auth token after connection
        this.ws.onopen = () => {
          console.log("WebSocket connected")
          this.reconnectAttempts = 0

          // Send authentication
          this.send({
            type: "auth",
            token: token,
          })

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error)
          }
        }

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason)
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          reject(error)
        }
      } catch (error) {
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

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.boardId) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connect(this.boardId!).catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
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

  disconnect() {
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
}

export const wsClient = new WebSocketClient()
