"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./chat-message"
import { ChatWelcome } from "./chat-welcome"
import { ChatLoading } from "./chat-loading"
import type { Message } from "./types"

interface ChatMessagesProps {
    messages: Message[]
    isLoading: boolean
    isRAGAvailable: boolean
    indexedFilesCount: number
}

export function ChatMessages({ messages, isLoading, isRAGAvailable, indexedFilesCount }: ChatMessagesProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    return (
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
                {messages.length === 0 && (
                    <ChatWelcome isRAGAvailable={isRAGAvailable} indexedFilesCount={indexedFilesCount} />
                )}

                {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                ))}

                {isLoading && <ChatLoading isRAGAvailable={isRAGAvailable} />}
            </div>
        </ScrollArea>
    )
}
