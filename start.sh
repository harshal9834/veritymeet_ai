#!/bin/sh
set -e

echo "[VerityMeet] Activating Python virtual environment..."
export PATH="/opt/venv/bin:$PATH"

echo "[VerityMeet] Starting FastAPI backend on port 8000..."
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
FASTAPI_PID=$!

echo "[VerityMeet] Starting Express full-stack proxy on port ${PORT:-10000}..."
node --loader tsx/esm server.ts &
NODE_PID=$!

# Trap signals for graceful shutdown
trap "kill -TERM $FASTAPI_PID $NODE_PID 2>/dev/null || true" SIGINT SIGTERM

# Wait for any process to exit
wait -n

# Exit with status of process that exited
exit $?
