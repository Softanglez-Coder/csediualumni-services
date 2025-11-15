#!/bin/bash

# Script to sync local .env to AWS Secrets Manager
# Usage: ./scripts/sync-env-to-secrets.sh

SECRET_NAME="csediualumni/production/env"
REGION="us-east-1"  # Change to your region

if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

echo "Reading .env file..."

# Convert .env to JSON format
json_string=$(awk -F= '!/^#/ && NF {gsub(/"/, "\\\"", $2); printf "\"%s\":\"%s\",", $1, $2}' .env | sed 's/,$//')
json_payload="{${json_string}}"

echo "Uploading to AWS Secrets Manager..."

# Check if secret exists
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" 2>/dev/null; then
    # Update existing secret
    aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --secret-string "$json_payload" \
        --region "$REGION"
    echo "✓ Secret updated successfully!"
else
    # Create new secret
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --secret-string "$json_payload" \
        --region "$REGION"
    echo "✓ Secret created successfully!"
fi

echo "To retrieve: aws secretsmanager get-secret-value --secret-id $SECRET_NAME --region $REGION"
