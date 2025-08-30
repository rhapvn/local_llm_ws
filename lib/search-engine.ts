import type { Chunk, SearchResult } from "./types"

export interface SearchOptions {
  topK?: number
}

export const createSearchEngine = () => {
  const search = (
    chunks: Chunk[],
    query: string, 
    options: SearchOptions = {}
  ): SearchResult[] => {
    const { topK = 5 } = options
    
    if (chunks.length === 0) {
      console.log("No chunks available for search")
      return []
    }

    if (!query || query.trim().length === 0) {
      console.log("Empty query provided")
      return []
    }

    const queryLower = query.toLowerCase().trim()
    const queryWords = queryLower.split(/\s+/).filter((word) => word.length > 2)

    if (queryWords.length === 0) {
      console.log("No meaningful words in query")
      return []
    }

    console.log(`Searching for query: "${query}" with ${queryWords.length} meaningful words`)

    const results: SearchResult[] = []

    for (const chunk of chunks) {
      const chunkLower = chunk.content.toLowerCase()
      let score = 0

      // Enhanced scoring algorithm
      for (const word of queryWords) {
        // Exact word matches get highest score
        const exactMatches = (chunkLower.match(new RegExp(`\\b${word}\\b`, "g")) || []).length
        score += exactMatches * 3

        // Partial matches
        if (chunkLower.includes(word)) {
          score += 1
        }

        // Stemmed matches (simple stemming)
        const stemmedWord = word.replace(/ing$|ed$|s$/, "")
        if (stemmedWord.length > 2) {
          const stemmedMatches = (chunkLower.match(new RegExp(`\\b${stemmedWord}`, "g")) || []).length
          score += stemmedMatches * 1.5
        }
      }

      // Bonus for chunks that contain multiple query words
      const uniqueMatches = queryWords.filter((word) => 
        chunkLower.includes(word) || chunkLower.includes(word.replace(/ing$|ed$|s$/, ""))
      ).length
      score += uniqueMatches * 0.5

      // Bonus for longer chunks with more content
      if (chunk.content.length > 200) {
        score += 0.2
      }

      if (score > 0) {
        results.push({
          chunk,
          score,
          content: chunk.content,
        })
      }
    }

    // Sort by score and return top K results
    const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, topK)
    console.log(`Found ${results.length} relevant chunks, returning top ${sortedResults.length}`)

    return sortedResults
  }

  return { search }
}
