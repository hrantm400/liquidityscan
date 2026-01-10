import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { config } from 'dotenv';
import { AppModule } from './app.module';

// Load .env file before anything else
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS - Allow requests from frontend
  const corsOrigin = configService.get('CORS_ORIGIN') || 'http://localhost:5173';
  console.log('[CORS] Enabling CORS for origin:', corsOrigin);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
      if (!origin) {
        console.log('[CORS] Request with no origin - allowing');
        return callback(null, true);
      }
      
      // Allow configured origin
      if (origin === corsOrigin) {
        console.log('[CORS] Request from allowed origin:', origin);
        return callback(null, true);
      }
      
      // Allow localhost variations for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
        console.log('[CORS] Request from localhost variation:', origin);
        return callback(null, true);
      }
      
      // Allow Cloudflare Tunnel domains
      if (origin.includes('.trycloudflare.com')) {
        console.log('[CORS] Request from Cloudflare Tunnel:', origin);
        return callback(null, true);
      }
      
      console.warn('[CORS] Request from unauthorized origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3000;
  
  try {
    await app.listen(port);
    console.log(`✅ Application is running on: http://localhost:${port}`);
    console.log(`✅ API available at: http://localhost:${port}/api`);
    console.log(`✅ Google OAuth callback: http://localhost:${port}/api/auth/google/callback`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      console.error(`   Please stop the process using port ${port} or change PORT in .env`);
      console.error(`   To find the process: netstat -ano | findstr :${port}`);
      console.error(`   To kill it: taskkill /PID <PID> /F`);
      process.exit(1);
    } else {
      throw error;
    }
  }
}
bootstrap();
