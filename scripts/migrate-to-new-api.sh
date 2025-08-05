#!/bin/bash

echo "🚀 Starting API migration..."

# Step 1: Backup old API
echo "📦 Step 1: Creating backup..."
if [ ! -f "lib/api.ts.backup" ]; then
    cp lib/api.ts lib/api.ts.backup
    echo "✅ Backup created: lib/api.ts.backup"
else
    echo "✅ Backup already exists"
fi

# Step 2: Check if new API structure is ready
echo "🔍 Step 2: Checking new API structure..."
if [ -f "lib/api/index.ts" ]; then
    echo "✅ New API structure exists"
else
    echo "❌ New API structure missing"
    exit 1
fi

# Step 3: Update imports in files
echo "📝 Step 3: Updating imports..."
FILES_TO_UPDATE=(
    "app/boards/page.tsx"
    "app/board/[id]/page.tsx"
    "app/profile/page.tsx"
    "components/kanban/card-detail-sidebar.tsx"
    "lib/api-debug.ts"
)

for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating $file..."
        # Update import from lib/api to lib/api/index
        sed -i '' 's|from "@/lib/api"|from "@/lib/api/index"|g' "$file"
        echo "✅ Updated $file"
    else
        echo "⚠️ File not found: $file"
    fi
done

# Step 4: Update API calls to use new structure
echo "🔄 Step 4: Updating API calls..."

# Update auth calls
echo "🔐 Updating auth calls..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "apiClient\.login\|apiClient\.logout\|apiClient\.getMyProfile\|apiClient\.updateProfile" | while read file; do
    echo "📝 Updating auth calls in $file"
    sed -i '' 's/apiClient\.login/apiClient.auth.login/g' "$file"
    sed -i '' 's/apiClient\.logout/apiClient.auth.logout/g' "$file"
    sed -i '' 's/apiClient\.getMyProfile/apiClient.auth.getMyProfile/g' "$file"
    sed -i '' 's/apiClient\.updateProfile/apiClient.auth.updateProfile/g' "$file"
done

# Update board calls
echo "📋 Updating board calls..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "apiClient\.getBoards\|apiClient\.getBoardById\|apiClient\.createBoard\|apiClient\.updateBoard\|apiClient\.deleteBoards" | while read file; do
    echo "📝 Updating board calls in $file"
    sed -i '' 's/apiClient\.getBoards/apiClient.boards.getBoards/g' "$file"
    sed -i '' 's/apiClient\.getBoardById/apiClient.boards.getBoardById/g' "$file"
    sed -i '' 's/apiClient\.createBoard/apiClient.boards.createBoard/g' "$file"
    sed -i '' 's/apiClient\.updateBoard/apiClient.boards.updateBoard/g' "$file"
    sed -i '' 's/apiClient\.deleteBoards/apiClient.boards.deleteBoards/g' "$file"
done

# Update list calls
echo "📝 Updating list calls..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "apiClient\.getLists\|apiClient\.createList\|apiClient\.updateList\|apiClient\.deleteLists" | while read file; do
    echo "📝 Updating list calls in $file"
    sed -i '' 's/apiClient\.getLists/apiClient.lists.getLists/g' "$file"
    sed -i '' 's/apiClient\.createList/apiClient.lists.createList/g' "$file"
    sed -i '' 's/apiClient\.updateList/apiClient.lists.updateList/g' "$file"
    sed -i '' 's/apiClient\.deleteLists/apiClient.lists.deleteLists/g' "$file"
done

# Update card calls
echo "🎴 Updating card calls..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "apiClient\.getCards\|apiClient\.createCard\|apiClient\.updateCard\|apiClient\.deleteCards\|apiClient\.moveCard" | while read file; do
    echo "📝 Updating card calls in $file"
    sed -i '' 's/apiClient\.getCards/apiClient.cards.getCards/g' "$file"
    sed -i '' 's/apiClient\.createCard/apiClient.cards.createCard/g' "$file"
    sed -i '' 's/apiClient\.updateCard/apiClient.cards.updateCard/g' "$file"
    sed -i '' 's/apiClient\.deleteCards/apiClient.cards.deleteCards/g' "$file"
    sed -i '' 's/apiClient\.moveCard/apiClient.cards.moveCard/g' "$file"
done

# Update label calls
echo "🏷️ Updating label calls..."
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "apiClient\.getLabels\|apiClient\.createLabel\|apiClient\.updateLabel\|apiClient\.deleteLabels" | while read file; do
    echo "📝 Updating label calls in $file"
    sed -i '' 's/apiClient\.getLabels/apiClient.labels.getLabels/g' "$file"
    sed -i '' 's/apiClient\.createLabel/apiClient.labels.createLabel/g' "$file"
    sed -i '' 's/apiClient\.updateLabel/apiClient.labels.updateLabel/g' "$file"
    sed -i '' 's/apiClient\.deleteLabels/apiClient.labels.deleteLabels/g' "$file"
done

# Step 5: Test compilation
echo "🧪 Step 5: Testing compilation..."
if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️ TypeScript compilation has warnings/errors (check manually)"
fi

# Step 6: Remove old API file (optional)
echo "🗑️ Step 6: Removing old API file..."
if [ -f "lib/api.ts" ]; then
    echo "⚠️ Old API file still exists. You can remove it manually when ready:"
    echo "   rm lib/api.ts"
else
    echo "✅ Old API file already removed"
fi

echo ""
echo "🎉 Migration completed!"
echo ""
echo "📊 Summary:"
echo "✅ Backup created"
echo "✅ Imports updated"
echo "✅ API calls updated to new structure"
echo "✅ TypeScript compilation tested"
echo ""
echo "🚀 Next steps:"
echo "1. Test the application"
echo "2. Remove lib/api.ts when ready"
echo "3. Update any remaining type conflicts" 