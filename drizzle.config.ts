import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: process.env.DB_MIRGRATION!,  // migration files
  dbCredentials: {
    url: process.env.DB_FILE!,
  }
});
