import type { Chunk } from "./types";

export interface ChunkingOptions {
  chunkSize?: number;
  overlap?: number;
}

export const createTextChunker = () => {
  const chunkText = (text: string, fileId: string, fileName: string, options: ChunkingOptions = {}): Chunk[] => {
    try {
      const { chunkSize = 800, overlap: initialOverlap = 150 } = options;
      let overlap = initialOverlap;

      if (!text || text.trim().length === 0) {
        console.warn(`⚠️ Empty text content for file ${fileName}`);
        return [];
      }

      // Validate input parameters
      if (chunkSize <= 0 || overlap < 0) {
        console.error(`❌ Invalid chunking parameters: chunkSize=${chunkSize}, overlap=${overlap}`);
        return [];
      }

      if (overlap >= chunkSize) {
        console.warn(`⚠️ Overlap (${overlap}) should be less than chunkSize (${chunkSize}), adjusting overlap`);
        overlap = Math.floor(chunkSize * 0.2); // Set overlap to 20% of chunk size
      }

      console.log(`✂️ Chunking file ${fileName}: ${text.length.toLocaleString()} characters into chunks of ~${chunkSize} characters`);

      const chunks: Chunk[] = [];
      let startIndex = 0;
      let chunkCount = 0;
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

        if (chunkContent.length > 50) {
          // Only add chunks with meaningful content
          chunks.push({
            id: `${fileId}-${startIndex}`,
            content: chunkContent,
            fileId,
            fileName,
            startIndex,
            endIndex: actualEndIndex,
          });
          chunkCount++;
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
      }

      // Safety check for infinite loop
      if (iterationCount >= maxIterations) {
        console.error(`❌ Maximum chunking iterations (${maxIterations}) reached for file ${fileName}. This may indicate an infinite loop.`);
        // Return what we have so far
        return chunks;
      }

      console.log(`✅ Created ${chunkCount} chunks for ${fileName} (average size: ${Math.round(text.length / chunkCount).toLocaleString()} characters)`);
      return chunks;
    } catch (error) {
      console.error(`Error chunking text for file ${fileName}:`, error);
      return [];
    }
  };

  return { chunkText };
};

// Test function to verify chunking logic
export const testChunking = () => {
  const chunker = createTextChunker();

  // Test with simple text
  const simpleText = "This is a test. It has multiple sentences. Each sentence should be properly chunked.";
  const simpleChunks = chunker.chunkText(simpleText, "test-1", "simple.txt");
  console.log("Simple text chunks:", simpleChunks.length);

  // Test with edge case that could cause infinite loop
  const edgeCaseText = "A".repeat(1000); // 1000 'A' characters with no sentence boundaries
  const edgeChunks = chunker.chunkText(edgeCaseText, "test-2", "edge.txt");
  console.log("Edge case chunks:", edgeChunks.length);

  // Test with empty text
  const emptyChunks = chunker.chunkText("", "test-3", "empty.txt");
  console.log("Empty text chunks:", emptyChunks.length);

  return { simpleChunks, edgeChunks, emptyChunks };
};
