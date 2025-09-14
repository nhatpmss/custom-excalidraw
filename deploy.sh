#!/bin/bash

# Deploy script for Excalidraw
# Usage: ./deploy.sh [vercel|vps]

set -e

DEPLOY_TYPE=${1:-"vps"}

echo "🚀 Starting Excalidraw deployment ($DEPLOY_TYPE)..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

case $DEPLOY_TYPE in
    "vercel")
        echo "🌐 Deploying to Vercel..."
        
        # Build the app
        echo "🔨 Building app..."
        yarn build
        
        # Deploy to Vercel
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not found. Please install it: npm i -g vercel"
            exit 1
        fi
        ;;
    
    "vps")
        echo "🐳 Deploying to VPS with Docker..."
        
        # Stop existing containers
        echo "🛑 Stopping existing containers..."
        docker-compose -f docker-compose.prod.yml down || true
        
        # Build new image
        echo "🔨 Building Docker image..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        
        # Start containers
        echo "🚀 Starting containers..."
        docker-compose -f docker-compose.prod.yml up -d
        
        # Show logs
        echo "📋 Container logs:"
        docker-compose -f docker-compose.prod.yml logs --tail=50
        
        echo "✅ Deploy completed! App should be running on http://localhost"
        ;;
    
    *)
        echo "❌ Invalid deploy type. Use 'vercel' or 'vps'"
        exit 1
        ;;
esac

echo "🎉 Deployment finished successfully!"
