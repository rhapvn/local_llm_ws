import type { FileInfo, Chunk, SearchResult, RAGStats, RAGDebugInfo } from "./types";

export interface ClientRAGService {
  addFiles: (files: FileInfo[]) => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  getFiles: () => FileInfo[];
  indexFiles: () => Promise<void>;
  search: (query: string, topK?: number) => Promise<SearchResult[]>;
  getContext: (query: string, maxLength?: number) => Promise<string>;
  isRAGAvailable: () => boolean;
  getStats: () => RAGStats;
  debugIndex: () => RAGDebugInfo;
  clear: () => Promise<void>;
  ragAnswer: (query: string) => Promise<{ answer: string; context: string }>;
}

export const createClientRAGService = (): ClientRAGService => {
  let files: FileInfo[] = [];
  let chunks: Chunk[] = [];
  let embeddings: number[][] = [];
  let isIndexed = false;

  const addFiles = async (newFiles: FileInfo[]): Promise<void> => {
    try {
      const response = await fetch("/api/rag/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "addFiles",
          files: newFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      files = [...files, ...newFiles];
      console.log(`✅ Added ${newFiles.length} files to RAG service`);
    } catch (error) {
      console.error("Failed to add files:", error);
      throw error;
    }
  };

  const removeFile = async (fileId: string): Promise<void> => {
    try {
      const response = await fetch("/api/rag/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "removeFile",
          fileId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      files = files.filter((f) => f.id !== fileId);
      console.log(`✅ Removed file ${fileId} from RAG service`);
    } catch (error) {
      console.error("Failed to remove file:", error);
      throw error;
    }
  };

  const getFiles = (): FileInfo[] => {
    return files;
  };

  const indexFiles = async (): Promise<void> => {
    try {
      console.log("🚀 Starting RAG indexing via API...");

      const response = await fetch("/api/rag/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ RAG indexing completed:", data);

      isIndexed = true;

      // Update file status
      files = files.map((file) => ({ ...file, indexed: true }));
    } catch (error) {
      console.error("RAG indexing failed:", error);
      throw error;
    }
  };

  const search = async (query: string, topK: number = 5): Promise<SearchResult[]> => {
    console.log(`🔍 Client RAG search called with query: "${query}", topK: ${topK}`);
    console.log(`🔍 Search state: isIndexed=${isIndexed}, files.length=${files.length}`);

    if (!isIndexed || files.length === 0) {
      console.log("❌ No indexed content available for search");
      return [];
    }

    try {
      console.log("📡 Making search request to /api/rag...");
      const response = await fetch("/api/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, topK }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ RAG search API error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ RAG search API response:", data);

      // Convert the API response to SearchResult format
      const results = data.searchResults.map((result: any, index: number) => ({
        chunk: {
          id: `chunk-${index}`,
          fileId: `file-${index}`,
          fileName: result.fileName,
          content: result.content,
          chunkIndex: index,
        },
        content: result.content,
        score: result.score,
      }));

      console.log(`🔍 Converted ${results.length} search results:`, results);
      return results;
    } catch (error) {
      console.error("❌ RAG search failed:", error);
      return [];
    }
  };

  const getContext = async (query: string, maxLength: number = 3000): Promise<string> => {
    console.log(`🔍 Client RAG getContext called with query: "${query}", maxLength: ${maxLength}`);
    console.log(`🔍 Context state: isIndexed=${isIndexed}, files.length=${files.length}`);

    if (!isIndexed || files.length === 0) {
      console.log("❌ No indexed content available for context retrieval");
      return "";
    }

    try {
      console.log("📡 Making context request to /api/rag...");
      const response = await fetch("/api/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, topK: 3 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ RAG context API error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ RAG context API response:", data);

      const context = data.context || "";
      console.log(`🔍 Retrieved context: ${context.length} characters`);
      return context;
    } catch (error) {
      console.error("❌ Failed to get context:", error);
      return "";
    }
  };

  const isRAGAvailable = (): boolean => {
    const available = isIndexed && files.length > 0;
    console.log(`🔍 Client RAG availability check:`, {
      isIndexed,
      filesLength: files.length,
      available,
      files: files.map((f) => ({ id: f.id, name: f.name, indexed: f.indexed, error: f.error })),
    });
    return available;
  };

  const getStats = (): RAGStats => {
    return {
      totalFiles: files.length,
      indexedFiles: files.filter((f) => f.indexed).length,
      totalChunks: chunks.length,
      totalCharacters: files.reduce((sum, f) => sum + f.characterCount, 0),
    };
  };

  const debugIndex = (): RAGDebugInfo => {
    return {
      chunks: chunks.map((c) => ({
        id: c.id,
        fileName: c.fileName,
        contentLength: c.content.length,
        contentPreview: c.content.substring(0, 100) + "...",
      })),
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        indexed: f.indexed,
        error: f.error,
        contentLength: f.content.length,
      })),
    };
  };

  const clear = async (): Promise<void> => {
    try {
      const response = await fetch("/api/rag/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "clear",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      files = [];
      chunks = [];
      embeddings = [];
      isIndexed = false;
      console.log("✅ RAG service cleared");
    } catch (error) {
      console.error("Failed to clear RAG service:", error);
      throw error;
    }
  };

  const ragAnswer = async (query: string): Promise<{ answer: string; context: string }> => {
    if (!isRAGAvailable()) {
      throw new Error("RAG not available - no indexed content");
    }

    const context = await getContext(query, 3000);
    if (!context) {
      throw new Error("No relevant context found");
    }

    // For now, return the context as the answer
    // In a full implementation, you might want to call the Gemini API here
    return {
      answer: `Based on the provided context: ${context.substring(0, 200)}...`,
      context,
    };
  };

  return {
    addFiles,
    removeFile,
    getFiles,
    indexFiles,
    search,
    getContext,
    isRAGAvailable,
    getStats,
    debugIndex,
    clear,
    ragAnswer,
  };
};
