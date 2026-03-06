#!/bin/sh
set -eu

if [ "${SKIP_TLS_BOOTSTRAP:-0}" = "1" ]; then
  echo "[init-cert] SKIP_TLS_BOOTSTRAP=1; skipping temporary TLS certificate generation."
  exit 0
fi

CERT_DIR="/etc/letsencrypt/live/desirsolutions.com"
FULLCHAIN_PATH="${CERT_DIR}/fullchain.pem"
PRIVKEY_PATH="${CERT_DIR}/privkey.pem"

if [ ! -f "$FULLCHAIN_PATH" ] || [ ! -f "$PRIVKEY_PATH" ]; then
  echo "[init-cert] TLS cert not found; generating temporary self-signed certificate."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$PRIVKEY_PATH" \
    -out "$FULLCHAIN_PATH" \
    -subj "/CN=desirsolutions.com" >/dev/null 2>&1
fi
