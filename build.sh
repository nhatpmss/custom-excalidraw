#!/bin/bash

# Build script specifically for Vercel deployment
set -e

echo "🔧 Vercel Build Script Starting..."

# Set Node version
export NODE_VERSION=20

echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

echo "🏗️ Building Excalidraw application..."
cd excalidraw-app
yarn build

echo "✅ Build completed successfully!"
echo "📁 Build output directory: excalidraw-app/build"

# List build contents for verification
ls -la build/
