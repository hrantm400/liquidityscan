import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load environment variables
config();

// Get database URL and remove quotes if present
// For migrations, prefer direct connection (DATABASE_URL) over pool (DATABASE_POOL_URL)
const getDatabaseUrl = () => {
  // Try DATABASE_URL first (direct connection), then DATABASE_POOL_URL (pgbouncer), then fallback
  let url = process.env.DATABASE_URL || process.env.DATABASE_POOL_URL || "postgresql://liquidityscan:liquidityscan_password@localhost:5432/liquidityscan_db?schema=public";
  // Remove quotes if present (sometimes .env files have quotes)
  url = url.replace(/^["']|["']$/g, '');
  
  // For migrations, we need direct connection, not through pgbouncer
  // If using pgbouncer URL, try to convert to direct connection
  if (url.includes(':6432')) {
    url = url.replace(':6432', ':5432');
  }
  
  return url;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
