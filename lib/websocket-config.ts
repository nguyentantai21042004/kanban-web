export enum WebSocketMode {
  LOCAL_ONLY = 'local_only',
  PRODUCTION_ONLY = 'production_only',
  DISABLED = 'disabled',
}

export class WebSocketConfig {
  static getUrl(boardId: string, token: string): string {
    return `wss://kanban-api.ngtantai.pro/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
  }
}