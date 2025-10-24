#!/bin/sh
set -e

echo "🎮 Starting Game Service..."

# Ensure data directory exists
mkdir -p /app/data

# Push database schema (creates/updates tables)
echo "📊 Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo "🚀 Starting server..."
exec node dist/server.js
