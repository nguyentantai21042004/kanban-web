#!/bin/bash

# Script tạo favicon từ SVG
# Yêu cầu: ImageMagick đã cài đặt

echo "🎨 Generating favicon files..."

# Kiểm tra ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it first:"
    echo "   brew install imagemagick"
    exit 1
fi

# Tạo các kích thước favicon
echo "📱 Creating favicon files..."

# 16x16
convert public/favicon.svg -resize 16x16 public/favicon-16x16.png
echo "✅ Created favicon-16x16.png"

# 32x32
convert public/favicon.svg -resize 32x32 public/favicon-32x32.png
echo "✅ Created favicon-32x32.png"

# 180x180 (Apple touch icon)
convert public/favicon.svg -resize 180x180 public/apple-touch-icon.png
echo "✅ Created apple-touch-icon.png"

# ICO file (32x32)
convert public/favicon.svg -resize 32x32 public/favicon.ico
echo "✅ Created favicon.ico"

echo "🎉 All favicon files generated successfully!"
echo "📁 Files created in public/ directory:"
ls -la public/favicon* public/apple-touch-icon.png 