import { extractFromEntry } from "./lib/ai/extraction/extractor";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testExtraction() {
  console.log("🧪 Testing AI Extraction\n");

  const sampleEntry = `Had lunch with Sarah at Cafe Nero today. We discussed her new job at Google and my upcoming trip to Paris. The pasta was amazing - definitely coming back. After lunch, went for a run in Central Park for about 30 minutes. Feeling energized and productive!`;

  console.log("📝 Sample Entry:");
  console.log(sampleEntry);
  console.log("\n⏳ Extracting...\n");

  try {
    const result = await extractFromEntry(sampleEntry, new Date());

    console.log("✅ Extraction Successful!\n");
    console.log("📊 Results:");
    console.log("━".repeat(50));

    console.log("\n👥 Entities:");
    result.entities.forEach((entity) => {
      console.log(`  • ${entity.type}: "${entity.name}" (confidence: ${entity.confidence})`);
      console.log(`    Mentioned as: "${entity.mentionText}"`);
    });

    console.log("\n📅 Events:");
    result.events.forEach((event) => {
      console.log(`  • ${event.title} (${event.eventType})`);
      console.log(`    ${event.description}`);
      console.log(`    Confidence: ${event.confidence}`);
    });

    console.log("\n😊 Sentiment:");
    console.log(`  Overall: ${result.sentiment.overall}`);
    console.log(`  Energy: ${result.sentiment.energy}/10`);
    console.log(`  Emotions: ${result.sentiment.emotions?.join(", ") || "none"}`);

    console.log("\n🏷️  Topics:");
    console.log(`  ${result.topics.join(", ")}`);

    console.log("\n📝 Summary:");
    console.log(`  "${result.summary}"`);

    console.log("\n" + "━".repeat(50));
    console.log("\n🎉 Test Complete!\n");
  } catch (error) {
    console.error("❌ Extraction Failed:");
    console.error(error);
  }

  process.exit(0);
}

testExtraction();
