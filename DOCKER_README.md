# Docker Setup cho Kanban Web App

## Cách sử dụng

### Development Mode (Khuyến nghị)
Chạy với hot reload để development:

```bash
# Build và chạy development container
docker-compose -f docker-compose.dev.yml up --build

# Hoặc chạy ở background
docker-compose -f docker-compose.dev.yml up -d --build
```

### Production Mode
Chạy phiên bản production:

```bash
# Build và chạy production container
docker-compose up --build

# Hoặc chạy ở background
docker-compose up -d --build
```

## Các lệnh hữu ích

### Dừng container
```bash
# Development
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose down
```

### Xem logs
```bash
# Development
docker-compose -f docker-compose.dev.yml logs -f

# Production
docker-compose logs -f
```

### Rebuild container
```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build
```

### Truy cập container shell
```bash
# Development
docker exec -it kanban-web-dev sh

# Production
docker exec -it kanban-web-app sh
```

## Truy cập ứng dụng

Sau khi chạy container, ứng dụng sẽ có sẵn tại:
- **Development**: http://localhost:3000
- **Production**: http://localhost:3000

## Lưu ý

- Source code được mount trực tiếp vào container, bạn có thể edit code và thấy thay đổi ngay lập tức (development mode)
- Trong development mode, Next.js sẽ hot reload khi có thay đổi code
- Production mode sử dụng build tối ưu hóa
- Port 3000 được expose ra ngoài, có thể thay đổi trong docker-compose.yml nếu cần 