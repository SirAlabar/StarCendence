# Setup with SSL support

FROM nginx:alpine

# Install additional packages for SSL and security
RUN apk add --no-cache \
    curl \
    openssl \
    && rm -rf /var/cache/apk/*

# Create SSL directory with proper permissions (for Docker secrets)
RUN mkdir -p /run/secrets \
    && chmod 750 /run/secrets

# Create nginx user and set permissions
RUN addgroup -g 101 -S nginx \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Create directories for static files and logs
RUN mkdir -p /var/www/html \
    && mkdir -p /var/log/nginx \
    && chown -R nginx:nginx /var/www/html \
    && chown -R nginx:nginx /var/log/nginx

# Create pid directory
RUN mkdir -p /var/run \
    && chown nginx:nginx /var/run

# Set proper permissions for nginx directories
RUN chmod 755 /var/www/html \
    && chmod 755 /var/log/nginx

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Health check to ensure nginx is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Run nginx as non-root user
USER nginx

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]