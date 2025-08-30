import type { Chunk } from "./types"

export interface ChunkingOptions {
  chunkSize?: number
  overlap?: number
}

export const createTextChunker = () => {
  const chunkText = (
    text: string, 
    fileId: string, 
    fileName: string, 
    options: ChunkingOptions = {}
  ): Chunk[] => {
    const { chunkSize = 800, overlap = 150 } = options
    
    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ Empty text content for file ${fileName}`)
      return []
    }

    console.log(`✂️ Chunking file ${fileName}: ${text.length.toLocaleString()} characters into chunks of ~${chunkSize} characters`)

    const chunks: Chunk[] = []
    let startIndex = 0
    let chunkCount = 0

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length)

      // Try to break at sentence boundaries
      let actualEndIndex = endIndex
      if (endIndex < text.length) {
        const nextPeriod = text.indexOf(".", endIndex - 100)
        const nextQuestion = text.indexOf("?", endIndex - 100)
        const nextExclamation = text.indexOf("!", endIndex - 100)
        const nextNewline = text.indexOf("\n", endIndex - 100)

        if (nextPeriod !== -1 && nextPeriod < endIndex + 100) {
          actualEndIndex = nextPeriod + 1
        } else if (nextQuestion !== -1 && nextQuestion < endIndex + 100) {
          actualEndIndex = nextQuestion + 1
        } else if (nextExclamation !== -1 && nextExclamation < endIndex + 100) {
          actualEndIndex = nextExclamation + 1
        } else if (nextNewline !== -1 && nextNewline < endIndex + 100) {
          actualEndIndex = nextNewline + 1
        }
      }

      const chunkContent = text.slice(startIndex, actualEndIndex).trim()

      if (chunkContent.length > 50) {
        // Only add chunks with meaningful content
        chunks.push({
          id: `${fileId}-${startIndex}`,
          content: chunkContent,
          fileId,
          fileName,
          startIndex,
          endIndex: actualEndIndex,
        })
        chunkCount++
      }

      startIndex = actualEndIndex - overlap
      if (startIndex >= text.length) break
    }

    console.log(`✅ Created ${chunkCount} chunks for ${fileName} (average size: ${Math.round(text.length / chunkCount).toLocaleString()} characters)`)
    return chunks
  }

  return { chunkText }
}
