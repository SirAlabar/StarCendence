#!/bin/sh
set -e

# Load Redis password from Docker secret
if [ -f /run/secrets/redis_password ]; then
    REDIS_PASSWORD=$(cat /run/secrets/redis_password)
    echo "Redis password loaded from secret"
else
    echo "Warning: No Redis password secret found!"
    REDIS_PASSWORD=""
fi

# Start Redis with password from secret
if [ -n "$REDIS_PASSWORD" ]; then
    exec redis-server /usr/local/etc/redis/redis.conf --requirepass "$REDIS_PASSWORD"
else
    echo "Error: Redis password is empty!"
    exit 1
fi