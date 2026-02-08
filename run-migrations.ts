import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

async function runMigrations() {
  console.log("🚀 Running Reflectify database migrations...\n");

  const sql = postgres(DATABASE_URL!, {
    max: 1,
  });

  const migrations = [
    "0001_initial_schema.sql",
    "0002_pgvector_and_search.sql",
    "0003_row_level_security.sql",
  ];

  try {
    for (let i = 0; i < migrations.length; i++) {
      const migrationFile = migrations[i];
      console.log(`📋 Migration ${i + 1}/${migrations.length}: ${migrationFile}`);

      const migrationPath = join(
        process.cwd(),
        "supabase",
        "migrations",
        migrationFile
      );
      const migrationSQL = readFileSync(migrationPath, "utf-8");

      await sql.unsafe(migrationSQL);
      console.log(`✅ Migration ${i + 1} completed\n`);
    }

    console.log("🎉 All migrations completed successfully!\n");
    console.log("Next steps:");
    console.log("  1. Verify in Supabase dashboard: Table Editor");
    console.log("  2. Test connection: npx tsx test-db.ts");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
