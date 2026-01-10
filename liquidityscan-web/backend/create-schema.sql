-- Создание таблиц для Liquidity Scan Web Application
-- Выполните: docker-compose exec -T postgres psql -U liquidityscan -d liquidityscan_db < backend/create-schema.sql

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Таблица подписок
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "features" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сигналов
CREATE TABLE IF NOT EXISTS "signals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strategy_type" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB
);

CREATE INDEX IF NOT EXISTS "signals_symbol_timeframe_detectedAt_idx" ON "signals"("symbol", "timeframe", "detected_at");
CREATE INDEX IF NOT EXISTS "signals_strategyType_detectedAt_idx" ON "signals"("strategy_type", "detected_at");
CREATE INDEX IF NOT EXISTS "signals_status_idx" ON "signals"("status");

-- Таблица свечей
CREATE TABLE IF NOT EXISTS "candles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "open_time" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(20,8) NOT NULL,
    "high" DECIMAL(20,8) NOT NULL,
    "low" DECIMAL(20,8) NOT NULL,
    "close" DECIMAL(20,8) NOT NULL,
    "volume" DECIMAL(30,8) NOT NULL,
    "quote_volume" DECIMAL(30,8)
);

CREATE UNIQUE INDEX IF NOT EXISTS "candles_symbol_timeframe_openTime_key" ON "candles"("symbol", "timeframe", "open_time");
CREATE INDEX IF NOT EXISTS "candles_symbol_timeframe_openTime_idx" ON "candles"("symbol", "timeframe", "open_time");
CREATE INDEX IF NOT EXISTS "candles_openTime_idx" ON "candles"("open_time");

-- Таблица стратегий
CREATE TABLE IF NOT EXISTS "strategies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy_type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "strategies_user_id_idx" ON "strategies"("user_id");

-- Таблица уведомлений о сигналах
CREATE TABLE IF NOT EXISTS "signal_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "signal_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "signal_alerts_user_id_read_at_idx" ON "signal_alerts"("user_id", "read_at");
CREATE INDEX IF NOT EXISTS "signal_alerts_signal_id_idx" ON "signal_alerts"("signal_id");

-- Внешние ключи
ALTER TABLE "users" ADD CONSTRAINT "users_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signal_alerts" ADD CONSTRAINT "signal_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signal_alerts" ADD CONSTRAINT "signal_alerts_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
