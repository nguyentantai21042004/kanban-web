# Infinite Scroll Demo

## Tính năng phân trang với Infinite Scroll

### 1. Cấu trúc Response API mới
```json
{
  "error_code": 0,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Product Development",
        "description": "Main board for product development tasks and features",
        "alias": ""
      }
    ],
    "meta": {
      "total": 4,
      "count": 4,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 1
    }
  }
}
```

### 2. State Management

#### A. Pagination State
```javascript
const [currentPage, setCurrentPage] = useState(1)
const [hasMore, setHasMore] = useState(true)
const [totalPages, setTotalPages] = useState(1)
const [isLoadingMore, setIsLoadingMore] = useState(false)
```

#### B. Boards State
```javascript
const [boards, setBoards] = useState<Board[]>([])
const [isLoading, setIsLoading] = useState(true)
```

### 3. Load Boards Function

#### A. Reset vs Load More
```javascript
const loadBoards = async (reset = false) => {
  if (reset) {
    // Reset to first page
    setIsLoading(true)
    setCurrentPage(1)
    setBoards([])
  } else {
    // Load more
    setIsLoadingMore(true)
  }
  
  const response = await apiClient.getBoards({
    keyword: searchKeyword || undefined,
    page: reset ? 1 : currentPage + 1,
    limit: 10, // Chỉ load 10 items mỗi lần
  })
}
```

#### B. Response Processing
```javascript
// Check response format
if (response.error_code !== 0) {
  throw new Error(response.message || "Failed to load boards")
}

const { items, meta } = response.data

if (reset) {
  setBoards(items || [])
} else {
  setBoards(prev => [...prev, ...(items || [])])
}

setCurrentPage(reset ? 1 : currentPage + 1)
setTotalPages(meta.total_pages)
setHasMore(meta.current_page < meta.total_pages)
```

### 4. Infinite Scroll Implementation

#### A. Intersection Observer
```javascript
const observerRef = useRef<HTMLDivElement>(null)

const handleScroll = useCallback(() => {
  if (isLoadingMore || !hasMore) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadBoards(false)
      }
    },
    { threshold: 0.1 }
  )

  if (observerRef.current) {
    observer.observe(observerRef.current)
  }

  return () => observer.disconnect()
}, [isLoadingMore, hasMore])
```

#### B. Observer Element
```jsx
<div ref={observerRef} />
```

### 5. UI Components

#### A. Loading States
```jsx
{/* Initial loading */}
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
) : (
  // Content
)}

{/* Load more loading */}
{isLoadingMore && (
  <div className="col-span-full text-center py-4">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
)}

{/* End of list */}
{!hasMore && boards.length > 0 && (
  <div className="col-span-full text-center py-4 text-gray-500 text-sm">
    Đã tải hết
  </div>
)}
```

### 6. Search Integration

#### A. Reset on Search
```javascript
useEffect(() => {
  loadBoards(true) // Reset to first page when search changes
}, [searchKeyword])
```

#### B. Search Parameters
```javascript
const response = await apiClient.getBoards({
  keyword: searchKeyword || undefined,
  page: reset ? 1 : currentPage + 1,
  limit: 10,
})
```

### 7. Performance Optimizations

#### A. Debounced Search
```javascript
// Có thể thêm debounce cho search
const debouncedSearch = useCallback(
  debounce((keyword: string) => {
    setSearchKeyword(keyword)
  }, 300),
  []
)
```

#### B. Memoized Components
```javascript
const BoardCard = memo(({ board, onClick }) => (
  <Card onClick={() => onClick(board.id)}>
    {/* Card content */}
  </Card>
))
```

### 8. Error Handling

#### A. API Errors
```javascript
try {
  const response = await apiClient.getBoards({...})
  
  if (response.error_code !== 0) {
    throw new Error(response.message || "Failed to load boards")
  }
} catch (error: any) {
  setError("Không thể tải danh sách boards")
  if (reset) {
    setBoards([])
  }
}
```

#### B. Network Errors
```javascript
// Auto retry on network errors
const loadBoardsWithRetry = async (reset = false, retries = 3) => {
  try {
    await loadBoards(reset)
  } catch (error) {
    if (retries > 0) {
      setTimeout(() => loadBoardsWithRetry(reset, retries - 1), 1000)
    }
  }
}
```

### 9. Testing

#### A. Manual Testing
1. Vào trang `/boards`
2. Scroll xuống cuối danh sách
3. Xem loading indicator xuất hiện
4. Kiểm tra boards mới được load
5. Test search và xem reset pagination

#### B. Console Testing
```javascript
// Test API với ApiDebugger
ApiDebugger.testGetBoards()

// Kiểm tra state
console.log("Current page:", currentPage)
console.log("Has more:", hasMore)
console.log("Total boards:", boards.length)
```

### 10. Expected Behavior

#### A. Initial Load
- Load 10 boards đầu tiên
- Show loading spinner
- Set `hasMore` based on total pages

#### B. Scroll to Bottom
- Trigger intersection observer
- Load next 10 boards
- Append to existing list
- Show "Đã tải hết" when no more

#### C. Search
- Reset pagination to page 1
- Clear existing boards
- Load new results
- Update `hasMore` state

#### D. Create New Board
- Add to beginning of list
- Don't affect pagination
- Update total count

### 11. API Endpoints

#### A. Get Boards
```bash
GET /api/v1/boards?page=1&limit=10&keyword=search
```

#### B. Response Format
```json
{
  "error_code": 0,
  "message": "Success",
  "data": {
    "items": [...],
    "meta": {
      "total": 25,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 3
    }
  }
}
```

### 12. Troubleshooting

#### A. Infinite Scroll không hoạt động
- Kiểm tra `observerRef` có được mount không
- Kiểm tra `hasMore` state
- Kiểm tra intersection observer

#### B. Duplicate boards
- Kiểm tra `reset` parameter
- Kiểm tra `currentPage` logic
- Kiểm tra API response

#### C. Performance issues
- Implement virtual scrolling cho large lists
- Add loading skeletons
- Optimize re-renders với React.memo 