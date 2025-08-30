"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface ChatInputProps {
    input: string
    onInputChange: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    isLoading: boolean
    isRAGAvailable: boolean
}

export function ChatInput({ input, onInputChange, onSubmit, isLoading, isRAGAvailable }: ChatInputProps) {
    return (
        <div className="border-t bg-card p-4">
            <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder={
                        isRAGAvailable
                            ? "Ask about your uploaded documents..."
                            : "Type your message..."
                    }
                    disabled={isLoading}
                    className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    )
}
