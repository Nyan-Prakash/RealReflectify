import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { entries } from "./lib/db/schema";

async function checkEntries() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("🔍 Checking entries...\n");

  // Get all entries
  const allEntries = await db.select().from(entries);

  console.log(`Found ${allEntries.length} entries total\n`);

  if (allEntries.length === 0) {
    console.log("No entries found!");
    await client.end();
    return;
  }

  // Group by parse status
  const byStatus: Record<string, typeof allEntries> = {};
  allEntries.forEach((entry) => {
    const status = entry.parseStatus || "null";
    if (!byStatus[status]) {
      byStatus[status] = [];
    }
    byStatus[status].push(entry);
  });

  console.log("Entries by parse status:");
  Object.keys(byStatus).forEach((status) => {
    console.log(`  ${status}: ${byStatus[status].length}`);
  });
  console.log();

  // Show failed entries
  const failed = byStatus.failed || [];
  if (failed.length > 0) {
    console.log(`\n❌ Failed entries (${failed.length}):\n`);
    failed.forEach((entry) => {
      console.log(`ID: ${entry.id}`);
      console.log(`Content: "${entry.content.substring(0, 100)}..."`);
      console.log(`Created: ${entry.createdAt}`);
      console.log(`Last parsed: ${entry.lastParsedAt}`);
      console.log("─".repeat(60));
    });
  }

  await client.end();
}

checkEntries()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
