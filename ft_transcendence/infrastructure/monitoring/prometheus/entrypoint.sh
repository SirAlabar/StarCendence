#!/bin/sh
set -e

METRICS_USER="$(cat /run/secrets/metrics_user)"
METRICS_PASS="$(cat /run/secrets/metrics_pass)"

esc() { printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'; }

MU="$(esc "$METRICS_USER")"
MP="$(esc "$METRICS_PASS")"

sed \
  -e "s|\${METRICS_USER}|$MU|g" \
  -e "s|\${METRICS_PASS}|$MP|g" \
  /etc/prometheus/prometheus.yml.tpl > /etc/prometheus/prometheus.yml

exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus
