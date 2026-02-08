import { config } from "dotenv";
config({ path: ".env.local" });

import { processEntry } from "./lib/ai/process-entry";

// Use one of the failed entry IDs from the database
const ENTRY_ID = "2f7a2e76-8838-48ea-a807-36e148547131";

// You'll need to get the user ID from the database
async function test() {
  // First get the user ID from the entry
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  const { entries } = await import("./lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  const [entry] = await db.select().from(entries).where(eq(entries.id, ENTRY_ID));

  if (!entry) {
    console.error("Entry not found!");
    await client.end();
    return;
  }

  console.log(`Found entry for user: ${entry.userId}`);
  console.log(`Content: "${entry.content.substring(0, 100)}..."`);
  console.log(`Current status: ${entry.parseStatus}\n`);

  console.log("Starting extraction...\n");

  try {
    const result = await processEntry(ENTRY_ID, entry.userId);
    console.log("\n✅ Result:", result.success ? "SUCCESS" : "FAILED");
    if (result.success) {
      console.log("Entities:", result.extraction?.entities.length);
      console.log("Events:", result.extraction?.events.length);
    } else {
      console.log("Error:", result.error);
    }
  } catch (error) {
    console.error("\n❌ Caught error:", error);
  }

  await client.end();
}

test()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
