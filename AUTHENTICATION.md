# Authentication API Documentation

This document describes the authentication and user registration system for the CSE DIU Alumni Services API.

## Table of Contents

- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)

## Overview

The authentication system supports two registration methods:
1. **Email/Password Registration** - Traditional registration with email verification
2. **Google OAuth** - Single Sign-On using Google accounts

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Authentication Methods

### 1. Email/Password Authentication

Users register with email and password. Email verification is required before login.

**Flow:**
1. User registers → Verification email sent
2. User clicks verification link → Email verified
3. User can now log in → JWT token returned

### 2. Google OAuth Authentication

Users authenticate using their Google account. Email is automatically verified.

**Flow:**
1. User clicks "Sign in with Google" → Redirected to Google
2. User authorizes → Redirected back to app
3. JWT token returned

## API Endpoints

### Base URL
```
Production: https://api.csediualumni.com
Development: http://localhost:3000
```

### 1. Register with Email/Password

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation Rules:**
- `email`: Must be a valid email address
- `password`: Minimum 8 characters
- `firstName`: Required
- `lastName`: Required

**Success Response:** `201 Created`
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Error Responses:**
- `409 Conflict`: Email already registered
- `400 Bad Request`: Validation failed

**Example:**
```bash
curl -X POST https://api.csediualumni.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

### 2. Login with Email/Password

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Success Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"],
    "isEmailVerified": true
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `401 Unauthorized`: Email not verified
- `401 Unauthorized`: Account deactivated
- `400 Bad Request`: Account uses social login

**Example:**
```bash
curl -X POST https://api.csediualumni.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

---

### 3. Verify Email

**Endpoint:** `POST /api/auth/verify-email`

**Description:** Verify user's email address using the token sent via email.

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Error Responses:**
- `404 Not Found`: Invalid or expired token

**Example:**
```bash
curl -X POST https://api.csediualumni.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456..."
  }'
```

---

### 4. Resend Verification Email

**Endpoint:** `POST /api/auth/resend-verification`

**Description:** Resend email verification link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Verification email sent successfully"
}
```

**Error Responses:**
- `400 Bad Request`: User not found
- `400 Bad Request`: Email already verified

**Example:**
```bash
curl -X POST https://api.csediualumni.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

### 5. Google OAuth Login

**Endpoint:** `GET /api/auth/google`

**Description:** Initiate Google OAuth flow.

**Usage:** Redirect user to this endpoint to start Google authentication.

**Example:**
```html
<a href="https://api.csediualumni.com/api/auth/google">
  Sign in with Google
</a>
```

---

### 6. Google OAuth Callback

**Endpoint:** `GET /api/auth/google/callback`

**Description:** Google OAuth callback endpoint (handled automatically).

**Note:** This endpoint is called by Google after user authorization. The response includes a script that posts the JWT token to the parent window.

---

## Error Handling

All error responses follow this structure:

```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Bad Request"
}
```

### Common Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication failed
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- Should include uppercase, lowercase, numbers, and special characters (recommended)
- Passwords are hashed using bcrypt before storage

### JWT Tokens
- Default expiration: 7 days
- Store securely (e.g., httpOnly cookies or secure storage)
- Include in Authorization header: `Bearer <token>`
- Tokens contain: user ID, email, and roles

### Email Verification
- Verification tokens expire after 24 hours
- Tokens are single-use
- New token can be requested via resend endpoint

### Google OAuth
- Uses secure OAuth 2.0 flow
- Requests email and profile scopes only
- Email is automatically verified for Google users

### Rate Limiting
- Implement rate limiting on your reverse proxy/load balancer
- Recommended: 100 requests per 15 minutes per IP

### CORS
- Configure CORS to allow only your frontend domain
- Update `FRONTEND_URL` environment variable

## Environment Variables

Required environment variables for authentication:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/csediualumni

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.csediualumni.com/api/auth/google/callback

# Email/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM=CSE DIU Alumni <noreply@csediualumni.com>

# Frontend
FRONTEND_URL=https://your-frontend-domain.com
```

## Testing

### Manual Testing

1. **Test Registration:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. **Check Email:** Look for verification email

3. **Test Login (should fail before verification):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

4. **Verify Email:** Use token from email

5. **Test Login (should succeed after verification):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

## Integration with Frontend

### Email/Password Flow

```javascript
// Register
const response = await fetch('https://api.csediualumni.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123',
    firstName: 'John',
    lastName: 'Doe'
  })
});

// Login
const response = await fetch('https://api.csediualumni.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.access_token);

// Use token in subsequent requests
const protectedResponse = await fetch('https://api.csediualumni.com/api/protected', {
  headers: {
    'Authorization': `Bearer ${data.access_token}`
  }
});
```

### Google OAuth Flow

```javascript
// Open Google OAuth in popup
const googleAuthWindow = window.open(
  'https://api.csediualumni.com/api/auth/google',
  'Google Sign In',
  'width=500,height=600'
);

// Listen for auth result
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://api.csediualumni.com') return;
  
  const { access_token, user } = event.data;
  localStorage.setItem('token', access_token);
  console.log('Logged in:', user);
});
```

## Support

For issues or questions:
- Create an issue on [GitHub](https://github.com/Softanglez-Coder/csediualumni-services/issues)
- Contact: support@csediualumni.com
