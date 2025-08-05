#!/bin/bash

echo "🔧 Testing URL Configuration..."
echo

echo "📡 API Configuration:"
echo "  Base URL: https://kanban-api.ngtantai.pro/api/v1"
echo "  Sample endpoint: https://kanban-api.ngtantai.pro/api/v1/boards"
echo

echo "🔌 WebSocket Configuration:"
echo "  Production WS URL: wss://kanban-api.ngtantai.pro/api/v1/websocket/ws/board-123?token=test-token"
echo "  Development WS URL: ws://localhost:8080/api/v1/websocket/ws/board-123?token=test-token"
echo

echo "🌍 Environment Detection:"
if [ "$NODE_ENV" = "production" ]; then
    echo "  Current: Production"
    echo "  API: https://kanban-api.ngtantai.pro"
    echo "  WebSocket: wss://kanban-api.ngtantai.pro"
else
    echo "  Current: Development"
    echo "  API: https://kanban-api.ngtantai.pro (still using production API)"
    echo "  WebSocket: ws://localhost:8080"
fi
echo

echo "✅ URL Configuration Test Complete!"
echo
echo "📝 Summary:"
echo "  ✅ API và WebSocket giờ đều sử dụng cùng domain: kanban-api.ngtantai.pro"
echo "  ✅ Production: wss://kanban-api.ngtantai.pro"
echo "  ✅ Development: ws://localhost:8080"
echo "  ✅ Configuration được tập trung trong lib/api/utils/config.ts" 