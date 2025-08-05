# Kubernetes Deployment Configuration

## Tổng quan

Deployment configuration đã được cập nhật để tương thích với cấu hình URL mới và đảm bảo API/WebSocket sử dụng cùng domain.

## Cấu trúc Files

### `deployment.yaml`
- **Deployment**: 2 replicas với rolling update
- **Service**: ClusterIP trên port 80
- **Ingress**: Nginx với host `kanban.ngtantai.pro`
- **ConfigMap**: Environment variables tập trung
- **HPA**: Auto-scaling dựa trên CPU/Memory

## Environment Variables

### ConfigMap: `kanban-web-config`
```yaml
data:
  NODE_ENV: "production"
  NEXT_PUBLIC_API_URL: "https://kanban-api.ngtantai.pro"
  NEXT_PUBLIC_APP_URL: "https://kanban.ngtantai.pro"
  NEXT_PUBLIC_WEBSOCKET_URL: "wss://kanban-api.ngtantai.pro"
```

### Deployment sử dụng ConfigMap
```yaml
env:
- name: NODE_ENV
  valueFrom:
    configMapKeyRef:
      name: kanban-web-config
      key: NODE_ENV
- name: NEXT_PUBLIC_API_URL
  valueFrom:
    configMapKeyRef:
      name: kanban-web-config
      key: NEXT_PUBLIC_API_URL
- name: NEXT_PUBLIC_WEBSOCKET_URL
  valueFrom:
    configMapKeyRef:
      name: kanban-web-config
      key: NEXT_PUBLIC_WEBSOCKET_URL
```

## URLs Configuration

### Production URLs
- **API**: `https://kanban-api.ngtantai.pro/api/v1`
- **WebSocket**: `wss://kanban-api.ngtantai.pro/api/v1/websocket/ws/{boardId}?token={token}`
- **App**: `https://kanban.ngtantai.pro`

### Consistency
✅ **API và WebSocket đều sử dụng cùng domain**: `kanban-api.ngtantai.pro`
✅ **Protocol đúng**: `https://` cho API, `wss://` cho WebSocket
✅ **ConfigMap-based**: Dễ thay đổi mà không cần rebuild

## Deployment Commands

### Validate Configuration
```bash
./scripts/validate-deployment.sh
```

### Deploy to Kubernetes
```bash
kubectl apply -f deployment.yaml
```

### Check Status
```bash
kubectl get pods -n kanban
kubectl get services -n kanban
kubectl get ingress -n kanban
```

### Update ConfigMap
```bash
kubectl patch configmap kanban-web-config -n kanban --patch-file configmap-patch.yaml
kubectl rollout restart deployment/kanban-web -n kanban
```

## Monitoring

### Health Checks
- **Liveness Probe**: `/` endpoint, 30s initial delay
- **Readiness Probe**: `/` endpoint, 5s initial delay
- **Auto-scaling**: 70% CPU, 80% Memory

### Resources
- **Requests**: 256Mi memory, 100m CPU
- **Limits**: 512Mi memory, 500m CPU
- **Replicas**: 2-10 (auto-scaling)

## Troubleshooting

### WebSocket Connection Issues
1. Kiểm tra domain: `kanban-api.ngtantai.pro`
2. Kiểm tra protocol: `wss://` (secure)
3. Kiểm tra token authentication

### API 404 Errors
1. Kiểm tra API URL: `https://kanban-api.ngtantai.pro/api/v1`
2. Kiểm tra authentication headers
3. Kiểm tra CORS configuration

### Deployment Issues
1. Kiểm tra ConfigMap: `kubectl get configmap kanban-web-config -n kanban -o yaml`
2. Kiểm tra environment variables: `kubectl exec -n kanban deployment/kanban-web -- env | grep NEXT_PUBLIC`
3. Kiểm tra logs: `kubectl logs -n kanban deployment/kanban-web`

## Migration Notes

### Từ cũ sang mới:
- ✅ **Hardcoded env → ConfigMap**: Dễ quản lý hơn
- ✅ **Inconsistent URLs → Same domain**: API và WebSocket đồng bộ
- ✅ **Wrong WebSocket protocol → wss://**: Secure WebSocket
- ✅ **No validation → Validation script**: Kiểm tra config trước deploy 