import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

console.log("\n🔍 Checking environment variables...\n");

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
];

let allPresent = true;

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value || value.includes("xxx") || value.includes("[YOUR") || value.includes("...")) {
    console.log(`❌ ${envVar}: NOT SET or placeholder`);
    allPresent = false;
  } else {
    // Mask sensitive parts
    let displayValue = value;
    if (envVar.includes("KEY") || envVar.includes("SECRET")) {
      displayValue = value.substring(0, 10) + "..." + value.substring(value.length - 4);
    } else if (envVar === "DATABASE_URL") {
      // Extract hostname from DATABASE_URL
      try {
        const url = new URL(value);
        console.log(`✅ ${envVar}:`);
        console.log(`   Host: ${url.hostname}`);
        console.log(`   Database: ${url.pathname.slice(1)}`);
      } catch {
        console.log(`⚠️  ${envVar}: Invalid URL format`);
        allPresent = false;
      }
    } else {
      console.log(`✅ ${envVar}: ${displayValue}`);
    }
  }
}

console.log();

if (allPresent) {
  console.log("✅ All required environment variables are set!\n");
  console.log("Next: Run migrations with: npx tsx run-migrations.ts\n");
} else {
  console.log("❌ Some environment variables are missing or invalid.\n");
  console.log("Please check your .env.local file and fill in all values from:");
  console.log("  - Supabase Dashboard → Project Settings → API");
  console.log("  - Supabase Dashboard → Project Settings → Database\n");
}
