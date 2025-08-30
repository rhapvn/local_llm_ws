import { createTextChunker } from "./text-chunker";
import { createSearchEngine } from "./search-engine";
import type { FileInfo, Chunk, SearchResult, RAGStats, RAGDebugInfo } from "./types";

export interface RAGService {
  addFiles: (files: FileInfo[]) => void;
  removeFile: (fileId: string) => void;
  getFiles: () => FileInfo[];
  indexFiles: () => void;
  search: (query: string, topK?: number) => SearchResult[];
  getContext: (query: string, maxLength?: number) => string;
  isRAGAvailable: () => boolean;
  getStats: () => RAGStats;
  debugIndex: () => RAGDebugInfo;
  clear: () => void;
}

export const createRAGService = (): RAGService => {
  let chunks: Chunk[] = [];
  let files: FileInfo[] = [];

  const textChunker = createTextChunker();
  const searchEngine = createSearchEngine();

  const addFiles = (newFiles: FileInfo[]) => {
    // Filter out files with errors or empty content
    const validFiles = newFiles.filter((file) => !file.error && file.content && file.content.trim().length > 0);
    files = [...files, ...validFiles];
    console.log(`Added ${validFiles.length} valid files to RAG service`);
  };

  const removeFile = (fileId: string) => {
    files = files.filter((file) => file.id !== fileId);
    chunks = chunks.filter((chunk) => chunk.fileId !== fileId);
    console.log(`Removed file ${fileId} from RAG service`);
  };

  const getFiles = (): FileInfo[] => {
    return files;
  };

  const indexFiles = (): void => {
    console.log(`🚀 Starting RAG indexing process...`);
    console.log(`📁 Processing ${files.length} files...`);

    try {
      chunks = [];

      let totalChunks = 0;
      let processedFiles = 0;
      let totalCharacters = 0;
      const startTime = Date.now();
      const maxProcessingTime = 30000; // 30 seconds timeout

      for (const file of files) {
        try {
          // Check for timeout
          if (Date.now() - startTime > maxProcessingTime) {
            console.warn(`⚠️ Indexing timeout reached after ${maxProcessingTime / 1000} seconds`);
            break;
          }

          // Skip files with errors or empty content
          if (file.error || !file.content || file.content.trim().length === 0) {
            console.log(`⚠️ Skipping file ${file.name} due to error or empty content`);
            continue;
          }

          console.log(`📄 Processing file: ${file.name} (${file.characterCount.toLocaleString()} characters)`);

          // Validate file content before chunking
          if (file.content.length > 1000000) {
            // 1MB limit for text content
            console.warn(`⚠️ File ${file.name} is very large (${file.characterCount.toLocaleString()} characters), this may cause performance issues`);
          }

          const fileChunks = textChunker.chunkText(file.content, file.id, file.name);

          // Validate chunks before adding
          if (fileChunks && Array.isArray(fileChunks)) {
            chunks.push(...fileChunks);
            totalChunks += fileChunks.length;
            totalCharacters += file.characterCount;

            // Mark file as indexed
            file.indexed = true;
            processedFiles++;

            console.log(`✅ Indexed file ${file.name}: ${fileChunks.length} chunks created`);
          } else {
            console.error(`❌ Invalid chunks returned for file ${file.name}:`, fileChunks);
            file.error = "Failed to create chunks";
          }
        } catch (fileError) {
          console.error(`❌ Error processing file ${file.name}:`, fileError);
          file.error = fileError instanceof Error ? fileError.message : "Unknown error occurred";
          // Continue with other files instead of crashing
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`🎉 RAG indexing completed successfully in ${processingTime}ms!`);
      console.log(`📊 Summary: ${processedFiles} files processed, ${totalChunks} chunks created, ${totalCharacters.toLocaleString()} total characters indexed`);
      console.log(`🔍 Total chunks in memory: ${chunks.length}`);
    } catch (error) {
      console.error(`❌ Critical error during RAG indexing:`, error);
      // Reset chunks on critical error
      chunks = [];
      throw error; // Re-throw to let caller handle it
    }
  };

  const search = (query: string, topK: number = 5): SearchResult[] => {
    if (chunks.length === 0) {
      console.log("No chunks available for search");
      return [];
    }

    try {
      return searchEngine.search(chunks, query, { topK });
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  };

  const getContext = (query: string, maxLength: number = 2500): string => {
    if (!query || query.trim().length === 0) {
      console.log("Empty query provided to getContext");
      return "";
    }

    const results = search(query, 6);

    if (results.length === 0) {
      console.log("No search results found for context");
      return "";
    }

    let context = "";
    let currentLength = 0;

    for (const result of results) {
      if (currentLength + result.content.length > maxLength) {
        break;
      }

      if (context) context += "\n\n";
      context += `[From: ${result.chunk.fileName}]\n${result.content}`;
      currentLength += result.content.length;
    }

    console.log(`RAG Context retrieved: ${context.length} characters from ${results.length} chunks`);
    return context;
  };

  const isRAGAvailable = (): boolean => {
    const available = chunks.length > 0;
    console.log(`RAG availability check: ${available} (${chunks.length} chunks)`);
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

  const clear = (): void => {
    chunks = [];
    files = [];
    console.log("RAG service cleared");
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
  };
};
