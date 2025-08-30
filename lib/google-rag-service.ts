import type { FileInfo, Chunk, SearchResult, RAGStats, RAGDebugInfo } from "./types";
import { createGeminiClient } from "./gemini-client";
import { createRAGSearchService } from "./rag-search";
import { createRAGFileManager } from "./rag-file-manager";
import { RAGPersistenceService } from "./rag-persistence";

// Re-export FileInfo for compatibility
export type { FileInfo, Chunk, SearchResult, RAGStats, RAGDebugInfo };

export interface GoogleRAGService {
  addFiles: (files: FileInfo[]) => void;
  removeFile: (fileId: string) => void;
  getFiles: () => FileInfo[];
  indexFiles: () => Promise<void>;
  search: (query: string, topK?: number) => Promise<SearchResult[]>;
  getContext: (query: string, maxLength?: number) => Promise<string>;
  isRAGAvailable: () => boolean;
  getStats: () => RAGStats;
  debugIndex: () => RAGDebugInfo;
  clear: () => void;
  ragAnswer: (query: string) => Promise<{ answer: string; context: string }>;
}

export const createGoogleRAGService = (): GoogleRAGService => {
  console.log("🆕 Creating Google RAG service instance");

  // Get persistence service instance
  const persistenceService = RAGPersistenceService.getInstance();

  // Get data from persistence
  let chunks = persistenceService.getChunks();
  let embeddings = persistenceService.getEmbeddings();

  // Memory management constants
  const MAX_CHUNKS_IN_MEMORY = 8000; // Limit chunks to prevent memory issues
  const MAX_EMBEDDINGS_IN_MEMORY = 4000; // Limit embeddings to prevent memory issues

  const geminiClient = createGeminiClient();
  const searchService = createRAGSearchService();
  const fileManager = createRAGFileManager();

  const addFiles = (newFiles: FileInfo[]) => {
    // Check memory limits before adding files
    const currentTotalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
    const newTotalChars = newFiles.reduce((sum, f) => sum + f.characterCount, 0);

    if (currentTotalChars + newTotalChars > 5000000) {
      // 5MB limit
      console.warn(`⚠️ Memory limit reached: Cannot add files with ${newTotalChars.toLocaleString()} characters`);
      return;
    }

    // Debug: Log file details
    console.log(`🔍 Adding ${newFiles.length} files to RAG service:`);
    newFiles.forEach((file, index) => {
      console.log(`  File ${index + 1}: ${file.name} (${file.characterCount} chars, content preview: "${file.content.substring(0, 100)}...")`);
    });

    fileManager.addFiles(newFiles);
    // Also add to persistence service
    persistenceService.addFiles(newFiles);
  };

  const removeFile = (fileId: string) => {
    fileManager.removeFile(fileId);
    // Remove related chunks and embeddings
    chunks = chunks.filter((c) => c.fileId !== fileId);
    embeddings = embeddings.filter((_, index) => {
      const chunk = chunks[index];
      return chunk && chunk.fileId !== fileId;
    });

    // Update persistence
    persistenceService.setChunks(chunks);
    persistenceService.setEmbeddings(embeddings);

    console.log(`File ${fileId} removed from RAG service`);
  };

  const getFiles = (): FileInfo[] => {
    // Use persistence service for files
    return persistenceService.getFiles();
  };

  const indexFiles = async (): Promise<void> => {
    try {
      console.log(`🚀 Starting Google RAG indexing process...`);
      const startTime = Date.now();
      const timeoutMs = 90000; // 90 second timeout

      // Clear previous data to free memory
      chunks = [];
      embeddings = [];

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log(`📁 Calling fileManager.indexFiles()...`);
      const { chunks: newChunks } = await fileManager.indexFiles();
      console.log(`✅ File manager indexing completed, got ${newChunks.length} chunks`);

      // Debug: Check if chunks are empty
      if (newChunks.length === 0) {
        console.warn(`⚠️ WARNING: No chunks created during indexing!`);
        const files = fileManager.getFiles();
        console.log(`📁 Files in manager: ${files.length}`);
        files.forEach((file, index) => {
          console.log(`  File ${index + 1}: ${file.name} (${file.characterCount} chars, indexed: ${file.indexed}, error: ${file.error || "none"})`);
        });
      }

      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error("Indexing timeout - file processing took too long");
      }

      // Check memory limits
      if (newChunks.length > MAX_CHUNKS_IN_MEMORY) {
        console.warn(`⚠️ Too many chunks (${newChunks.length}), limiting to ${MAX_CHUNKS_IN_MEMORY}`);
        chunks = newChunks.slice(0, MAX_CHUNKS_IN_MEMORY);
      } else {
        chunks = newChunks;
      }

      // Generate embeddings for chunks in batches
      if (chunks.length > 0) {
        console.log(`🔍 Generating embeddings for ${chunks.length} chunks...`);

        // Process chunks in smaller batches to prevent memory spikes
        const batchSize = 100;
        const allEmbeddings: number[][] = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
          // Check timeout before each batch
          if (Date.now() - startTime > timeoutMs) {
            throw new Error("Indexing timeout - embedding generation took too long");
          }

          const batch = chunks.slice(i, i + batchSize);
          const chunkTexts = batch.map((chunk) => chunk.content);

          console.log(`📝 Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);

          try {
            const batchEmbeddings = await geminiClient.embedMultiple(chunkTexts);
            allEmbeddings.push(...batchEmbeddings);

            // Check memory limits
            if (allEmbeddings.length > MAX_EMBEDDINGS_IN_MEMORY) {
              console.warn(`⚠️ Memory limit reached during embedding generation, stopping at ${allEmbeddings.length} embeddings`);
              break;
            }

            // Yield control to prevent blocking
            await new Promise((resolve) => setTimeout(resolve, 0));
          } catch (error) {
            console.error(`Failed to generate embeddings for batch ${Math.floor(i / batchSize) + 1}:`, error);
            // Continue with next batch
          }
        }

        embeddings = allEmbeddings;
        console.log(`✅ Generated ${embeddings.length} embeddings`);
      }

      // Update persistence
      persistenceService.setChunks(chunks);
      persistenceService.setEmbeddings(embeddings);

      // Force garbage collection after processing
      if (global.gc) {
        global.gc();
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Google RAG indexing completed in ${totalTime}ms`);
    } catch (error) {
      console.error("Indexing failed:", error);
      // Clear data on error to free memory
      chunks = [];
      embeddings = [];
      persistenceService.setChunks(chunks);
      persistenceService.setEmbeddings(embeddings);
      throw error;
    }
  };

  const search = async (query: string, topK: number = 5): Promise<SearchResult[]> => {
    if (embeddings.length === 0 || chunks.length === 0) {
      console.log("No embeddings available for semantic search");
      return [];
    }

    try {
      // Generate query embedding
      console.log(`🔍 Generating query embedding for: "${query}"`);
      const queryEmbedding = await geminiClient.embedContent(query);

      // Use search service with query embedding
      return await searchService.search(query, queryEmbedding, chunks, embeddings, topK);
    } catch (error) {
      console.error("Semantic search failed:", error);
      return [];
    }
  };

  const getContext = async (query: string, maxLength: number = 3000): Promise<string> => {
    if (!query || query.trim().length === 0) {
      console.log("Empty query provided to getContext");
      return "";
    }

    try {
      // Generate query embedding for context retrieval
      const queryEmbedding = await geminiClient.embedContent(query);
      return await searchService.getContext(query, queryEmbedding, chunks, embeddings, maxLength);
    } catch (error) {
      console.error("Failed to get context:", error);
      return "";
    }
  };

  const isRAGAvailable = (): boolean => {
    const available = chunks.length > 0 && embeddings.length > 0;
    console.log(`Google RAG availability check: ${available} (${chunks.length} chunks, ${embeddings.length} embeddings)`);
    return available;
  };

  const getStats = (): RAGStats => {
    const files = persistenceService.getFiles();
    return {
      totalFiles: files.length,
      indexedFiles: files.filter((f) => f.indexed).length,
      totalChunks: chunks.length,
      totalCharacters: files.reduce((sum, f) => sum + f.characterCount, 0),
    };
  };

  const debugIndex = (): RAGDebugInfo => {
    const files = persistenceService.getFiles();
    console.log(`🔍 Debug index info: chunks=${chunks.length}, embeddings=${embeddings.length}`);
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

  const clear = (): void => {
    chunks = [];
    embeddings = [];
    // Update persistence
    persistenceService.setChunks(chunks);
    persistenceService.setEmbeddings(embeddings);
    fileManager.clear();
    geminiClient.clearMemory();
    console.log("Google RAG service cleared");
  };

  // RAG answer generation using Google Gemini
  const ragAnswer = async (query: string): Promise<{ answer: string; context: string }> => {
    try {
      if (!isRAGAvailable()) {
        throw new Error("Google RAG not available - no indexed content");
      }

      // Get relevant context
      const context = await getContext(query, 3000);
      if (!context) {
        throw new Error("No relevant context found");
      }

      // Build prompt similar to sampleRAG.py
      const prompt = `あなたは検索強化されたアシスタントです。以下のコンテキストの内容に基づいて日本語で答えてください。コンテキストに無い場合は「不明です」と述べてください。引用は [1], [2] のように付けてください。

# コンテキスト
${context}

# 質問
${query}

# 回答（日本語・必要に応じて [1], [2] で出典を明示）`;

      // Generate answer using Gemini
      const answer = await geminiClient.generateContent(prompt);

      return { answer, context };
    } catch (error) {
      console.error("Google RAG answer generation failed:", error);
      throw error;
    }
  };

  const instance: GoogleRAGService = {
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

  return instance;
};
