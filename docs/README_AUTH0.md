# Auth0 Integration Guide

## Setup Instructions

### 1. Configure Auth0

1. **Create an Auth0 Account**: Go to [auth0.com](https://auth0.com) and sign up
2. **Create an API**:
   - Navigate to Applications → APIs
   - Click "Create API"
   - Give it a name (e.g., "CSEDI Alumni API")
   - Set an identifier (e.g., `https://api.csedialumni.com`)
   - Select RS256 signing algorithm
   - Save the **Audience** (API Identifier)

3. **Create an Application** (for your frontend):
   - Navigate to Applications → Applications
   - Click "Create Application"
   - Choose "Single Page Web Applications" (for React/Angular/Vue)
   - Save the **Domain** and **Client ID**

4. **Configure Social Connections**:
   - Navigate to Authentication → Social
   - Enable providers you want (Google, Facebook, GitHub, etc.)
   - Configure each with their credentials

5. **Enable Username/Password**:
   - Navigate to Authentication → Database
   - Username-Password-Authentication should be enabled by default
   - Configure password policy as needed

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Auth0 credentials:

```bash
cp .env.example .env
```

Update these values:

- `AUTH0_DOMAIN`: Your Auth0 domain (e.g., `https://yourapp.us.auth0.com/`)
- `AUTH0_AUDIENCE`: Your API identifier from step 2

### 3. Test the Endpoints

#### Public Endpoint (No Auth Required)

```bash
curl http://localhost:3000/auth/health
```

#### Protected Endpoint (Requires JWT)

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/auth/profile
```

### 4. Frontend Integration

Install Auth0 SDK in your frontend:

**React:**

```bash
npm install @auth0/auth0-react
```

**Angular:**

```bash
npm install @auth0/auth0-angular
```

**Vue:**

```bash
npm install @auth0/auth0-vue
```

Example React setup:

```typescript
import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain="yourapp.us.auth0.com"
  clientId="YOUR_CLIENT_ID"
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: "https://api.csedialumni.com",
  }}
>
  <App />
</Auth0Provider>
```

Get token and make API calls:

```typescript
import { useAuth0 } from '@auth0/auth0-react';

const { getAccessTokenSilently } = useAuth0();

const token = await getAccessTokenSilently();

fetch('http://localhost:3000/auth/profile', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## API Endpoints

### `GET /auth/health` (Public)

Health check endpoint - no authentication required.

**Response:**

```json
{
  "status": "ok",
  "message": "Auth service is running"
}
```

### `GET /auth/profile` (Protected)

Get authenticated user's profile with message.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Authenticated user profile",
  "user": {
    "userId": "auth0|123456",
    "email": "user@example.com",
    "emailVerified": true,
    "name": "John Doe",
    "picture": "https://...",
    "permissions": [],
    "roles": []
  }
}
```

### `GET /auth/me` (Protected)

Get authenticated user's details.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "userId": "auth0|123456",
  "email": "user@example.com",
  "emailVerified": true,
  "name": "John Doe",
  "picture": "https://...",
  "permissions": [],
  "roles": []
}
```

## Using the Guard in Other Controllers

Protect any route with the Auth0 guard:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Auth0Guard } from './features/auth/guards/auth0.guard';
import { CurrentUser } from './features/auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(Auth0Guard) // All routes in this controller require auth
export class UsersController {
  @Get()
  findAll(@CurrentUser() user: any) {
    // user is automatically populated from JWT
    return `Getting users for ${user.email}`;
  }
}
```

Make specific routes public:

```typescript
import { Public } from './features/auth/decorators/public.decorator';

@Controller('products')
@UseGuards(Auth0Guard)
export class ProductsController {
  @Public() // This route doesn't require auth
  @Get()
  findAll() {
    return 'Public product list';
  }

  @Get('my-purchases') // This requires auth
  myPurchases(@CurrentUser() user: any) {
    return `Purchases for ${user.userId}`;
  }
}
```

## Troubleshooting

**"Unable to verify JWT signature"**

- Check that `AUTH0_DOMAIN` includes the trailing slash
- Verify the domain matches your Auth0 tenant
- Ensure the token is from the correct Auth0 tenant

**"Invalid audience"**

- Verify `AUTH0_AUDIENCE` matches your API identifier exactly
- Check that your frontend requests tokens with the correct audience

**"No authorization token found"**

- Ensure frontend sends token in `Authorization: Bearer <token>` header
- Check CORS is properly configured

**Social login not showing**

- Verify social connections are enabled in Auth0 dashboard
- Check that connections are enabled for your application
