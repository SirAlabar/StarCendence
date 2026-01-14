#!/bin/sh
set -e

# Read secrets (This will work if the VM permissions allow it)
METRICS_USER="$(cat /run/secrets/metrics_user)"
METRICS_PASS="$(cat /run/secrets/metrics_pass)"

esc() { printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'; }

MU="$(esc "$METRICS_USER")"
MP="$(esc "$METRICS_PASS")"

# Output to our 'gen' sub-directory
sed \
  -e "s|\${METRICS_USER}|$MU|g" \
  -e "s|\${METRICS_PASS}|$MP|g" \
  /etc/prometheus/prometheus.yml.tpl > /etc/prometheus/gen/prometheus.yml

# Start Prometheus pointing to the generated file
exec /bin/prometheus \
  --config.file=/etc/prometheus/gen/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.enable-lifecycle