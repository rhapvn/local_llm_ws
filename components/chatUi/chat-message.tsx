"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Bot, User, Database, Search } from "lucide-react"
import type { Message } from "./types"

interface ChatMessageProps {
    message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user"

    return (
        <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                    </AvatarFallback>
                </Avatar>
            )}

            <Card
                className={`max-w-[80%] p-3 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
            >
                <div className="flex items-start gap-2">
                    {message.isRAG && (
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                            <Database className="w-3 h-3" />
                            RAG
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {/* Show search results summary */}
                        {message.searchResults && message.isRAG && message.searchResults.length > 0 && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs">
                                <div className="flex items-center gap-1 mb-1 text-blue-600 dark:text-blue-400">
                                    <Search className="w-3 h-3" />
                                    <span className="font-medium">Sources found:</span>
                                </div>
                                {message.searchResults.map((result, idx) => (
                                    <div key={idx} className="text-blue-700 dark:text-blue-300 mb-1">
                                        <span className="font-medium">{result.fileName}</span>
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {" "}
                                            (score: {result.score.toFixed(1)})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show full context */}
                        {message.context && message.isRAG && (
                            <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    Show RAG context
                                </summary>
                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground max-h-32 overflow-y-auto">
                                    {message.context}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
                <p
                    className={`text-xs mt-2 opacity-70 ${isUser ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                >
                    {message.timestamp.toLocaleTimeString()}
                </p>
            </Card>

            {isUser && (
                <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary">
                        <User className="w-4 h-4" />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}
