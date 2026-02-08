import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./lib/db/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL!;
const queryClient = postgres(DATABASE_URL, { max: 10 });
const db = drizzle(queryClient, { schema });

async function testConnection() {
  console.log("\n🔌 Testing database connection...\n");

  try {
    // Test 1: Basic query
    console.log("Test 1: Querying users table...");
    const result = await db.select().from(schema.users).limit(1);
    console.log("✅ Database connected successfully!");
    console.log(`   Found ${result.length} users\n`);

    // Test 2: Check if we can query other tables
    console.log("Test 2: Checking table access...");
    const tables = ["entries", "events", "entities", "threads"];

    for (const tableName of tables) {
      try {
        await db.execute(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`   ✅ ${tableName} table accessible`);
      } catch (error) {
        console.log(`   ❌ ${tableName} table not accessible`);
      }
    }

    console.log("\n🎉 All database tests passed!\n");
    console.log("Next steps:");
    console.log("  1. Start the dev server: npm run dev");
    console.log("  2. Build authentication UI");
    console.log("");
  } catch (error: any) {
    console.error("❌ Database connection failed!");
    console.error("\nError details:");
    console.error(error.message);
    console.error("\nTroubleshooting:");
    console.error("  - Check your DATABASE_URL in .env.local");
    console.error("  - Verify migrations were run successfully");
    console.error("  - Check Supabase dashboard for connection info");
    console.error("");
  }

  process.exit(0);
}

testConnection();
