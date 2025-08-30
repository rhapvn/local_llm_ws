"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, X, FileX, File } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileInfo } from "./types"

interface FileListProps {
    files: FileInfo[]
    onFileRemove: (fileId: string) => void
}

export function FileList({ files, onFileRemove }: FileListProps) {
    if (files.length === 0) {
        return (
            <div className="flex-1 px-4 pb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Uploaded Files</h3>
                <div className="text-center py-8 text-muted-foreground">
                    <FileX className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No files uploaded yet</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 px-4 pb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Uploaded Files</h3>
            <ScrollArea className="h-full">
                <div className="space-y-2">
                    {files.map((file) => (
                        <Card key={file.id} className="p-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {file.fileType === 'pdf' ? (
                                            <File className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">{file.characterCount.toLocaleString()} characters</span>
                                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                                        {file.pageCount && (
                                            <span>{file.pageCount} pages</span>
                                        )}
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs",
                                            file.error
                                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                : file.indexed
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        )}>
                                            {file.error ? "Error" : file.indexed ? "Indexed" : "Pending"}
                                        </span>
                                    </div>
                                    {file.error && (
                                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onFileRemove(file.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
