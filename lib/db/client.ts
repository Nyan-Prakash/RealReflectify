import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/config/env";

// For query purposes
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  ssl: 'require', // Force SSL for Supabase
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// Export types
export type DB = typeof db;
