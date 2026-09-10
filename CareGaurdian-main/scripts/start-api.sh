#!/usr/bin/env bash
# Start the Baseline API fully detached from the calling shell.
cd "$(dirname "$0")/../apps/api" || exit 1
PID_FILE=/tmp/baseline-api.pid
if [ -f "$PID_FILE" ]; then
  OLD=$(cat "$PID_FILE" 2>/dev/null)
  if [ -n "$OLD" ] && kill -0 "$OLD" 2>/dev/null; then
    kill "$OLD" 2>/dev/null
  fi
fi
nohup node dist/src/main.js </dev/null >/tmp/api.log 2>&1 &
echo $! > "$PID_FILE"
sleep 1
echo "started pid=$(cat "$PID_FILE")"