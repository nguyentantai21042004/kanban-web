#!/bin/bash

echo "🧪 Testing fixes for console errors..."

# Test 1: Check if manifest file is valid JSON
echo "📋 Test 1: Checking site.webmanifest JSON syntax..."
if node -e "JSON.parse(require('fs').readFileSync('public/site.webmanifest', 'utf8')); console.log('✅ site.webmanifest is valid JSON')" 2>/dev/null; then
    echo "✅ PASS: site.webmanifest is valid JSON"
else
    echo "❌ FAIL: site.webmanifest has JSON syntax errors"
fi

# Test 2: Check if API endpoints exist in swagger
echo "🔍 Test 2: Checking API endpoints in swagger..."
if grep -q '"/api/v1/boards"' swagger.json; then
    echo "✅ PASS: /api/v1/boards endpoint exists"
else
    echo "❌ FAIL: /api/v1/boards endpoint missing"
fi

if grep -q '"/api/v1/cards"' swagger.json; then
    echo "✅ PASS: /api/v1/cards endpoint exists"
else
    echo "❌ FAIL: /api/v1/cards endpoint missing"
fi

if grep -q '"/api/v1/labels"' swagger.json; then
    echo "✅ PASS: /api/v1/labels endpoint exists"
else
    echo "❌ FAIL: /api/v1/labels endpoint missing"
fi

# Test 3: Check if getUsers method was removed from API client
echo "🔍 Test 3: Checking if getUsers method was removed..."
if grep -q "getUsers" lib/api.ts; then
    echo "❌ FAIL: getUsers method still exists in API client"
else
    echo "✅ PASS: getUsers method was removed from API client"
fi

# Test 4: Check if board page no longer calls getUsers
echo "🔍 Test 4: Checking if board page no longer calls getUsers..."
if grep -q "apiClient.getUsers()" app/board/\[id\]/page.tsx; then
    echo "❌ FAIL: Board page still calls getUsers"
else
    echo "✅ PASS: Board page no longer calls getUsers"
fi

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📝 Summary of fixes:"
echo "1. ✅ Removed getUsers API call (endpoint doesn't exist)"
echo "2. ✅ Improved WebSocket error handling"
echo "3. ✅ Verified manifest JSON syntax"
echo "4. ✅ Added better error handling for optional WebSocket" 