import 'dotenv/config';
import { defineConfig } from "drizzle-kit";
import { DB_FILE, DB_MIGRATION } from '@/lib/constants';

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: DB_MIGRATION,  // migration dir
  dbCredentials: {
    url: DB_FILE,
  }
});


/**
 * Drizzle orm Usage:
 * 
 *  const result = await db.select().from(users);
 * equals:
 *  const result = db.select().from(users).all();
 *  
 *  const result = await db.select().from(users).limit(1);
 * equals:
 *  const result = db.select().from(users).get();
 */