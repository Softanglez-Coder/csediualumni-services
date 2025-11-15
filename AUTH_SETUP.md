# Authentication Setup Guide

## Quick Start

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

#### Required Configuration:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Generate a secure secret (min 32 characters)
- `EMAIL_USER` - Your email address for sending emails
- `EMAIL_PASSWORD` - Your email app password
- `FRONTEND_URL` - Your frontend application URL

#### Optional (for Google OAuth):

- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `GOOGLE_CALLBACK_URL` - OAuth callback URL

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `JWT_SECRET` in your `.env` file.

### 4. Setup Gmail for Email Sending

**Option A: Using Gmail with App Password (Recommended)**

1. Enable 2-Factor Authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Create an app password for "Mail"
4. Use this password in `EMAIL_PASSWORD`

**Option B: Using Gmail with "Less Secure Apps" (Not Recommended)**

1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn on "Allow less secure apps"
3. Use your Gmail password in `EMAIL_PASSWORD`

**Option C: Using Other SMTP Providers**

Update these variables accordingly:

```env
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@provider.com
EMAIL_PASSWORD=your-password
```

### 5. Setup Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/auth/google/callback`
     - Production: `https://api.csediualumni.com/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### 6. Start the Application

**Development:**

```bash
npm run start:dev
```

**Production:**

```bash
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000`

### 7. Test Authentication

**Test Registration:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Check Email:**

- Look for verification email in the inbox
- Click the verification link or copy the token

**Verify Email:**

```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_FROM_EMAIL"
  }'
```

**Test Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response.

**Test Protected Endpoint:**

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema Migration

If you have existing users in the database, you need to migrate them to support the new fields.

### MongoDB Migration Script

Create a file `migrate-users.js`:

```javascript
// Connect to MongoDB
const { MongoClient } = require('mongodb');

async function migrateUsers() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  const users = db.collection('users');

  // Update all users with new fields
  await users.updateMany(
    {},
    {
      $set: {
        emailVerified: true, // Set to true for existing users
        blocked: false,
      },
    },
  );

  // Make hash field optional (remove required constraint if set)
  // This is handled by the schema, no migration needed

  console.log('Migration completed!');
  await client.close();
}

migrateUsers().catch(console.error);
```

Run the migration:

```bash
node migrate-users.js
```

## Troubleshooting

### Email Not Sending

**Check Email Configuration:**

```bash
# Test your SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your-email', pass: 'your-app-password' }
});
transporter.verify().then(() => console.log('✓ Email config works!'))
  .catch(err => console.error('✗ Email config error:', err));
"
```

**Common Issues:**

- Gmail blocking: Enable "Less secure app access" or use App Password
- Wrong port: Use 587 for TLS, 465 for SSL
- Firewall: Ensure port is not blocked

### Google OAuth Not Working

**Common Issues:**

- Redirect URI mismatch: Must exactly match in Google Console
- Missing scopes: Ensure 'email' and 'profile' scopes are requested
- Project not published: OAuth consent screen must be configured

**Debug Mode:**
Check Google OAuth errors at: `http://localhost:3000/auth/google/callback`

### JWT Token Invalid

**Common Issues:**

- Secret mismatch: Ensure JWT_SECRET is consistent
- Token expired: Check JWT_EXPIRATION setting
- Invalid format: Token must be sent as `Bearer TOKEN`

**Test Token:**

```bash
# Decode JWT token (without verification)
node -e "
const token = 'YOUR_TOKEN';
console.log(JSON.parse(Buffer.from(token.split('.')[1], 'base64')));
"
```

## Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Use environment-specific GOOGLE_CALLBACK_URL
- [ ] Enable HTTPS for all endpoints
- [ ] Configure CORS properly for your frontend domain
- [ ] Use strong MongoDB credentials
- [ ] Enable MongoDB authentication
- [ ] Use email service with proper SPF/DKIM records
- [ ] Set up rate limiting for auth endpoints
- [ ] Enable application logging
- [ ] Configure proper backup strategy
- [ ] Set up monitoring and alerting
- [ ] Review and test all error messages (no sensitive data leakage)

## Production Deployment

### Environment Variables

Ensure all production variables are set:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prod
JWT_SECRET=your-production-secret-64-chars-min
JWT_EXPIRATION=1d
GOOGLE_CLIENT_ID=prod-client-id
GOOGLE_CLIENT_SECRET=prod-client-secret
GOOGLE_CALLBACK_URL=https://api.csediualumni.com/auth/google/callback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@csediualumni.com
EMAIL_PASSWORD=production-app-password
EMAIL_FROM=CSE DIU Alumni <noreply@csediualumni.com>
FRONTEND_URL=https://csediualumni.com
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start dist/main.js --name csediualumni-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Support

For issues or questions:

- Check the [AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md) for detailed API documentation
- Review error logs in the console
- Check MongoDB connection and user permissions
- Verify email service configuration

## Next Steps

1. **Frontend Integration**: Update your frontend to use these auth endpoints
2. **Role Management**: Implement admin endpoints for role assignment
3. **Profile Management**: Add endpoints for users to update their profiles
4. **Email Templates**: Customize email templates with your branding
5. **Rate Limiting**: Add rate limiting to prevent abuse
6. **Logging**: Implement comprehensive logging for security audits
7. **Testing**: Write unit and integration tests for auth flows
