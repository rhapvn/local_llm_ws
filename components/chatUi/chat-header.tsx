"use client"

import { Bot, Database } from "lucide-react"

interface ChatHeaderProps {
    isRAGAvailable: boolean
    indexedFilesCount: number
}

export function ChatHeader({ isRAGAvailable, indexedFilesCount }: ChatHeaderProps) {
    return (
        <div className="border-b bg-card p-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">NoCodeChatGPT</h1>
                    <p className="text-sm text-muted-foreground">Powered by Google Gemini</p>
                    {isRAGAvailable && (
                        <div className="flex items-center gap-2 mt-1">
                            <Database className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">RAG Enabled</span>
                            <span className="text-xs text-muted-foreground">
                                ({indexedFilesCount} files indexed)
                            </span>
                        </div>
                    )}
                </div>
                <div className="ml-auto text-right">
                    <p className="text-sm text-muted-foreground">学生番号: 22M25202</p>
                    <p className="text-sm text-muted-foreground">名前: 平松　孝博</p>
                </div>
            </div>
        </div>
    )
}
