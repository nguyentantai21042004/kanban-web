# URL Configuration

## Tổng quan

Cấu hình URL đã được tập trung hóa để đảm bảo API và WebSocket luôn sử dụng cùng domain.

## Cấu trúc

### File chính: `lib/api/utils/config.ts`

```typescript
export class Config {
  // API Configuration
  static readonly API_BASE_URL = "https://kanban-api.ngtantai.pro/api/v1"
  
  // WebSocket Configuration
  static readonly WS_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'wss://kanban-api.ngtantai.pro'
    : 'ws://localhost:8080'
}
```

## URLs theo Environment

### Production
- **API**: `https://kanban-api.ngtantai.pro/api/v1`
- **WebSocket**: `wss://kanban-api.ngtantai.pro/api/v1/websocket/ws/{boardId}?token={token}`

### Development
- **API**: `https://kanban-api.ngtantai.pro/api/v1` (vẫn dùng production API)
- **WebSocket**: `ws://localhost:8080/api/v1/websocket/ws/{boardId}?token={token}`

## Sử dụng

### API Requests
```typescript
import { Config } from '@/lib/api/utils/config'

// Tự động sử dụng đúng URL
const boards = await apiClient.boards.getBoards()
```

### WebSocket Connection
```typescript
import { Config } from '@/lib/api/utils/config'

// Tự động sử dụng đúng URL theo environment
const wsUrl = Config.getWebSocketUrl(boardId, token)
```

## Lợi ích

1. **Consistency**: API và WebSocket luôn dùng cùng domain
2. **Maintainability**: Chỉ cần thay đổi ở một nơi
3. **Environment-aware**: Tự động chọn URL phù hợp
4. **Type-safe**: TypeScript support đầy đủ

## Migration từ cũ

### Trước đây:
```typescript
// Hardcoded URLs
const apiUrl = "https://kanban-api.ngtantai.pro/api/v1"
const wsUrl = process.env.NODE_ENV === 'production' 
  ? 'wss://kanban-api.ngtantai.pro'
  : 'ws://localhost:8080'
```

### Bây giờ:
```typescript
// Centralized configuration
import { Config } from '@/lib/api/utils/config'

const apiUrl = Config.getApiUrl('/boards')
const wsUrl = Config.getWebSocketUrl(boardId, token)
```

## Testing

Chạy script test để kiểm tra cấu hình:

```bash
./scripts/test-url-config.sh
```

## Troubleshooting

### WebSocket không kết nối được
1. Kiểm tra domain có đúng không: `kanban-api.ngtantai.pro`
2. Kiểm tra protocol: `wss://` cho production, `ws://` cho development
3. Kiểm tra token có hợp lệ không

### API 404 errors
1. Kiểm tra endpoint có đúng không
2. Kiểm tra base URL: `https://kanban-api.ngtantai.pro/api/v1`
3. Kiểm tra authentication headers 