# Plot Finder Backend - Setup Instructions

This guide will help you set up the backend with PostgreSQL, TypeORM, and NestAuth authentication.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Using Local PostgreSQL

1. Install PostgreSQL on your machine if you haven't already
2. Create a new database:

```sql
CREATE DATABASE plot_finder;
```

#### Option B: Using Docker

```bash
docker run --name plot-finder-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=plot_finder \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Configure Environment Variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
copy .env.example .env
```

Update the values in `.env` according to your PostgreSQL setup:

```env
JWT_SECRET=my-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=plot_finder
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

**Important:**

- Change `JWT_SECRET` to a strong, random secret in production
- Set `DB_SYNCHRONIZE=false` in production (use migrations instead)

### 4. Start the Application

```bash
npm run start:dev
```

The application will:

- Connect to PostgreSQL
- Automatically create the `users` table (because `DB_SYNCHRONIZE=true`)
- Start the server on `http://localhost:3000`

### 5. Seed the Database with Test Data

Create a test user by calling the seed endpoint:

```bash
curl -X POST http://localhost:3000/users/seed
```

This creates a test user with:

- **Email:** `test@example.com`
- **Password:** `password123`

## Testing the Authentication

### 1. Login to Get Access Token

```bash
curl -X POST http://localhost:3000/nestauth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessTokenExpiresIn": "1h",
  "refreshTokenExpiresIn": "7d"
}
```

### 2. Access Protected Route

Use the `accessToken` from the login response:

```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Response:

```json
{
  "sub": 1,
  "name": "Test User",
  "email": "test@example.com",
  "role": "user"
}
```

### 3. Refresh Token

When your access token expires, use the refresh token:

```bash
curl -X POST http://localhost:3000/nestauth/refresh-token \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"YOUR_REFRESH_TOKEN_HERE\"}"
```

## Available Endpoints

### Authentication Endpoints (provided by NestAuth)

- `POST /nestauth/login` - Login with email and password
- `POST /nestauth/refresh-token` - Refresh access token

### User Endpoints

- `GET /users/profile` - Get current user profile (protected)
- `POST /users/seed` - Seed database with test user

## Project Structure

```
src/
├── users/
│   ├── entities/
│   │   └── user.entity.ts      # User entity with TypeORM
│   ├── user.controller.ts      # User endpoints
│   ├── user.module.ts          # User module with TypeORM
│   ├── user.service.ts         # User service (implements NestAuthInterface)
│   └── seed.service.ts         # Database seeding service
├── app.module.ts               # Main app module with TypeORM & NestAuth config
├── app.controller.ts
├── app.service.ts
└── main.ts
```

## Database Schema

### Users Table

| Column    | Type      | Constraints                 |
| --------- | --------- | --------------------------- |
| id        | integer   | Primary Key, Auto-increment |
| email     | varchar   | Unique, Not Null            |
| password  | varchar   | Not Null (bcrypt hashed)    |
| name      | varchar   | Not Null                    |
| role      | varchar   | Default: 'user'             |
| createdAt | timestamp | Auto-generated              |
| updatedAt | timestamp | Auto-updated                |

## Customization

### Adding More Fields to User Entity

Edit `src/users/entities/user.entity.ts`:

```typescript
@Column({ nullable: true })
phoneNumber: string;
```

TypeORM will automatically update the database schema (when `DB_SYNCHRONIZE=true`).

### Changing Password Hashing

The password is hashed using bcrypt with 10 salt rounds in `user.service.ts`. To change:

```typescript
const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds
```

### Custom JWT Payload

Modify the return values in `user.service.ts`:

```typescript
async validateUser(params: any): Promise<JwtPayloadType> {
    // ... validation logic
    return {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customField: 'custom value', // Add custom fields
    };
}
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

- Make sure PostgreSQL is running
- Check your `.env` file has correct database credentials
- Test connection: `psql -U postgres -d plot_finder`

### User Already Exists Error

```
Error: duplicate key value violates unique constraint "users_email_key"
```

**Solution:** The test user already exists. You can:

- Skip seeding, or
- Delete the user: `DELETE FROM users WHERE email = 'test@example.com';`

### Invalid Credentials

```
{"statusCode": 401, "message": "Invalid credentials"}
```

**Solution:**

- Check you're using the correct email/password
- Make sure the database was seeded
- Verify the user exists: `SELECT * FROM users WHERE email = 'test@example.com';`

## Production Considerations

1. **Set `DB_SYNCHRONIZE=false`** and use TypeORM migrations
2. **Use a strong JWT secret** - generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Enable HTTPS**
4. **Add rate limiting** to prevent brute force attacks
5. **Use environment-specific configs**
6. **Add logging and monitoring**
7. **Implement proper error handling**
8. **Use connection pooling** for PostgreSQL

## Next Steps

- Implement password reset functionality
- Add email verification
- Create additional user roles and permissions
- Add user registration endpoint
- Implement refresh token rotation
- Add two-factor authentication
- Create database migrations with TypeORM

## Support

For issues with:

- NestAuth: https://github.com/next-nest-auth/nestauth
- TypeORM: https://typeorm.io/
- NestJS: https://docs.nestjs.com/

