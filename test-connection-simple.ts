import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL!;

async function testConnection() {
  console.log("\n🔌 Testing raw database connection...\n");

  try {
    const sql = postgres(DATABASE_URL, { max: 1 });

    // Test 1: Simple ping
    console.log("Test 1: Basic connection...");
    const result = await sql`SELECT NOW() as current_time`;
    console.log(`✅ Connected! Server time: ${result[0].current_time}\n`);

    // Test 2: Check tables exist
    console.log("Test 2: Checking if tables exist...");
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach((t: any) => console.log(`   - ${t.table_name}`));
    console.log("");

    // Test 3: Check pgvector extension
    console.log("Test 3: Checking pgvector extension...");
    const extensions = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    if (extensions.length > 0) {
      console.log(`✅ pgvector enabled (version ${extensions[0].extversion})\n`);
    } else {
      console.log(`⚠️  pgvector extension not found\n`);
    }

    // Test 4: Try to query users table
    console.log("Test 4: Querying users table...");
    try {
      const users = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`✅ Users table accessible (${users[0].count} users)\n`);
    } catch (error: any) {
      console.log(`❌ Error accessing users table: ${error.message}\n`);
    }

    await sql.end();

    console.log("🎉 Connection test complete!\n");

  } catch (error: any) {
    console.error("❌ Connection failed!\n");
    console.error("Error:", error.message);
    console.error("\nCheck:");
    console.error("  - DATABASE_URL is correct in .env.local");
    console.error("  - Supabase project is running");
    console.error("  - Migrations were applied successfully");
  }

  process.exit(0);
}

testConnection();
