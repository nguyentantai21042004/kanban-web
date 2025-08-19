## Kanban Web

- **Mô tả**: Đây là dự án Kanban do Nguyễn Tấn Tài phát triển với mục đích sử dụng cá nhân.
- **Available site**: [kanban.ngtantai.pro](https://kanban.ngtantai.pro/)

### Tính năng chính
- **Boards**: Tạo và quản lý nhiều bảng Kanban
- **Cards**: Kéo thả giữa các lists, đặt ưu tiên, nhãn, hạn xử lý, mô tả
- **Lists**: Thêm/sửa/xóa, sắp xếp linh hoạt
- **Real-time**: Cập nhật thời gian thực qua WebSocket
- **Auth**: Đăng nhập/đăng xuất, quản lý phiên

### Công nghệ sử dụng
- **Next.js 14**, **React 18**, **TypeScript**
- **Tailwind CSS**, **Radix UI**
- **WebSocket** cho realtime

### Chạy local (development)
```bash
npm ci
npm run dev
# Mặc định: http://localhost:3000
```

### Build production
```bash
npm run build
npm run start
```

### Docker (tùy chọn)
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d --build

# Production
docker-compose up -d --build
```

### Cấu trúc thư mục (rút gọn)
```
kanban-web/
├── app/            # Next.js app router
├── components/     # UI & Kanban components
├── lib/            # Logic, API clients, websocket, utils
├── hooks/          # Custom hooks
└── public/         # Static assets
```

### License
Sử dụng cá nhân.
