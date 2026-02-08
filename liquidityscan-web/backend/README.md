# LiquidityScan Backend

NestJS backend API for LiquidityScan platform.

## Setup

### Database Setup (Local PostgreSQL)

Install PostgreSQL locally and ensure it is running on port **5432**. Create a database (e.g. `liquidityscan_db`) and a user with access. Set `DATABASE_URL` in `.env` to match your credentials.

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string, e.g. `postgresql://postgres:password@localhost:5432/liquidityscan_db?schema=public` (port 5432)
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL (e.g., `http://localhost:3000/api/auth/google/callback`)

4. Setup database:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate
```

5. Start development server:
```bash
npm run start:dev
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set Application type to "Web application"
6. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - Your production URL (production)
7. Copy Client ID and Client Secret to `.env`

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token

### Academy
- `GET /api/academy/categories` - Get all categories
- `GET /api/academy/courses` - Get courses (with filters)
- `GET /api/academy/courses/:id` - Get course details
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `GET /api/academy/my-courses` - Get user's enrolled courses
- `GET /api/academy/courses/:id/lessons` - Get course lessons
- `GET /api/academy/lessons/:id` - Get lesson details
- `PUT /api/academy/lessons/:id/progress` - Update lesson progress

### Admin
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/users` - Get users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/categories` - Get categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/courses` - Get courses
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `GET /api/admin/payments` - Get payments

### Payments
- `POST /api/payments/create` - Create payment
- `GET /api/payments/status/:id` - Get payment status
- `PUT /api/payments/status/:id` - Update payment status

## Database Schema

See `prisma/schema.prisma` for full database schema.

Main models:
- `User` - Users
- `Course` - Courses
- `Lesson` - Lessons
- `Category` - Categories
- `CourseEnrollment` - User course enrollments
- `CourseProgress` - User lesson progress
- `Payment` - Payments
- `Subscription` - Subscriptions

## Development

```bash
# Watch mode
npm run start:dev

# Build
npm run build

# Production
npm run start:prod
```

## Testing

```bash
npm test
```
