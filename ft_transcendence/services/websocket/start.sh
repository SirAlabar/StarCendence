#!/bin/bash

echo " Starting User Service..."

export CHOKIDAR_USEPOLLING=true

# Build and start the application
echo " Building TypeScript..."
npm run dev
