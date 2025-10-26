#!/bin/bash
set -e

echo "🎮 Starting Game Service..."

# Ensure data directory exists
mkdir -p /app/data

# Set DATABASE_URL for Prisma
export DATABASE_URL="file:/app/data/game.db"

# Push database schema (creates/updates tables)
echo "📊 Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss

# Build TypeScript if dist doesn't exist or in development
if [ ! -d "/app/dist" ] || [ "$NODE_ENV" = "development" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

# Check if build succeeded
if [ ! -f "/app/dist/server.js" ]; then
    echo "❌ Error: dist/server.js not found after build"
    echo "📂 Contents of /app:"
    ls -la /app
    echo "📂 Contents of /app/dist:"
    ls -la /app/dist || echo "dist folder doesn't exist"
    exit 1
fi

echo "🚀 Starting server..."
exec node dist/server.js