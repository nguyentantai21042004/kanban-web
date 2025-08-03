# Card Detail Sidebar Improvements

## Tổng quan

Đã cải thiện component `CardDetailSidebar` để đáp ứng các yêu cầu về UX và tính năng mới.

## Các cải tiến chính

### 1. Độ rộng responsive và có thể thay đổi

- **Độ rộng mặc định**: 1/3 màn hình (thay vì 400px cố định)
- **Giới hạn**: Tối thiểu 350px, tối đa 1000px
- **Responsive**: Tự động điều chỉnh khi thay đổi kích thước màn hình
- **Resizable**: Có thể kéo thả để thay đổi độ rộng bằng chuột

### 2. Giao diện chỉnh sửa cải tiến

- **Edit mode**: Tất cả các field đều có thể chỉnh sửa
- **Button edit**: Di chuyển lên header để dễ truy cập
- **Visual feedback**: Hiển thị rõ ràng trạng thái edit/view

### 3. Quản lý labels gọn gàng

- **Compact display**: Hiển thị labels gọn gàng với badges
- **Label selector**: Panel riêng biệt để chọn/bỏ chọn labels
- **Visual indicators**: Hiển thị màu sắc và trạng thái đã chọn
- **Scrollable**: Có thể scroll khi có nhiều labels

### 4. Cải tiến UX

- **Collapse/Expand**: Có thể thu gọn sidebar
- **Smooth transitions**: Animation mượt mà khi thay đổi trạng thái
- **Better spacing**: Layout tối ưu hơn cho các field
- **Error handling**: Xử lý lỗi tốt hơn với toast notifications

## Cấu trúc component

```typescript
interface CardDetailSidebarProps {
  card: Card | null
  lists: List[]
  labels: Label[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedCard: Card) => void
}
```

## Các tính năng mới

### Resizable Sidebar
```typescript
const [sidebarWidth, setSidebarWidth] = useState(() => {
  // Default to 1/3 of screen width
  if (typeof window !== 'undefined') {
    return Math.max(400, Math.min(800, window.innerWidth / 3))
  }
  return 500
})
```

### Label Management
```typescript
const handleLabelToggle = (labelId: string) => {
  const currentLabels = editedCard.labels || []
  const newLabels = currentLabels.includes(labelId)
    ? currentLabels.filter(id => id !== labelId)
    : [...currentLabels, labelId]
  
  setEditedCard({ ...editedCard, labels: newLabels })
}
```

### Responsive Width
```typescript
useEffect(() => {
  const handleResize = () => {
    if (typeof window !== 'undefined') {
      const newWidth = Math.max(350, Math.min(1000, window.innerWidth / 3))
      setSidebarWidth(newWidth)
    }
  }

  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

## Cách sử dụng

### Basic Usage
```tsx
<CardDetailSidebar
  card={selectedCard}
  lists={lists}
  labels={labels}
  isOpen={isCardDetailOpen}
  onClose={() => setIsCardDetailOpen(false)}
  onUpdate={handleCardUpdate}
/>
```

### Handling Updates
```tsx
const handleCardUpdate = (updatedCard: Card) => {
  setCards((prev) => prev.map((c) => 
    c.id === updatedCard.id ? updatedCard : c
  ))
  setSelectedCard(updatedCard)
}
```

## Testing

Đã tạo test suite đầy đủ trong `tests/card-detail-sidebar.test.ts` để kiểm tra:

- Rendering với độ rộng mặc định
- Chỉnh sửa title và description
- Chỉnh sửa priority
- Quản lý labels
- Lưu thay đổi
- Xử lý lỗi
- Resize và collapse functionality

## API Integration

Component sử dụng `apiClient.updateCard()` để cập nhật card:

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

## Performance

- **Lazy loading**: Chỉ render khi cần thiết
- **Debounced resize**: Tránh re-render quá nhiều khi resize
- **Optimized re-renders**: Sử dụng useCallback và useMemo khi cần thiết

## Accessibility

- **Keyboard navigation**: Hỗ trợ điều hướng bằng bàn phím
- **Screen reader**: ARIA labels và roles phù hợp
- **Focus management**: Quản lý focus khi mở/đóng sidebar

## Future Enhancements

1. **Drag and drop**: Cho phép kéo thả labels
2. **Rich text editor**: Hỗ trợ markdown cho description
3. **File attachments**: Thêm tính năng đính kèm file
4. **Comments**: Hệ thống comment cho card
5. **Activity log**: Hiển thị lịch sử thay đổi 