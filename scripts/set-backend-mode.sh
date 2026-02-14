#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
ENV_FILE="${2:-.env.local}"

if [[ "$MODE" != "api" && "$MODE" != "local" ]]; then
  echo "Usage: $0 <api|local> [env-file]" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  touch "$ENV_FILE"
fi

BACKEND_URL="${VITE_BACKEND_URL:-http://localhost:8080/api/v1}"
TEMP_FILE="$(mktemp)"

grep -v '^VITE_BACKEND_MODE=' "$ENV_FILE" | grep -v '^VITE_BACKEND_URL=' > "$TEMP_FILE" || true
printf 'VITE_BACKEND_MODE=%s\n' "$MODE" >> "$TEMP_FILE"
if [[ "$MODE" == "api" ]]; then
  printf 'VITE_BACKEND_URL=%s\n' "$BACKEND_URL" >> "$TEMP_FILE"
fi

mv "$TEMP_FILE" "$ENV_FILE"

echo "Updated $ENV_FILE"
echo "VITE_BACKEND_MODE=$MODE"
if [[ "$MODE" == "api" ]]; then
  echo "VITE_BACKEND_URL=$BACKEND_URL"
fi
