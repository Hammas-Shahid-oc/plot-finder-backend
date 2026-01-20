# 🚀 Quick Start Guide - Authentication Setup Complete!

## ✅ What's Been Installed & Configured

1. **TypeORM** with PostgreSQL driver
2. **@next-nest-auth/nestauth** - Authentication package
3. **@nestjs/config** - Environment configuration
4. **bcrypt** - Password hashing
5. **User entity** with TypeORM decorators
6. **Complete authentication flow** with JWT tokens

## 📁 Project Structure

```
src/
├── users/
│   ├── entities/
│   │   └── user.entity.ts          # User entity (id, email, password, name, role)
│   ├── user.controller.ts          # Endpoints: /users/profile, /users/seed
│   ├── user.module.ts              # UserModule with TypeORM integration
│   ├── user.service.ts             # NestAuthInterface implementation + DB logic
│   └── seed.service.ts             # Database seeding
└── app.module.ts                   # ConfigModule + TypeORM + NestAuth setup
```

## 🎯 Quick Start (3 Steps)

### Step 1: Create `.env` file

```bash
copy .env.example .env
```

Update the `.env` file with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=plot_finder
```

### Step 2: Start PostgreSQL

**Option A - Docker:**
```bash
docker run --name plot-finder-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=plot_finder -p 5432:5432 -d postgres:15
```

**Option B - Local PostgreSQL:**
```sql
CREATE DATABASE plot_finder;
```

### Step 3: Start the Application

```bash
npm run start:dev
```

## 🧪 Test the Setup

### 1. Seed the database with a test user:
```bash
curl -X POST http://localhost:3000/users/seed
```

This creates:
- Email: `test@example.com`
- Password: `password123`

### 2. Login:
```bash
curl -X POST http://localhost:3000/nestauth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

You'll get an `accessToken` and `refreshToken`.

### 3. Access protected route:
```bash
curl -X GET http://localhost:3000/users/profile -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔌 Available Endpoints

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| POST | `/nestauth/login` | Login with email/password | No |
| POST | `/nestauth/refresh-token` | Refresh access token | No |
| GET | `/users/profile` | Get current user profile | Yes ✅ |
| POST | `/users/seed` | Seed test user | No |

## 📝 Environment Variables

All variables in `.env.example`:

```env
# JWT Configuration
JWT_SECRET=my-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=plot_finder
DB_SYNCHRONIZE=true    # Auto-create tables (dev only!)
DB_LOGGING=false       # Enable SQL query logging
```

## 🔐 How It Works

1. **User Entity** (`user.entity.ts`) defines the database schema
2. **UserService** implements `NestAuthInterface`:
   - `validateUser()` - Validates email/password during login
   - `getUserById()` - Retrieves user for JWT token validation
3. **NestAuthModule** provides:
   - `/nestauth/login` endpoint
   - `/nestauth/refresh-token` endpoint
   - `NestAuthJwtGuard` for protecting routes
4. **TypeORM** automatically creates the `users` table on startup

## 🎨 Customization

### Add more fields to User:

Edit `src/users/entities/user.entity.ts`:
```typescript
@Column({ nullable: true })
phoneNumber: string;
```

### Add custom validation logic:

Edit `src/users/user.service.ts` in the `validateUser()` method.

### Protect additional routes:

```typescript
@Get('admin')
@UseGuards(NestAuthJwtGuard)
adminOnly(@Request() req) {
    return { admin: req.user };
}
```

## 📚 Full Documentation

See `SETUP_INSTRUCTIONS.md` for:
- Detailed troubleshooting
- Production considerations
- Database schema details
- Custom JWT payload
- Migration setup

## ⚠️ Important Notes

- **DB_SYNCHRONIZE=true** is for development only. Use migrations in production.
- Change **JWT_SECRET** to a strong random value in production.
- Passwords are hashed with bcrypt (10 salt rounds).
- The access token expires in 1 hour, refresh token in 7 days.

## 🐛 Common Issues

**"Cannot connect to database"**
→ Make sure PostgreSQL is running and credentials are correct in `.env`

**"Invalid credentials"**
→ Run the seed endpoint first: `POST http://localhost:3000/users/seed`

**"Module not found"**
→ Run `npm install` to ensure all packages are installed

---

**Everything is ready to go! 🎉**

Just create your `.env` file, start PostgreSQL, and run the app!


