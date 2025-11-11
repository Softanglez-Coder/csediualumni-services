# 🚀 CSE DIU Alumni Services API

RESTful API backend for CSE DIU Alumni platform built with NestJS.

**Production URL:** [https://api.csediualumni.com](https://api.csediualumni.com)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Documentation](#documentation)

## ✨ Features

- 🏗️ Built with NestJS framework
- 🐳 Fully containerized with Docker
- 🔄 CI/CD pipeline with GitHub Actions
- 🔒 SSL/HTTPS enabled with Let's Encrypt
- 📊 Health monitoring and logging
- 🚀 Auto-deployment to AWS EC2
- 🌐 Custom domain: **api.csediualumni.com**

## 🛠️ Tech Stack

- **Framework:** [NestJS](https://nestjs.com/)
- **Runtime:** Node.js 20
- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** AWS EC2 (Ubuntu 22.04)
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (Certbot)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run in development mode
npm run start:dev

# API will be available at http://localhost:3000
```

### Using Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📦 Available Scripts

```bash
npm run start:dev      # Development with hot-reload
npm run build          # Build for production
npm run test           # Run tests
npm run lint           # Run linter
npm run format         # Format code
```

## 🌐 Deployment

### Automatic Deployment (CI/CD)

Push to `main` branch triggers automatic deployment:

1. ✅ Runs tests and linting
2. 🏗️ Builds Docker image
3. 📦 Pushes to Docker Hub
4. 🚀 Deploys to AWS EC2
5. ✓ Verifies deployment

### First-Time Setup

1. **Launch EC2 Instance** (Ubuntu 22.04)
2. **Configure DNS:** Point `api.csediualumni.com` to EC2 IP
3. **Run Setup Scripts:**
   ```bash
   ./scripts/ec2-setup.sh
   ./scripts/setup-nginx.sh
   ```
4. **Configure GitHub Secrets**
5. **Push to deploy**

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 Documentation

- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- 🔧 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common commands
- 🐳 [Dockerfile](./Dockerfile) - Docker configuration
- ⚙️ [CI/CD Workflow](.github/workflows/deploy.yml) - GitHub Actions

## 🏗️ Project Structure

```
csediualumni-services/
├── src/                 # Application source
├── scripts/            # Deployment scripts
├── nginx/              # Nginx configuration
├── .github/workflows/  # CI/CD pipelines
└── test/              # Tests
```

## 🐛 Issues & Support

- Create an issue on [GitHub](https://github.com/Softanglez-Coder/csediualumni-services/issues)
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting

---

**Live API:** [https://api.csediualumni.com](https://api.csediualumni.com)

Built with [NestJS](https://nestjs.com/) for CSE DIU Alumni Community
