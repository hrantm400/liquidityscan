import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private isConnected = false;
  private connectionRetries = 0;
  private readonly maxRetries = 3;

  constructor(private configService: ConfigService) {
    // Support both DATABASE_URL and DATABASE_POOL_URL
    // Priority: DATABASE_POOL_URL (for pgbouncer) > DATABASE_URL (direct connection)
    let databaseUrl = configService.get<string>('DATABASE_POOL_URL') || configService.get<string>('DATABASE_URL');
    
    if (!databaseUrl) {
      console.warn('DATABASE_POOL_URL or DATABASE_URL is not defined in environment variables. Database features will be disabled.');
      // Create a dummy pool that won't connect
      super();
      return;
    }
    
    // Remove quotes if present (sometimes .env files have quotes)
    databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
    
    // Log which URL is being used
    if (configService.get<string>('DATABASE_POOL_URL')) {
      console.log('📊 Using DATABASE_POOL_URL (pgbouncer connection pool)');
    } else if (configService.get<string>('DATABASE_URL')) {
      console.log('📊 Using DATABASE_URL (direct PostgreSQL connection)');
    }
    
    try {
      // Create PostgreSQL pool for Prisma 7 adapter with better error handling
      const pool = new Pool({ 
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      
      // Handle pool errors
      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
        this.isConnected = false;
      });
      
      const adapter = new PrismaPg(pool);
      
      // Prisma 7 requires adapter in constructor
      super({ adapter });
    } catch (error) {
      console.error('Failed to initialize Prisma adapter:', error);
      // Fallback to basic PrismaClient without adapter
      super();
    }
  }

  async onModuleInit() {
    try {
      // Test connection with a simple query first
      await this.$connect();
      
      // Verify connection with a test query
      await this.$queryRaw`SELECT 1`;
      
      this.isConnected = true;
      this.connectionRetries = 0;
      console.log('✅ Database connected successfully');
    } catch (error: any) {
      this.isConnected = false;
      const errorMessage = error?.message || String(error);
      console.error('❌ Failed to connect to database:', errorMessage);
      
      // More detailed error information
      if (error?.code === 'P1000' || error?.meta?.driverAdapterError) {
        const dbError = error.meta?.driverAdapterError?.cause;
        if (dbError?.originalCode === '28P01') {
          console.error('🔐 Authentication failed. Please check:');
          console.error('   - Database username and password in .env');
          console.error('   - DATABASE_URL or DATABASE_POOL_URL is correct');
        } else if (dbError?.originalCode === '3D000') {
          console.error('📊 Database does not exist. Please create the database first.');
        } else if (dbError?.kind === 'ConnectionRefused') {
          console.error('🔌 Connection refused. Please check:');
          console.error('   - PostgreSQL container is running (docker ps)');
          console.error('   - Port is correct (5432 for direct, 6432 for pgbouncer)');
        }
      }
      
      console.warn('⚠️  Application will continue with limited functionality (no database access)');
      
      // Retry connection with exponential backoff
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        const retryDelay = 5000 * this.connectionRetries;
        console.log(`🔄 Retrying database connection in ${retryDelay / 1000} seconds... (attempt ${this.connectionRetries}/${this.maxRetries})`);
        setTimeout(() => {
          this.onModuleInit().catch(() => {
            // Ignore retry errors
          });
        }, retryDelay);
      } else {
        console.error('❌ Max retry attempts reached. Database connection failed.');
      }
    }
  }

  async onModuleDestroy() {
    try {
      if (this.isConnected) {
        await this.$disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  // Helper method to check if database is available
  isDatabaseAvailable(): boolean {
    return this.isConnected;
  }
}
