# Quick Reference Guide

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm test

# Build for production
npm run build
```

## Docker Commands

```bash
# Build image
docker build -t csediualumni-services .

# Run container
docker run -p 3000:3000 csediualumni-services

# Using Docker Compose
docker-compose up -d          # Start in background
docker-compose down           # Stop
docker-compose logs -f        # View logs
docker-compose ps             # Check status
docker-compose restart        # Restart
```

## Deployment Commands

```bash
# First time EC2 setup
./scripts/ec2-setup.sh

# Manual deployment
./scripts/deploy.sh

# Health check
./scripts/health-check.sh
```

## GitHub Actions Workflow

**Automatic deployment on push to main:**

- ✅ Runs tests
- 🏗️ Builds Docker image
- 📦 Pushes to Docker Hub
- 🚀 Deploys to EC2
- ✓ Verifies deployment

## Required GitHub Secrets

```
EC2_HOST              # EC2 public IP
EC2_USERNAME          # ubuntu
EC2_SSH_KEY          # Private key content
DOCKER_USERNAME      # Docker Hub username
DOCKER_PASSWORD      # Docker Hub token
```

## EC2 Instance Commands

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to app
cd /home/ubuntu/csediualumni-services

# View logs
docker-compose logs -f

# Restart app
docker-compose restart

# Update and redeploy
git pull origin main
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Container won't start

```bash
docker-compose logs
docker-compose down && docker-compose up -d
```

### Port already in use

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Disk space issues

```bash
df -h
docker system prune -a
```

### View running processes

```bash
docker ps
docker stats
```

## URLs

- **Local Development:** http://localhost:3000
- **Production (EC2):** http://your-ec2-ip:3000
- **With Domain:** https://your-domain.com

## Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
nano .env
```

## Documentation

- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- 🐳 [Dockerfile](./Dockerfile) - Docker configuration
- 🚀 [.github/workflows/deploy.yml](.github/workflows/deploy.yml) - CI/CD pipeline
