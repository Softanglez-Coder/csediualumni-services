#!/bin/bash

# Health check script for monitoring

APP_URL="${APP_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/}"

echo "Checking application health at $APP_URL$HEALTH_ENDPOINT"

response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL$HEALTH_ENDPOINT)

if [ $response -eq 200 ]; then
    echo "✓ Application is healthy (HTTP $response)"
    exit 0
else
    echo "✗ Application is unhealthy (HTTP $response)"
    exit 1
fi
