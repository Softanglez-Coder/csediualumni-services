# User Management with Auth0

## Architecture: Hybrid Approach

**Auth0 handles:**

- ✅ Authentication (login/logout)
- ✅ Password storage and hashing
- ✅ Social login connections
- ✅ Email verification
- ✅ Multi-factor authentication

**Your MongoDB database handles:**

- ✅ User profiles (alumni-specific data)
- ✅ Application data (posts, events, connections)
- ✅ Business logic
- ✅ Performance (no Auth0 API calls on every request)

## How It Works

### 1. User Flow

```
1. User logs in via Auth0 (frontend)
2. Auth0 returns JWT with user info (sub, email, name)
3. Frontend sends JWT to your API
4. Backend validates JWT
5. Backend checks if user exists in MongoDB
   - If NO: Create user record with Auth0 ID
   - If YES: Update last login
6. Return user profile from MongoDB
```

### 2. Data Sync

**Auth0 is the source of truth for:**

- User ID (`sub` claim, e.g., `auth0|123456`)
- Email
- Email verification status
- Basic profile (name, picture)

**Your database extends this with:**

- Alumni-specific fields (department, graduation year, batch)
- Custom fields (bio, skills, company, etc.)
- Application data

## API Endpoints

### `GET /users/me`

Get current user's profile (creates user record on first call)

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "_id": "674d...",
  "auth0Id": "auth0|123456",
  "email": "john@csedialumni.com",
  "name": "John Doe",
  "picture": "https://...",
  "emailVerified": true,
  "department": "CSE",
  "graduationYear": 2020,
  "batch": "2020",
  "currentCompany": "Google",
  "skills": ["Python", "React"],
  "roles": ["user"],
  "lastLoginAt": "2025-12-02T...",
  "createdAt": "2025-01-15T...",
  "updatedAt": "2025-12-02T..."
}
```

### `PUT /users/me`

Update current user's profile

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "department": "CSE",
  "graduationYear": 2020,
  "batch": "Spring 2020",
  "bio": "Software Engineer passionate about AI",
  "currentCompany": "Google",
  "currentPosition": "Senior Software Engineer",
  "skills": ["Python", "React", "Node.js"],
  "linkedinUrl": "https://linkedin.com/in/johndoe"
}
```

### `GET /users`

Get all users with optional filters

**Headers:** `Authorization: Bearer <token>`

**Query Params:**

- `department`: Filter by department (e.g., `CSE`)
- `graduationYear`: Filter by year (e.g., `2020`)
- `batch`: Filter by batch (e.g., `Spring 2020`)

**Example:**

```
GET /users?department=CSE&graduationYear=2020
```

### `GET /users/search?q=john`

Search users by name or email

**Headers:** `Authorization: Bearer <token>`

**Query Params:**

- `q`: Search term (searches in name and email)

### `GET /users/:id`

Get specific user by Auth0 ID

**Headers:** `Authorization: Bearer <token>`

**Example:**

```
GET /users/auth0|123456
```

## Database Schema

```typescript
{
  auth0Id: string;        // Required, unique (from JWT 'sub')
  email: string;          // Required, unique
  name: string;
  picture: string;
  emailVerified: boolean;

  // Alumni-specific
  department: string;     // CSE, EEE, etc.
  graduationYear: number;
  batch: string;
  studentId: string;
  phone: string;
  bio: string;
  currentCompany: string;
  currentPosition: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  skills: string[];

  // System
  roles: string[];        // ['user', 'admin', 'moderator']
  isActive: boolean;      // For soft delete
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Setup MongoDB

### Option 1: Local MongoDB

1. **Install MongoDB:**

```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

2. **Update `.env`:**

```
MONGODB_URI=mongodb://localhost:27017/csediualumni
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster (Free tier)
4. Create database user
5. Whitelist IP (0.0.0.0/0 for development)
6. Get connection string
7. Update `.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/csediualumni?retryWrites=true&w=majority
```

## Testing with Postman

### 1. First Login (Creates User)

```
GET http://localhost:3000/users/me
Authorization: Bearer <your_auth0_token>
```

This automatically creates user record if it doesn't exist.

### 2. Update Profile

```
PUT http://localhost:3000/users/me
Authorization: Bearer <your_auth0_token>
Content-Type: application/json

{
  "department": "CSE",
  "graduationYear": 2020,
  "bio": "Alumni working at Google",
  "skills": ["Python", "JavaScript"]
}
```

### 3. Get All Users

```
GET http://localhost:3000/users
Authorization: Bearer <your_auth0_token>
```

### 4. Search Users

```
GET http://localhost:3000/users/search?q=john
Authorization: Bearer <your_auth0_token>
```

## Important Patterns

### Automatic User Creation

The `findOrCreate` method ensures users are automatically added to your database on first login:

```typescript
@Get('me')
async getMyProfile(@CurrentUser() user: any) {
  // Creates user if doesn't exist, updates if exists
  const dbUser = await this.usersService.findOrCreate(user);
  return dbUser;
}
```

### Auth0 ID as Primary Key

Always use `auth0Id` (the JWT `sub` claim) to identify users:

- Unique across Auth0 tenant
- Stable (doesn't change)
- Works with social logins (Google, Facebook, etc.)

### Soft Deletes

Users are never actually deleted, just marked inactive:

```typescript
isActive: false;
```

This preserves data integrity for historical records.

## Common Issues

**"User not found"**

- User hasn't called `/users/me` yet (not created in DB)
- Solution: Always call `/users/me` after login

**"Duplicate key error"**

- User already exists with that email/auth0Id
- Usually happens if you're testing and creating manually

**"Cannot connect to MongoDB"**

- Check `MONGODB_URI` in `.env`
- Verify MongoDB is running (local) or accessible (Atlas)

**Auth0 data not syncing**

- User info is only synced on login
- If you change name in Auth0, user must log out and log back in

## Next Steps

1. **Add more features:**
   - User connections (followers/following)
   - Posts and comments
   - Event attendance
   - Job postings

2. **Add roles and permissions:**
   - Check user roles in guards
   - Implement admin-only endpoints

3. **Add pagination:**
   - Modify `findAll` to support skip/limit

4. **Add more complex queries:**
   - Filter by skills
   - Search by company
   - Alumni directory with faceted search
