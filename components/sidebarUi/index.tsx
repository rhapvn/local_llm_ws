"use client"

import { Database } from "lucide-react"
import { FileUpload } from "./file-upload"
import { SidebarStats } from "./sidebar-stats"
import { FileList } from "./file-list"
import { IndexButton } from "./index-button"
import type { SidebarProps } from "./types"

export function Sidebar({ files, onFileAdd, onFileRemove, onIndexFiles, isIndexing = false }: SidebarProps) {
    return (
        <div className="w-80 border-r bg-card flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    RAG Documents
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Upload text files and PDFs to enable RAG functionality
                </p>
            </div>

            {/* Upload Area */}
            <FileUpload onFileAdd={onFileAdd} />

            {/* Stats */}
            <SidebarStats files={files} />

            {/* Files List */}
            <FileList files={files} onFileRemove={onFileRemove} />

            {/* Index Button */}
            <IndexButton files={files} onIndexFiles={onIndexFiles} isIndexing={isIndexing} />
        </div>
    )
}
