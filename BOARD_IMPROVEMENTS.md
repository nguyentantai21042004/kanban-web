# Cải tiến Board Page

## Các vấn đề đã giải quyết

### 1. ✅ Card Detail Sidebar
**Vấn đề**: Khi bấm vào card, cần hiển thị sidebar với thông tin chi tiết

**Giải pháp**:
- Tạo component `CardDetailSidebar` với full height
- Width 384px (w-96) không chiếm hết màn hình
- Hiển thị từ bên phải với animation
- Bao gồm:
  - Title (có thể edit)
  - Description (có thể edit)
  - List info
  - Priority (có thể edit)
  - Labels
  - Due date (có thể edit)
  - Created/Updated timestamps

**Files tạo mới**:
- `components/kanban/card-detail-sidebar.tsx`

### 2. ✅ Cải thiện Drag & Drop
**Vấn đề**: 
- Chỉ kéo được giữa các list, không xử lý position
- Không kết nối WebSocket real-time
- Phải reload để thấy thay đổi

**Giải pháp**:
- Cập nhật `use-drag-drop.ts` để track position
- Thêm `dropPosition` vào drag state
- Cải thiện WebSocket connection với localhost
- Real-time updates qua WebSocket events

**API Move Card**:
```typescript
// Theo swagger spec
{
  "id": "card_id",
  "list_id": "target_list_id", 
  "position": 0 // Vị trí trong list
}
```

### 3. ✅ WebSocket Integration
**Vấn đề**: WebSocket không kết nối đúng

**Giải pháp**:
- Sử dụng localhost:8080 thay vì production URL
- Cập nhật API base URL
- WebSocket events:
  - `card_created`
  - `card_updated` 
  - `card_moved`
  - `card_deleted`
  - `list_created`
  - `list_updated`
  - `list_deleted`

### 4. ✅ UI/UX Improvements
**Thay đổi**:
- Card click mở sidebar thay vì form
- Cursor pointer cho cards
- Smooth transitions
- Better visual feedback cho drag & drop

## API Endpoints sử dụng

### WebSocket
```
ws://localhost:8080/api/v1/websocket/ws/{board_id}
```

### Move Card
```
POST /api/v1/cards/move
{
  "id": "string",
  "list_id": "string", 
  "position": "integer"
}
```

### Get Board Data
```
GET /api/v1/boards/{id}
GET /api/v1/lists
GET /api/v1/cards  
GET /api/v1/labels
```

## Cấu trúc Components

```
BoardPage
├── ListColumn[]
│   └── CardItem[]
│       └── onClick → CardDetailSidebar
├── CardForm (create/edit)
├── CardDetailSidebar (view/edit details)
└── WebSocket (real-time updates)
```

## Testing

### Manual Test Cases:
1. ✅ Click card → Mở sidebar
2. ✅ Edit card trong sidebar → Save thành công
3. ✅ Drag card giữa lists → Real-time update
4. ✅ WebSocket connection → Real-time collaboration
5. ✅ Position tracking → Đúng vị trí drop

### Build Status:
- ✅ TypeScript compilation
- ✅ No linting errors
- ✅ All components properly typed

## Next Steps

1. **Position Calculation**: Implement precise position calculation based on mouse position
2. **Visual Feedback**: Add drop indicators between cards
3. **Undo/Redo**: Add undo functionality for card moves
4. **Keyboard Navigation**: Add keyboard shortcuts
5. **Mobile Support**: Optimize for mobile devices

## Files Modified

### New Files:
- `components/kanban/card-detail-sidebar.tsx`

### Updated Files:
- `app/board/[id]/page.tsx` - Add sidebar integration
- `components/kanban/card-item.tsx` - Add click handler
- `components/kanban/list-column.tsx` - Add onCardClick prop
- `lib/use-drag-drop.ts` - Add position tracking
- `lib/websocket.ts` - Update to localhost
- `lib/api.ts` - Update base URL

### Configuration:
- WebSocket URL: `ws://localhost:8080/api/v1/websocket/ws/{board_id}`
- API Base URL: `http://localhost:8080/api/v1` 