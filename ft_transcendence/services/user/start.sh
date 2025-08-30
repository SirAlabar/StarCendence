#!/bin/bash

echo " Starting User Service..."

# Check if database exists, if not create it
if [ ! -f "user.db" ]; then
    echo " Database not found, initializing..."
    npx prisma db push
    echo " Database initialized successfully"
else
    echo " Database already exists"
fi

# Start the application
echo " Starting Node.js application..."
npm start
