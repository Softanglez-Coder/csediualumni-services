#!/bin/bash

# EC2 Initial Setup Script for NestJS Application
# Run this script on your EC2 instance after first launch

set -e

echo "========================================="
echo "EC2 Instance Setup for NestJS Application"
echo "========================================="

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
echo "Adding user to docker group..."
sudo usermod -aG docker $USER

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Install Node.js (for npm if needed)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create application directory
echo "Creating application directory..."
APP_DIR="/home/$USER/csediualumni-services"
mkdir -p $APP_DIR
cd $APP_DIR

# Initialize Git repository (if not already done)
if [ ! -d .git ]; then
    echo "Initializing Git repository..."
    git init
    git remote add origin https://github.com/Softanglez-Coder/csediualumni-services.git
fi

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
# Add other environment variables here
EOF
    echo "Please edit .env file with your configuration"
fi

# Enable Docker service
echo "Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# Setup firewall rules
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

echo "========================================="
echo "Setup completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Log out and log back in for docker group changes to take effect"
echo "2. Configure your .env file at $APP_DIR/.env"
echo "3. Set up GitHub secrets for CI/CD:"
echo "   - EC2_HOST"
echo "   - EC2_USERNAME"
echo "   - EC2_SSH_KEY"
echo "   - DOCKER_USERNAME"
echo "   - DOCKER_PASSWORD"
echo "4. Push code to trigger deployment"
echo ""
echo "To start the application manually:"
echo "  cd $APP_DIR && docker-compose up -d"
