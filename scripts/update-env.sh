#!/bin/bash

# Script to update environment variables on EC2 instance
# This script should be run on the EC2 instance
# It reads environment variables from GitHub Secrets and updates the .env file

set -e

APP_DIR="/home/$USER/csediualumni-services"
ENV_FILE="$APP_DIR/.env"

echo "========================================="
echo "Updating Environment Variables"
echo "========================================="

cd $APP_DIR

# Backup existing .env if it exists
if [ -f "$ENV_FILE" ]; then
    cp $ENV_FILE "${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"
    echo "Backed up existing .env file"
fi

# Create/update .env file
cat > $ENV_FILE <<EOF
# Auto-generated environment file
# Last updated: $(date)

# Node Environment
NODE_ENV=${NODE_ENV:-production}

# Application Port
PORT=${PORT:-3000}

# Frontend URL
FRONTEND_URL=${FRONTEND_URL:-http://localhost:4200}

# MongoDB Configuration
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/csediualumni}

# JWT Configuration
JWT_SECRET=${JWT_SECRET:-}
JWT_EXPIRATION=${JWT_EXPIRATION:-7d}

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL:-}

# Email/SMTP Configuration
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_SECURE=${SMTP_SECURE:-false}
SMTP_USER=${SMTP_USER:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
MAIL_FROM=${MAIL_FROM:-noreply@csediualumni.com}

# Docker Hub
DOCKER_USERNAME=${DOCKER_USERNAME:-}
EOF

# Set proper permissions
chmod 600 $ENV_FILE

echo "Environment variables updated successfully"
echo "========================================="

# Verify critical variables are set
echo "Verifying critical variables..."

MISSING_VARS=()

if [ -z "$JWT_SECRET" ]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ -z "$MONGODB_URI" ]; then
    MISSING_VARS+=("MONGODB_URI")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "WARNING: The following critical variables are not set:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo "Please set these variables before deploying!"
else
    echo "All critical variables are set ✓"
fi

echo "========================================="
