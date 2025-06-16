# Frontend container for ft_transcendence - clean build approach
FROM node:lts

# Set working directory
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package.json ./

# Install dependencies  
RUN npm install

# Copy all source files
COPY . .

# Build the project at Docker build time (creates /app/dist/)
RUN npm run build

# Copy built files to volume mount point and exit gracefully
CMD ["echo", "Frontend ready"]