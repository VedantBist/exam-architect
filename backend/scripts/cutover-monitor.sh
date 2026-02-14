#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
SAMPLES="${SAMPLES:-5}"
MAX_AUTH_ERRORS="${MAX_AUTH_ERRORS:-0}"
MAX_SUBMISSION_ERRORS="${MAX_SUBMISSION_ERRORS:-0}"
MAX_P95_LATENCY_MS="${MAX_P95_LATENCY_MS:-1200}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

BODY_FILE="$(mktemp)"
LATENCY_FILE="$(mktemp)"
cleanup() {
  rm -f "$BODY_FILE" "$LATENCY_FILE"
}
trap cleanup EXIT

request() {
  local method="$1"
  local path="$2"
  local payload="${3:-}"
  local header_name="${4:-}"
  local header_value="${5:-}"

  local curl_args=(-sS -X "$method" -o "$BODY_FILE" -w "%{http_code} %{time_total}")

  if [[ -n "$payload" ]]; then
    curl_args+=(-H "Content-Type: application/json" -d "$payload")
  fi

  if [[ -n "$header_name" ]]; then
    curl_args+=(-H "$header_name: $header_value")
  fi

  curl_args+=("$BASE_URL$path")

  local status_and_time
  status_and_time="$(curl "${curl_args[@]}")"
  local status="${status_and_time%% *}"
  local time_total="${status_and_time##* }"
  local body
  body="$(cat "$BODY_FILE")"

  printf '%s\n' "$status"
  printf '%s\n' "$time_total"
  printf '%s\n' "$body"
}

HTTP_STATUS=""
HTTP_TIME=""
HTTP_BODY=""
run_request() {
  local output
  output="$(request "$@")"
  HTTP_STATUS="$(printf '%s' "$output" | sed -n '1p')"
  HTTP_TIME="$(printf '%s' "$output" | sed -n '2p')"
  HTTP_BODY="$(printf '%s' "$output" | sed -n '3,$p')"
}

record_latency_ms() {
  local latency_seconds="$1"
  awk -v latency="$latency_seconds" 'BEGIN {printf "%.0f\n", latency * 1000}' >> "$LATENCY_FILE"
}

auth_errors=0
submission_errors=0
successful_samples=0

echo "Monitoring synthetic cutover flow at $BASE_URL (samples=$SAMPLES)"

for sample in $(seq 1 "$SAMPLES"); do
  echo "Sample $sample/$SAMPLES"

  run_request POST /auth/login '{"email":"admin@example.com","password":"admin123"}'
  if [[ "$HTTP_STATUS" != "200" ]]; then
    auth_errors=$((auth_errors + 1))
    echo "  auth error: admin login failed with HTTP $HTTP_STATUS"
    continue
  fi
  record_latency_ms "$HTTP_TIME"
  admin_id="$(printf '%s' "$HTTP_BODY" | jq -r '.user.id // empty')"
  if [[ -z "$admin_id" ]]; then
    auth_errors=$((auth_errors + 1))
    echo "  auth error: admin id missing in response"
    continue
  fi

  run_request POST /auth/login '{"email":"student@example.com","password":"student123"}'
  if [[ "$HTTP_STATUS" != "200" ]]; then
    auth_errors=$((auth_errors + 1))
    echo "  auth error: student login failed with HTTP $HTTP_STATUS"
    continue
  fi
  record_latency_ms "$HTTP_TIME"
  student_id="$(printf '%s' "$HTTP_BODY" | jq -r '.user.id // empty')"
  if [[ -z "$student_id" ]]; then
    auth_errors=$((auth_errors + 1))
    echo "  auth error: student id missing in response"
    continue
  fi

  unique_suffix="$(date +%s%N)-$sample"
  question_id="monitor-q-$unique_suffix"
  exam_payload="$(jq -n \
    --arg createdBy "$admin_id" \
    --arg questionId "$question_id" \
    '{
      title:"Cutover Monitor Exam",
      description:"Synthetic transaction exam",
      durationMinutes:30,
      passingPercentage:40,
      createdBy:$createdBy,
      status:"active",
      questions:[
        {
          id:$questionId,
          text:"What is 2 + 2?",
          type:"integer",
          marks:1,
          orderIndex:0,
          correctAnswer:4
        }
      ]
    }')"

  run_request POST /exams "$exam_payload" "X-User-Id" "$admin_id"
  if [[ "$HTTP_STATUS" != "200" ]]; then
    submission_errors=$((submission_errors + 1))
    echo "  submission error: failed to create synthetic exam (HTTP $HTTP_STATUS)"
    continue
  fi
  exam_id="$(printf '%s' "$HTTP_BODY" | jq -r '.id // empty')"
  if [[ -z "$exam_id" ]]; then
    submission_errors=$((submission_errors + 1))
    echo "  submission error: created exam id missing"
    continue
  fi

  attempt_payload="$(jq -n \
    --arg examId "$exam_id" \
    --arg studentId "$student_id" \
    --arg studentName "Student User" \
    '{examId:$examId, studentId:$studentId, studentName:$studentName}')"

  run_request POST /attempts "$attempt_payload" "X-User-Id" "$student_id"
  if [[ "$HTTP_STATUS" != "200" ]]; then
    submission_errors=$((submission_errors + 1))
    echo "  submission error: failed to create attempt (HTTP $HTTP_STATUS)"
    run_request DELETE "/exams/$exam_id" '' "X-User-Id" "$admin_id" || true
    continue
  fi
  attempt_id="$(printf '%s' "$HTTP_BODY" | jq -r '.id // empty')"
  if [[ -z "$attempt_id" ]]; then
    submission_errors=$((submission_errors + 1))
    echo "  submission error: attempt id missing"
    run_request DELETE "/exams/$exam_id" '' "X-User-Id" "$admin_id" || true
    continue
  fi

  run_request POST "/attempts/$attempt_id/submit" '' "X-User-Id" "$student_id"
  if [[ "$HTTP_STATUS" != "200" ]]; then
    submission_errors=$((submission_errors + 1))
    echo "  submission error: submit attempt failed (HTTP $HTTP_STATUS)"
    run_request DELETE "/exams/$exam_id" '' "X-User-Id" "$admin_id" || true
    continue
  fi

  record_latency_ms "$HTTP_TIME"
  successful_samples=$((successful_samples + 1))
  run_request DELETE "/exams/$exam_id" '' "X-User-Id" "$admin_id" || true
done

latency_count=0
avg_latency=0
p95_latency=0
if [[ -s "$LATENCY_FILE" ]]; then
  latency_count="$(wc -l < "$LATENCY_FILE" | tr -d ' ')"
  avg_latency="$(awk '{sum+=$1} END {if (NR == 0) {print 0} else {printf "%.0f", sum/NR}}' "$LATENCY_FILE")"
  p95_index=$(( (95 * latency_count + 99) / 100 ))
  p95_latency="$(sort -n "$LATENCY_FILE" | sed -n "${p95_index}p")"
fi

echo "Summary:"
echo "  successful synthetic samples: $successful_samples/$SAMPLES"
echo "  auth errors: $auth_errors"
echo "  submission errors: $submission_errors"
echo "  average latency: ${avg_latency}ms"
echo "  p95 latency: ${p95_latency}ms"

failed=0
if (( auth_errors > MAX_AUTH_ERRORS )); then
  echo "[FAIL] auth errors ($auth_errors) exceeded threshold ($MAX_AUTH_ERRORS)" >&2
  failed=1
fi

if (( submission_errors > MAX_SUBMISSION_ERRORS )); then
  echo "[FAIL] submission errors ($submission_errors) exceeded threshold ($MAX_SUBMISSION_ERRORS)" >&2
  failed=1
fi

if (( p95_latency > MAX_P95_LATENCY_MS )); then
  echo "[FAIL] p95 latency (${p95_latency}ms) exceeded threshold (${MAX_P95_LATENCY_MS}ms)" >&2
  failed=1
fi

if (( failed == 1 )); then
  exit 1
fi

echo "[PASS] cutover monitor checks are within thresholds"
