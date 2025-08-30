import type { Message } from "./types"

export interface ChatService {
  sendMessage: (
    message: string,
    ragService: any,
    onSuccess: (message: Message) => void,
    onError: (error: string) => void
  ) => Promise<void>
}

export const createChatService = (): ChatService => ({
  async sendMessage(message, ragService, onSuccess, onError) {
    try {
      // Check if RAG is available and get context
      let context = ""
      let isRAG = false
      let searchResults: Array<{ fileName: string; content: string; score: number }> = []

      if (ragService.isRAGAvailable()) {
        console.log("RAG is available, searching for context...")

        // Get search results for debugging
        const searchResultsRaw = ragService.search(message, 3)
        searchResults = searchResultsRaw.map((result: any) => ({
          fileName: result.chunk.fileName,
          content: result.content,
          score: result.score
        }))

        context = ragService.getContext(message)
        isRAG = context.length > 0

        console.log("RAG search results:", searchResults)
        console.log("RAG context length:", context.length)
        console.log("RAG context preview:", context.substring(0, 200) + "...")
      } else {
        console.log("RAG is not available")
      }

      // Prepare the message for the API
      let apiMessage = message
      if (isRAG && context) {
        apiMessage = `Context from uploaded documents:\n\n${context}\n\nUser question: ${message}\n\nPlease answer the user's question based on the provided context. If the context doesn't contain relevant information, you can provide a general answer. Always try to use the context first, and if the context is relevant, mention that you found this information in the uploaded documents.`
      }

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: apiMessage }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
        isRAG,
        context: isRAG ? context : undefined,
        searchResults: isRAG ? searchResults : undefined,
      }

      onSuccess(assistantMessage)
    } catch (error) {
      console.error("Error sending message:", error)
      onError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }
})
