# Frontend container for ft_transcendence - minimal and correct
FROM node:lts

# Set working directory
WORKDIR /app

# Install Vite globally
RUN npm install -g vite@latest

# Build ft_transcendence frontend and exit
ENTRYPOINT ["/bin/sh", "-c", "npm install --non-interactive && exec npm run build"]