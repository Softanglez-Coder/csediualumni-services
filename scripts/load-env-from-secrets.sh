#!/bin/bash

# Script to load environment variables from AWS Secrets Manager
# Usage: source ./scripts/load-env-from-secrets.sh

SECRET_NAME="csediualumni/production/env"
REGION="us-east-1"  # Change to your region

echo "Loading environment variables from AWS Secrets Manager..."

# Retrieve the secret
secret_json=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    --query SecretString \
    --output text 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "✗ Failed to retrieve secret from AWS Secrets Manager"
    exit 1
fi

# Parse JSON and export as environment variables
while IFS='=' read -r key value; do
    # Remove quotes and whitespace
    key=$(echo "$key" | tr -d '"' | xargs)
    value=$(echo "$value" | tr -d '"' | xargs)
    
    if [ ! -z "$key" ]; then
        export "$key"="$value"
        echo "✓ Loaded $key"
    fi
done < <(echo "$secret_json" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')

echo "Environment variables loaded successfully!"
