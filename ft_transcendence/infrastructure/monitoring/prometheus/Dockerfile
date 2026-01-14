# Start from the official image
FROM prom/prometheus:latest

# Temporarily switch to root to set up the environment
USER root

# 1. Create a sub-directory for our dynamic config
# 2. Give ownership of the config and storage areas to the 'nobody' user (UID 65534)
RUN mkdir -p /etc/prometheus/gen && \
    chown -R 65534:65534 /etc/prometheus /prometheus

# Copy your entrypoint script into the image
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Switch back to the non-privileged user
USER 65534

# Use the script as the entrypoint
ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]