# Authentication System Documentation

## Overview

This authentication system provides a complete authentication flow for the CSE DIU Alumni membership management system, including:

- **Email/Password Registration** with email verification
- **Google OAuth 2.0** sign-in
- **Password Recovery** flow
- **Email Verification** system
- **JWT-based** authentication
- **Role-based Access Control (RBAC)**

## Features Implemented

### 1. User Registration & Email Verification

- Users register with email and password
- Verification email sent automatically
- 24-hour expiration on verification tokens
- Welcome email after successful verification

### 2. Login System

- Email/password authentication
- Password hashing with bcrypt
- Email verification required before login
- JWT token generation

### 3. Google OAuth Integration

- Sign in with Google account
- Automatic account creation for new users
- Link Google account to existing email
- Auto-verified emails for Google users

### 4. Password Recovery

- Forgot password request
- Secure reset token generation (1-hour expiration)
- Password reset via email link
- Token invalidation after use

### 5. Security Features

- JWT authentication with configurable expiration
- Password hashing (bcrypt with 10 rounds)
- Secure token generation (crypto.randomBytes)
- Email verification enforcement
- Account blocking capability
- Role-based access control

## API Endpoints

### Public Endpoints

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "GUEST",
    "emailVerified": true,
    "blocked": false
  }
}
```

#### Verify Email

```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

#### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newsecurepassword123"
}
```

#### Resend Verification Email

```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Google OAuth

```http
GET /auth/google
```

Redirects to Google OAuth consent screen.

```http
GET /auth/google/callback
```

Google OAuth callback endpoint (handles automatically).

### Protected Endpoints

#### Get Current User Profile

```http
GET /auth/me
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "GUEST",
    "emailVerified": true,
    "blocked": false
  }
}
```

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key-at-least-32-characters
JWT_EXPIRATION=1d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=CSE DIU Alumni <noreply@csediualumni.com>

# Frontend
FRONTEND_URL=http://localhost:3001
```

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`

### Setting up Gmail for Emails

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASSWORD`

## Authentication Flow

### Registration Flow

```
1. User submits registration form
2. System validates input
3. Check if email already exists
4. Hash password with bcrypt
5. Create user record (emailVerified: false)
6. Generate verification token
7. Send verification email
8. Return success message
```

### Login Flow

```
1. User submits email/password
2. Find user by email
3. Compare password with stored hash
4. Check if email is verified
5. Check if account is blocked
6. Generate JWT token
7. Return token + user data
```

### Google OAuth Flow

```
1. User clicks "Sign in with Google"
2. Redirect to Google consent screen
3. User approves permissions
4. Google redirects to callback URL
5. System receives user profile
6. Check if user exists by email
7. If new: Create account (auto-verified)
8. If exists: Link Google ID
9. Generate JWT token
10. Redirect to frontend with token
```

### Email Verification Flow

```
1. User clicks verification link in email
2. System validates token
3. Check token expiration (24 hours)
4. Mark email as verified
5. Clear verification token
6. Send welcome email
7. Return success message
```

### Password Reset Flow

```
1. User requests password reset
2. Find user by email
3. Generate reset token (1 hour expiry)
4. Send reset email
5. User clicks reset link
6. Submit new password
7. Validate reset token
8. Hash new password
9. Update password
10. Clear reset token
```

## Security Considerations

### Password Security

- Minimum 8 characters required
- Hashed with bcrypt (10 rounds)
- Never returned in API responses

### Token Security

- JWT secret must be strong (32+ chars)
- Tokens include user ID, email, role
- Configurable expiration time
- Verification/reset tokens are crypto-random

### Email Verification

- Required before login
- 24-hour expiration
- One-time use tokens
- Resend capability available

### Account Protection

- Account blocking capability
- Failed login attempts trackable
- Email enumeration protection (consistent messages)

## Database Schema

### User Entity

```typescript
{
  email: string (unique, required)
  hash: string (optional - for OAuth users)
  role: 'GUEST' | 'MEMBER' | 'ADMIN'
  blocked: boolean
  emailVerified: boolean
  emailVerificationToken: string (optional)
  emailVerificationExpires: Date (optional)
  passwordResetToken: string (optional)
  passwordResetExpires: Date (optional)
  googleId: string (optional)
  name: string (optional)
  batch: string (optional)
  photo: string (optional)
  membershipId: string (optional, unique)
}
```

## Guards & Decorators

### Guards

#### `JwtAuthGuard`

Protects routes requiring authentication.

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

#### `RolesGuard`

Protects routes requiring specific roles.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete('users/:id')
deleteUser(@Param('id') id: string) {
  // Only admins can access
}
```

### Decorators

#### `@CurrentUser()`

Injects authenticated user into route handler.

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User) {
  return { user };
}
```

#### `@Roles(...roles)`

Specifies required roles for route access.

```typescript
@Roles(Role.ADMIN, Role.MEMBER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('dashboard')
getDashboard() {
  // Only admins and members can access
}
```

## Testing

### Manual Testing with cURL

#### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

#### Get Profile

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

### Common Error Responses

#### Invalid Credentials (401)

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

#### Email Not Verified (401)

```json
{
  "statusCode": 401,
  "message": "Please verify your email before logging in"
}
```

#### User Already Exists (409)

```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

#### Validation Error (400)

```json
{
  "statusCode": 400,
  "message": ["password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

## Next Steps

### Recommended Enhancements

1. Add rate limiting for auth endpoints
2. Implement refresh tokens
3. Add two-factor authentication (2FA)
4. Add social login (Facebook, GitHub, etc.)
5. Add audit logging for authentication events
6. Implement session management
7. Add password strength requirements
8. Add CAPTCHA for registration/login
9. Implement account lockout after failed attempts
10. Add email change verification flow

## Support

For issues or questions, contact the development team or create an issue in the repository.
