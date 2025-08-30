import { NextRequest, NextResponse } from "next/server";
import { createGoogleRAGService } from "@/lib/google-rag-service";

export async function POST(request: NextRequest) {
  try {
    const { query, topK = 5 } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("🔍 RAG search request:", { query, topK });

    // Check environment variable
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY environment variable not set");
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY environment variable not set",
          searchResults: [],
          context: "",
        },
        { status: 500 }
      );
    }
    console.log("✅ GEMINI_API_KEY environment variable is set");

    const ragService = createGoogleRAGService();

    // Check if RAG is available
    console.log("🔍 Checking RAG availability...");
    const isAvailable = await ragService.isRAGAvailable();
    console.log("🔍 RAG availability result:", isAvailable);

    if (!isAvailable) {
      console.log("❌ RAG not available - no indexed content");
      console.log("🔍 RAG service stats:", ragService.getStats());
      console.log("🔍 RAG debug info:", ragService.debugIndex());

      return NextResponse.json({
        error: "RAG not available - no indexed content",
        searchResults: [],
        context: "",
      });
    }

    // Perform search
    console.log("🔍 Performing RAG search...");
    const searchResults = await ragService.search(query, topK);
    console.log("🔍 Search results:", searchResults);

    // Get context
    console.log("🔍 Getting RAG context...");
    const context = await ragService.getContext(query);
    console.log("🔍 Context retrieved:", context.length, "characters");

    console.log(`✅ RAG search completed: ${searchResults.length} results`);

    return NextResponse.json({
      success: true,
      searchResults: searchResults.map((result) => ({
        fileName: result.chunk.fileName,
        content: result.content,
        score: result.score,
      })),
      context,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ RAG search failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        searchResults: [],
        context: "",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
