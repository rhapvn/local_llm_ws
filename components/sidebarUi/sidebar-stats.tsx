"use client"

import type { FileInfo } from "./types"

interface SidebarStatsProps {
    files: FileInfo[]
}

export function SidebarStats({ files }: SidebarStatsProps) {
    const totalCharacters = files.reduce((sum, file) => sum + file.characterCount, 0)
    const indexedFiles = files.filter(file => file.indexed).length
    const totalPages = files.reduce((sum, file) => sum + (file.pageCount || 0), 0)

    return (
        <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Total Files</p>
                    <p className="text-lg font-semibold">{files.length}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Total Characters</p>
                    <p className="text-lg font-semibold">{totalCharacters.toLocaleString()}</p>
                </div>
            </div>
            <div className="mt-2 bg-muted p-3 rounded-lg">
                <p className="text-muted-foreground text-sm">Indexed Files</p>
                <p className="text-lg font-semibold">{indexedFiles} / {files.length}</p>
            </div>
            {totalPages > 0 && (
                <div className="mt-2 bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground text-sm">Total Pages (PDFs)</p>
                    <p className="text-lg font-semibold">{totalPages}</p>
                </div>
            )}
        </div>
    )
}
