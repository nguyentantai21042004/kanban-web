# Kanban Web - Hệ thống quản lý công việc nội bộ

Hệ thống Kanban board hiện đại được xây dựng với Next.js 14, TypeScript và Tailwind CSS để quản lý công việc nội bộ của tổ chức.

## 🚀 Tính năng chính

### 📋 Quản lý Board
- Tạo và quản lý nhiều Kanban boards
- Tìm kiếm và lọc boards theo từ khóa
- Giao diện responsive, thân thiện với người dùng

### 📝 Quản lý Cards
- **Drag & Drop**: Kéo thả cards giữa các lists
- **Priority levels**: Thấp, Trung bình, Cao
- **Labels**: Phân loại với màu sắc tùy chỉnh
- **Due dates**: Thiết lập deadline cho công việc
- **Descriptions**: Mô tả chi tiết công việc

### 🏷️ Quản lý Lists
- Tạo, chỉnh sửa và xóa lists
- Sắp xếp cards theo thứ tự tùy chỉnh
- Giao diện trực quan với cards được phân loại

### 🔐 Xác thực người dùng
- Hệ thống đăng nhập/đăng xuất
- Quản lý phiên làm việc
- Bảo mật dữ liệu người dùng

### ⚡ Real-time Updates
- WebSocket integration cho cập nhật real-time
- Đồng bộ hóa dữ liệu giữa các phiên làm việc
- Thông báo thay đổi tức thì

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: React Hooks, Context API
- **Real-time**: WebSocket
- **Authentication**: Custom auth system
- **Package Manager**: pnpm

## 🐳 Chạy với Docker

### Development Mode (Khuyến nghị)
```bash
# Chạy với hot reload
docker-compose -f docker-compose.dev.yml up -d --build

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Mode
```bash
# Chạy production build
docker-compose up -d --build

# Xem logs
docker-compose logs -f
```

### Dừng container
```bash
# Development
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose down
```

## 🚀 Chạy local development

### Yêu cầu
- Node.js 18+
- pnpm

### Cài đặt
```bash
# Clone repository
git clone <repository-url>
cd kanban-web

# Cài đặt dependencies
pnpm install

# Chạy development server
pnpm dev
```

## 📱 Giao diện

- **Responsive design**: Hoạt động tốt trên desktop, tablet và mobile
- **Dark/Light mode**: Hỗ trợ chế độ tối/sáng
- **Modern UI**: Giao diện hiện đại với animations mượt mà
- **Accessibility**: Tuân thủ các tiêu chuẩn accessibility

## 🔧 Cấu trúc dự án

```
kanban-web/
├── app/                    # Next.js app router
│   ├── board/[id]/        # Kanban board page
│   ├── boards/            # Boards list page
│   ├── login/             # Authentication
│   └── profile/           # User profile
├── components/            # React components
│   ├── kanban/           # Kanban-specific components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities và configurations
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## 🎯 Tính năng nổi bật

- ✅ **Drag & Drop** cards giữa lists
- ✅ **Real-time updates** qua WebSocket
- ✅ **Priority management** với 3 mức độ
- ✅ **Label system** với màu sắc tùy chỉnh
- ✅ **Due date tracking** cho deadlines
- ✅ **Search & Filter** boards
- ✅ **Responsive design** cho mọi thiết bị
- ✅ **Modern UI/UX** với animations
- ✅ **TypeScript** cho type safety
- ✅ **Docker support** cho deployment

## 🌐 Truy cập ứng dụng

Sau khi chạy container, ứng dụng có sẵn tại:
- **Development**: http://localhost:3000
- **Production**: http://localhost:3000

## 📄 License

Internal project - All rights reserved.
