#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for this script" >&2
  echo "Install jq and retry." >&2
  exit 1
fi

BODY_FILE="$(mktemp)"
cleanup() {
  rm -f "$BODY_FILE"
}
trap cleanup EXIT

request() {
  local method="$1"
  local path="$2"
  local payload="${3:-}"
  local header_name="${4:-}"
  local header_value="${5:-}"

  local curl_args=(-sS -X "$method" -o "$BODY_FILE" -w "%{http_code}")

  if [[ -n "$payload" ]]; then
    curl_args+=(-H "Content-Type: application/json" -d "$payload")
  fi

  if [[ -n "$header_name" ]]; then
    curl_args+=(-H "$header_name: $header_value")
  fi

  curl_args+=("$BASE_URL$path")

  local status
  status="$(curl "${curl_args[@]}")"
  local body
  body="$(cat "$BODY_FILE")"

  printf '%s\n' "$status"
  printf '%s\n' "$body"
}

HTTP_STATUS=""
HTTP_BODY=""
run_request() {
  local raw
  raw="$(request "$@")"
  HTTP_STATUS="${raw%%$'\n'*}"
  HTTP_BODY="${raw#*$'\n'}"
}

expect_status() {
  local actual="$1"
  local expected="$2"
  local context="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "[FAIL] $context expected HTTP $expected, got $actual" >&2
    exit 1
  fi

  echo "[PASS] $context -> HTTP $actual"
}

echo "Running backend parity smoke checks against: $BASE_URL"

run_request GET /health
expect_status "$HTTP_STATUS" "200" "health"

run_request POST /auth/login '{"email":"admin@example.com","password":"admin123"}'
expect_status "$HTTP_STATUS" "200" "admin login"
admin_id="$(printf '%s' "$HTTP_BODY" | jq -r '.user.id')"

echo "adminId=$admin_id"

run_request POST /auth/login '{"email":"student@example.com","password":"student123"}'
expect_status "$HTTP_STATUS" "200" "student login"
student_id="$(printf '%s' "$HTTP_BODY" | jq -r '.user.id')"

echo "studentId=$student_id"

run_request GET /auth/me '' "X-User-Id" "$student_id"
expect_status "$HTTP_STATUS" "200" "auth me"

me_role="$(printf '%s' "$HTTP_BODY" | jq -r '.user.role')"
if [[ "$me_role" != "student" ]]; then
  echo "[FAIL] expected me.role=student, got $me_role" >&2
  exit 1
fi
echo "[PASS] auth me role=student"

run_request GET /exams '' "X-User-Id" "$admin_id"
expect_status "$HTTP_STATUS" "200" "list exams"

exam_count="$(printf '%s' "$HTTP_BODY" | jq 'length')"
if [[ "$exam_count" -lt 1 ]]; then
  echo "[FAIL] expected at least one exam" >&2
  exit 1
fi

exam_id="$(printf '%s' "$HTTP_BODY" | jq -r 'map(select(.id == "exam-001"))[0].id // .[0].id')"
echo "examId=$exam_id"

admin_exam_payload="$(jq -n --arg createdBy "$admin_id" '{
  title:"Smoke Admin Exam",
  description:"Contract smoke validation exam",
  durationMinutes:30,
  passingPercentage:40,
  createdBy:$createdBy,
  status:"created",
  questions:[{
    text:"What is 2 + 2?",
    type:"integer",
    marks:1,
    orderIndex:0,
    correctAnswer:4
  }]
}')"
run_request POST /exams "$admin_exam_payload" "X-User-Id" "$admin_id"
expect_status "$HTTP_STATUS" "200" "admin create exam"
admin_exam_id="$(printf '%s' "$HTTP_BODY" | jq -r '.id')"
echo "adminCreatedExamId=$admin_exam_id"

run_request DELETE "/exams/$admin_exam_id" '' "X-User-Id" "$admin_id"
expect_status "$HTTP_STATUS" "204" "admin delete exam"

unique_suffix="$(date +%s%N)"
qid1="smoke-q1-$unique_suffix"
qid2="smoke-q2-$unique_suffix"
qid3="smoke-q3-$unique_suffix"
opt1="smoke-opt1-$unique_suffix"
opt2="smoke-opt2-$unique_suffix"
opt3="smoke-opt3-$unique_suffix"
opt4="smoke-opt4-$unique_suffix"

attempt_exam_payload="$(jq -n \
  --arg createdBy "$admin_id" \
  --arg qid1 "$qid1" --arg qid2 "$qid2" --arg qid3 "$qid3" \
  --arg opt1 "$opt1" --arg opt2 "$opt2" --arg opt3 "$opt3" --arg opt4 "$opt4" \
  '{
    title:"Smoke Attempt Exam",
    description:"Attempt lifecycle smoke exam",
    durationMinutes:30,
    passingPercentage:40,
    createdBy:$createdBy,
    status:"active",
    questions:[
      {
        id:$qid1,
        text:"What is the SI unit of velocity?",
        type:"mcq",
        marks:1,
        orderIndex:0,
        options:[
          {id:$opt1,text:"m/s",isCorrect:true,orderIndex:0},
          {id:$opt2,text:"km/h",isCorrect:false,orderIndex:1},
          {id:$opt3,text:"cm/s",isCorrect:false,orderIndex:2},
          {id:$opt4,text:"ft/s",isCorrect:false,orderIndex:3}
        ],
        correctAnswer:"m/s"
      },
      {
        id:$qid2,
        text:"Velocity is a scalar quantity.",
        type:"true_false",
        marks:1,
        orderIndex:1,
        correctAnswer:false
      },
      {
        id:$qid3,
        text:"If an object moves 100m in 5 seconds, what is its speed in m/s?",
        type:"integer",
        marks:1,
        orderIndex:2,
        correctAnswer:20
      }
    ]
  }')"
run_request POST /exams "$attempt_exam_payload" "X-User-Id" "$admin_id"
expect_status "$HTTP_STATUS" "200" "create attempt exam"
attempt_exam_id="$(printf '%s' "$HTTP_BODY" | jq -r '.id')"
echo "attemptExamId=$attempt_exam_id"

attempt_payload="$(jq -n --arg examId "$attempt_exam_id" --arg studentId "$student_id" --arg studentName "Student User" '{examId:$examId, studentId:$studentId, studentName:$studentName}')"
run_request POST /attempts "$attempt_payload" "X-User-Id" "$student_id"
expect_status "$HTTP_STATUS" "200" "create attempt"
attempt_id="$(printf '%s' "$HTTP_BODY" | jq -r '.id')"

echo "attemptId=$attempt_id"

answers_payload="$(jq -n --arg qid1 "$qid1" --arg qid2 "$qid2" --arg qid3 "$qid3" \
  '{answers:{($qid1):"m/s",($qid2):false,($qid3):"20"}}')"
run_request PATCH "/attempts/$attempt_id" "$answers_payload" "X-User-Id" "$student_id"
expect_status "$HTTP_STATUS" "200" "update attempt answers"

run_request POST "/attempts/$attempt_id/submit" '' "X-User-Id" "$student_id"
expect_status "$HTTP_STATUS" "200" "submit attempt"

submitted_status="$(printf '%s' "$HTTP_BODY" | jq -r '.status')"
if [[ "$submitted_status" != "submitted" ]]; then
  echo "[FAIL] expected submitted status after submit, got $submitted_status" >&2
  exit 1
fi
echo "[PASS] attempt status=submitted"

run_request GET "/attempts?studentId=$student_id" '' "X-User-Id" "$student_id"
expect_status "$HTTP_STATUS" "200" "list student attempts"

submitted_count="$(printf '%s' "$HTTP_BODY" | jq '[.[] | select(.status=="submitted")] | length')"
if [[ "$submitted_count" -lt 1 ]]; then
  echo "[FAIL] expected at least one submitted attempt" >&2
  exit 1
fi
echo "[PASS] student has submitted attempts"

run_request GET /stats/exams '' "X-User-Id" "$admin_id"
expect_status "$HTTP_STATUS" "200" "exam stats"

run_request DELETE "/exams/$attempt_exam_id" '' "X-User-Id" "$admin_id"
expect_status "$HTTP_STATUS" "204" "cleanup attempt exam"

echo "All parity smoke checks passed."
