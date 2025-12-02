# Auth0 Action Setup - Add User Profile to Access Token

## Problem

By default, Auth0 access tokens only contain minimal claims (`sub`, `aud`, `iss`, `iat`, `exp`). They don't include user profile information like `email`, `name`, or `picture`. This causes the backend to receive `undefined` for these fields.

## Solution

Create a custom Auth0 Action to add user profile claims to the access token.

## Steps

### 1. Navigate to Auth0 Dashboard

- Go to **Actions** → **Flows** → **Login**

### 2. Create a New Action

- Click **"+"** (Add Action) → **Build from scratch**
- Name: `Add user profile to access token`
- Runtime: Use latest Node.js version

### 3. Add Action Code

```javascript
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Only modify access tokens
  if (event.authorization) {
    const namespace = 'https://api.csedialumni.com/';

    // Add user profile claims to access token
    api.accessToken.setCustomClaim(`${namespace}email`, event.user.email);
    api.accessToken.setCustomClaim(`${namespace}name`, event.user.name);
    api.accessToken.setCustomClaim(`${namespace}picture`, event.user.picture);
    api.accessToken.setCustomClaim(
      `${namespace}email_verified`,
      event.user.email_verified,
    );

    // Optional: Add user metadata if needed
    // api.accessToken.setCustomClaim(`${namespace}user_metadata`, event.user.user_metadata);

    console.log(`Added profile claims for user: ${event.user.email}`);
  }
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
// exports.onContinuePostLogin = async (event, api) => {
// };
```

### 4. Deploy the Action

- Click **Deploy** (top right)

### 5. Add to Login Flow

- In the **Login** flow, drag your new action from the right sidebar
- Place it between **Start** and **Complete**
- Click **Apply**

## Verification

After deploying, test the token claims:

### 1. Get a new access token from your frontend

### 2. Decode at [jwt.io](https://jwt.io)

You should see:

```json
{
  "https://api.csedialumni.com/email": "user@example.com",
  "https://api.csedialumni.com/name": "John Doe",
  "https://api.csedialumni.com/picture": "https://...",
  "https://api.csedialumni.com/email_verified": true,
  "iss": "https://csediualumni.us.auth0.com/",
  "sub": "google-oauth2|...",
  "aud": [
    "https://api.csedialumni.com",
    "https://csediualumni.us.auth0.com/userinfo"
  ],
  ...
}
```

## Alternative: Standard Claims (Not Recommended)

You could use standard claim names without namespace, but Auth0 recommends namespaced claims for custom data:

```javascript
// NOT RECOMMENDED - May conflict with OIDC standard
api.accessToken.setCustomClaim('email', event.user.email);
api.accessToken.setCustomClaim('name', event.user.name);
```

## Backend Support

The backend (`auth0.strategy.ts`) now supports both:

- Standard claims: `payload.email`, `payload.name`, etc.
- Namespaced claims: `payload['https://api.csedialumni.com/email']`

It will try standard claims first, then fall back to namespaced claims.

## Troubleshooting

### Email still undefined after adding Action

1. Make sure the Action is **deployed** (not just saved)
2. Verify the Action is **added to the Login flow** and the flow is **applied**
3. **Get a new token** - old tokens won't have the new claims
4. Check Auth0 logs: **Monitoring** → **Logs** for any Action errors

### Claims not appearing

- Ensure you're checking the **access token**, not the ID token
- Verify the namespace URL matches exactly (including trailing `/`)
- Check that `event.authorization` is truthy in the Action

## References

- [Auth0 Actions Documentation](https://auth0.com/docs/customize/actions)
- [Add Custom Claims to Tokens](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)
