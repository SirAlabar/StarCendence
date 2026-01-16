#!/bin/sh
set -e

# Try to read from secret file or environment variable
if [ -f "${REDIS_PASSWORD_FILE:-/run/secrets/redis_password}" ]; then
    REDIS_PASSWORD=$(cat "${REDIS_PASSWORD_FILE:-/run/secrets/redis_password}" 2>/dev/null || echo "")
elif [ -n "${REDIS_PASSWORD}" ]; then
    # Password already in environment
    echo "Using Redis password from environment"
else
    echo "Warning: No Redis password found!"
    REDIS_PASSWORD=""
fi

if [ -n "$REDIS_PASSWORD" ]; then
    exec redis-server /usr/local/etc/redis/redis.conf --requirepass "$REDIS_PASSWORD"
else
    echo "Error: Redis password is empty!"
    exit 1
fi