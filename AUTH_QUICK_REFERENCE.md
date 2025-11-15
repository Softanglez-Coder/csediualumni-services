# Authentication Quick Reference

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## 🔑 Environment Variables (Required)

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-64-char-secret
JWT_EXPIRATION=1d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=CSE DIU Alumni <noreply@csediualumni.com>
FRONTEND_URL=http://localhost:3001
```

## 📍 API Endpoints

### Public

```
POST   /auth/register              Register new user
POST   /auth/login                 Login
POST   /auth/verify-email          Verify email
POST   /auth/forgot-password       Request password reset
POST   /auth/reset-password        Reset password
POST   /auth/resend-verification   Resend verification email
GET    /auth/google                Google OAuth login
GET    /auth/google/callback       Google OAuth callback
```

### Protected (requires JWT)

```
GET    /auth/me                    Get current user
```

## 🎯 Common cURL Commands

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Get Profile

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛡️ Using Guards

### Require Authentication

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
protectedRoute(@CurrentUser() user: User) {
  return user;
}
```

### Require Specific Role

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete('users/:id')
adminOnly() {
  // Only admins can access
}
```

### Multiple Roles

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MEMBER)
@Get('resources')
membersAndAdmins() {
  // Members and admins can access
}
```

## 📧 Gmail Setup

1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use app password in `EMAIL_PASSWORD`

## 🔐 Google OAuth Setup

1. Go to: https://console.cloud.google.com/
2. Create project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID & Secret to `.env`

## 🗄️ User Roles

```typescript
enum Role {
  GUEST = 'GUEST', // Default for new users
  MEMBER = 'MEMBER', // Verified alumni members
  ADMIN = 'ADMIN', // Administrators
}
```

## ⚠️ Common Issues

### Email not sending

- Check EMAIL_USER and EMAIL_PASSWORD
- Verify Gmail app password is correct
- Check port 587 is not blocked

### Google OAuth not working

- Verify GOOGLE_CALLBACK_URL matches exactly
- Check CLIENT_ID and CLIENT_SECRET
- Ensure OAuth consent screen is configured

### JWT token invalid

- Verify JWT_SECRET is consistent
- Check token hasn't expired
- Ensure token format: `Bearer <token>`

## 📚 Documentation Files

- `AUTH_IMPLEMENTATION_SUMMARY.md` - Complete implementation overview
- `AUTH_DOCUMENTATION.md` - Detailed API documentation
- `AUTH_SETUP.md` - Step-by-step setup guide
- `AUTH_QUICK_REFERENCE.md` - This file

## 🔥 Response Examples

### Success Login

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

### Error Response

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

## 🎨 Frontend Integration

### React/Next.js Example

```typescript
// lib/auth.ts
const API_URL = 'http://localhost:3000';

export const authService = {
  async register(email: string, password: string, name: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
    }
    return data;
  },

  async getProfile() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  logout() {
    localStorage.removeItem('token');
  },
};
```

## 🧪 Testing Checklist

- [ ] User can register
- [ ] Verification email is sent
- [ ] User can verify email
- [ ] User can login after verification
- [ ] User cannot login without verification
- [ ] JWT token is returned on login
- [ ] Protected routes require authentication
- [ ] User can request password reset
- [ ] Password reset email is sent
- [ ] User can reset password
- [ ] Google OAuth redirects correctly
- [ ] Google OAuth creates/links account
- [ ] Role-based access control works

## 💡 Tips

- Use strong JWT_SECRET (64+ characters)
- Set JWT_EXPIRATION based on your security needs
- Test email service separately before integration
- Keep .env file secure and never commit it
- Use different secrets for dev/staging/prod
- Enable HTTPS in production
- Add rate limiting before going live
- Monitor failed login attempts
- Regularly update dependencies

## 🚨 Security Checklist

- [ ] Strong JWT_SECRET configured
- [ ] HTTPS enabled (production)
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Password hashing with bcrypt
- [ ] Email verification enforced
- [ ] Secure token generation
- [ ] Token expiration configured
- [ ] Environment variables secured
- [ ] MongoDB authentication enabled

## 📞 Need Help?

1. Check error logs in console
2. Review AUTH_SETUP.md troubleshooting section
3. Verify all environment variables
4. Test email/Google OAuth separately
5. Check MongoDB connection
