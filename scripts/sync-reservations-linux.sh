#!/usr/bin/env bash
set -u

APP_DIR="/prd/irytour"
LOG_DIR="$APP_DIR/logs"
LOCK_DIR="/tmp/irytour-reservation-sync.lock"

mkdir -p "$LOG_DIR"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') sync skipped: previous job is still running"
  exit 0
fi

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT

export PATH="/usr/local/bin:/usr/bin:/bin"

cd "$APP_DIR" || exit 1

echo "$(date '+%Y-%m-%d %H:%M:%S') sync started"
npm run sync
exit_code=$?
echo "$(date '+%Y-%m-%d %H:%M:%S') sync finished: status=$exit_code"

exit "$exit_code"
