#!/usr/bin/env bash
# HertaSchedule — dev server launcher
# Run from Git Bash: bash start.sh

set -e

echo "✦ Starting HertaSchedule..."

# Start the dev server in the background
npm run dev &
DEV_PID=$!

# Wait until the server is accepting connections
echo "  Waiting for localhost:5174..."
until curl -s http://localhost:5174 > /dev/null 2>&1; do
  sleep 0.4
done

echo "  ✓ Server ready — http://localhost:5174"
echo ""

# Open in the default Windows browser
cmd.exe /c start "" "http://localhost:5174" 2>/dev/null || true

# Keep running until Ctrl+C
wait $DEV_PID
