import { NextRequest, NextResponse } from "next/server";
import { createGoogleRAGService } from "@/lib/google-rag-service";

export async function POST(request: NextRequest) {
  try {
    const { action, files, fileId } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const ragService = createGoogleRAGService();

    switch (action) {
      case "addFiles":
        if (!files || !Array.isArray(files)) {
          return NextResponse.json({ error: "Files array is required" }, { status: 400 });
        }
        ragService.addFiles(files);
        return NextResponse.json({
          success: true,
          message: "Files added successfully",
          fileCount: files.length,
        });

      case "removeFile":
        if (!fileId) {
          return NextResponse.json({ error: "File ID is required" }, { status: 400 });
        }
        ragService.removeFile(fileId);
        return NextResponse.json({
          success: true,
          message: "File removed successfully",
        });

      case "clear":
        ragService.clear();
        return NextResponse.json({
          success: true,
          message: "RAG service cleared",
        });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ RAG file management failed:", error);

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
    const files = ragService.getFiles();

    return NextResponse.json({
      success: true,
      files,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ RAG files fetch failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
