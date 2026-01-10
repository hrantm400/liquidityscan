# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- npm or yarn package manager

## Step 1: Start Docker Services

```bash
cd liquidityscan-web
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- PgBouncer on port 6432

## Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example if exists)
# Set DATABASE_URL and other environment variables

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start backend (development)
npm run start:dev
```

Backend will run on http://localhost:3000

## Step 3: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
# VITE_API_URL=http://localhost:3000
# VITE_WS_URL=http://localhost:3000

# Start frontend (development)
npm run dev
```

Frontend will run on http://localhost:5173

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://liquidityscan:liquidityscan_password@localhost:5432/liquidityscan_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
CORS_ORIGIN=http://localhost:5173
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
MEXC_API_KEY=your_mexc_api_key
MEXC_SECRET_KEY=your_mexc_secret_key
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## Testing

1. Open http://localhost:5173 in your browser
2. Navigate to monitor pages:
   - Super Engulfing: http://localhost:5173/monitor/superengulfing
   - Bias Shifts: http://localhost:5173/monitor/bias
   - RSI Divergence: http://localhost:5173/monitor/rsi

## Production Build

### Backend

```bash
cd backend
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend
npm run build
# Serve dist/ folder with a web server (nginx, etc.)
```

## Troubleshooting

- **Database connection errors**: Make sure Docker containers are running (`docker ps`)
- **WebSocket connection errors**: Check Redis is running and CORS_ORIGIN is set correctly
- **Port conflicts**: Change ports in docker-compose.yml and .env files
