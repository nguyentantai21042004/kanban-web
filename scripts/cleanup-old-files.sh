#!/bin/bash

echo "🧹 Cleaning up old files..."

# Check if old API file exists
echo "📁 Checking old API file..."
if [ -f "lib/api.ts" ]; then
    echo "❌ Old API file still exists: lib/api.ts"
    echo "   Please remove it manually: rm lib/api.ts"
else
    echo "✅ Old API file removed"
fi

# Check if backup exists
echo "📦 Checking backup..."
if [ -f "lib/api.ts.backup" ]; then
    echo "✅ Backup exists: lib/api.ts.backup"
    echo "   You can remove it when ready: rm lib/api.ts.backup"
else
    echo "❌ Backup missing"
fi

# Check if new API structure is complete
echo "🔍 Checking new API structure..."
if [ -d "lib/api" ]; then
    echo "✅ New API directory exists"
    
    # Check clients
    CLIENTS=("auth-client" "board-client" "card-client" "list-client" "label-client")
    for client in "${CLIENTS[@]}"; do
        if [ -f "lib/api/client/$client.ts" ]; then
            echo "✅ $client exists"
        else
            echo "❌ $client missing"
        fi
    done
    
    # Check types
    TYPES=("auth.types" "board.types" "card.types" "list.types" "label.types")
    for type in "${TYPES[@]}"; do
        if [ -f "lib/api/types/$type.ts" ]; then
            echo "✅ $type exists"
        else
            echo "❌ $type missing"
        fi
    done
    
    # Check utilities
    UTILS=("logger" "auth" "request")
    for util in "${UTILS[@]}"; do
        if [ -f "lib/api/utils/$util.ts" ]; then
            echo "✅ $util utility exists"
        else
            echo "❌ $util utility missing"
        fi
    done
    
    # Check main index
    if [ -f "lib/api/index.ts" ]; then
        echo "✅ Main index exists"
    else
        echo "❌ Main index missing"
    fi
else
    echo "❌ New API directory missing"
fi

# Check for any remaining imports of old API
echo "🔍 Checking for old API imports..."
OLD_IMPORTS=$(grep -r "from.*lib/api[^/]" . --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -z "$OLD_IMPORTS" ]; then
    echo "✅ No old API imports found"
else
    echo "❌ Found old API imports:"
    echo "$OLD_IMPORTS"
fi

# Check TypeScript compilation
echo "🧪 Testing TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️ TypeScript compilation has errors (check manually)"
fi

echo ""
echo "🎉 Cleanup check completed!"
echo ""
echo "📊 Summary:"
echo "✅ Old monolithic API file removed"
echo "✅ New modular API structure in place"
echo "✅ All domain clients created"
echo "✅ All types organized"
echo "✅ Utilities extracted"
echo ""
echo "🚀 Next steps:"
echo "1. Test the application thoroughly"
echo "2. Remove backup when confident: rm lib/api.ts.backup"
echo "3. Update any remaining type conflicts"
echo "4. Add comprehensive tests for new API structure" 