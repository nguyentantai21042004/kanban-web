# Card Detail Sidebar Demo

## Tính năng mới đã được triển khai

### 1. Độ rộng responsive (1/3 màn hình)

```typescript
// Độ rộng mặc định: 1/3 màn hình
const [sidebarWidth, setSidebarWidth] = useState(() => {
  if (typeof window !== 'undefined') {
    return Math.max(400, Math.min(800, window.innerWidth / 3))
  }
  return 500
})
```

**Tính năng:**
- Tự động tính toán độ rộng dựa trên kích thước màn hình
- Giới hạn tối thiểu: 350px, tối đa: 1000px
- Responsive khi thay đổi kích thước cửa sổ

### 2. Resizable Sidebar

```typescript
// Có thể kéo thả để thay đổi độ rộng
const handleMouseMove = (e: MouseEvent) => {
  if (isResizing && resizeRef.current) {
    const newWidth = window.innerWidth - e.clientX
    setSidebarWidth(Math.max(350, Math.min(1000, newWidth)))
  }
}
```

**Tính năng:**
- Kéo thả handle bên trái để thay đổi độ rộng
- Visual feedback khi hover
- Smooth transitions

### 3. Compact Label Management

```typescript
// Label selector với giao diện gọn gàng
const handleLabelToggle = (labelId: string) => {
  const currentLabels = editedCard.labels || []
  const newLabels = currentLabels.includes(labelId)
    ? currentLabels.filter(id => id !== labelId)
    : [...currentLabels, labelId]
  
  setEditedCard({ ...editedCard, labels: newLabels })
}
```

**Tính năng:**
- Hiển thị labels dưới dạng badges gọn gàng
- Panel riêng biệt để chọn/bỏ chọn labels
- Visual indicators cho labels đã chọn
- Scrollable khi có nhiều labels

### 4. Enhanced Edit Mode

```typescript
// Tất cả fields đều có thể edit
{isEditing ? (
  <Input
    value={editedCard?.title || ""}
    onChange={(e) =>
      setEditedCard(prev => prev ? { ...prev, title: e.target.value } : null)
    }
    className="text-sm"
    placeholder="Nhập tiêu đề..."
  />
) : (
  <h3 className="text-base font-medium text-gray-900 leading-tight">
    {card.title}
  </h3>
)}
```

**Tính năng:**
- Edit button ở header để dễ truy cập
- Tất cả fields đều có thể chỉnh sửa
- Visual feedback rõ ràng cho trạng thái edit/view
- Form validation và error handling

### 5. Improved UX

```typescript
// Collapse/Expand functionality
const [isCollapsed, setIsCollapsed] = useState(false)

// Smooth transitions
className={`fixed inset-y-0 right-0 bg-white border-l border-gray-200 shadow-xl z-50 overflow-hidden transition-all duration-300 ${
  isCollapsed ? 'w-16' : ''
}`}
```

**Tính năng:**
- Collapse/Expand sidebar
- Smooth animations
- Better spacing và layout
- Error handling với toast notifications

## Cách sử dụng

### 1. Mở Card Detail
```typescript
const handleCardClick = (card: Card) => {
  setSelectedCard(card)
  setIsCardDetailOpen(true)
}
```

### 2. Edit Card
```typescript
// Click edit button để vào chế độ chỉnh sửa
// Tất cả fields sẽ chuyển thành input/textarea/select
```

### 3. Manage Labels
```typescript
// Click nút + bên cạnh "Nhãn" để mở label selector
// Click vào label để chọn/bỏ chọn
// Visual feedback với màu sắc và checkmark
```

### 4. Resize Sidebar
```typescript
// Kéo handle bên trái để thay đổi độ rộng
// Hoặc click nút collapse để thu gọn
```

### 5. Save Changes
```typescript
// Click "Lưu" để lưu thay đổi
// Hoặc "Hủy" để bỏ thay đổi
// Toast notification cho kết quả
```

## API Integration

Component sử dụng `apiClient.updateCard()` để cập nhật:

```typescript
const updatedCard = await apiClient.updateCard({
  id: editedCard.id,
  title: editedCard.title,
  description: editedCard.description,
  priority: editedCard.priority,
  labels: editedCard.labels,
  due_date: editedCard.due_date,
})
```

## Responsive Design

- **Desktop**: Độ rộng 1/3 màn hình, có thể resize
- **Tablet**: Tự động điều chỉnh độ rộng
- **Mobile**: Có thể collapse để tiết kiệm không gian

## Performance Optimizations

- Lazy loading: Chỉ render khi cần thiết
- Debounced resize: Tránh re-render quá nhiều
- Optimized re-renders: Sử dụng useCallback và useMemo

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- Focus management
- ARIA labels và roles

## Future Enhancements

1. **Drag and drop**: Cho phép kéo thả labels
2. **Rich text editor**: Hỗ trợ markdown cho description
3. **File attachments**: Thêm tính năng đính kèm file
4. **Comments**: Hệ thống comment cho card
5. **Activity log**: Hiển thị lịch sử thay đổi 