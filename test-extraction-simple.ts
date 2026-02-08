import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ExtractionResultSchema } from "./lib/ai/extraction/schemas";
import {
  EXTRACTION_SYSTEM_PROMPT,
  createExtractionPrompt,
} from "./lib/ai/extraction/prompts";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testExtraction() {
  console.log("🧪 Testing AI Extraction\n");

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found in .env.local");
    console.error("\nPlease add your OpenAI API key to .env.local:");
    console.error("OPENAI_API_KEY=sk-...");
    process.exit(1);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const sampleEntry = `Had lunch with Sarah at Cafe Nero today. We discussed her new job at Google and my upcoming trip to Paris. The pasta was amazing - definitely coming back. After lunch, went for a run in Central Park for about 30 minutes. Feeling energized and productive!`;

  console.log("📝 Sample Entry:");
  console.log(sampleEntry);
  console.log("\n⏳ Extracting...\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: createExtractionPrompt(sampleEntry, new Date()),
        },
      ],
      response_format: zodResponseFormat(ExtractionResultSchema, "extraction"),
      temperature: 0.1,
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      console.error("Completion:", JSON.stringify(completion, null, 2));
      throw new Error("No message content from OpenAI");
    }

    const result = ExtractionResultSchema.parse(JSON.parse(messageContent));

    console.log("✅ Extraction Successful!\n");
    console.log("📊 Results:");
    console.log("━".repeat(50));

    console.log("\n👥 Entities:");
    result.entities.forEach((entity) => {
      console.log(`  • ${entity.type}: "${entity.name}" (confidence: ${entity.confidence.toFixed(2)})`);
      console.log(`    Mentioned as: "${entity.mentionText}"`);
    });

    console.log("\n📅 Events:");
    result.events.forEach((event) => {
      console.log(`  • ${event.title} (${event.eventType})`);
      console.log(`    ${event.description}`);
      console.log(`    Confidence: ${event.confidence.toFixed(2)}`);
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
