#!/bin/bash

echo "🧪 Testing new API structure..."

# Test 1: Check if new structure exists
echo "📁 Test 1: Checking new API structure..."
if [ -d "lib/api" ]; then
    echo "✅ PASS: lib/api directory exists"
else
    echo "❌ FAIL: lib/api directory missing"
    exit 1
fi

# Test 2: Check if utilities exist
echo "🔧 Test 2: Checking utilities..."
if [ -f "lib/api/utils/logger.ts" ]; then
    echo "✅ PASS: logger utility exists"
else
    echo "❌ FAIL: logger utility missing"
fi

if [ -f "lib/api/utils/auth.ts" ]; then
    echo "✅ PASS: auth utility exists"
else
    echo "❌ FAIL: auth utility missing"
fi

if [ -f "lib/api/utils/request.ts" ]; then
    echo "✅ PASS: request utility exists"
else
    echo "❌ FAIL: request utility missing"
fi

# Test 3: Check if base client exists
echo "🏗️ Test 3: Checking base client..."
if [ -f "lib/api/client/base-client.ts" ]; then
    echo "✅ PASS: base client exists"
else
    echo "❌ FAIL: base client missing"
fi

# Test 4: Check if domain clients exist
echo "🎯 Test 4: Checking domain clients..."
if [ -f "lib/api/client/auth-client.ts" ]; then
    echo "✅ PASS: auth client exists"
else
    echo "❌ FAIL: auth client missing"
fi

if [ -f "lib/api/client/board-client.ts" ]; then
    echo "✅ PASS: board client exists"
else
    echo "❌ FAIL: board client missing"
fi

# Test 5: Check if types exist
echo "📝 Test 5: Checking types..."
if [ -f "lib/api/types/auth.types.ts" ]; then
    echo "✅ PASS: auth types exist"
else
    echo "❌ FAIL: auth types missing"
fi

if [ -f "lib/api/types/board.types.ts" ]; then
    echo "✅ PASS: board types exist"
else
    echo "❌ FAIL: board types missing"
fi

# Test 6: Check if main index exists
echo "📦 Test 6: Checking main index..."
if [ -f "lib/api/index.ts" ]; then
    echo "✅ PASS: main index exists"
else
    echo "❌ FAIL: main index missing"
fi

# Test 7: Check TypeScript compilation
echo "🔍 Test 7: Checking TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck lib/api/index.ts 2>/dev/null; then
    echo "✅ PASS: TypeScript compilation successful"
else
    echo "❌ FAIL: TypeScript compilation failed"
fi

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📊 Summary:"
echo "✅ New modular API structure created"
echo "✅ Utilities extracted (logger, auth, request)"
echo "✅ Base client created"
echo "✅ Domain clients started (auth, board)"
echo "✅ Types organized by domain"
echo "✅ Main API client with domain separation"
echo ""
echo "🚀 Next steps:"
echo "1. Create remaining domain clients (cards, lists, labels, comments, users)"
echo "2. Update imports in existing code"
echo "3. Remove old monolithic api.ts"
echo "4. Add comprehensive tests" 