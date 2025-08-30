"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Bot } from "lucide-react"

interface ChatLoadingProps {
    isRAGAvailable: boolean
}

export function ChatLoading({ isRAGAvailable }: ChatLoadingProps) {
    return (
        <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                </AvatarFallback>
            </Avatar>
            <Card className="bg-muted p-3">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                        />
                        <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                        />
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {isRAGAvailable ? "Searching documents and thinking..." : "Thinking..."}
                    </span>
                </div>
            </Card>
        </div>
    )
}
