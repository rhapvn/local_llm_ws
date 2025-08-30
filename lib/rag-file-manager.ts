import type { FileInfo, Chunk } from "./types";
import { createTextChunker } from "./text-chunker";

export interface RAGFileManager {
  addFiles: (files: FileInfo[]) => void;
  removeFile: (fileId: string) => void;
  getFiles: () => FileInfo[];
  indexFiles: () => Promise<{ chunks: Chunk[]; totalChunks: number; totalCharacters: number }>;
  clear: () => void;
}

export const createRAGFileManager = (): RAGFileManager => {
  let chunks: Chunk[] = [];
  let files: FileInfo[] = [];
  const textChunker = createTextChunker();

  // Memory management constants
  const MAX_CHUNKS_IN_MEMORY = 10000; // Limit total chunks in memory
  const MAX_FILE_SIZE = 500000; // 500KB max file size
  const MAX_TOTAL_CHARS = 10000000; // 10MB total character limit
  const CHUNK_BATCH_SIZE = 100; // Process chunks in batches

  const addFiles = (newFiles: FileInfo[]) => {
    // Filter out files with errors or empty content
    const validFiles = newFiles.filter((file) => !file.error && file.content && file.content.trim().length > 0);

    // Debug: Log file details
    console.log(`🔍 File manager addFiles: ${newFiles.length} files received, ${validFiles.length} valid files`);
    newFiles.forEach((file, index) => {
      console.log(`  File ${index + 1}: ${file.name} (${file.characterCount} chars, error: ${file.error || "none"}, content preview: "${file.content.substring(0, 100)}...")`);
    });

    // Check memory limits before adding files
    const currentTotalChars = files.reduce((sum, f) => sum + f.characterCount, 0);
    const newTotalChars = validFiles.reduce((sum, f) => sum + f.characterCount, 0);

    if (currentTotalChars + newTotalChars > MAX_TOTAL_CHARS) {
      console.warn(`⚠️ Memory limit reached: Cannot add ${validFiles.length} files (${newTotalChars.toLocaleString()} chars). Current: ${currentTotalChars.toLocaleString()}, Limit: ${MAX_TOTAL_CHARS.toLocaleString()}`);
      return;
    }

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

  const indexFiles = async (): Promise<{ chunks: Chunk[]; totalChunks: number; totalCharacters: number }> => {
    console.log(`🚀 Starting RAG indexing process...`);
    console.log(`📁 Processing ${files.length} files...`);

    try {
      // Clear previous chunks to free memory
      chunks = [];

      // Force garbage collection hint (if available)
      if (global.gc) {
        global.gc();
      }

      let totalChunks = 0;
      let processedFiles = 0;
      let totalCharacters = 0;
      const startTime = Date.now();
      const maxProcessingTime = 60000; // 60 seconds timeout

      // Process files in smaller batches to prevent memory spikes
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        // Check for timeout
        if (Date.now() - startTime > maxProcessingTime) {
          console.warn(`⚠️ Indexing timeout reached after ${maxProcessingTime / 1000} seconds`);
          break;
        }

        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);

        // Process batch
        for (const file of batch) {
          try {
            // Skip files with errors or empty content
            if (file.error || !file.content || file.content.trim().length === 0) {
              console.log(`⚠️ Skipping file ${file.name} due to error or empty content`);
              continue;
            }

            // Check file size limits
            if (file.content.length > MAX_FILE_SIZE) {
              console.warn(`⚠️ File ${file.name} exceeds size limit (${file.characterCount.toLocaleString()} chars > ${MAX_FILE_SIZE.toLocaleString()}), skipping`);
              file.error = "File too large for processing";
              continue;
            }

            console.log(`📄 Processing file: ${file.name} (${file.characterCount.toLocaleString()} characters)`);

            // Process file in chunks with memory management
            const fileChunks = await processFileInBatches(file);
            console.log(`🔍 File ${file.name}: processFileInBatches returned ${fileChunks ? fileChunks.length : "null"} chunks`);

            if (fileChunks && Array.isArray(fileChunks)) {
              // Check memory limits before adding chunks
              if (chunks.length + fileChunks.length > MAX_CHUNKS_IN_MEMORY) {
                console.warn(`⚠️ Memory limit reached: Cannot add ${fileChunks.length} chunks. Current: ${chunks.length}, Limit: ${MAX_CHUNKS_IN_MEMORY}`);
                file.error = "Memory limit reached during processing";
                continue;
              }

              chunks.push(...fileChunks);
              totalChunks += fileChunks.length;
              totalCharacters += file.characterCount;

              // Mark file as indexed
              file.indexed = true;
              processedFiles++;

              console.log(`✅ Indexed file ${file.name}: ${fileChunks.length} chunks created`);

              // Yield control to prevent blocking
              await new Promise((resolve) => setTimeout(resolve, 0));
            } else {
              console.error(`❌ Invalid chunks returned for file ${file.name}:`, fileChunks);
              file.error = "Failed to create chunks";
            }
          } catch (fileError) {
            console.error(`❌ Error processing file ${file.name}:`, fileError);
            file.error = fileError instanceof Error ? fileError.message : "Unknown error occurred";
          }
        }

        // Force garbage collection between batches
        if (global.gc) {
          global.gc();
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`🎉 RAG indexing completed successfully in ${processingTime}ms!`);
      console.log(`📊 Summary: ${processedFiles} files processed, ${totalChunks} chunks created, ${totalCharacters.toLocaleString()} total characters indexed`);
      console.log(`🔍 Total chunks in memory: ${chunks.length}`);

      return { chunks, totalChunks, totalCharacters };
    } catch (error) {
      console.error(`❌ Critical error during RAG indexing:`, error);
      // Reset chunks on critical error
      chunks = [];
      throw error;
    }
  };

  // Helper function to process large files in batches
  const processFileInBatches = async (file: FileInfo): Promise<Chunk[]> => {
    const allChunks: Chunk[] = [];
    const text = file.content;
    const chunkSize = 800;
    const overlap = 150;

    console.log(`🔍 Starting chunking for file ${file.name}: ${text.length} characters, chunkSize=${chunkSize}, overlap=${overlap}`);

    let startIndex = 0;
    let maxIterations = Math.ceil(text.length / (chunkSize - overlap)) + 100; // Safety limit
    let iterationCount = 0;

    while (startIndex < text.length && iterationCount < maxIterations) {
      iterationCount++;

      const endIndex = Math.min(startIndex + chunkSize, text.length);

      // Try to break at sentence boundaries
      let actualEndIndex = endIndex;
      if (endIndex < text.length) {
        const nextPeriod = text.indexOf(".", endIndex - 100);
        const nextQuestion = text.indexOf("?", endIndex - 100);
        const nextExclamation = text.indexOf("!", endIndex - 100);
        const nextNewline = text.indexOf("\n", endIndex - 100);

        if (nextPeriod !== -1 && nextPeriod < endIndex + 100) {
          actualEndIndex = nextPeriod + 1;
        } else if (nextQuestion !== -1 && nextQuestion < endIndex + 100) {
          actualEndIndex = nextQuestion + 1;
        } else if (nextExclamation !== -1 && nextExclamation < endIndex + 100) {
          actualEndIndex = nextExclamation + 1;
        } else if (nextNewline !== -1 && nextNewline < endIndex + 100) {
          actualEndIndex = nextNewline + 1;
        }
      }

      const chunkContent = text.slice(startIndex, actualEndIndex).trim();

      if (iterationCount <= 3) {
        // Only log first few iterations to avoid spam
        console.log(`  Iteration ${iterationCount}: startIndex=${startIndex}, endIndex=${endIndex}, actualEndIndex=${actualEndIndex}, chunkLength=${chunkContent.length}`);
      }

      if (chunkContent.length > 50) {
        allChunks.push({
          id: `${file.id}-${startIndex}`,
          content: chunkContent,
          fileId: file.id,
          fileName: file.name,
          startIndex,
          endIndex: actualEndIndex,
        });
      }

      // Safety check: ensure we're making progress
      const newStartIndex = actualEndIndex - overlap;
      if (newStartIndex <= startIndex) {
        console.warn(`⚠️ No progress made in chunking, forcing advance. startIndex: ${startIndex}, newStartIndex: ${newStartIndex}`);
        startIndex = actualEndIndex; // Force advance to prevent infinite loop
      } else {
        startIndex = newStartIndex;
      }

      if (startIndex >= text.length) break;

      // Yield control every 10 chunks to prevent blocking
      if (allChunks.length % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Safety check for infinite loop
    if (iterationCount >= maxIterations) {
      console.error(`❌ Maximum chunking iterations (${maxIterations}) reached for file ${file.name}. This may indicate an infinite loop.`);
      // Return what we have so far
      return allChunks;
    }

    console.log(`🔍 Chunking completed for file ${file.name}: ${allChunks.length} chunks created in ${iterationCount} iterations`);
    return allChunks;
  };

  const clear = (): void => {
    chunks = [];
    files = [];
    console.log("RAG file manager cleared");

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  };

  return {
    addFiles,
    removeFile,
    getFiles,
    indexFiles,
    clear,
  };
};
