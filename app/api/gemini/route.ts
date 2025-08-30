import { NextRequest, NextResponse } from "next/server";
import { createGeminiClient } from "@/lib/gemini-client";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    console.log("🧪 Testing Gemini API with prompt:", prompt);

    const geminiClient = createGeminiClient();

    // Test content generation
    const startTime = Date.now();
    const response = await geminiClient.generateContent(prompt);
    const generationTime = Date.now() - startTime;

    console.log(`✅ Gemini API test successful in ${generationTime}ms`);

    return NextResponse.json({
      success: true,
      response,
      generationTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Gemini API test failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Add a GET endpoint for simple testing
export async function GET() {
  try {
    console.log("🧪 Testing Gemini API connection...");

    const geminiClient = createGeminiClient();

    // Test with a simple prompt
    const startTime = Date.now();
    const response = await geminiClient.generateContent('Hello, this is a test. Please respond with "API is working" if you can see this message.');
    const generationTime = Date.now() - startTime;

    console.log(`✅ Gemini API connection test successful in ${generationTime}ms`);

    return NextResponse.json({
      success: true,
      response,
      generationTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Gemini API connection test failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
