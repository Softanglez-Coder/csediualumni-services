#!/bin/bash

# Nginx Setup Script for api.csediualumni.com
# Run this script on your EC2 instance after running ec2-setup.sh

set -e

DOMAIN="api.csediualumni.com"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
APP_DIR="/home/$USER/csediualumni-services"

echo "========================================="
echo "Setting up Nginx for $DOMAIN"
echo "========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "Please do not run as root. Run as ubuntu user."
   exit 1
fi

# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
else
    echo "Nginx is already installed."
fi

# Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx
else
    echo "Certbot is already installed."
fi

# Copy Nginx configuration
echo "Configuring Nginx..."
sudo cp $APP_DIR/nginx/api.csediualumni.com.conf $NGINX_CONFIG_DIR/api.csediualumni.com

# Create initial HTTP-only configuration for Certbot
echo "Creating initial HTTP configuration..."
sudo tee $NGINX_CONFIG_DIR/api.csediualumni.com.temp > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Remove default site if it exists
if [ -L "$NGINX_ENABLED_DIR/default" ]; then
    echo "Removing default Nginx site..."
    sudo rm -f $NGINX_ENABLED_DIR/default
fi

# Enable the temporary site
echo "Enabling site..."
sudo ln -sf $NGINX_CONFIG_DIR/api.csediualumni.com.temp $NGINX_ENABLED_DIR/api.csediualumni.com

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

echo ""
echo "========================================="
echo "Nginx installed and configured!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Ensure your DNS A record for $DOMAIN points to this EC2 instance's IP"
echo ""
echo "2. Wait for DNS propagation (check with: dig $DOMAIN)"
echo ""
echo "3. Once DNS is propagated, run SSL setup:"
echo "   sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email your-email@example.com"
echo ""
echo "4. After SSL is set up, replace the temporary config with the full SSL config:"
echo "   sudo rm -f $NGINX_ENABLED_DIR/api.csediualumni.com"
echo "   sudo ln -sf $NGINX_CONFIG_DIR/api.csediualumni.com $NGINX_ENABLED_DIR/api.csediualumni.com"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "5. Test your API at: https://$DOMAIN"
echo ""
echo "To auto-renew SSL certificates, Certbot has set up a systemd timer."
echo "Check status with: sudo systemctl status certbot.timer"
