"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, FileText, Search, Info } from "lucide-react"
import type { FileInfo } from "@/components/ragUi/types"
import type { RAGService } from "@/components/ragUi/rag-service"

interface DebugPanelProps {
    ragService: RAGService
    files: FileInfo[]
}

export function DebugPanel({ ragService, files }: DebugPanelProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    const refreshDebugInfo = () => {
        const stats = ragService.getStats()
        const debugIndex = ragService.debugIndex()
        setDebugInfo({ stats, debugIndex })
    }

    if (!isOpen) {
        return (
            <div className="fixed bottom-4 right-4">
                <Button
                    onClick={() => {
                        setIsOpen(true)
                        refreshDebugInfo()
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-background/80 backdrop-blur-sm"
                >
                    <Database className="w-4 h-4 mr-2" />
                    Debug RAG
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed inset-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg z-50 overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    RAG Debug Panel
                </h2>
                <div className="flex gap-2">
                    <Button onClick={refreshDebugInfo} variant="outline" size="sm">
                        Refresh
                    </Button>
                    <Button onClick={() => setIsOpen(false)} variant="outline" size="sm">
                        Close
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {debugInfo && (
                    <>
                        {/* Stats */}
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                RAG Service Statistics
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Total Files:</span>
                                    <Badge variant="secondary" className="ml-2">{debugInfo.stats.totalFiles}</Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Indexed Files:</span>
                                    <Badge variant="secondary" className="ml-2">{debugInfo.stats.indexedFiles}</Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Total Chunks:</span>
                                    <Badge variant="secondary" className="ml-2">{debugInfo.stats.totalChunks}</Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Total Characters:</span>
                                    <Badge variant="secondary" className="ml-2">{debugInfo.stats.totalCharacters.toLocaleString()}</Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Files */}
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Files Status
                            </h3>
                            <div className="space-y-2">
                                {debugInfo.debugIndex.files.map((file: any) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {file.contentLength.toLocaleString()} chars
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={file.indexed ? "default" : "secondary"}>
                                                {file.indexed ? "Indexed" : "Pending"}
                                            </Badge>
                                            {file.error && (
                                                <Badge variant="destructive">Error</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Chunks */}
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Indexed Chunks
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {debugInfo.debugIndex.chunks.map((chunk: any) => (
                                    <div key={chunk.id} className="p-2 bg-muted rounded text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium">{chunk.fileName}</span>
                                            <Badge variant="outline">{chunk.contentLength} chars</Badge>
                                        </div>
                                        <p className="text-muted-foreground text-xs">{chunk.contentPreview}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}
