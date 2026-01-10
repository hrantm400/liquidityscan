# Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured (optional)
- SSL certificates (for HTTPS)
- Environment variables configured

## Step 1: Environment Setup

Create `.env` file in the root directory:

```env
# Database
POSTGRES_USER=liquidityscan
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=liquidityscan_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars

# CORS
CORS_ORIGIN=https://yourdomain.com

# Exchange APIs
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
MEXC_API_KEY=your_mexc_api_key
MEXC_SECRET_KEY=your_mexc_secret_key
```

## Step 2: Build and Deploy

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate
```

## Step 3: Health Checks

```bash
# Check backend health
curl http://localhost:3000/api/health

# Check frontend
curl http://localhost
```

## Step 4: Scaling (Optional)

For horizontal scaling, use multiple backend instances behind a load balancer:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

## Step 5: Monitoring

- Monitor logs: `docker-compose -f docker-compose.prod.yml logs -f`
- Check resource usage: `docker stats`
- Database connections: Monitor PostgreSQL connections
- Redis memory: Monitor Redis memory usage

## Step 6: Backup

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U liquidityscan liquidityscan_db > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U liquidityscan liquidityscan_db < backup.sql
```

## Performance Optimization

1. **Database Indexes**: Already configured in Prisma schema
2. **Redis Caching**: Enabled with 5-minute TTL for signals
3. **Connection Pooling**: PgBouncer configured
4. **CDN**: Configure CDN for frontend static assets
5. **Load Balancer**: Use Nginx or Traefik for load balancing

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Enable rate limiting (already configured)
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Monitor for suspicious activity

## Troubleshooting

### Backend won't start
- Check database connection
- Verify environment variables
- Check logs: `docker-compose logs backend`

### WebSocket connection issues
- Verify Redis is running
- Check CORS_ORIGIN setting
- Verify port 3000 is accessible

### Database connection errors
- Check PostgreSQL is running
- Verify credentials in .env
- Check connection pool settings
