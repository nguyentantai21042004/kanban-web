# Frontend Position Calculation Algorithm

## Tổng quan
Document này mô tả chi tiết giải thuật tính toán position cho cards trong Kanban Board Web App (Frontend).

## Cấu trúc dữ liệu

### TypeScript Types
```typescript
// lib/types.ts
interface Card {
    id: string;
    list_id: string;
    position: number; // float64 từ API
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    labels: Label[];
    due_date?: string;
    is_archived: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

interface List {
    id: string;
    board_id: string;
    title: string;
    position: number;
    created_at: string;
    updated_at: string;
}
```

### State Management
```typescript
// app/board/[id]/page.tsx
const [cards, setCards] = useState<Card[]>([]);
const [lists, setLists] = useState<List[]>([]);
const [draggedCard, setDraggedCard] = useState<Card | null>(null);
```

## Giải thuật tính position

### 1. Drag & Drop Position Calculation

**Mục đích**: Tính toán position khi user drag card

**Logic trong ListColumn component**:
```typescript
// components/kanban/list-column.tsx
const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const headerHeight = 60; // Card header height
    const cardSpacing = 12; // Space between cards
    const cardHeight = 100; // Card height including spacing

    let position = 0;
    if (y > headerHeight) {
        const cardAreaY = y - headerHeight;
        position = Math.floor(cardAreaY / cardHeight);
        position = Math.max(0, Math.min(position, cards.length));
    }

    // Auto-scroll when near edges
    const isNearTop = y < headerHeight + 30;
    const isNearBottom = y > rect.height - 30;
    
    if (isNearTop) {
        // Scroll left
        const boardContainer = document.querySelector('.board-container');
        if (boardContainer) {
            boardContainer.scrollLeft -= 10;
        }
    } else if (isNearBottom) {
        // Scroll right
        const boardContainer = document.querySelector('.board-container');
        if (boardContainer) {
            boardContainer.scrollLeft += 10;
        }
    }

    console.log(`🎯 Drag over - Y: ${y}, Position: ${position}, Cards: ${cards.length}`);
    onDragOver(list.id, undefined, position);
};
```

**Ví dụ**:
```
List có 3 cards, card height = 100px, header height = 60px

- Mouse Y = 50px (trong header) → Position = 0
- Mouse Y = 120px → Position = 0 (card đầu tiên)
- Mouse Y = 220px → Position = 1 (giữa card 1&2)
- Mouse Y = 320px → Position = 2 (giữa card 2&3)
- Mouse Y = 420px → Position = 3 (cuối list)
```

### 2. Optimistic Update Algorithm

**Mục đích**: Cập nhật UI ngay lập tức khi drop card

**Logic trong handleDrop**:
```typescript
// app/board/[id]/page.tsx
const handleDrop = async (listId: string, position: number) => {
    if (!draggedCard) return;

    console.log(`🎯 Drop - Card: ${draggedCard.title}, List: ${listId}, Position: ${position}`);

    try {
        // 1. Optimistic update - update UI immediately
        const isSameList = draggedCard.list_id === listId;
        
        // Remove card from current position
        setCards((prev) => prev.filter((c) => c.id !== draggedCard.id));
        
        // Add card to new position
        setCards((prev) => {
            const cardsInList = prev.filter((c) => c.list_id === listId);
            const otherCards = prev.filter((c) => c.list_id !== listId);
            
            // Insert card at target position
            const newCardsInList = [...cardsInList];
            newCardsInList.splice(position, 0, {
                ...draggedCard,
                list_id: listId,
                position: position, // Index-based position
            });
            
            // Update positions for cards after the inserted position
            for (let i = position + 1; i < newCardsInList.length; i++) {
                newCardsInList[i] = {
                    ...newCardsInList[i],
                    position: i, // Index-based position
                };
            }
            
            return [...otherCards, ...newCardsInList];
        });

        // 2. Call API to update server
        const updatedCard = await apiClient.moveCard({
            id: draggedCard.id,
            list_id: listId,
            position: position, // Send position to BE
        });

        // 3. Update with server response
        setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));

        // 4. Send websocket event
        wsClient.send({
            type: "card_moved",
            data: updatedCard,
        });

        console.log(`✅ Card moved successfully: ${updatedCard.title} to position ${updatedCard.position}`);
    } catch (error: any) {
        console.error(`❌ Failed to move card:`, error);
        
        // Revert optimistic update on error
        setCards((prev) => {
            const withoutDraggedCard = prev.filter((c) => c.id !== draggedCard!.id);
            return [...withoutDraggedCard, draggedCard!];
        });
        
        toast({
            title: "Lỗi",
            description: "Không thể di chuyển card",
            variant: "destructive",
        });
    }

    handleDragEnd();
};
```

### 3. Visual Feedback Algorithm

**Mục đích**: Cung cấp visual feedback cho drag & drop

**Logic trong CardItem component**:
```typescript
// components/kanban/card-item.tsx
<Card
    className={`cursor-pointer transition-all duration-300 hover:shadow-sm group ${
        isDragging
            ? "opacity-50 rotate-1 scale-95 shadow-xl border-blue-300"
            : isDraggedOver
            ? "ring-2 ring-purple-500 bg-purple-50 shadow-xl scale-105 border-purple-300"
            : "hover:shadow-md hover:scale-[1.02]"
    }`}
    draggable
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
>
    {/* Card content */}
</Card>
```

**Drop Zone Indicators**:
```typescript
// components/kanban/list-column.tsx
{isDraggingOver && (
    <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 h-3 opacity-90 animate-pulse rounded-lg" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 h-3 opacity-90 rounded-lg animate-ping" />
    </div>
)}
```

## Các trường hợp đặc biệt

### 1. Empty List
```typescript
if (cards.length === 0) {
    position = 0; // Insert at beginning
}
```

### 2. Invalid Position
```typescript
// Validate position boundaries
if (position < 0) {
    position = 0;
}
if (position > cardsInTargetList.length) {
    position = cardsInTargetList.length;
}
```

### 3. Same List Move
```typescript
const isSameList = draggedCard.list_id === listId;
if (isSameList) {
    // Remove from current position first
    setCards((prev) => prev.filter((c) => c.id !== draggedCard.id));
    // Then insert at new position
    // ... insert logic
}
```

## Validation Rules

### 1. Position Bounds
- Position phải >= 0
- Position phải <= số cards trong list
- Auto-correct nếu out of bounds

### 2. Card Validation
- Dragged card phải tồn tại
- List ID phải hợp lệ
- Card phải thuộc về board hiện tại

### 3. State Consistency
- Optimistic update phải reversible
- Server response phải override optimistic update
- Error handling phải restore original state

## Performance Optimizations

### 1. Debounced Updates
```typescript
// Debounce drag over events
const debouncedDragOver = useCallback(
    debounce((listId: string, cardId: string | undefined, position: number) => {
        onDragOver(listId, cardId, position);
    }, 50),
    [onDragOver]
);
```

### 2. Memoized Components
```typescript
// Memoize card components
const CardItem = memo(({ card, isDragging, isDraggedOver, ...props }) => {
    return (
        <Card className={getCardClassName(isDragging, isDraggedOver)}>
            {/* Card content */}
        </Card>
    );
});
```

### 3. Efficient State Updates
```typescript
// Use functional updates for better performance
setCards((prev) => {
    const filtered = prev.filter((c) => c.id !== draggedCard.id);
    const inserted = [...filtered.slice(0, position), draggedCard, ...filtered.slice(position)];
    return inserted;
});
```

## Error Handling

### 1. Network Errors
```typescript
try {
    const updatedCard = await apiClient.moveCard(moveData);
    // Success handling
} catch (error: any) {
    console.error(`❌ Failed to move card:`, error);
    // Revert optimistic update
    setCards(originalCards);
    toast({
        title: "Lỗi",
        description: "Không thể di chuyển card",
        variant: "destructive",
    });
}
```

### 2. Validation Errors
```typescript
// Validate API response
if (!updatedCard) {
    throw new Error('Invalid API response: missing card data');
}
if (!updatedCard.id) {
    throw new Error('Invalid API response: missing card ID');
}
if (typeof updatedCard.position !== 'number') {
    throw new Error('Invalid API response: missing or invalid position');
}
```

### 3. State Recovery
```typescript
// Store original state for rollback
const originalCards = [...cards];

// Revert on error
setCards(originalCards);
```

## WebSocket Integration

### 1. Real-time Updates
```typescript
// Listen for card_moved events
const handleCardMoved = useCallback((data: Card) => {
    console.log(`📡 WebSocket: Card moved`, data);
    setCards((prev) => {
        const filtered = prev.filter((c) => c.id !== data.id);
        return [...filtered, data];
    });
}, []);

useEffect(() => {
    wsClient.on('card_moved', handleCardMoved);
    return () => wsClient.off('card_moved', handleCardMoved);
}, [wsClient, handleCardMoved]);
```

### 2. Send Events
```typescript
// Send card_moved event after successful API call
wsClient.send({
    type: "card_moved",
    data: updatedCard,
});
```

## Visual Feedback System

### 1. Drag States
```typescript
// Card states during drag
const getCardClassName = (isDragging: boolean, isDraggedOver: boolean) => {
    if (isDragging) {
        return "opacity-50 rotate-1 scale-95 shadow-xl border-blue-300";
    }
    if (isDraggedOver) {
        return "ring-2 ring-purple-500 bg-purple-50 shadow-xl scale-105 border-purple-300";
    }
    return "hover:shadow-md hover:scale-[1.02]";
};
```

### 2. Drop Zone Indicators
```typescript
// Visual indicators for drop zones
{isDraggingOver && (
    <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 h-3 opacity-90 animate-pulse rounded-lg" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 h-3 opacity-90 rounded-lg animate-ping" />
    </div>
)}
```

### 3. Auto-scroll
```typescript
// Auto-scroll when dragging near edges
const isNearTop = y < headerHeight + 30;
const isNearBottom = y > rect.height - 30;

if (isNearTop) {
    boardContainer.scrollLeft -= 10;
} else if (isNearBottom) {
    boardContainer.scrollLeft += 10;
}
```

## Testing Scenarios

### 1. Normal Operations
- Drag card to beginning of list
- Drag card to end of list
- Drag card between two cards
- Drag card to different list

### 2. Edge Cases
- Drag to empty list
- Drag to single card list
- Drag with invalid position
- Drag with network error

### 3. Visual Feedback
- Drag state visual feedback
- Drop zone indicators
- Auto-scroll behavior
- Error state handling

## Integration với Backend

### 1. API Communication
```typescript
// Send position to BE
const updatedCard = await apiClient.moveCard({
    id: draggedCard.id,
    list_id: listId,
    position: position, // Index-based position
});
```

### 2. Response Handling
```typescript
// Handle BE response with actual calculated position
setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
```

### 3. WebSocket Events
```typescript
// Send events for real-time updates
wsClient.send({
    type: "card_moved",
    data: updatedCard,
});
```

## Kết luận

Giải thuật position calculation trong Frontend được thiết kế để:
- **Responsive**: Immediate UI feedback với optimistic updates
- **User-friendly**: Rich visual feedback và smooth interactions
- **Robust**: Comprehensive error handling và state recovery
- **Real-time**: WebSocket integration cho live updates
- **Accessible**: Keyboard navigation và screen reader support 