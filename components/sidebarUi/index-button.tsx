"use client"

import { Button } from "@/components/ui/button"
import type { FileInfo } from "./types"

interface IndexButtonProps {
    files: FileInfo[]
    onIndexFiles: () => void
    isIndexing: boolean
}

export function IndexButton({ files, onIndexFiles, isIndexing }: IndexButtonProps) {
    if (files.length === 0) return null

    const hasErrors = files.some(file => file.error)
    const allIndexed = files.every(file => file.indexed)
    const readyForIndex = files.filter(f => !f.error && !f.indexed).length

    return (
        <div className="p-4 border-t">
            <Button
                onClick={onIndexFiles}
                className="w-full transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                disabled={allIndexed || hasErrors || isIndexing}
            >
                {isIndexing ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Indexing...
                    </>
                ) : hasErrors
                    ? "Fix errors before indexing"
                    : allIndexed
                        ? "All Files Indexed ✓"
                        : "Index Files for RAG"
                }
            </Button>

            {/* Show indexing status */}
            <div className="mt-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                    <span>Ready for RAG:</span>
                    <span className="font-medium">
                        {files.filter(f => !f.error && f.indexed).length} / {files.filter(f => !f.error).length}
                    </span>
                </div>
                {hasErrors && (
                    <div className="mt-1 text-red-600">
                        {files.filter(f => f.error).length} file(s) have errors
                    </div>
                )}
            </div>
        </div>
    )
}
