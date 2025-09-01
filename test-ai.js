// free-ai-test.js
require("dotenv").config();
const axios = require("axios");

console.log("Testing Google AI API free tier models...");
console.log("API Key exists:", !!process.env.GOOGLE_AI_API_KEY);

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("ERROR: GOOGLE_AI_API_KEY not found");
  process.exit(1);
}

// Free tier models that typically have better availability
const FREE_MODELS = [
  "models/gemini-1.5-flash",
  "models/gemini-1.5-flash-8b",
  "models/gemini-1.5-flash-8b-001",
];

async function testWithModel(modelName, prompt) {
  try {
    console.log(`\n--- Testing ${modelName} ---`);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 100, // Keep responses short
          temperature: 0.3, // More deterministic responses
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const answer = response.data.candidates[0].content.parts[0].text;
    console.log("✓ Success:", answer.trim());
    return true;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log("✗ Rate limited - try again later");
    } else {
      console.log(
        "✗ Error:",
        error.response?.data?.error?.message || error.message
      );
    }
    return false;
  }
}

async function testFreeTier() {
  console.log("Testing free tier models (may take a moment)...");

  const simplePrompt = "What is 2+2? Answer in one word.";

  for (const model of FREE_MODELS) {
    const success = await testWithModel(model, simplePrompt);

    // If we succeed with one model, no need to test others
    if (success) {
      console.log(`\n🎉 Successfully used ${model} in free tier!`);

      // Test a slightly more complex query
      console.log("\nTesting a follow-up question...");
      await testWithModel(
        model,
        "Explain photosynthesis very briefly in 2 sentences."
      );
      break;
    }

    // Wait a bit between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// If all models are rate limited, suggest alternatives
function showFreeTierTips() {
  console.log(`
📋 FREE TIER USAGE TIPS:

1. 🕐 Time your requests - Free tier has daily and per-minute limits
2. 🔄 Space out requests - Wait a few seconds between calls
3. 📉 Use simpler models - Flash models have better availability than Pro
4. ✂️ Keep it short - Use fewer tokens with brief prompts and maxOutputTokens
5. 📊 Monitor usage - Check your quotas in Google Cloud Console

Best practices:
- Use 'gemini-1.5-flash' for most free tier tasks
- Set maxOutputTokens to 100-200 for short responses
- Avoid rapid successive requests
- Try again later if you hit limits (quotas reset daily)
`);
}

// Run the test
testFreeTier()
  .then(() => {
    showFreeTierTips();
  })
  .catch((error) => {
    console.error("Unexpected error:", error.message);
  });
