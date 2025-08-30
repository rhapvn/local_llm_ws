import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return NextResponse.json(
        {
          error: "Gemini API key not configured. Please create a .env.local file with GEMINI_API_KEY=your_key_here",
        },
        { status: 500 }
      );
    }

    console.log("Making request to Gemini API with message:", message.substring(0, 100) + "...");

    // Call Google Gemini API
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Gemini API response received successfully");

    // Extract the response text from Gemini API response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

    return NextResponse.json({
      response: responseText,
      model: "gemini-2.0-flash",
      done: true,
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json({ error: `Failed to get response from Gemini API: ${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 });
  }
}
