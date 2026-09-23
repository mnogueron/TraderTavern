#!/bin/bash
set -e

export PATH="/app/node_modules/.bin:$PATH"

if [ -z "$FRONTEND_ORIGIN" ] && [ -n "$DOMAIN" ]; then
  export FRONTEND_ORIGIN="https://${DOMAIN}"
fi

echo "Running database migrations..."
(cd /app/apps/api && migrate-mongo up -f migrate-mongo-config.js)

echo "Starting API on port ${API_PORT:-4711}..."
PORT="${API_PORT:-4711}" node /app/apps/api/dist/main.js &
API_PID=$!

echo "Starting frontend on port ${FRONTEND_PORT:-4710}..."
# react-router-serve resolves the build's assetsBuildDirectory ("build/client")
# relative to the process cwd, not the build file's location, so it must be
# launched from the app's own directory or static assets 404.
(cd /app/apps/TraderTavern && PORT="${FRONTEND_PORT:-4710}" react-router-serve build/server/index.js) &
WEB_PID=$!

trap 'kill -TERM "$API_PID" "$WEB_PID" 2>/dev/null' TERM INT

wait -n "$API_PID" "$WEB_PID"
EXIT_CODE=$?
kill -TERM "$API_PID" "$WEB_PID" 2>/dev/null
exit "$EXIT_CODE"
