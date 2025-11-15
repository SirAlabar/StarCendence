# frontend/Dockerfile.build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (npm ci installs devDependencies by default unless NODE_ENV=production)
RUN npm ci --omit=optional || npm install

# Copy source code
COPY . .

# Fix permissions for all .glb files (racing models, tracks, etc.)
RUN find public/assets -name "*.glb" -type f -exec chmod 644 {} \;

# Build the application
RUN npm run build

# Fix permissions in built dist folder
RUN find dist/assets -name "*.glb" -type f -exec chmod 644 {} \; || true

# Production stage - just copy files to volume
FROM alpine:latest

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create volume mount point
VOLUME ["/app/dist"]

# Command to copy files and exit
CMD cp -r dist/* /app/dist/ && echo "Frontend built and deployed!"