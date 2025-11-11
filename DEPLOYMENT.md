# AWS EC2 Deployment Guide

This guide will help you deploy the NestJS application to AWS EC2 using the CI/CD pipeline.

## Prerequisites

- AWS Account
- GitHub Account
- Docker Hub Account
- Domain name (optional, for production)

## 1. AWS EC2 Setup

### Create EC2 Instance

1. **Launch EC2 Instance:**
   - Go to AWS Console → EC2 → Launch Instance
   - Choose: Ubuntu Server 22.04 LTS
   - Instance type: t2.micro (or larger based on needs)
   - Configure security group with the following inbound rules:
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (3000) - 0.0.0.0/0
   - Create or select an existing key pair (download the .pem file)

2. **Connect to EC2 Instance:**

   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ubuntu@your-ec2-public-ip
   ```

3. **Run Setup Script:**

   ```bash
   # Download the setup script
   curl -O https://raw.githubusercontent.com/Softanglez-Coder/csediualumni-services/main/scripts/ec2-setup.sh

   # Make it executable
   chmod +x ec2-setup.sh

   # Run the setup
   ./ec2-setup.sh

   # Log out and log back in for docker group changes
   exit
   ssh -i your-key.pem ubuntu@your-ec2-public-ip
   ```

## 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

2. Add these secrets:

   | Secret Name       | Description               | Example                    |
   | ----------------- | ------------------------- | -------------------------- |
   | `EC2_HOST`        | EC2 public IP or domain   | `54.123.45.67`             |
   | `EC2_USERNAME`    | EC2 username              | `ubuntu`                   |
   | `EC2_SSH_KEY`     | Private SSH key content   | Contents of your .pem file |
   | `EC2_SSH_PORT`    | SSH port (optional)       | `22`                       |
   | `DOCKER_USERNAME` | Docker Hub username       | `your-dockerhub-username`  |
   | `DOCKER_PASSWORD` | Docker Hub password/token | `your-dockerhub-password`  |

### Getting SSH Private Key:

```bash
cat your-key.pem
```

Copy the entire content including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

## 3. Docker Hub Setup

1. Create account at https://hub.docker.com
2. Create a repository named `csediualumni-services`
3. Generate access token:
   - Account Settings → Security → New Access Token
   - Save token as `DOCKER_PASSWORD` secret

## 4. Environment Variables

### On EC2 Instance:

Create/edit `.env` file:

```bash
cd /home/ubuntu/csediualumni-services
nano .env
```

Add your environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
# Add other variables as needed
```

### Update docker-compose.yml:

The docker-compose.yml will automatically load the .env file.

## 5. Deployment Process

### Automatic Deployment (CI/CD)

The application deploys automatically when you push to the `main` branch:

```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

The GitHub Actions workflow will:

1. ✅ Run tests
2. 🏗️ Build Docker image
3. 📦 Push to Docker Hub
4. 🚀 Deploy to EC2
5. ✓ Verify deployment

### Manual Deployment

On EC2 instance:

```bash
cd /home/ubuntu/csediualumni-services
./scripts/deploy.sh
```

## 6. Monitoring & Management

### View Logs:

```bash
cd /home/ubuntu/csediualumni-services
docker-compose logs -f
```

### Check Status:

```bash
docker-compose ps
./scripts/health-check.sh
```

### Restart Application:

```bash
docker-compose restart
```

### Stop Application:

```bash
docker-compose down
```

### Start Application:

```bash
docker-compose up -d
```

## 7. SSL/HTTPS Setup (Production)

### Using Nginx Reverse Proxy with Let's Encrypt:

1. **Install Nginx:**

   ```bash
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx:**

   ```bash
   sudo nano /etc/nginx/sites-available/csediualumni
   ```

   Add:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable site:**

   ```bash
   sudo ln -s /etc/nginx/sites-available/csediualumni /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Get SSL Certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## 8. Troubleshooting

### Container won't start:

```bash
docker-compose logs
docker-compose down
docker-compose up -d
```

### Check disk space:

```bash
df -h
docker system prune -a
```

### SSH connection issues:

- Verify security group allows SSH from your IP
- Check key permissions: `chmod 400 your-key.pem`
- Verify EC2_HOST is correct public IP

### Application not accessible:

- Check security group allows port 3000
- Verify container is running: `docker-compose ps`
- Check logs: `docker-compose logs`

## 9. Cost Optimization

- Use **t2.micro** for development (free tier eligible)
- Use **Elastic IP** to avoid IP changes
- Set up **CloudWatch alarms** for monitoring
- Consider **Auto Scaling** for production
- Use **Application Load Balancer** for multiple instances

## 10. Backup & Recovery

### Database Backup:

```bash
# Add backup scripts as needed
# Example for PostgreSQL:
docker exec postgres-container pg_dump -U user dbname > backup.sql
```

### Application Backup:

```bash
cd /home/ubuntu
tar -czf csediualumni-backup-$(date +%Y%m%d).tar.gz csediualumni-services/
```

## Support

For issues, check:

- GitHub Actions logs
- EC2 instance logs: `docker-compose logs`
- Application health: `./scripts/health-check.sh`
