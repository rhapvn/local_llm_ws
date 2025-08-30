import type { Chunk, SearchResult } from "./types";

export interface RAGSearchService {
  search: (query: string, queryEmbedding: number[], chunks: Chunk[], embeddings: number[][], topK?: number) => Promise<SearchResult[]>;
  getContext: (query: string, queryEmbedding: number[], chunks: Chunk[], embeddings: number[][], maxLength?: number) => Promise<string>;
}

export const createRAGSearchService = (): RAGSearchService => {
  // Cosine similarity calculation
  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
  };

  const search = async (query: string, queryEmbedding: number[], chunks: Chunk[], embeddings: number[][], topK: number = 5): Promise<SearchResult[]> => {
    if (embeddings.length === 0 || chunks.length === 0) {
      console.log("No embeddings available for semantic search");
      return [];
    }

    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.log("No query embedding provided for search");
      return [];
    }

    try {
      // Calculate similarities using the actual query embedding
      const similarities = chunks.map((chunk, index) => {
        if (index >= embeddings.length) {
          console.warn(`Chunk index ${index} exceeds embeddings length ${embeddings.length}`);
          return { chunk, similarity: 0, index };
        }

        const similarity = cosineSimilarity(queryEmbedding, embeddings[index]);
        return { chunk, similarity, index };
      });

      // Sort by similarity and return top K
      const topResults = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(({ chunk, similarity }) => ({
          chunk,
          score: similarity,
          content: chunk.content,
        }));

      console.log(
        `🔍 Semantic search found ${topResults.length} results with scores:`,
        topResults.map((r) => r.score)
      );
      return topResults;
    } catch (error) {
      console.error("Semantic search failed:", error);
      return [];
    }
  };

  const getContext = async (query: string, queryEmbedding: number[], chunks: Chunk[], embeddings: number[][], maxLength: number = 3000): Promise<string> => {
    if (!query || query.trim().length === 0) {
      console.log("Empty query provided to getContext");
      return "";
    }

    const results = await search(query, queryEmbedding, chunks, embeddings, 6);

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

  return {
    search,
    getContext,
  };
};
