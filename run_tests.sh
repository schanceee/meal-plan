#!/bin/bash
# Run all tests: Jest unit tests + headless UI tests
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8889

echo "=== Jest unit tests ==="
cd "$DIR"
npm test -- --no-coverage

echo ""
echo "=== UI tests (headless) ==="

# Kill any existing server on the port
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true

python3 -m http.server $PORT --directory "$DIR" &
SERVER_PID=$!
sleep 0.8

cleanup() {
    kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

cd "$DIR/tests"
python3 -m pytest \
    --browser chromium \
    -v \
    "$@"
