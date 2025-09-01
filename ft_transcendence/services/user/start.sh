#!/bin/bash

echo " Starting User Service..."

# Check if database exists, if not create it
if [ ! -f "prisma/user.db" ]; then
    echo " Database not found, initializing..."
    npx prisma db push
    echo " Database initialized successfully"
else
    echo " Database already exists"
fi

if [ "${PRISMA_STUDIO:-}" = "1" ] || [ "${PRISMA_STUDIO:-}" = "true" ]; then
  echo " Starting Prisma Studio on ${PRISMA_STUDIO_PORT:-5555}..."
  npx prisma studio --port ${PRISMA_STUDIO_PORT:-5555} --browser none &
fi

# Start the application
echo " Starting Node.js application..."
npm start