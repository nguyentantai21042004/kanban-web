# WebSocket Testing Guide

## Các cách test WebSocket

### 1. **Test với local API server (Khuyến nghị)**

```bash
# Terminal 1: Start local API server
cd ../kanban-api
go run main.go

# Terminal 2: Start web app
cd kanban-web
npm run dev
```

### 2. **Test với production WebSocket only**

Chỉnh sửa `lib/websocket.ts`:
```typescript
// Thay đổi dòng này:
if (Config.isDevelopment()) {
  wsUrl = `ws://localhost:8080/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
}

// Thành:
if (Config.isDevelopment()) {
  wsUrl = Config.getWebSocketUrl(boardId, token) // Force production
}
```

### 3. **Test với local + production fallback (Hiện tại)**

- Tự động thử local trước (`ws://localhost:8080`)
- Nếu local fail, fallback về production (`wss://kanban-api.ngtantai.pro`)

### 4. **Disable WebSocket hoàn toàn**

Chỉnh sửa `lib/websocket.ts`:
```typescript
if (Config.isDevelopment()) {
  console.log(`🔌 WebSocket disabled in development mode`)
  resolve()
  return
}
```

## Cách kiểm tra WebSocket hoạt động

1. **Mở Developer Tools** (F12)
2. **Vào tab Console**
3. **Load một board**
4. **Xem log WebSocket**:
   - `🔌 Trying local WebSocket: ws://localhost:8080/...`
   - `✅ WebSocket connected successfully` (nếu thành công)
   - `🔄 Local WebSocket failed, trying production WebSocket...` (nếu local fail)

## Real-time features để test

1. **Card updates**: Chỉnh sửa card, xem có update real-time không
2. **Card movement**: Kéo thả card, xem có sync không
3. **New cards**: Tạo card mới, xem có xuất hiện real-time không
4. **Comments**: Thêm comment, xem có sync không

## Troubleshooting

### WebSocket không kết nối được
- Kiểm tra API server có chạy không
- Kiểm tra port 8080 có mở không
- Kiểm tra CORS settings

### Mixed content errors
- Đảm bảo web chạy trên HTTP khi test local
- Đảm bảo WebSocket URL đúng protocol (ws:// vs wss://)

### Authentication errors
- Kiểm tra token có valid không
- Kiểm tra token format trong WebSocket URL 