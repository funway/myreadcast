import 'dotenv/config';
import { defineConfig } from "drizzle-kit";
import { DB_FILE, DB_MIGRATION } from './src/lib/server/constants';
import path from 'path';

const REL_DB_FILE = path.relative(path.resolve(), DB_FILE);
const REL_DB_MIGRATION = path.relative(path.resolve(), DB_MIGRATION);
// console.log(REL_DB_FILE, REL_DB_MIGRATION);

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/server/db/schema.ts",
  out: REL_DB_MIGRATION,  // migration dir
  dbCredentials: {
    url: REL_DB_FILE,
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