# 🚀 Hướng dẫn sử dụng các tính năng mới

## 📋 Tổng quan

Dự án Kanban đã được cập nhật với nhiều tính năng mới mạnh mẽ để cải thiện trải nghiệm quản lý công việc. Dưới đây là hướng dẫn chi tiết cho từng tính năng.

## 🆕 Các tính năng mới

### 1. 📝 **Assignment Management (Quản lý phân công)**

**Tính năng**: Gán card cho người dùng cụ thể

**Cách sử dụng**:
- **Trong Card Form**: Chọn "Người được gán" từ dropdown
- **Trong Card Detail**: 
  - Tab "Chi tiết" → Phần "Người được gán"
  - Có thể gán hoặc bỏ gán người dùng
- **Hiển thị**: Avatar và tên người được gán sẽ hiển thị trên card

**API Endpoints**:
- `POST /api/v1/cards/assign` - Gán card
- `POST /api/v1/cards/unassign` - Bỏ gán card

---

### 2. ⏰ **Time Tracking (Theo dõi thời gian)**

**Tính năng**: Quản lý giờ ước tính và thực tế

**Cách sử dụng**:
- **Trong Card Form**: Nhập "Giờ ước tính"
- **Trong Card Detail**: 
  - Tab "Chi tiết" → Phần "Thời gian"
  - Cập nhật giờ ước tính và thực tế
- **Hiển thị**: Thời gian hiển thị trên card với icon đồng hồ

**API Endpoints**:
- `PUT /api/v1/cards/time-tracking` - Cập nhật thời gian

---

### 3. 📅 **Date Management (Quản lý ngày tháng)**

**Tính năng**: Quản lý ngày bắt đầu, hạn hoàn thành, ngày hoàn thành

**Cách sử dụng**:
- **Trong Card Form**: 
  - "Ngày bắt đầu" - Khi bắt đầu làm việc
  - "Hạn hoàn thành" - Deadline của card
- **Trong Card Detail**: 
  - Tab "Chi tiết" → Phần "Ngày tháng"
  - Cập nhật tất cả các ngày
- **Hiển thị**: 
  - Ngày quá hạn hiển thị màu đỏ
  - Ngày hôm nay hiển thị màu cam
  - Ngày hoàn thành hiển thị màu xanh

**API Endpoints**:
- `PUT /api/v1/cards/start-date` - Set start date
- `PUT /api/v1/cards/completion-date` - Set completion date

---

### 4. 🏷️ **Tag System (Hệ thống tag)**

**Tính năng**: Thêm tags để phân loại và tìm kiếm card

**Cách sử dụng**:
- **Trong Card Form**: 
  - Nhập tag vào ô "Tags"
  - Nhấn Enter hoặc nút "+" để thêm
- **Trong Card Detail**: 
  - Tab "Chi tiết" → Phần "Tags"
  - Thêm/xóa tags
- **Hiển thị**: Tags hiển thị dưới dạng badges trên card

**API Endpoints**:
- `POST /api/v1/cards/tags/add` - Thêm tag
- `POST /api/v1/cards/tags/remove` - Xóa tag

---

### 5. ✅ **Checklist System (Hệ thống checklist)**

**Tính năng**: Tạo danh sách công việc con trong card

**Cách sử dụng**:
- **Trong Card Form**: 
  - Phần "Checklist"
  - Nhập item và nhấn "+" để thêm
  - Checkbox để đánh dấu hoàn thành
- **Trong Card Detail**: 
  - Tab "Checklist"
  - Thêm/toggle/xóa items
  - Xem tiến độ hoàn thành
- **Hiển thị**: 
  - Progress bar hiển thị tiến độ
  - Số lượng items hoàn thành/tổng số

**API Endpoints**:
- `PUT /api/v1/cards/checklist` - Cập nhật checklist

---

### 6. 📎 **File Attachments (Đính kèm file)**

**Tính năng**: Upload và quản lý files đính kèm

**Cách sử dụng**:
- **Trong Card Detail**: 
  - Tab "File"
  - Chọn file và nhấn "Tải lên"
  - Xem danh sách files đã upload
  - Xóa files không cần thiết
- **Hiển thị**: 
  - Icon paperclip và số lượng files
  - Tên file và kích thước

**API Endpoints**:
- `POST /api/v1/cards/attachments/add` - Thêm attachment
- `POST /api/v1/cards/attachments/remove` - Xóa attachment

---

### 7. 💬 **Comments System (Hệ thống bình luận)**

**Tính năng**: Thêm bình luận và thảo luận về card

**Cách sử dụng**:
- **Trong Card Detail**: 
  - Tab "Bình luận"
  - Viết bình luận và nhấn "Thêm bình luận"
  - Xem danh sách bình luận theo thời gian
- **Hiển thị**: 
  - Icon message và số lượng bình luận
  - Avatar và tên người bình luận

**API Endpoints**:
- `GET /api/v1/comments` - Lấy danh sách comments
- `POST /api/v1/comments` - Tạo comment mới
- `PUT /api/v1/comments` - Cập nhật comment
- `DELETE /api/v1/comments` - Xóa comment
- `GET /api/v1/cards/:card_id/comments` - Lấy comments theo card

---

### 8. 📊 **Enhanced Analytics (Thống kê nâng cao)**

**Tính năng**: Dashboard với thống kê chi tiết

**Cách sử dụng**:
- **Board Dashboard**: 
  - Tổng số card và tỷ lệ hoàn thành
  - Số card quá hạn và đến hạn hôm nay
  - Phân bố theo người dùng và độ ưu tiên
  - Thống kê thời gian và checklist
  - Hoạt động (files, comments, etc.)

**Components**:
- `BoardDashboard` - Hiển thị thống kê tổng quan
- `CardPreview` - Xem trước card với đầy đủ thông tin

---

## 🎨 **UI/UX Improvements (Cải thiện giao diện)**

### **Card Form**:
- ✅ Smooth animations (700ms duration)
- ✅ Elegant border styling
- ✅ Unsaved changes warning
- ✅ Auto-fill list_id khi tạo card từ list cụ thể
- ✅ Responsive design

### **Card Detail Sidebar**:
- ✅ Tabbed interface (Details, Comments, Attachments, Checklist)
- ✅ Smooth resize với requestAnimationFrame
- ✅ Progress bars cho checklist
- ✅ Avatar và user information
- ✅ File upload với drag & drop

### **Card Display**:
- ✅ Visual indicators cho overdue, completion status
- ✅ Progress bars cho checklist
- ✅ Compact display với đầy đủ thông tin
- ✅ Hover effects và smooth transitions

---

## 🔧 **Technical Implementation**

### **Types mới**:
```typescript
interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  created_at: string
  updated_at: string
}

interface Attachment {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  url: string
  uploaded_by: string
  created_at: string
}

interface Comment {
  id: string
  card_id: string
  content: string
  created_by: string
  parent_id?: string
  replies?: Comment[]
  created_at: string
  updated_at: string
}
```

### **Card interface mở rộng**:
```typescript
interface Card {
  // ... existing fields
  assigned_to?: string
  estimated_hours?: number
  actual_hours?: number
  start_date?: string
  completion_date?: string
  tags?: string[]
  checklist?: ChecklistItem[]
  attachments?: Attachment[]
  comments?: Comment[]
}
```

### **API Endpoints mới**:
- **Assignment**: `/cards/assign`, `/cards/unassign`
- **Time Tracking**: `/cards/time-tracking`
- **Dates**: `/cards/start-date`, `/cards/completion-date`
- **Tags**: `/cards/tags/add`, `/cards/tags/remove`
- **Checklist**: `/cards/checklist`
- **Attachments**: `/cards/attachments/add`, `/cards/attachments/remove`
- **Comments**: `/comments` (CRUD), `/cards/:card_id/comments`
- **Users**: `/users` (GET)

---

## 🚀 **Getting Started**

### **1. Cài đặt dependencies**:
```bash
npm install
```

### **2. Chạy development server**:
```bash
npm run dev
```

### **3. Truy cập ứng dụng**:
- Mở browser và truy cập `http://localhost:3000`
- Đăng nhập và tạo board mới
- Thử nghiệm các tính năng mới

### **4. Test các tính năng**:
1. **Tạo card mới** với assignment, time tracking, tags
2. **Mở card detail** và thử các tabs khác nhau
3. **Upload files** và thêm comments
4. **Tạo checklist** và đánh dấu hoàn thành
5. **Xem dashboard** để thấy thống kê

---

## 🐛 **Troubleshooting**

### **Lỗi thường gặp**:

1. **TypeScript errors**: Đã được sửa tất cả
2. **API response format**: Đã handle cả `data` wrapper và direct response
3. **File upload**: Hỗ trợ FormData và proper headers
4. **WebSocket**: Real-time updates cho tất cả tính năng mới

### **Debug tips**:
- Kiểm tra console logs cho API calls
- Xem Network tab trong DevTools
- Kiểm tra WebSocket connection status

---

## 📈 **Performance Optimizations**

- ✅ **Optimistic updates** cho tất cả actions
- ✅ **RequestAnimationFrame** cho smooth animations
- ✅ **Lazy loading** cho comments và attachments
- ✅ **Debounced** input cho tags và checklist
- ✅ **Memoized** components để tránh re-renders không cần thiết

---

## 🎯 **Next Steps**

Các tính năng đã được implement hoàn chỉnh và sẵn sàng sử dụng. Tất cả đều có:
- ✅ TypeScript support
- ✅ Error handling
- ✅ Loading states
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Accessibility features

Hệ thống đã sẵn sàng cho production! 🚀 