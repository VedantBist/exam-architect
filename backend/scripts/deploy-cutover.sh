#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
ACTION="${2:-up}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

case "$ENVIRONMENT" in
  staging)
    PROJECT_NAME="exam-architect-staging"
    COMPOSE_FILE="$BACKEND_DIR/deploy/docker-compose.staging.yml"
    DEFAULT_BASE_URL="http://localhost:8080/api/v1"
    ;;
  production)
    PROJECT_NAME="exam-architect-production"
    COMPOSE_FILE="$BACKEND_DIR/deploy/docker-compose.production.yml"
    DEFAULT_BASE_URL="http://localhost:8081/api/v1"
    ;;
  *)
    echo "Usage: $0 <staging|production> [up|down]" >&2
    exit 1
    ;;
esac

if [[ "$ACTION" == "down" ]]; then
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v
  echo "Environment '$ENVIRONMENT' stopped."
  exit 0
fi

if [[ "$ACTION" != "up" ]]; then
  echo "Usage: $0 <staging|production> [up|down]" >&2
  exit 1
fi

if [[ "$ENVIRONMENT" == "production" && "${CONFIRM_PRODUCTION:-}" != "YES" ]]; then
  echo "Refusing production deploy without CONFIRM_PRODUCTION=YES" >&2
  exit 1
fi

BASE_URL="${BASE_URL:-$DEFAULT_BASE_URL}"

echo "Deploying '$ENVIRONMENT' with compose file: $COMPOSE_FILE"
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --build

echo "Waiting for backend health at $BASE_URL/health"
ready=0
for _ in $(seq 1 60); do
  status="$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" || true)"
  if [[ "$status" == "200" ]]; then
    ready=1
    break
  fi
  sleep 2
done

if (( ready == 0 )); then
  echo "Backend did not become healthy in time." >&2
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs --tail=200
  exit 1
fi

echo "Running parity smoke checks..."
BASE_URL="$BASE_URL" "$SCRIPT_DIR/parity-smoke.sh"

echo "Running cutover monitor checks..."
BASE_URL="$BASE_URL" SAMPLES="${SAMPLES:-3}" "$SCRIPT_DIR/cutover-monitor.sh"

echo "Deployment verification complete for '$ENVIRONMENT'."
echo "Rollback toggle: run ./scripts/set-backend-mode.sh local and redeploy frontend build."
