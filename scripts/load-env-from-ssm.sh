#!/bin/bash

# Script to load environment variables from AWS Systems Manager Parameter Store
# Usage: source ./scripts/load-env-from-ssm.sh

PARAMETER_PREFIX="/csediualumni"

echo "Loading environment variables from AWS Parameter Store..."

# Function to get parameter and export as env variable
get_and_export() {
    local param_name=$1
    local env_name=$2
    
    value=$(aws ssm get-parameter --name "${PARAMETER_PREFIX}/${param_name}" --with-decryption --query "Parameter.Value" --output text 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$value" ]; then
        export ${env_name}="$value"
        echo "✓ Loaded ${env_name}"
    else
        echo "✗ Failed to load ${env_name}"
    fi
}

# Load all parameters
get_and_export "JWT_SECRET" "JWT_SECRET"
get_and_export "MONGODB_URI" "MONGODB_URI"
get_and_export "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_ID"
get_and_export "GOOGLE_CLIENT_SECRET" "GOOGLE_CLIENT_SECRET"
get_and_export "EMAIL_USER" "EMAIL_USER"
get_and_export "EMAIL_PASSWORD" "EMAIL_PASSWORD"

# Non-secret parameters can still be in .env or set here
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export EMAIL_HOST="${EMAIL_HOST:-smtp.gmail.com}"
export EMAIL_PORT="${EMAIL_PORT:-587}"
export EMAIL_SECURE="${EMAIL_SECURE:-false}"

echo "Environment variables loaded!"
