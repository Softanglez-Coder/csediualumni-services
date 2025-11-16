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
- 🔐 **User Authentication & Registration**
  - Email/Password registration with email verification
  - Google OAuth 2.0 integration
  - JWT-based authentication
  - Secure password hashing with bcrypt
- 🗄️ **MongoDB Database Integration**
  - User management with Mongoose
  - Indexed schemas for performance
- 📧 **Email Service**
  - Email verification system
  - Welcome emails
  - SMTP support (Gmail, SendGrid, etc.)
- 🐳 Fully containerized with Docker
- 🔄 CI/CD pipeline with GitHub Actions
- 📊 Health monitoring and logging

## 🛠️ Tech Stack

- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with Mongoose
- **Authentication:** JWT, Passport.js, bcrypt
- **Email:** Nodemailer with SMTP
- **Runtime:** Node.js 20
- **Containerization:** Docker
- **Hosting:** [Railway](https://railway.app/)
- **CI/CD:** GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Gmail account with App Password (for email verification)
- Google Cloud Console account (for OAuth)

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure .env file with your settings
# See SETUP_GUIDE.md for detailed instructions

# Run in development mode
npm run start:dev

# API will be available at http://localhost:3000
```

### Quick Test

```bash
# Test registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

For complete setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

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

### Railway Deployment

This application is deployed on [Railway](https://railway.app/) at [api.csediualumni.com](https://api.csediualumni.com).

**Automatic Deployment:**
- Push to `main` branch triggers Railway deployment automatically
- Railway builds from Dockerfile
- Environment variables are managed in Railway dashboard

**First-Time Setup:**

1. **Connect to Railway:**
   - Go to [Railway](https://railway.app/)
   - Create new project from GitHub repo
   - Connect `Softanglez-Coder/csediualumni-services`

2. **Configure Environment Variables:**
   Add these in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRATION=7d
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://api.csediualumni.com/api/auth/google/callback
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   MAIL_FROM=CSE DIU Alumni <noreply@csediualumni.com>
   FRONTEND_URL=https://csediualumni.com
   ```

3. **Configure Custom Domain:**
   - In Railway project settings
   - Add custom domain: `api.csediualumni.com`
   - Update DNS with provided CNAME

4. **Deploy:**
   - Push to main branch or click "Deploy" in Railway dashboard

### CI/CD Pipeline

Push to `main` branch triggers:
1. ✅ Runs tests and linting
2. ✅ Builds application
3. 🚀 Railway auto-deploys on success

## 📚 Documentation

- 📖 [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication API reference
- 🔧 [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup guide
- 📋 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation overview
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

---

**Live API:** [https://api.csediualumni.com](https://api.csediualumni.com)

Built with [NestJS](https://nestjs.com/) for CSE DIU Alumni Community
