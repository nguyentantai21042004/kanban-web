# Cập nhật Trang Boards

## Các thay đổi đã thực hiện

### 1. Sửa lỗi call API 2 lần

**Vấn đề**: Cơ chế phân trang đang gọi API 2 lần, khiến data bị duplicate (4 records nhưng hiển thị 8 records).

**Giải pháp**:
- Thêm debounce cho search keyword (500ms delay)
- Sửa lại logic infinite scroll để tránh duplicate calls
- Loại bỏ useCallback không cần thiết
- Tối ưu hóa Intersection Observer

**Thay đổi trong code**:
```typescript
// Thêm debounce
const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState(searchKeyword)

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchKeyword(searchKeyword)
  }, 500)
  return () => clearTimeout(timer)
}, [searchKeyword])

// Sử dụng debounced keyword trong API call
const response = await apiClient.getBoards({
  keyword: debouncedSearchKeyword || undefined,
  page: reset ? 1 : currentPage + 1,
  limit: 10,
})
```

### 2. Thêm thông tin "Created By"

**Yêu cầu**: Hiển thị tên người tạo board ở góc dưới phải của mỗi board item.

**Thay đổi**:
- Cập nhật type `Board` để bao gồm thông tin `created_by`
- Thêm UI hiển thị thông tin người tạo với icon User

**Type mới**:
```typescript
export interface Board {
  id: string
  name: string
  description?: string
  alias?: string
  created_by?: {
    id: string
    full_name: string
    email: string
  }
  created_at?: string
  updated_at?: string
}
```

**UI mới**:
```tsx
{/* Created by info at bottom right */}
{board.created_by && (
  <div className="absolute bottom-2 right-3">
    <div className="flex items-center space-x-1">
      <User className="h-3 w-3 text-gray-400" />
      <span className="text-xs text-gray-500">
        {board.created_by.full_name}
      </span>
    </div>
  </div>
)}
```

### 3. Cải thiện UX

- Thêm debounce cho search để tránh spam API calls
- Tối ưu hóa infinite scroll
- Giữ nguyên giao diện sạch sẽ và responsive

## API Endpoint

Endpoint `/api/v1/boards` hỗ trợ các tham số:
- `keyword`: Tìm kiếm theo từ khóa
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng items per page (mặc định: 10)
- `ids`: Filter theo IDs

Response format:
```json
{
  "error_code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "alias": "string",
        "created_by": {
          "id": "string",
          "full_name": "string",
          "email": "string"
        },
        "created_at": "string",
        "updated_at": "string"
      }
    ],
    "meta": {
      "count": 0,
      "current_page": 1,
      "per_page": 10,
      "total": 0,
      "total_pages": 1
    }
  }
}
```

## Testing

Đã test build thành công với Next.js 14.2.16. Không có lỗi TypeScript hoặc linting. 