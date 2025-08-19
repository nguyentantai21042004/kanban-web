import type { WebSocketMessage, WebSocketAuthMessage } from "./types"
import { WebSocketConfig } from "./websocket-config"

export class WebSocketClient {
  private ws: WebSocket | null = null
  private boardId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private connectionPromise: Promise<void> | null = null // Cache connection promise
  private persistentBoardId: string | null = null // Store boardId persistently for reconnection

  connect(boardId: string): Promise<void> {
    console.log(`🔍 [WEBSOCKET DEBUG] connect() called with boardId: ${boardId}`)
    
    // Store boardId persistently for reconnection
    this.persistentBoardId = boardId
    
    // Return cached connection if already connecting
    if (this.connectionPromise) {
      console.log(`🔍 [WEBSOCKET DEBUG] Using cached connection promise`)
      return this.connectionPromise
    }

    console.log(`🔍 [WEBSOCKET DEBUG] Creating new connection promise`)
    this.connectionPromise = new Promise((resolve, reject) => {
      this.boardId = boardId
      console.log(`🔍 [WEBSOCKET DEBUG] BoardId set to: ${this.boardId}`)
      
      const tokenData = localStorage.getItem("access_token")
      console.log(`🔍 [WEBSOCKET DEBUG] Token data from localStorage:`, tokenData ? "EXISTS" : "NOT FOUND")

      console.log(`🔌 WEBSOCKET CONNECT`)

      if (!tokenData) {
        console.error(`❌ [WEBSOCKET DEBUG] No access token found for WebSocket`)
        reject(new Error("No access token found"))
        return
      }

      // Parse token data and extract JWT token
      let token: string
      try {
        console.log(`🔍 [WEBSOCKET DEBUG] Attempting to parse token data`)
        const parsed = JSON.parse(tokenData)
        console.log(`🔍 [WEBSOCKET DEBUG] Parsed token data:`, parsed)
        token = parsed.token
        if (!token) {
          throw new Error("Token not found in stored data")
        }
        console.log(`🔍 [WEBSOCKET DEBUG] Token extracted successfully, length: ${token.length}`)
      } catch (error) {
        console.error(`❌ [WEBSOCKET DEBUG] Failed to parse token data:`, error)
        reject(new Error("Invalid token data"))
        return
      }

      // Use centralized config for WebSocket URL
      console.log(`🔍 [WEBSOCKET DEBUG] Getting WebSocket URL from config`)
      const wsUrl = WebSocketConfig.getUrl(boardId, token)
      console.log(`🔍 [WEBSOCKET DEBUG] WebSocket URL generated: ${wsUrl}`)
      console.log(`🔗 WebSocket URL:`, wsUrl)

      try {
        console.log(`🔍 [WEBSOCKET DEBUG] Creating new WebSocket instance`)
        console.log(`🔍 [WEBSOCKET DEBUG] WebSocket constructor called with URL: ${wsUrl}`)
        this.ws = new WebSocket(wsUrl)
        console.log(`🔍 [WEBSOCKET DEBUG] WebSocket instance created successfully`)
        console.log(`🔍 [WEBSOCKET DEBUG] WebSocket readyState: ${this.ws.readyState}`)
        console.log(`🔍 [WEBSOCKET DEBUG] WebSocket readyState meaning:`, {
          0: "CONNECTING",
          1: "OPEN", 
          2: "CLOSING",
          3: "CLOSED"
        }[this.ws.readyState])
        
        this.setupWebSocketHandlers(token, resolve, reject)
      } catch (error) {
        console.error("❌ [WEBSOCKET DEBUG] WebSocket connection failed:", error)
        console.error("❌ [WEBSOCKET DEBUG] Error details:", {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        })
        this.connectionPromise = null // Reset connection promise
        reject(error)
      }
    })

    return this.connectionPromise
  }

  private handleMessage(message: WebSocketMessage) {
    console.log(`🔍 [WEBSOCKET DEBUG] handleMessage called with:`, message)
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      console.log(`🔍 [WEBSOCKET DEBUG] Found ${listeners.size} listeners for type: ${message.type}`)
      listeners.forEach((callback) => callback(message.data))
    } else {
      console.log(`🔍 [WEBSOCKET DEBUG] No listeners found for type: ${message.type}`)
    }

    // Also trigger generic listeners
    const allListeners = this.listeners.get("*")
    if (allListeners) {
      console.log(`🔍 [WEBSOCKET DEBUG] Found ${allListeners.size} generic listeners`)
      allListeners.forEach((callback) => callback(message))
    }
  }

  send(message: WebSocketMessage): void {
    console.log(`🔍 [WEBSOCKET DEBUG] send() called with message:`, message)
    console.log(`🔍 [WEBSOCKET DEBUG] WebSocket state:`, {
      exists: !!this.ws,
      readyState: this.ws?.readyState,
      readyStateText: this.ws ? {
        0: "CONNECTING",
        1: "OPEN", 
        2: "CLOSING",
        3: "CLOSED"
      }[this.ws.readyState] : "NO_WEBSOCKET"
    })
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`📤 WebSocket sending message:`, message)
      this.ws.send(JSON.stringify(message))
    } else {
      console.error(`❌ [WEBSOCKET DEBUG] WebSocket not connected, cannot send message:`, message)
    }
  }

  sendAuth(message: WebSocketAuthMessage): void {
    console.log(`🔍 [WEBSOCKET DEBUG] sendAuth() called with message:`, message)
    console.log(`🔍 [WEBSOCKET DEBUG] WebSocket state:`, {
      exists: !!this.ws,
      readyState: this.ws?.readyState,
      readyStateText: this.ws ? {
        0: "CONNECTING",
        1: "OPEN", 
        2: "CLOSING",
        3: "CLOSED"
      }[this.ws.readyState] : "NO_WEBSOCKET"
    })
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`📤 WebSocket sending auth message:`, message)
      this.ws.send(JSON.stringify(message))
    } else {
      console.error(`❌ [WEBSOCKET DEBUG] WebSocket not connected, cannot send auth message:`, message)
    }
  }

  on(eventType: string, callback: (data: any) => void) {
    console.log(`🔍 [WEBSOCKET DEBUG] on() called for eventType: ${eventType}`)
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
      console.log(`🔍 [WEBSOCKET DEBUG] Created new listener set for eventType: ${eventType}`)
    }
    this.listeners.get(eventType)!.add(callback)
    console.log(`🔍 [WEBSOCKET DEBUG] Added callback for eventType: ${eventType}, total listeners: ${this.listeners.get(eventType)!.size}`)
  }

  off(eventType: string, callback: (data: any) => void) {
    console.log(`🔍 [WEBSOCKET DEBUG] off() called for eventType: ${eventType}`)
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.delete(callback)
      console.log(`🔍 [WEBSOCKET DEBUG] Removed callback for eventType: ${eventType}, remaining listeners: ${listeners.size}`)
    }
  }

  disconnect(): void {
    console.log(`🔍 [WEBSOCKET DEBUG] disconnect() called`)
    console.log(`🔌 WebSocket disconnecting`)
    if (this.ws) {
      console.log(`🔍 [WEBSOCKET DEBUG] Closing WebSocket connection`)
      this.ws.close()
      this.ws = null
    }
    this.boardId = null
    this.reconnectAttempts = 0
    this.listeners.clear()
    console.log(`🔍 [WEBSOCKET DEBUG] WebSocket client reset`)
  }

  isConnected(): boolean {
    const connected = this.ws?.readyState === WebSocket.OPEN
    console.log(`🔍 [WEBSOCKET DEBUG] isConnected() called, result: ${connected}`)
    return connected
  }

  private setupWebSocketHandlers(token: string, resolve: () => void, reject: (error: any) => void): void {
    console.log(`🔍 [WEBSOCKET DEBUG] setupWebSocketHandlers() called`)
    console.log(`🔍 [WEBSOCKET DEBUG] Token length: ${token.length}`)
    
    // Set connection timeout
    console.log(`🔍 [WEBSOCKET DEBUG] Setting connection timeout of 10 seconds`)
    const connectionTimeout = setTimeout(() => {
      console.log(`🔍 [WEBSOCKET DEBUG] Connection timeout triggered`)
      if (this.ws?.readyState === WebSocket.CONNECTING) {
        console.error(`❌ [WEBSOCKET DEBUG] WebSocket connection timeout`)
        console.log(`🔍 [WEBSOCKET DEBUG] Current WebSocket readyState: ${this.ws.readyState}`)
        this.ws.close()
        reject(new Error("Connection timeout"))
      }
    }, 10000) // Tăng timeout lên 10s cho local development

    // Send auth token after connection
    this.ws!.onopen = () => {
      console.log(`🔍 [WEBSOCKET DEBUG] onopen event triggered`)
      console.log(`🔍 [WEBSOCKET DEBUG] WebSocket readyState: ${this.ws!.readyState}`)
      console.log(`✅ WebSocket connected successfully`)
      console.log(`📤 Sending auth message`)
      clearTimeout(connectionTimeout)
      this.reconnectAttempts = 0

      // Send authentication confirmation
      console.log(`🔍 [WEBSOCKET DEBUG] Preparing auth message`)
      const authMessage: WebSocketAuthMessage = {
        type: "auth",
        data: {
          token: token,
        },
      }
      console.log(`🔍 [WEBSOCKET DEBUG] Auth message prepared:`, authMessage)
      this.sendAuth(authMessage)

      console.log(`🔍 [WEBSOCKET DEBUG] Resolving connection promise`)
      resolve()
    }

    this.ws!.onmessage = (event) => {
      console.log(`🔍 [WEBSOCKET DEBUG] onmessage event triggered`)
      console.log(`🔍 [WEBSOCKET DEBUG] Raw message data:`, event.data)
      console.log(`📥 WebSocket message received:`, event.data)
      try {
        console.log(`🔍 [WEBSOCKET DEBUG] Attempting to parse message as JSON`)
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log(`🔍 [WEBSOCKET DEBUG] Message parsed successfully:`, message)
        console.log(`📥 Parsed message:`, message)
        this.handleMessage(message)
      } catch (error) {
        console.error("❌ [WEBSOCKET DEBUG] Failed to parse WebSocket message:", error)
        console.error("❌ [WEBSOCKET DEBUG] Raw message that failed to parse:", event.data)
      }
    }

    this.ws!.onclose = (event) => {
      console.log(`🔍 [WEBSOCKET DEBUG] onclose event triggered`)
      console.log(`🔍 [WEBSOCKET DEBUG] Close event details:`, {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        type: event.type
      })
      console.log(`🔍 [WEBSOCKET DEBUG] Close code meanings:`, {
        1000: "Normal closure",
        1001: "Going away",
        1002: "Protocol error", 
        1003: "Unsupported data",
        1005: "No status received",
        1006: "Abnormal closure",
        1007: "Invalid frame payload data",
        1008: "Policy violation",
        1009: "Message too big",
        1010: "Client terminating",
        1011: "Server error",
        1012: "Service restart",
        1013: "Try again later",
        1014: "Bad gateway",
        1015: "TLS handshake"
      }[event.code] || "Unknown code")
      
      console.log(`🔌 WebSocket disconnected:`, event.code, event.reason)
      clearTimeout(connectionTimeout)
      this.connectionPromise = null // Reset connection promise
      
      // Don't reconnect if it's a normal close or auth error
      if (event.code === 1000 || event.code === 1008) {
        console.log(`🔍 [WEBSOCKET DEBUG] WebSocket closed normally or due to auth error, not reconnecting`)
        console.log(`🔌 WebSocket closed normally or due to auth error`)
        return
      }
      
      // Remove fallback to production websocket, always use production URL
      console.log(`🔍 [WEBSOCKET DEBUG] Initiating reconnection`)
      this.handleReconnect()
    }

    this.ws!.onerror = (error) => {
      console.log(`🔍 [WEBSOCKET DEBUG] onerror event triggered`)
      console.log(`🔍 [WEBSOCKET DEBUG] Error event details:`, error)
      console.error("❌ [WEBSOCKET DEBUG] WebSocket error:", error)
      clearTimeout(connectionTimeout)
      this.connectionPromise = null // Reset connection promise
      // Don't reject immediately, let the onclose handle it
      // reject(error)
    }
  }

  private handleReconnect(): void {
    console.log(`🔍 [WEBSOCKET DEBUG] handleReconnect() called`)
    console.log(`🔍 [WEBSOCKET DEBUG] Current reconnect attempts: ${this.reconnectAttempts}`)
    console.log(`🔍 [WEBSOCKET DEBUG] Max reconnect attempts: ${this.maxReconnectAttempts}`)
    console.log(`🔍 [WEBSOCKET DEBUG] Persistent boardId: ${this.persistentBoardId}`)
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔍 [WEBSOCKET DEBUG] Incrementing reconnect attempts to: ${this.reconnectAttempts}`)
      console.log(`🔄 WebSocket reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      
      const delay = this.reconnectDelay * this.reconnectAttempts
      console.log(`🔍 [WEBSOCKET DEBUG] Reconnection delay: ${delay}ms`)
      
      setTimeout(() => {
        console.log(`🔍 [WEBSOCKET DEBUG] Reconnection timeout triggered`)
        if (this.persistentBoardId) {
          console.log(`🔍 [WEBSOCKET DEBUG] Attempting to reconnect with persistent boardId: ${this.persistentBoardId}`)
          this.connect(this.persistentBoardId).catch((error) => {
            console.error(`❌ [WEBSOCKET DEBUG] WebSocket reconnection failed:`, error)
          })
        } else {
          console.log(`🔍 [WEBSOCKET DEBUG] No persistent boardId available for reconnection`)
        }
      }, delay)
    } else {
      console.log(`🔍 [WEBSOCKET DEBUG] Max reconnection attempts reached`)
      console.error(`❌ [WEBSOCKET DEBUG] WebSocket max reconnection attempts reached`)
    }
  }
}

export const wsClient = new WebSocketClient()
