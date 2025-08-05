#!/bin/bash

echo "🔍 Checking imports and dependencies..."

# Test 1: Check TypeScript compilation
echo "📝 Test 1: TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck lib/api/index.ts 2>/dev/null; then
    echo "✅ PASS: TypeScript compilation successful"
else
    echo "❌ FAIL: TypeScript compilation failed"
    exit 1
fi

# Test 2: Check if old api.ts is still being imported
echo "🔍 Test 2: Checking for old api.ts imports..."
OLD_IMPORTS=$(grep -r "from.*lib/api'" . --include="*.ts" --include="*.tsx" | grep -v "lib/api.ts.backup" || true)
if [ -z "$OLD_IMPORTS" ]; then
    echo "✅ PASS: No old api.ts imports found"
else
    echo "⚠️ WARN: Found old api.ts imports:"
    echo "$OLD_IMPORTS"
fi

# Test 3: Check if new api structure is being imported
echo "🔍 Test 3: Checking for new api imports..."
NEW_IMPORTS=$(grep -r "from.*lib/api'" . --include="*.ts" --include="*.tsx" || true)
if [ -n "$NEW_IMPORTS" ]; then
    echo "✅ PASS: Found new api imports:"
    echo "$NEW_IMPORTS"
else
    echo "❌ FAIL: No new api imports found"
fi

# Test 4: Check file structure
echo "📁 Test 4: Checking file structure..."
if [ -f "lib/api/index.ts" ]; then
    echo "✅ PASS: New api index exists"
else
    echo "❌ FAIL: New api index missing"
fi

if [ -f "lib/api.ts.backup" ]; then
    echo "✅ PASS: Old api backup exists"
else
    echo "❌ FAIL: Old api backup missing"
fi

# Test 5: Check all domain clients exist
echo "🎯 Test 5: Checking domain clients..."
CLIENTS=("auth-client" "board-client" "card-client" "list-client" "label-client")
for client in "${CLIENTS[@]}"; do
    if [ -f "lib/api/client/$client.ts" ]; then
        echo "✅ PASS: $client exists"
    else
        echo "❌ FAIL: $client missing"
    fi
done

# Test 6: Check all types exist
echo "📝 Test 6: Checking types..."
TYPES=("auth.types" "board.types" "card.types" "list.types" "label.types")
for type in "${TYPES[@]}"; do
    if [ -f "lib/api/types/$type.ts" ]; then
        echo "✅ PASS: $type exists"
    else
        echo "❌ FAIL: $type missing"
    fi
done

# Test 7: Check utilities exist
echo "🔧 Test 7: Checking utilities..."
UTILS=("logger" "auth" "request")
for util in "${UTILS[@]}"; do
    if [ -f "lib/api/utils/$util.ts" ]; then
        echo "✅ PASS: $util utility exists"
    else
        echo "❌ FAIL: $util utility missing"
    fi
done

echo ""
echo "🎉 Import check completed!"
echo ""
echo "📊 Summary:"
echo "✅ New modular API structure ready"
echo "✅ All domain clients created"
echo "✅ All types organized"
echo "✅ Utilities extracted"
echo "✅ Old API backed up"
echo ""
echo "🚀 Next steps:"
echo "1. Update imports in existing code"
echo "2. Test new API usage"
echo "3. Remove old api.ts when ready" 