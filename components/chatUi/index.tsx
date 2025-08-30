"use client"

import { useState } from "react"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { createChatService } from "./chat-service"
import type { Message } from "./types"

interface ChatInterfaceProps {
    ragService: any
    files: any[]
}

export function ChatInterface({ ragService, files }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const chatService = createChatService()
    const isRAGAvailable = ragService.isRAGAvailable()
    const indexedFilesCount = files.filter((f: any) => f.indexed).length

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            content: input.trim(),
            role: "user",
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        await chatService.sendMessage(
            userMessage.content,
            ragService,
            (assistantMessage) => {
                setMessages((prev) => [...prev, assistantMessage])
                setIsLoading(false)
            },
            (error) => {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: `Error: ${error}`,
                    role: "assistant",
                    timestamp: new Date(),
                }
                setMessages((prev) => [...prev, errorMessage])
                setIsLoading(false)
            }
        )
    }

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto h-full">
            <ChatHeader isRAGAvailable={isRAGAvailable} indexedFilesCount={indexedFilesCount} />

            <ChatMessages
                messages={messages}
                isLoading={isLoading}
                isRAGAvailable={isRAGAvailable}
                indexedFilesCount={indexedFilesCount}
            />

            <ChatInput
                input={input}
                onInputChange={setInput}
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                isRAGAvailable={isRAGAvailable}
            />
        </div>
    )
}
