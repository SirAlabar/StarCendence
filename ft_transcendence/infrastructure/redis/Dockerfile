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

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose Redis port
EXPOSE 23111

# Health check with secret support
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD redis-cli -a "$(cat /run/secrets/redis_password 2>/dev/null || echo '')" ping || exit 1

# Switch to redis user
USER redis

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]