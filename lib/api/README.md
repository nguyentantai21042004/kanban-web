# API Client Architecture Improvement

## Current Issues

### 1. **File Structure Problems**
- Single file with 523 lines
- Mixed concerns (auth, logging, request handling)
- Hard to test and maintain
- Code duplication

### 2. **Proposed Solution: Modular Architecture**

```
lib/api/
├── client/
│   ├── base-client.ts      # Base HTTP client
│   ├── auth-client.ts      # Authentication methods
│   ├── board-client.ts     # Board API methods
│   ├── card-client.ts      # Card API methods
│   ├── list-client.ts      # List API methods
│   ├── label-client.ts     # Label API methods
│   ├── comment-client.ts   # Comment API methods
│   └── user-client.ts      # User API methods
├── types/
│   ├── auth.types.ts
│   ├── board.types.ts
│   ├── card.types.ts
│   ├── list.types.ts
│   ├── label.types.ts
│   ├── comment.types.ts
│   └── user.types.ts
├── utils/
│   ├── request.ts          # HTTP request utilities
│   ├── auth.ts             # Authentication utilities
│   └── logger.ts           # Logging utilities
└── index.ts                # Main export
```

### 3. **Benefits of New Structure**

#### ✅ **Separation of Concerns**
- Each client handles specific domain
- Authentication logic isolated
- Logging centralized

#### ✅ **Testability**
- Easy to mock individual clients
- Dependency injection support
- Unit test friendly

#### ✅ **Maintainability**
- Smaller, focused files
- Easy to find and modify specific APIs
- Clear responsibility boundaries

#### ✅ **Reusability**
- Base client can be reused
- Common utilities shared
- Consistent patterns

#### ✅ **Type Safety**
- Domain-specific types
- Better IntelliSense
- Compile-time error checking

### 4. **Implementation Plan**

#### Phase 1: Extract Base Client
```typescript
// lib/api/client/base-client.ts
export class BaseClient {
  protected async request<T>(endpoint: string, options?: RequestOptions): Promise<T>
  protected getAuthHeaders(): HeadersInit
  protected getStoredToken(): string | null
}
```

#### Phase 2: Create Domain Clients
```typescript
// lib/api/client/board-client.ts
export class BoardClient extends BaseClient {
  async getBoards(params?: GetBoardsParams): Promise<GetBoardResponse>
  async getBoardById(id: string): Promise<Board>
  async createBoard(data: CreateBoardRequest): Promise<Board>
  // ... other board methods
}
```

#### Phase 3: Create Main API Client
```typescript
// lib/api/index.ts
export class ApiClient {
  public auth: AuthClient
  public boards: BoardClient
  public cards: CardClient
  public lists: ListClient
  public labels: LabelClient
  public comments: CommentClient
  public users: UserClient
}
```

### 5. **Usage Example**

```typescript
// Before (current)
const boards = await apiClient.getBoards()
const card = await apiClient.createCard(data)

// After (proposed)
const boards = await apiClient.boards.getBoards()
const card = await apiClient.cards.createCard(data)
```

### 6. **Migration Strategy**

1. **Step 1**: Create base client and utilities
2. **Step 2**: Extract one domain at a time (start with boards)
3. **Step 3**: Update imports gradually
4. **Step 4**: Remove old monolithic file
5. **Step 5**: Add comprehensive tests

### 7. **Testing Benefits**

```typescript
// Easy to mock specific clients
const mockBoardClient = {
  getBoards: jest.fn().mockResolvedValue(mockBoards)
}

// Test specific functionality
describe('BoardClient', () => {
  it('should fetch boards with correct parameters', async () => {
    const client = new BoardClient()
    await client.getBoards({ page: 1, limit: 10 })
    // Assert request was made correctly
  })
})
```

## Conclusion

The current API client works but has maintainability issues. The proposed modular structure will:

- ✅ Reduce file size and complexity
- ✅ Improve testability
- ✅ Better separation of concerns
- ✅ Easier to add new features
- ✅ Better developer experience 