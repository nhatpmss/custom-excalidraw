#!/bin/bash

# Debug deployment issues
echo "🔍 Debugging Excalidraw deployment..."

echo "📁 Checking build directory..."
if [ -d "excalidraw-app/build" ]; then
    echo "✅ Build directory exists"
    echo "📋 Build contents:"
    ls -la excalidraw-app/build/
    
    echo ""
    echo "🔍 Checking index.html..."
    if [ -f "excalidraw-app/build/index.html" ]; then
        echo "✅ index.html exists"
        echo "📄 First few lines:"
        head -10 excalidraw-app/build/index.html
    else
        echo "❌ index.html missing!"
    fi
    
    echo ""
    echo "🔍 Checking static assets..."
    if [ -d "excalidraw-app/build/assets" ]; then
        echo "✅ Assets directory exists"
        echo "📊 Assets count: $(ls excalidraw-app/build/assets | wc -l)"
    else
        echo "❌ Assets directory missing!"
    fi
    
else
    echo "❌ Build directory not found!"
    echo "🔨 Running build..."
    yarn build
fi

echo ""
echo "🌐 Testing local server..."
echo "Starting local server on http://localhost:8081"
echo "Press Ctrl+C to stop"
npx http-server excalidraw-app/build -p 8081 -c-1 --cors
