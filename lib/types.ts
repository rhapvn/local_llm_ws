export interface FileInfo {
  id: string
  name: string
  size: number
  content: string
  characterCount: number
  indexed: boolean
  fileType: "txt" | "pdf"
  pageCount?: number
  error?: string
}

export interface Chunk {
  id: string
  content: string
  fileId: string
  fileName: string
  startIndex: number
  endIndex: number
}

export interface SearchResult {
  chunk: Chunk
  score: number
  content: string
}

export interface RAGStats {
  totalFiles: number
  indexedFiles: number
  totalChunks: number
  totalCharacters: number
}

export interface RAGDebugInfo {
  chunks: Array<{
    id: string
    fileName: string
    contentLength: number
    contentPreview: string
  }>
  files: Array<{
    id: string
    name: string
    indexed: boolean
    error?: string
    contentLength: number
  }>
}
