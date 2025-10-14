#!/bin/bash

echo " Starting User Service..."

# Check if database exists, if not create it
if [ ! -f "prisma/auth.db" ]; then
    echo " Database not found, initializing..."
    npx prisma db push
    echo " Database initialized successfully"
else
    echo " Database already exists"
fi

if [ "${PRISMA_STUDIO:-}" = "1" ] || [ "${PRISMA_STUDIO:-}" = "true" ]; then
  echo " Starting Prisma Studio on ${PRISMA_STUDIO_PORT:-5001}..."
  npx prisma studio --port ${PRISMA_STUDIO_PORT:-5001} --browser none &
fi

export CHOKIDAR_USEPOLLING=true

# Build and start the application
echo " Building TypeScript..."
npm run dev
