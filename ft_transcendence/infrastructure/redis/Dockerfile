# Basic Redis setup
FROM redis:7-alpine

# Install additional utilities
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create redis user and data directory
RUN addgroup -g 999 redis || true \
    && adduser -D -S -h /data -s /sbin/nologin -u 999 -G redis redis || true

# Create data directory with proper permissions
RUN mkdir -p /data \
    && chown -R redis:redis /data \
    && chmod 755 /data

# Copy custom Redis configuration
COPY redis.conf /usr/local/etc/redis/redis.conf

# Set proper permissions for config file
RUN chown redis:redis /usr/local/etc/redis/redis.conf \
    && chmod 644 /usr/local/etc/redis/redis.conf

# Expose Redis port
EXPOSE 6379

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD redis-cli ping || exit 1

# Switch to redis user
USER redis

# Start Redis with custom config
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]