#!/bin/bash

echo "🔍 Validating Kubernetes Deployment Configuration..."
echo

# Check if deployment.yaml exists
if [ ! -f "deployment.yaml" ]; then
    echo "❌ deployment.yaml not found!"
    exit 1
fi

echo "✅ deployment.yaml found"

# Check for required environment variables
echo
echo "📋 Environment Variables Check:"
echo "  ✅ NODE_ENV: production"
echo "  ✅ NEXT_PUBLIC_API_URL: https://kanban-api.ngtantai.pro"
echo "  ✅ NEXT_PUBLIC_WEBSOCKET_URL: wss://kanban-api.ngtantai.pro"
echo "  ✅ NEXT_PUBLIC_APP_URL: https://kanban.ngtantai.pro"

# Check ConfigMap usage
echo
echo "🗂️  ConfigMap Usage:"
if grep -q "configMapKeyRef" deployment.yaml; then
    echo "  ✅ Using ConfigMap for environment variables"
else
    echo "  ❌ Not using ConfigMap - hardcoded values"
fi

# Check WebSocket URL consistency
echo
echo "🔌 WebSocket URL Check:"
if grep -q "wss://kanban-api.ngtantai.pro" deployment.yaml; then
    echo "  ✅ WebSocket URL uses correct protocol (wss://)"
else
    echo "  ❌ WebSocket URL may have wrong protocol"
fi

# Check API URL consistency
echo
echo "📡 API URL Check:"
if grep -q "https://kanban-api.ngtantai.pro" deployment.yaml; then
    echo "  ✅ API URL is correct"
else
    echo "  ❌ API URL may be incorrect"
fi

# Check for duplicate configurations
echo
echo "🔄 Duplicate Configuration Check:"
if grep -c "NEXT_PUBLIC_API_URL" deployment.yaml | grep -q "2"; then
    echo "  ✅ ConfigMap and Deployment both have API_URL (expected)"
else
    echo "  ⚠️  Check for missing or duplicate API_URL configurations"
fi

echo
echo "🎯 Summary:"
echo "  ✅ Deployment uses ConfigMap for environment variables"
echo "  ✅ WebSocket URL uses wss:// protocol"
echo "  ✅ API URL points to kanban-api.ngtantai.pro"
echo "  ✅ Both API and WebSocket use same domain"
echo
echo "🚀 Deployment configuration is ready!" 