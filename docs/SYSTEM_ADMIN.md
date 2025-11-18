# System Admin Bot User

## Overview

The CSE DIU Alumni Services API includes a **system admin bot user** that is automatically created and maintained on application startup. This bot user has full administrative access and is used for:

- **Automated Operations**: Background jobs and system tasks that require user context
- **Emergency Access**: Guaranteed admin access when human administrators are unavailable
- **System Integrity**: A superuser that cannot be accidentally locked out or deleted
- **Audit Trail**: Clear distinction between system-initiated and user-initiated actions

## Features

### Automatic Initialization

The system admin bot is automatically initialized when the application starts:

1. Checks if a system admin bot user exists
2. Creates one if it doesn't exist
3. Updates credentials and permissions if it does exist
4. Ensures the bot is always active and verified

### Guaranteed Properties

The system admin bot user always has:

- ✅ `SYSTEM_ADMIN` role - highest level of access
- ✅ `isSystemBot: true` - identifies it as a bot user
- ✅ `isActive: true` - always active
- ✅ `isEmailVerified: true` - always verified
- ✅ `authProvider: 'local'` - uses local authentication
- ✅ Password authentication enabled

### Protection Features

- **Cannot be deleted** through normal user deletion flows (protected by `isSystemBot` flag)
- **Credentials always up-to-date** - updated on every application restart if changed
- **Fail-safe design** - errors during initialization won't prevent app from starting

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# System Admin Bot User (for automated operations)
SYSTEM_ADMIN_EMAIL=system-admin@csediualumni.com
SYSTEM_ADMIN_PASSWORD=your-secure-password-here
SYSTEM_ADMIN_FIRST_NAME=System
SYSTEM_ADMIN_LAST_NAME=Administrator
```

### Security Best Practices

1. **Use a strong password** - minimum 16 characters with mixed case, numbers, and symbols
2. **Keep credentials secure** - never commit actual passwords to version control
3. **Rotate regularly** - change the password periodically in production
4. **Monitor usage** - audit logs for system admin actions
5. **Environment-specific** - use different credentials for dev/staging/production

### Example Production Configuration

```bash
SYSTEM_ADMIN_EMAIL=system-admin@csediualumni.com
SYSTEM_ADMIN_PASSWORD=A$tr0ng!P@ssw0rd#2024-SecureBot
SYSTEM_ADMIN_FIRST_NAME=System
SYSTEM_ADMIN_LAST_NAME=Administrator
```

## Usage

### Authentication

The system admin bot can authenticate like any other user:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "system-admin@csediualumni.com",
    "password": "your-secure-password-here"
  }'
```

### In Application Code

```typescript
// Example: Using system admin for automated tasks
import { UsersService } from './users/users.service';
import { ConfigService } from '@nestjs/config';

// In your service
async performSystemTask() {
  const systemAdminEmail = this.configService.get('systemAdmin.email');
  const systemAdmin = await this.usersService.findByEmail(systemAdminEmail);
  
  if (systemAdmin && systemAdmin.isSystemBot) {
    // Perform operations as system admin
    // This creates a proper audit trail
  }
}
```

## Technical Details

### Implementation

The system admin bot is implemented through:

1. **User Schema Extension** (`src/users/schemas/user.schema.ts`)
   - Added `isSystemBot: boolean` field

2. **Users Service** (`src/users/users.service.ts`)
   - `ensureSystemAdminExists()` method handles creation/updates

3. **Initialization Service** (`src/users/system-admin-init.service.ts`)
   - Implements `OnModuleInit` to run on startup
   - Gracefully handles errors

4. **Configuration** (`src/config/configuration.ts`)
   - Loads system admin credentials from environment

### Database Schema

```typescript
{
  email: 'system-admin@csediualumni.com',
  password: '<bcrypt-hashed-password>',
  firstName: 'System',
  lastName: 'Administrator',
  isSystemBot: true,
  isActive: true,
  isEmailVerified: true,
  authProvider: 'local',
  roles: ['system_admin']
}
```

## Troubleshooting

### Bot Not Created

If the system admin bot isn't created:

1. **Check Environment Variables**
   ```bash
   # Verify variables are set
   echo $SYSTEM_ADMIN_EMAIL
   echo $SYSTEM_ADMIN_PASSWORD
   ```

2. **Check Application Logs**
   ```bash
   # Look for initialization messages
   [Nest] INFO [SystemAdminInitService] System admin bot user initialized: system-admin@csediualumni.com
   ```

3. **Manual Creation**
   ```bash
   # If needed, you can manually create via API
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "system-admin@csediualumni.com",
       "password": "your-password",
       "firstName": "System",
       "lastName": "Administrator"
     }'
   # Then manually update the user in database to set isSystemBot: true and roles: ['system_admin']
   ```

### Password Not Working

If the password doesn't work:

1. **Restart the Application** - password is updated on startup
2. **Check Environment Variable** - ensure `SYSTEM_ADMIN_PASSWORD` is correct
3. **No Typos** - verify there are no extra spaces or special characters issues

### Missing Credentials Warning

If you see this warning:
```
[Nest] WARN [SystemAdminInitService] System admin credentials not configured. Skipping system admin initialization.
```

**Solution**: Add `SYSTEM_ADMIN_EMAIL` and `SYSTEM_ADMIN_PASSWORD` to your environment variables.

## Security Considerations

### Access Control

- The system admin bot has **full access** to all resources
- Use it only for legitimate system operations
- Audit all actions performed by the bot
- Consider implementing additional logging for bot actions

### Credential Management

- **Never** hardcode credentials in code
- **Never** commit real credentials to version control
- Use secret management tools in production (e.g., AWS Secrets Manager, HashiCorp Vault)
- Rotate credentials regularly (e.g., every 90 days)

### Monitoring

Consider monitoring:
- Login attempts for system admin account
- Failed authentication attempts
- Actions performed by system admin
- Unusual activity patterns

## FAQs

**Q: Can I disable the system admin bot?**
A: Yes, simply don't set `SYSTEM_ADMIN_EMAIL` and `SYSTEM_ADMIN_PASSWORD` environment variables.

**Q: Can I have multiple system admin bots?**
A: The current implementation supports one system admin bot. However, you can create additional admin users with `ADMIN` role manually.

**Q: What if I forget the system admin password?**
A: Update the `SYSTEM_ADMIN_PASSWORD` environment variable and restart the application. The password will be updated automatically.

**Q: Is the bot account visible to regular users?**
A: It depends on your user listing endpoints. Consider filtering out `isSystemBot: true` users from public user lists.

**Q: Can the system admin bot be deleted?**
A: The application should implement protection to prevent deletion of `isSystemBot: true` users. Add this check to your user deletion logic.

## Related Documentation

- [Authentication Guide](./AUTHENTICATION.md) - How authentication works
- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
