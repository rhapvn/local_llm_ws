// Simple test script for text chunking logic
// Run with: node test-chunking.js

function createTextChunker() {
  const chunkText = (text, fileId, fileName, options = {}) => {
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

      const chunks = [];
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
}

// Test the chunking logic
function testChunking() {
  const chunker = createTextChunker();
  
  console.log("🧪 Testing text chunking logic...\n");
  
  // Test 1: Simple text with sentences
  console.log("Test 1: Simple text with sentences");
  const simpleText = "This is a test. It has multiple sentences. Each sentence should be properly chunked.";
  const simpleChunks = chunker.chunkText(simpleText, "test-1", "simple.txt");
  console.log(`Result: ${simpleChunks.length} chunks created\n`);
  
  // Test 2: Edge case that could cause infinite loop
  console.log("Test 2: Edge case with no sentence boundaries");
  const edgeCaseText = "A".repeat(1000); // 1000 'A' characters with no sentence boundaries
  const edgeChunks = chunker.chunkText(edgeCaseText, "test-2", "edge.txt");
  console.log(`Result: ${edgeChunks.length} chunks created\n`);
  
  // Test 3: Empty text
  console.log("Test 3: Empty text");
  const emptyChunks = chunker.chunkText("", "test-3", "empty.txt");
  console.log(`Result: ${emptyChunks.length} chunks created\n`);
  
  // Test 4: Very long text with minimal punctuation
  console.log("Test 4: Very long text with minimal punctuation");
  const longText = "This is a very long text " + "without much punctuation ".repeat(200);
  const longChunks = chunker.chunkText(longText, "test-4", "long.txt");
  console.log(`Result: ${longChunks.length} chunks created\n`);
  
  console.log("🎉 All tests completed!");
  return { simpleChunks, edgeChunks, emptyChunks, longChunks };
}

// Run the tests
if (require.main === module) {
  testChunking();
}

module.exports = { createTextChunker, testChunking };
