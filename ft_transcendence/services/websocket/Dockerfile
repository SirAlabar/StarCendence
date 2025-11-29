# WebSocket Service Dockerfile 3005
# Use Node.js 20 Slim for smaller size
FROM node:20-slim

# Install curl for health checks
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port 3005 (websocket-service port)
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start the service
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'development' ]; then npm run dev; else node dist/server.js; fi"]

