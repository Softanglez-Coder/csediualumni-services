# Testing Auth0 Locally

## Setup for Multiple Frontend Applications

### 1. Auth0 Configuration for Multiple Frontends

**Create one API** (same audience for all frontends):

1. Go to Auth0 Dashboard → Applications → APIs
2. Create API with identifier: `https://api.csedialumni.com`
3. This is your `AUTH0_AUDIENCE` - all frontends will use this

**Create separate Applications** (one per frontend):

1. Go to Auth0 Dashboard → Applications → Applications
2. Create 3 applications:
   - **Web Application**: "CSEDI Alumni Web" (React/Angular/Vue SPA)
   - **Mobile Application**: "CSEDI Alumni Mobile" (React Native/Flutter)
   - **Admin Application**: "CSEDI Alumni Admin" (Admin dashboard)
3. For each application:
   - Set **Application Type**: Single Page Application
   - Configure **Allowed Callback URLs**:
     - Web: `http://localhost:4200/callback, https://web.csedialumni.com/callback`
     - Mobile: `http://localhost:3001/callback, https://mobile.csedialumni.com/callback`
     - Admin: `http://localhost:4300/callback, https://admin.csedialumni.com/callback`
   - Configure **Allowed Logout URLs**: (same domains as above)
   - Configure **Allowed Web Origins**: (same domains as above)
   - Save each **Client ID**

**Enable Connections** for each application:

1. Go to each Application → Connections tab
2. Enable the auth methods you want:
   - ✅ Username-Password-Authentication (for email/password login)
   - ✅ google-oauth2 (for Google login)
   - ✅ facebook (for Facebook login)
   - ✅ github (for GitHub login)

### 2. Backend Configuration

Your `.env` file should have:

```dotenv
AUTH0_DOMAIN=https://csediualumni.us.auth0.com/
AUTH0_AUDIENCE=https://api.csedialumni.com  # Same for all frontends

# Optional: Store client IDs for reference
AUTH0_WEB_CLIENT_ID=abc123...
AUTH0_MOBILE_CLIENT_ID=def456...
AUTH0_ADMIN_CLIENT_ID=ghi789...
```

**Note:** Backend doesn't validate client ID by default - it only validates the audience. All three frontends can get tokens for the same API.

### 3. Create Test User

1. Go to Auth0 Dashboard → User Management → Users
2. Click "Create User"
3. Enter:
   - **Email**: `test@csedialumni.com`
   - **Password**: `TestPassword123!`
   - **Connection**: Username-Password-Authentication
4. Click "Create"
5. Optionally, verify the email manually: Click user → Email → Mark as verified

## Testing Methods

### Method 1: Postman (Recommended for Backend Testing)

#### Step 1: Import Collection

1. Open Postman
2. Import the collection from `postman/Auth0_Testing.postman_collection.json` (see below)

#### Step 2: Get Access Token

**Option A: Using Resource Owner Password Flow (Quick Testing)**

⚠️ **Important:** Enable this grant in Auth0 first:

1. Go to Auth0 Dashboard → Applications → [Your Application]
2. Go to Settings → Advanced Settings → Grant Types
3. Enable "Password" grant
4. Save

Create a POST request in Postman:

```
POST https://csediualumni.us.auth0.com/oauth/token
Content-Type: application/json

{
  "grant_type": "password",
  "username": "test@csedialumni.com",
  "password": "TestPassword123!",
  "audience": "https://api.csedialumni.com",
  "client_id": "YOUR_WEB_CLIENT_ID",
  "scope": "openid profile email"
}
```

**Option B: Using Authorization Code Flow (More Secure, Production-like)**

1. In Postman, create a new request
2. Go to Authorization tab
3. Type: OAuth 2.0
4. Configure:
   - **Grant Type**: Authorization Code
   - **Callback URL**: `https://oauth.pstmn.io/v1/callback` (add this to Auth0 allowed callbacks)
   - **Auth URL**: `https://csediualumni.us.auth0.com/authorize`
   - **Access Token URL**: `https://csediualumni.us.auth0.com/oauth/token`
   - **Client ID**: Your web client ID
   - **Scope**: `openid profile email`
   - **Audience**: `https://api.csedialumni.com`
5. Click "Get New Access Token"
6. Login with `test@csedialumni.com` / `TestPassword123!`
7. Use the token

#### Step 3: Test Protected Endpoints

**Test Health Check (Public)**

```
GET http://localhost:3000/auth/health
```

**Test Profile (Protected)**

```
GET http://localhost:3000/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Test User Info (Protected)**

```
GET http://localhost:3000/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Step 4: Test Token from Different Frontends

Get tokens using different client IDs (web, mobile, admin) - they should all work because they use the same audience:

```json
// Token from Web App
{
  "grant_type": "password",
  "username": "test@csedialumni.com",
  "password": "TestPassword123!",
  "audience": "https://api.csedialumni.com",
  "client_id": "WEB_CLIENT_ID",
  "scope": "openid profile email"
}

// Token from Mobile App
{
  "grant_type": "password",
  "username": "test@csedialumni.com",
  "password": "TestPassword123!",
  "audience": "https://api.csedialumni.com",
  "client_id": "MOBILE_CLIENT_ID",
  "scope": "openid profile email"
}
```

Both tokens will be accepted by the backend because they have the same audience.

### Method 2: Using cURL

#### Get Token

```bash
curl --request POST \
  --url https://csediualumni.us.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "grant_type": "password",
    "username": "test@csedialumni.com",
    "password": "TestPassword123!",
    "audience": "https://api.csedialumni.com",
    "client_id": "YOUR_CLIENT_ID",
    "scope": "openid profile email"
  }'
```

#### Test with Token

```bash
# Save token to variable
TOKEN="eyJhbGc..."

# Test public endpoint
curl http://localhost:3000/auth/health

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/auth/profile
```

### Method 3: Frontend Testing (React Example)

#### Install Dependencies

```bash
npm install @auth0/auth0-react
```

#### Configure Auth0Provider

```tsx
import { Auth0Provider } from '@auth0/auth0-react';

// For Web App
<Auth0Provider
  domain="csediualumni.us.auth0.com"
  clientId="YOUR_WEB_CLIENT_ID"
  authorizationParams={{
    redirect_uri: window.location.origin + '/callback',
    audience: "https://api.csedialumni.com",
    scope: "openid profile email"
  }}
>
  <App />
</Auth0Provider>

// For Mobile App - same config, different clientId
<Auth0Provider
  domain="csediualumni.us.auth0.com"
  clientId="YOUR_MOBILE_CLIENT_ID"
  authorizationParams={{
    redirect_uri: window.location.origin + '/callback',
    audience: "https://api.csedialumni.com",
    scope: "openid profile email"
  }}
>
  <App />
</Auth0Provider>
```

#### Make API Calls

```tsx
import { useAuth0 } from '@auth0/auth0-react';

function ProfileComponent() {
  const { getAccessTokenSilently, user, isAuthenticated, loginWithRedirect } =
    useAuth0();
  const [profile, setProfile] = React.useState(null);

  const fetchProfile = async () => {
    try {
      const token = await getAccessTokenSilently();

      const response = await fetch('http://localhost:3000/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (!isAuthenticated) {
    return <button onClick={() => loginWithRedirect()}>Log In</button>;
  }

  return (
    <div>
      <h2>Welcome {user.name}</h2>
      <button onClick={fetchProfile}>Fetch Profile from API</button>
      {profile && <pre>{JSON.stringify(profile, null, 2)}</pre>}
    </div>
  );
}
```

## Postman Collection

Save this as `postman/Auth0_Testing.postman_collection.json`:

```json
{
  "info": {
    "name": "CSEDI Alumni - Auth0 Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "auth0_domain",
      "value": "csediualumni.us.auth0.com"
    },
    {
      "key": "api_audience",
      "value": "https://api.csedialumni.com"
    },
    {
      "key": "client_id",
      "value": "YOUR_CLIENT_ID"
    },
    {
      "key": "test_email",
      "value": "test@csedialumni.com"
    },
    {
      "key": "test_password",
      "value": "TestPassword123!"
    },
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth0",
      "item": [
        {
          "name": "Get Access Token (Password Grant)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "const response = pm.response.json();",
                  "pm.collectionVariables.set('access_token', response.access_token);",
                  "console.log('Token saved:', response.access_token);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"grant_type\": \"password\",\n  \"username\": \"{{test_email}}\",\n  \"password\": \"{{test_password}}\",\n  \"audience\": \"{{api_audience}}\",\n  \"client_id\": \"{{client_id}}\",\n  \"scope\": \"openid profile email\"\n}"
            },
            "url": {
              "raw": "https://{{auth0_domain}}/oauth/token",
              "protocol": "https",
              "host": ["{{auth0_domain}}"],
              "path": ["oauth", "token"]
            }
          }
        }
      ]
    },
    {
      "name": "API Endpoints",
      "item": [
        {
          "name": "Health Check (Public)",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/health",
              "host": ["{{base_url}}"],
              "path": ["auth", "health"]
            }
          }
        },
        {
          "name": "Get Profile (Protected)",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{access_token}}",
                  "type": "string"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/profile",
              "host": ["{{base_url}}"],
              "path": ["auth", "profile"]
            }
          }
        },
        {
          "name": "Get Current User (Protected)",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{access_token}}",
                  "type": "string"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/me",
              "host": ["{{base_url}}"],
              "path": ["auth", "me"]
            }
          }
        }
      ]
    }
  ]
}
```

## Troubleshooting

### "Grant type 'password' not allowed"

Enable Password grant in Auth0:

- Go to Applications → Settings → Advanced Settings → Grant Types
- Enable "Password"
- ⚠️ Only for testing - use Authorization Code Flow in production

### "Invalid audience"

- Verify `AUTH0_AUDIENCE` in `.env` matches exactly what you use in token request
- Check your API identifier in Auth0 Dashboard → APIs

### "Token does not match the required audience"

- Frontend must request token with `audience` parameter
- Audience must match backend `AUTH0_AUDIENCE` env variable

### Multiple frontends getting different tokens

This is expected - each frontend has different `client_id`. But if they all use the same `audience`, the backend accepts all of them. The `sub` (user ID) claim will be the same across all tokens for the same user.

### Need to distinguish which frontend made the request?

Add custom claim in Auth0 Action:

1. Go to Auth0 Dashboard → Actions → Flows → Login
2. Create custom action that adds `app_type` to token based on `client_id`
3. Backend can read this from JWT payload

### Social login not working locally

- Make sure callback URLs include your local URLs
- Check social connection is enabled for your application
- Verify social provider credentials in Auth0

## Best Practices

1. **One API, Multiple Applications**: Use single audience for all frontends accessing same backend
2. **Password Grant for Testing Only**: Use Authorization Code Flow in production
3. **Short Token Expiry**: Keep access tokens short-lived (default 24h, consider 1-2h)
4. **Verify Email**: Ensure test users have verified emails for full functionality
5. **Use Environment Variables**: Never commit Auth0 credentials to git
6. **CORS**: Make sure backend CORS allows your frontend origins
