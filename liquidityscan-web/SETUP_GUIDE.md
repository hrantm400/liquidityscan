# LiquidityScan Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL installed locally (port 5432)
- Google Cloud Console account (for OAuth)

## Database Setup (Local PostgreSQL)

1. Install PostgreSQL on your machine (if not already installed).
2. Ensure the PostgreSQL service is running on port **5432**.
3. Create a database and user for the app (optional; you can use the default `postgres` user):
   - Database: `liquidityscan_db`
   - User and password: your choice (e.g. `postgres` / your password, or create a dedicated user).

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure `.env`:
```env
# Database (local PostgreSQL - port 5432)
DATABASE_URL="postgresql://postgres:password@localhost:5432/liquidityscan_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Admin Access - список email адресов с доступом к админ панели (через запятую)
ADMIN_EMAILS=admin@example.com,superadmin@example.com

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

Replace `postgres` and `password` in `DATABASE_URL` with your PostgreSQL user and password.

5. Setup database:
```bash
# Generate Prisma Client
npm run prisma:generate

# Sync database schema (creates tables)
npm run db:push

# Or use migrations (alternative)
# npm run prisma:migrate

# Check database connection
npm run db:check
```

6. Start backend:
```bash
npm run start:dev
```

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:3000/api
```

4. Start frontend:
```bash
npm run dev
```

## Google OAuth Setup

**Подробная инструкция:** См. [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

**Краткая версия:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API" or "Google Identity"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret to backend `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   ```
7. Restart backend after adding credentials

## Admin Access Setup

**Подробная инструкция:** См. [ADMIN_ACCESS_SETUP.md](./ADMIN_ACCESS_SETUP.md)

**Краткая версия:**

1. Добавьте в `backend/.env`:
   ```env
   ADMIN_EMAILS=admin@example.com,superadmin@example.com
   ```
   (Укажите email адреса через запятую)

2. Перезапустите бэкенд

3. Зарегистрируйтесь с одним из email из списка - права админа будут назначены автоматически

**Важно:** 
- Email должен быть **точно** в списке `ADMIN_EMAILS`
- После изменения `.env` нужно **перезапустить бэкенд**
- Доступ проверяется по двум критериям: `isAdmin = true` в БД И email в `ADMIN_EMAILS`

## Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Admin Panel: http://localhost:5173/admin

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL service is running (port 5432).
- Check DATABASE_URL in `backend/.env`: host, port 5432, user, password, database name.
- Verify the database exists (e.g. `liquidityscan_db`).
- If behind a firewall, ensure port 5432 is allowed.

### OAuth Issues
- Verify Google OAuth credentials
- Check redirect URIs match exactly
- Ensure CORS_ORIGIN is set correctly

### CORS Issues
- Update CORS_ORIGIN in backend `.env`
- Ensure frontend URL matches
