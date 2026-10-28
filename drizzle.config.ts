// Legacy SQLite prototype only. Runtime PostgreSQL schema is maintained in db/*.sql
// and supabase/migrations. Do not use this configuration to provision production.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "sqlite",
});
