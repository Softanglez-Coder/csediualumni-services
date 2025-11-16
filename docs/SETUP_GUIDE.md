# Authentication Setup Guide

This guide explains how to set up and configure the authentication system for the CSE DIU Alumni Services API.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [MongoDB Setup](#mongodb-setup)
- [Email Configuration](#email-configuration)
- [Google OAuth Setup](#google-oauth-setup)
- [Production Deployment](#production-deployment)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Testing the Setup](#testing-the-setup)

## Prerequisites

- Node.js 20+
- MongoDB (local or cloud instance)
- Gmail account (for SMTP) or other email service
- Google Cloud Console account (for OAuth)

## Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Copy Environment File:**
   ```bash
   cp .env.example .env
   ```

3. **Configure Environment Variables:**
   Edit `.env` and update the values (see sections below for specific services).

4. **Start Development Server:**
   ```bash
   npm run start:dev
   ```

5. **Verify Server is Running:**
   ```bash
   curl http://localhost:3000
   ```

## MongoDB Setup

### Option 1: Local MongoDB

1. **Install MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb
   
   # macOS with Homebrew
   brew install mongodb-community
   ```

2. **Start MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mongodb
   
   # macOS
   brew services start mongodb-community
   ```

3. **Update .env:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/csediualumni
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster:**
   - Create a new cluster (Free M0 tier available)
   - Choose a region close to your users

3. **Configure Access:**
   - Database Access: Create a database user with password
   - Network Access: Add your IP address (or 0.0.0.0/0 for development)

4. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

5. **Update .env:**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/csediualumni?retryWrites=true&w=majority
   ```

## Email Configuration

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "CSE DIU Alumni"
   - Copy the generated 16-character password

3. **Update .env:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   MAIL_FROM=CSE DIU Alumni <noreply@csediualumni.com>
   ```

### Other Email Services

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## Google OAuth Setup

1. **Go to Google Cloud Console:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

3. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"

4. **Configure OAuth Consent Screen:**
   - Fill in application name: "CSE DIU Alumni"
   - Add authorized domains: `csediualumni.com` (for production)
   - Add scopes: email, profile, openid

5. **Add Authorized Redirect URIs:**
   - For development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://api.csediualumni.com/api/auth/google/callback`

6. **Copy Credentials:**
   - Copy the Client ID and Client Secret

7. **Update .env:**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   ```

## Production Deployment

### Railway Deployment

1. **Environment Variables:**
   Configure these in Railway dashboard:
   ```bash
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://csediualumni.com
   GOOGLE_CALLBACK_URL=https://api.csediualumni.com/api/auth/google/callback
   MONGODB_URI=mongodb+srv://... (use MongoDB Atlas)
   JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
   JWT_EXPIRATION=7d
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   MAIL_FROM=CSE DIU Alumni <noreply@csediualumni.com>
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

2. **Connect Repository:**
   - Go to [Railway](https://railway.app/)
   - Create new project
   - Connect GitHub repository
   - Railway will auto-deploy on push to main

3. **Configure Custom Domain:**
   - In Railway settings, add `api.csediualumni.com`
   - Update your DNS with provided CNAME

### Docker Setup

For local development with Docker:

```bash
docker-compose up -d
```

## GitHub Secrets Configuration

Configure these secrets for CI/CD (tests only - Railway handles deployment):

1. **Go to Repository Settings:**
   - Navigate to Settings → Secrets and variables → Actions

2. **Optional Secrets for Testing:**
   - Secrets are primarily needed for Railway deployment
   - Railway manages environment variables in its dashboard

## Testing the Setup

### 1. Test Local Development

```bash
# Start the server
npm run start:dev

# Test health endpoint
curl http://localhost:3000

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Test Email Delivery

After registration, check your email inbox for the verification email. If not received:

1. Check spam folder
2. Verify SMTP credentials in .env
3. Check application logs for errors:
   ```bash
   docker-compose logs -f
   ```

### 3. Test Email Verification

Click the verification link in the email, or test manually:

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-token-from-email"
  }'
```

### 4. Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### 5. Test Google OAuth

Open in browser:
```
http://localhost:3000/api/auth/google
```

You should be redirected to Google login.

## Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
- Check MongoDB is running: `sudo systemctl status mongodb`
- Verify connection string in .env
- Check firewall rules

### Email Not Sending

**Error:** `Invalid login` or `Authentication failed`

**Solution:**
- Verify Gmail App Password is correct
- Check 2FA is enabled on Gmail account
- Try regenerating App Password

### Google OAuth Not Working

**Error:** `redirect_uri_mismatch`

**Solution:**
- Verify callback URL in Google Cloud Console matches .env
- Ensure URL includes `/api/auth/google/callback`
- Check if URL uses http/https correctly

### JWT Token Issues

**Error:** `JsonWebTokenError: invalid signature`

**Solution:**
- Ensure JWT_SECRET is the same on server and client
- Check token hasn't expired
- Verify token format: `Bearer <token>`

## Next Steps

After successful setup:

1. **Customize Email Templates:** Edit `/src/mail/mail.service.ts`
2. **Add More Fields to User:** Modify `/src/users/schemas/user.schema.ts`
3. **Implement Password Reset:** Already structured, needs activation
4. **Add Role-Based Access Control:** Use roles in user schema
5. **Set Up Rate Limiting:** Configure on Nginx/API level
6. **Enable API Documentation:** Consider adding Swagger/OpenAPI

## Support

- **Documentation:** [AUTHENTICATION.md](./AUTHENTICATION.md)
- **Issues:** [GitHub Issues](https://github.com/Softanglez-Coder/csediualumni-services/issues)
