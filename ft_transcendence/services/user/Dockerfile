# Use Node.js 20 Slim for smaller size
FROM node:20-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy source code
COPY . .

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Copy and make startup script executable
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port 3004 (user-service port)
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# Start the service
CMD ["/app/start.sh"]