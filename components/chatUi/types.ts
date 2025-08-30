export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isRAG?: boolean
  context?: string
  searchResults?: Array<{ fileName: string; content: string; score: number }>
}

export interface ChatInterfaceProps {
  ragService: any // Will be properly typed when we refactor RAG service
  files: any[] // Will be properly typed when we refactor
}
