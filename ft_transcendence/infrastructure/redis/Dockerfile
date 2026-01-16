FROM redis:7-alpine

# Install additional utilities including su-exec for user switching
RUN apk add --no-cache \
    curl \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create data directory with proper permissions
RUN mkdir -p /data \
    && chown -R redis:redis /data \
    && chmod 755 /data

# Copy custom Redis configuration
COPY redis.conf /usr/local/etc/redis/redis.conf
RUN chown redis:redis /usr/local/etc/redis/redis.conf \
    && chmod 644 /usr/local/etc/redis/redis.conf

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 23111

# Health check - run as root to read secret
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD sh -c 'redis-cli -a "$(cat /run/secrets/redis_password 2>/dev/null || echo "")" ping || exit 1'

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]