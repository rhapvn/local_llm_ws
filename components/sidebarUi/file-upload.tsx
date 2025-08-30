"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileInfo } from "./types"

interface FileUploadProps {
    onFileAdd: (files: FileInfo[]) => void
}

export function FileUpload({ onFileAdd }: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            file => file.type === "text/plain" || file.name.endsWith('.txt') ||
                file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')
        )

        if (droppedFiles.length > 0) {
            await processFiles(droppedFiles)
        }
    }, [])

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []).filter(
            file => file.type === "text/plain" || file.name.endsWith('.txt') ||
                file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')
        )

        if (selectedFiles.length > 0) {
            await processFiles(selectedFiles)
        }

        // Reset input value
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [])

    const processFiles = async (files: File[]) => {
        const processedFiles: FileInfo[] = []

        for (const file of files) {
            try {
                let content = ""
                let fileType: 'txt' | 'pdf' = 'txt'
                let pageCount: number | undefined

                if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                    // Process PDF file - only on client side
                    if (typeof window === 'undefined') {
                        processedFiles.push({
                            id: `${Date.now()}-${Math.random()}`,
                            name: file.name,
                            size: file.size,
                            content: "",
                            characterCount: 0,
                            indexed: false,
                            fileType: 'pdf',
                            error: "PDF processing not available during server rendering"
                        })
                        continue
                    }

                    try {
                        console.log('Starting PDF processing for:', file.name)
                        // Dynamic import to avoid SSR issues
                        const { PDFUtils } = await import('@/lib/pdf-utils')

                        const validation = PDFUtils.validatePDFFile(file)
                        console.log('PDF validation result:', validation)
                        if (!validation.valid) {
                            processedFiles.push({
                                id: `${Date.now()}-${Math.random()}`,
                                name: file.name,
                                size: file.size,
                                content: "",
                                characterCount: 0,
                                indexed: false,
                                fileType: 'pdf',
                                error: validation.error
                            })
                            continue
                        }

                        const pdfResult = await PDFUtils.extractTextFromPDF(file)
                        console.log('PDF processing completed for:', file.name, pdfResult)

                        if (pdfResult.error) {
                            console.error('PDF processing error:', pdfResult.error)
                            processedFiles.push({
                                id: `${Date.now()}-${Math.random()}`,
                                name: file.name,
                                size: file.size,
                                content: "",
                                characterCount: 0,
                                indexed: false,
                                fileType: 'pdf',
                                error: pdfResult.error
                            })
                            continue
                        }

                        content = pdfResult.text
                        fileType = 'pdf'
                        pageCount = pdfResult.pages
                        console.log('PDF content extracted successfully:', {
                            name: file.name,
                            contentLength: content.length,
                            pages: pageCount,
                            contentPreview: content.substring(0, 100) + '...'
                        })
                    } catch (pdfError) {
                        console.error(`Error processing PDF ${file.name}:`, pdfError)
                        processedFiles.push({
                            id: `${Date.now()}-${Math.random()}`,
                            name: file.name,
                            size: file.size,
                            content: "",
                            characterCount: 0,
                            indexed: false,
                            fileType: 'pdf',
                            error: `PDF processing failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`
                        })
                        continue
                    }
                } else {
                    // Process text file
                    content = await file.text()
                    fileType = 'txt'
                }

                const fileInfo: FileInfo = {
                    id: `${Date.now()}-${Math.random()}`,
                    name: file.name,
                    size: file.size,
                    content,
                    characterCount: content.length,
                    indexed: false,
                    fileType,
                    pageCount
                }
                console.log('Created file info:', fileInfo)
                processedFiles.push(fileInfo)
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error)
                processedFiles.push({
                    id: `${Date.now()}-${Math.random()}`,
                    name: file.name,
                    size: file.size,
                    content: "",
                    characterCount: 0,
                    indexed: false,
                    fileType: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt',
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                })
            }
        }

        if (processedFiles.length > 0) {
            console.log('Calling onFileAdd with processed files:', processedFiles)
            onFileAdd(processedFiles)
        }
    }

    return (
        <div className="p-4">
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop .txt and .pdf files here
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                    or click to browse
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Select Files
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.pdf,text/plain,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    )
}
