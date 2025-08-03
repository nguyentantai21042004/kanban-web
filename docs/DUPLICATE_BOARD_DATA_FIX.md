# Duplicate Board Data Fix

## Vấn đề

WebSocket connection đang được gọi 2 lần, dẫn đến việc load board data bị duplicate và hiển thị 2 board trên giao diện.

## Nguyên nhân

1. **useEffect dependency**: `useEffect` có thể chạy nhiều lần khi `boardId` thay đổi
2. **WebSocket event handlers**: Các event handlers có thể trigger việc update state nhiều lần
3. **Reconnection logic**: WebSocket có thể reconnect và trigger lại các event handlers
4. **Missing cleanup**: Không có cleanup cho event listeners khi component unmount

## Giải pháp

### 1. Cải thiện useEffect cleanup

```typescript
// Trước
useEffect(() => {
  if (boardId) {
    loadBoardData()
    connectWebSocket()
  }

  return () => {
    wsClient.disconnect()
  }
}, [boardId])

// Sau
useEffect(() => {
  if (boardId) {
    loadBoardData()
    connectWebSocket()
  }

  return () => {
    // Cleanup WebSocket listeners
    wsClient.off("card_created", handleCardCreated)
    wsClient.off("card_updated", handleCardUpdated)
    wsClient.off("card_moved", handleCardMoved)
    wsClient.off("card_deleted", handleCardDeleted)
    wsClient.off("list_created", handleListCreated)
    wsClient.off("list_updated", handleListUpdated)
    wsClient.off("list_deleted", handleListDeleted)
    wsClient.disconnect()
  }
}, [boardId]) // Only depend on boardId
```

### 2. Cải thiện WebSocket message format

Sửa tất cả WebSocket messages để có đúng format:

```typescript
// Trước
wsClient.send({
  type: "card_updated",
  data: { ... }
})

// Sau
if (wsClient.isConnected()) {
  wsClient.send({
    type: "card_updated",
    data: { ... },
    board_id: boardId,
    user_id: user?.id || "",
    timestamp: new Date().toISOString(),
  })
}
```

### 3. Thêm connection status check

```typescript
// Kiểm tra connection status trước khi gửi message
if (wsClient.isConnected()) {
  wsClient.send(message)
} else {
  console.warn("WebSocket not connected, cannot send message")
}
```

### 4. Cải thiện error handling

```typescript
// Trước
setCards(originalCards) // originalCards không tồn tại

// Sau
loadBoardData() // Reload data từ server
```

## Các thay đổi đã thực hiện

### 1. WebSocket Client (`kanban-web/lib/websocket.ts`)
- ✅ Thêm connection timeout (10 giây)
- ✅ Cải thiện error handling
- ✅ Thêm method `isConnected()` để kiểm tra status
- ✅ Thêm method `sendAuth()` cho auth messages

### 2. Board Page (`kanban-web/app/board/[id]/page.tsx`)
- ✅ Thêm cleanup cho tất cả event listeners
- ✅ Sửa format cho tất cả WebSocket messages
- ✅ Thêm connection status check trước khi gửi message
- ✅ Cải thiện error handling trong handleDrop

### 3. Development Script (`kanban-api/start-dev.sh`)
- ✅ Tạo script để khởi động development server
- ✅ Tự động kill process cũ nếu port 8080 đang được sử dụng
- ✅ Kiểm tra dependencies và environment

## Cách test

### 1. Khởi động server
```bash
cd kanban-api
./start-dev.sh
```

### 2. Kiểm tra WebSocket connection
- Mở browser console
- Xem logs:
  ```
  🔌 WEBSOCKET CONNECT
  ✅ WebSocket connected successfully
  📤 Sending auth message
  ```

### 3. Test board loading
- Vào một board
- Kiểm tra chỉ có 1 board được hiển thị
- Không có duplicate data

### 4. Test card operations
- Tạo/sửa/xóa card
- Kiểm tra WebSocket messages được gửi đúng format
- Không có lỗi "WebSocket not connected"

## Monitoring

### Console Logs
```javascript
// Successful connection
🔌 WEBSOCKET CONNECT
📝 Board ID: board123
🔗 WebSocket URL: ws://localhost:8080/api/v1/websocket/ws/board123?token=...
✅ WebSocket connected successfully
📤 Sending auth message

// Successful message sending
📤 WebSocket sending message: {type: "card_updated", ...}

// Connection error
❌ WebSocket not connected, cannot send message
```

### Error Handling
- Connection timeout sau 10 giây
- Automatic reconnection với exponential backoff
- Graceful fallback khi WebSocket không khả dụng

## Troubleshooting

### Board data bị duplicate
1. Kiểm tra console logs xem có multiple connections không
2. Kiểm tra useEffect có chạy nhiều lần không
3. Kiểm tra event listeners có được cleanup đúng không

### WebSocket không kết nối
1. Kiểm tra server có chạy trên port 8080 không
2. Kiểm tra token authentication
3. Kiểm tra network connectivity

### Messages không được gửi
1. Kiểm tra connection status với `wsClient.isConnected()`
2. Kiểm tra message format có đúng không
3. Kiểm tra console logs để debug 