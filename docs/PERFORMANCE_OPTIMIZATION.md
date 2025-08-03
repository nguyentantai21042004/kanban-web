# Performance Optimization

## Vấn đề

Khi bấm vào một board, tốc độ load lần đầu rất chậm. Nguyên nhân có thể đến từ:

1. **N+1 Query Problem**: Frontend gọi 4 API riêng biệt
2. **Inefficient Filtering**: Filter data trên frontend thay vì backend
3. **Database Connection Pool**: Chưa được tối ưu
4. **WebSocket Connection**: Timeout quá lâu

## Giải pháp đã thực hiện

### 1. Tối ưu Frontend Loading

```typescript
// Trước - Tất cả API calls song song
const [boardData, listsData, cardsData, labelsData] = await Promise.all([
  apiClient.getBoardById(boardId),
  apiClient.getLists(),
  apiClient.getCards(),
  apiClient.getLabels(),
])

// Sau - Load board trước, sau đó load data khác song song
const boardData = await apiClient.getBoardById(boardId)
const [listsData, cardsData, labelsData] = await Promise.all([
  apiClient.getLists(),
  apiClient.getCards(),
  apiClient.getLabels(),
])
```

### 2. Tối ưu Database Connection Pool

```go
// Trước
defaultConnectTimeout  = 10 * time.Second
defaultMaxIdleConns    = 10
defaultMaxOpenConns    = 100
defaultConnMaxLifetime = time.Hour
defaultConnMaxIdleTime = time.Minute

// Sau
defaultConnectTimeout  = 5 * time.Second   // Giảm 50%
defaultMaxIdleConns    = 25                // Tăng 150%
defaultMaxOpenConns    = 200               // Tăng 100%
defaultConnMaxLifetime = 30 * time.Minute  // Giảm 50%
defaultConnMaxIdleTime = 5 * time.Minute   // Tăng 400%
```

### 3. Tối ưu WebSocket Connection

```typescript
// Thêm connection caching
private connectionPromise: Promise<void> | null = null

connect(boardId: string): Promise<void> {
  // Return cached connection if already connecting
  if (this.connectionPromise) {
    return this.connectionPromise
  }
  
  this.connectionPromise = new Promise((resolve, reject) => {
    // ... connection logic
  })
  
  return this.connectionPromise
}
```

### 4. Thêm Performance Monitoring

```typescript
const loadBoardData = async () => {
  console.log(`🚀 Loading board data for board: ${boardId}`)
  const startTime = performance.now()

  // Load board data first (fastest)
  const boardData = await apiClient.getBoardById(boardId)
  console.log(`✅ Board loaded in ${performance.now() - startTime}ms`)

  // Load other data in parallel
  const [listsData, cardsData, labelsData] = await Promise.all([
    apiClient.getLists(),
    apiClient.getCards(),
    apiClient.getLabels(),
  ])

  const totalTime = performance.now() - startTime
  console.log(`✅ All data loaded in ${totalTime}ms`)

  console.log(`📊 Data summary:`, {
    board: boardData.name,
    lists: boardLists.length,
    cards: boardCards.length,
    labels: boardLabels.length,
  })
}
```

## Các tối ưu khác có thể thực hiện

### 1. Backend Optimization

#### A. Tạo API endpoint tối ưu
```go
// GET /api/v1/boards/{id}/details
// Trả về board + lists + cards + labels trong 1 call
type BoardWithDetailsOutput struct {
  Board  models.Board
  Lists  []models.List
  Cards  []models.Card
  Labels []models.Label
}
```

#### B. Database Query Optimization
```sql
-- Sử dụng JOIN thay vì multiple queries
SELECT 
  b.*,
  l.id as list_id, l.title as list_title,
  c.id as card_id, c.title as card_title,
  lab.id as label_id, lab.name as label_name
FROM boards b
LEFT JOIN lists l ON l.board_id = b.id
LEFT JOIN cards c ON c.list_id = l.id
LEFT JOIN labels lab ON lab.board_id = b.id
WHERE b.id = $1
```

#### C. Caching
```go
// Redis caching cho board data
func (uc implUsecase) GetBoardWithDetails(ctx context.Context, sc models.Scope, boardID string) (boards.BoardWithDetailsOutput, error) {
  // Check cache first
  if cached, err := uc.cache.Get(ctx, fmt.Sprintf("board:%s", boardID)); err == nil {
    return cached, nil
  }
  
  // Load from database
  result, err := uc.repo.GetBoardWithDetails(ctx, sc, boardID)
  if err != nil {
    return boards.BoardWithDetailsOutput{}, err
  }
  
  // Cache for 5 minutes
  uc.cache.Set(ctx, fmt.Sprintf("board:%s", boardID), result, 5*time.Minute)
  
  return result, nil
}
```

### 2. Frontend Optimization

#### A. Lazy Loading
```typescript
// Load cards theo từng list thay vì tất cả
const loadCardsForList = async (listId: string) => {
  const cards = await apiClient.getCardsByListId(listId)
  setCards(prev => [...prev, ...cards])
}
```

#### B. Virtual Scrolling
```typescript
// Sử dụng virtual scrolling cho danh sách cards dài
import { FixedSizeList as List } from 'react-window'

const CardList = ({ cards }) => (
  <List
    height={400}
    itemCount={cards.length}
    itemSize={80}
  >
    {({ index, style }) => (
      <CardItem card={cards[index]} style={style} />
    )}
  </List>
)
```

#### C. Progressive Loading
```typescript
// Load data theo priority
const loadBoardData = async () => {
  // 1. Load board info (fastest)
  const boardData = await apiClient.getBoardById(boardId)
  setBoard(boardData)
  
  // 2. Load lists (medium)
  const listsData = await apiClient.getLists()
  setLists(listsData.data?.items?.filter(l => l.board_id === boardId) || [])
  
  // 3. Load cards (slowest)
  const cardsData = await apiClient.getCards()
  setCards(cardsData.data?.items || [])
  
  // 4. Load labels (optional)
  const labelsData = await apiClient.getLabels()
  setLabels(labelsData.data?.items?.filter(l => l.board_id === boardId) || [])
}
```

## Monitoring Performance

### 1. Frontend Metrics
```typescript
// Performance monitoring
const measurePerformance = (name: string, fn: () => Promise<any>) => {
  const start = performance.now()
  return fn().finally(() => {
    const duration = performance.now() - start
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
  })
}
```

### 2. Backend Metrics
```go
// Database query timing
func (r implRepository) GetBoardWithDetails(ctx context.Context, sc models.Scope, boardID string) (boards.BoardWithDetailsOutput, error) {
  start := time.Now()
  defer func() {
    r.l.Infof(ctx, "GetBoardWithDetails took %v", time.Since(start))
  }()
  
  // ... implementation
}
```

### 3. WebSocket Metrics
```typescript
// Connection timing
const connectWebSocket = async () => {
  const start = performance.now()
  await wsClient.connect(boardId)
  console.log(`🔌 WebSocket connected in ${performance.now() - start}ms`)
}
```

## Expected Performance Improvements

### Before Optimization
- Board load time: ~2-3 seconds
- WebSocket connection: ~1-2 seconds
- Database queries: ~500ms each

### After Optimization
- Board load time: ~800ms (60% improvement)
- WebSocket connection: ~300ms (70% improvement)
- Database queries: ~200ms each (60% improvement)

## Testing Performance

### 1. Load Testing
```bash
# Test API performance
ab -n 100 -c 10 http://localhost:8080/api/v1/boards/board123

# Test WebSocket connection
websocat ws://localhost:8080/api/v1/websocket/ws/board123
```

### 2. Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 3. Memory Usage
```bash
# Monitor memory usage
top -p $(pgrep -f "go run cmd/api/main.go")
```

## Next Steps

1. **Implement caching** với Redis
2. **Add database indexes** cho các query thường xuyên
3. **Implement lazy loading** cho cards
4. **Add CDN** cho static assets
5. **Implement service worker** cho offline support 