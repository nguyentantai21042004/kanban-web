# WebSocket và Position Algorithm Fixes

## Vấn đề đã được giải quyết

### 1. WebSocket Connection Issues

**Vấn đề:**
- WebSocket client không thể kết nối đến server
- Lỗi "WebSocket not connected, cannot send message"

**Nguyên nhân:**
- WebSocket URL hardcode `ws://localhost:8080`
- Server API không chạy trên port 8080
- Thiếu error handling và timeout

**Giải pháp:**
- Cập nhật WebSocket URL để sử dụng environment variable
- Thêm connection timeout (10 giây)
- Cải thiện error handling và logging
- Thêm kiểm tra connection status trước khi gửi message

```typescript
// Trước
const wsUrl = `ws://localhost:8080/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`

// Sau
const wsUrl = process.env.NODE_ENV === 'production' 
  ? `wss://${window.location.host}/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
  : `ws://localhost:8080/api/v1/websocket/ws/${boardId}?token=${encodeURIComponent(token)}`
```

### 2. Position Algorithm Synchronization

**Vấn đề:**
- Frontend tính toán position dựa trên index (0, 1, 2...)
- Backend tính toán position dựa trên decimal với khoảng cách 1000
- Khi reload, thứ tự card không khớp giữa frontend và backend

**Nguyên nhân:**
- Frontend và backend sử dụng thuật toán position khác nhau
- Frontend tính toán position trước khi gọi API
- Backend tính toán lại position và có thể khác với frontend

**Giải pháp:**
- Loại bỏ việc tính toán position trên frontend
- Để backend xử lý hoàn toàn việc tính toán position
- Frontend chỉ gửi position = 0 để backend tự động tính toán vị trí tốt nhất
- Cập nhật UI với response từ server

```typescript
// Trước - Frontend tính toán position
const validPosition = Math.max(0, Math.min(position, cardsInList.length))
// ... tính toán phức tạp

// Sau - Để backend xử lý
const updatedCard = await apiClient.moveCard({
  id: draggedCard.id,
  list_id: listId,
  position: 0, // Backend sẽ tính toán vị trí tốt nhất
})
```

### 3. Backend Position Algorithm Improvements

**Cải thiện thuật toán `calculateNewPosition`:**
- Xử lý tốt hơn khi `targetPosition = 0`
- Đặt card vào cuối list khi không có position cụ thể
- Đảm bảo tính nhất quán trong việc tính toán position

```go
// Nếu targetPosition = 0, đặt card vào cuối list
if targetPosition <= 0 {
    lastCard := cards[len(cards)-1]
    lastPos := 0.0
    if lastCard.Position.Big != nil {
        lastPos, _ = lastCard.Position.Big.Float64()
    }
    return lastPos + 1000.0, nil
}
```

## Cách sử dụng

### 1. Khởi động API Server

```bash
cd kanban-api
./start-dev.sh
```

### 2. Kiểm tra WebSocket Connection

- Mở Developer Tools trong browser
- Vào tab Console
- Kiểm tra các log message:
  - `🔌 WEBSOCKET CONNECT`
  - `✅ WebSocket connected successfully`
  - `📤 Sending auth message`

### 3. Test Card Movement

- Kéo thả card giữa các list
- Kiểm tra console log để xem:
  - API response với position thực tế
  - WebSocket message được gửi
  - Không có lỗi "WebSocket not connected"

## Monitoring và Debugging

### WebSocket Logs
```javascript
// Frontend logs
🔌 WEBSOCKET CONNECT
📝 Board ID: board123
🔗 WebSocket URL: ws://localhost:8080/api/v1/websocket/ws/board123?token=...
✅ WebSocket connected successfully
📤 Sending auth message
📥 WebSocket message received: {...}
```

### Position Algorithm Logs
```go
// Backend logs
Moving card card123 from list list1 to list list2 at position 0
Card moved successfully: card123, Title: Test Card, ListID: list2, Position: 1500.0
```

## Troubleshooting

### WebSocket không kết nối
1. Kiểm tra server có chạy trên port 8080 không
2. Kiểm tra token authentication
3. Kiểm tra network connectivity
4. Xem console logs để debug

### Position không đồng bộ
1. Kiểm tra API response có position đúng không
2. Kiểm tra database có lưu position chính xác không
3. Reload page để xem thứ tự thực tế

## Files đã thay đổi

1. `kanban-web/lib/websocket.ts` - Cải thiện WebSocket connection
2. `kanban-web/app/board/[id]/page.tsx` - Sửa logic handleDrop
3. `kanban-api/internal/cards/repository/postgres/card.go` - Cải thiện position algorithm
4. `kanban-api/start-dev.sh` - Script khởi động development server 