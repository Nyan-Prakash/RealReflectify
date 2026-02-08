import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./lib/db/client";
import { parseRuns, entries } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function checkFailures() {
  console.log("🔍 Checking for failed parse runs...\n");

  // Get all parse runs
  const runs = await db.select().from(parseRuns);

  console.log(`Found ${runs.length} parse runs total\n`);

  const failed = runs.filter((r) => r.status === "failed");

  if (failed.length === 0) {
    console.log("✅ No failed parse runs!");
    return;
  }

  console.log(`❌ Found ${failed.length} failed parse runs:\n`);

  for (const run of failed) {
    console.log(`Run ID: ${run.id}`);
    console.log(`Entry ID: ${run.entryId}`);
    console.log(`Status: ${run.status}`);
    console.log(`Model: ${run.model}`);
    console.log(`Error: ${run.errorMessage || "No error message"}`);
    console.log(`Started: ${run.startedAt}`);
    console.log(`Completed: ${run.completedAt}`);

    // Get the entry content
    const [entry] = await db
      .select()
      .from(entries)
      .where(eq(entries.id, run.entryId));

    if (entry) {
      console.log(`Entry content: "${entry.content.substring(0, 100)}..."`);
    }

    console.log("─".repeat(60));
    console.log();
  }
}

checkFailures()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
