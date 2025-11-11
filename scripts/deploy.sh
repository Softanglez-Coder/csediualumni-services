#!/bin/bash

# Deployment script for manual deployment or troubleshooting
# This script can be run on the EC2 instance

set -e

APP_NAME="csediualumni-services"
APP_DIR="/home/$USER/$APP_NAME"

echo "========================================="
echo "Deploying $APP_NAME"
echo "========================================="

# Navigate to app directory
cd $APP_DIR

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Pull latest Docker image (if using Docker Hub)
if [ ! -z "$DOCKER_USERNAME" ]; then
    echo "Pulling latest Docker image..."
    docker pull $DOCKER_USERNAME/$APP_NAME:latest
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Remove old containers and images
echo "Cleaning up old containers and images..."
docker container prune -f
docker image prune -f

# Start new containers
echo "Starting new containers..."
docker-compose up -d

# Wait for containers to start
echo "Waiting for application to start..."
sleep 10

# Check container status
echo "Container status:"
docker-compose ps

# Check logs
echo ""
echo "Recent logs:"
docker-compose logs --tail=50

echo ""
echo "========================================="
echo "Deployment completed!"
echo "========================================="
echo "Application is running at http://localhost:3000"
