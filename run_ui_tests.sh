#!/bin/bash
# Run UI tests for meal-plan app (opens real browser)
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8889

# Kill any existing server on the port
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true

# Start the HTTP server in background
echo "Starting HTTP server on port $PORT..."
python3 -m http.server $PORT --directory "$DIR" &
SERVER_PID=$!
sleep 0.8

cleanup() {
    echo "Stopping server..."
    kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

echo "Running UI tests..."
cd "$DIR/tests"

# Run with headed browser + slow motion so clicks are visible
python3 -m pytest \
    --browser chromium \
    --headed \
    --slowmo 350 \
    -v \
    "$@"
