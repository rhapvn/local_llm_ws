"use client"

import { Bot, Database } from "lucide-react"

interface ChatWelcomeProps {
    isRAGAvailable: boolean
    indexedFilesCount: number
}

export function ChatWelcome({ isRAGAvailable, indexedFilesCount }: ChatWelcomeProps) {
    return (
        <div className="text-center py-12">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Welcome to NoCodeChatGPT</h3>
            <p className="text-muted-foreground mb-4">Start a conversation with Google Gemini AI</p>
            {isRAGAvailable ? (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <Database className="w-4 h-4" />
                    <span>RAG is enabled with {indexedFilesCount} indexed files</span>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Upload text files to enable RAG functionality</p>
            )}
        </div>
    )
}
