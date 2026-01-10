# Liquidity Scan Web Application

Modern web application for cryptocurrency market monitoring and trading signal generation. Migrated from Java Telegram bot to a scalable web platform.

## 🚀 Features

- **3 Trading Strategies:**
  - RSI Divergence Detection
  - Super Engulfing Pattern Detection
  - ICT Daily Bias Analysis

- **Real-time Updates:**
  - WebSocket connections for live signal updates
  - Redis-backed scalable WebSocket architecture
  - Support for 10,000+ concurrent users

- **Modern UI:**
  - Dark/Light theme support
  - Fully responsive design
  - Mobile-optimized interface
  - Interactive charts with TradingView Lightweight Charts

- **Additional Features:**
  - Risk Calculator
  - Signal Details with charts
  - Settings management
  - Subscription plans

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- TradingView Lightweight Charts
- Socket.io-client
- React Query
- Zustand

### Backend
- NestJS (TypeScript)
- PostgreSQL with Prisma ORM
- Redis for caching and WebSocket scaling
- Socket.io with Redis Adapter
- JWT Authentication
- Binance & MEXC API integration

### Infrastructure
- Docker & Docker Compose
- Nginx for frontend
- PgBouncer for connection pooling
- Redis for caching and pub/sub

## 📦 Quick Start

### Development

1. **Start Docker services:**
```bash
docker-compose up -d
```

2. **Setup Backend:**
```bash
cd backend
npm install
cp .env.example .env  # Configure your .env file
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

3. **Setup Frontend:**
```bash
cd frontend
npm install
cp .env.example .env  # Configure your .env file
npm run dev
```

### Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## 📁 Project Structure

```
liquidityscan-web/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/     # Authentication
│   │   ├── strategies/ # Trading strategies
│   │   ├── exchanges/  # Exchange integrations
│   │   ├── signals/    # Signal generation
│   │   ├── websocket/  # WebSocket gateway
│   │   └── common/     # Shared utilities
│   └── prisma/         # Database schema
├── frontend/          # React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API & WebSocket clients
│   │   └── store/      # State management
└── docker-compose.yml # Development setup
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host
- `JWT_SECRET` - JWT signing secret
- `BINANCE_API_KEY` - Binance API key
- `MEXC_API_KEY` - MEXC API key

**Frontend (.env):**
- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL

## 📊 Database Schema

- `users` - User accounts
- `signals` - Trading signals
- `candles` - Market candle data
- `strategies` - User strategies
- `subscriptions` - Subscription plans
- `signal_alerts` - User signal alerts

## 🎯 API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/signals` - Get signals (with filters)
- `GET /api/signals/:id` - Get signal details
- `POST /api/signals/generate` - Generate signals

## 🔌 WebSocket Events

- `signal:new` - New signal detected
- `candle:update` - Candle data update
- `price:update` - Price update
- `subscribe:symbol` - Subscribe to symbol updates
- `subscribe:strategy` - Subscribe to strategy updates

## 📈 Performance

- **Caching:** Redis caching with 5-minute TTL
- **Code Splitting:** Route-based lazy loading
- **Database:** Optimized indexes and connection pooling
- **WebSocket:** Redis adapter for horizontal scaling
- **Rate Limiting:** 100 requests/minute per user

## 🔒 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- SQL injection protection (Prisma)

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📞 Support

For support, please open an issue in the repository.
