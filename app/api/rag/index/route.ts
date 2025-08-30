import { NextRequest, NextResponse } from "next/server";
import { createGoogleRAGService } from "@/lib/google-rag-service";

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Files array is required" }, { status: 400 });
    }

    console.log("🚀 RAG indexing request:", { fileCount: files.length });

    const ragService = createGoogleRAGService();

    // Add files to the service
    ragService.addFiles(files);

    // Index the files
    await ragService.indexFiles();

    // Get stats
    const stats = ragService.getStats();
    const isAvailable = ragService.isRAGAvailable();

    console.log(`✅ RAG indexing completed:`, stats);

    return NextResponse.json({
      success: true,
      message: "Files indexed successfully",
      stats,
      isAvailable,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ RAG indexing failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ragService = createGoogleRAGService();
    const stats = ragService.getStats();
    const isAvailable = ragService.isRAGAvailable();

    return NextResponse.json({
      success: true,
      stats,
      isAvailable,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ RAG stats failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
