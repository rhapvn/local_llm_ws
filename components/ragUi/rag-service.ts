import { createTextChunker } from "./text-chunker"
import { createSearchEngine } from "./search-engine"
import type { FileInfo, Chunk, SearchResult, RAGStats, RAGDebugInfo } from "./types"

export interface RAGService {
  addFiles: (files: FileInfo[]) => void
  removeFile: (fileId: string) => void
  getFiles: () => FileInfo[]
  indexFiles: () => void
  search: (query: string, topK?: number) => SearchResult[]
  getContext: (query: string, maxLength?: number) => string
  isRAGAvailable: () => boolean
  getStats: () => RAGStats
  debugIndex: () => RAGDebugInfo
  clear: () => void
}

export const createRAGService = (): RAGService => {
  let chunks: Chunk[] = []
  let files: FileInfo[] = []
  
  const textChunker = createTextChunker()
  const searchEngine = createSearchEngine()

  const addFiles = (newFiles: FileInfo[]) => {
    // Filter out files with errors or empty content
    const validFiles = newFiles.filter((file) => !file.error && file.content && file.content.trim().length > 0)
    files = [...files, ...validFiles]
    console.log(`Added ${validFiles.length} valid files to RAG service`)
  }

  const removeFile = (fileId: string) => {
    files = files.filter((file) => file.id !== fileId)
    chunks = chunks.filter((chunk) => chunk.fileId !== fileId)
    console.log(`Removed file ${fileId} from RAG service`)
  }

  const getFiles = (): FileInfo[] => {
    return files
  }

  const indexFiles = (): void => {
    console.log(`🚀 Starting RAG indexing process...`)
    console.log(`📁 Processing ${files.length} files...`)

    chunks = []

    let totalChunks = 0
    let processedFiles = 0
    let totalCharacters = 0

    for (const file of files) {
      // Skip files with errors or empty content
      if (file.error || !file.content || file.content.trim().length === 0) {
        console.log(`⚠️ Skipping file ${file.name} due to error or empty content`)
        continue
      }

      console.log(`📄 Processing file: ${file.name} (${file.characterCount.toLocaleString()} characters)`)

      const fileChunks = textChunker.chunkText(file.content, file.id, file.name)
      chunks.push(...fileChunks)
      totalChunks += fileChunks.length
      totalCharacters += file.characterCount

      // Mark file as indexed
      file.indexed = true
      processedFiles++

      console.log(`✅ Indexed file ${file.name}: ${fileChunks.length} chunks created`)
    }

    console.log(`🎉 RAG indexing completed successfully!`)
    console.log(`📊 Summary: ${processedFiles} files processed, ${totalChunks} chunks created, ${totalCharacters.toLocaleString()} total characters indexed`)
    console.log(`🔍 Total chunks in memory: ${chunks.length}`)
  }

  const search = (query: string, topK: number = 5): SearchResult[] => {
    return searchEngine.search(chunks, query, { topK })
  }

  const getContext = (query: string, maxLength: number = 2500): string => {
    if (!query || query.trim().length === 0) {
      console.log("Empty query provided to getContext")
      return ""
    }

    const results = search(query, 6)

    if (results.length === 0) {
      console.log("No search results found for context")
      return ""
    }

    let context = ""
    let currentLength = 0

    for (const result of results) {
      if (currentLength + result.content.length > maxLength) {
        break
      }

      if (context) context += "\n\n"
      context += `[From: ${result.chunk.fileName}]\n${result.content}`
      currentLength += result.content.length
    }

    console.log(`RAG Context retrieved: ${context.length} characters from ${results.length} chunks`)
    return context
  }

  const isRAGAvailable = (): boolean => {
    const available = chunks.length > 0
    console.log(`RAG availability check: ${available} (${chunks.length} chunks)`)
    return available
  }

  const getStats = (): RAGStats => {
    return {
      totalFiles: files.length,
      indexedFiles: files.filter((f) => f.indexed).length,
      totalChunks: chunks.length,
      totalCharacters: files.reduce((sum, f) => sum + f.characterCount, 0),
    }
  }

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
    }
  }

  const clear = (): void => {
    chunks = []
    files = []
    console.log("RAG service cleared")
  }

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
  }
}
