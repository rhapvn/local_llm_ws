"use client"

import { useState, useCallback, useEffect } from "react"
import { ChatInterface } from "@/components/chatUi"
import { Sidebar } from "@/components/sidebarUi"
import { DebugPanel } from "@/components/debug-panel"
import { createRAGService, type FileInfo } from "@/components/ragUi"

export default function Home() {
  const [ragService] = useState(() => createRAGService())
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleFileAdd = useCallback((newFiles: FileInfo[]) => {
    console.log('handleFileAdd called with:', newFiles)
    console.log('Current files state before update:', files)

    // Filter out files with errors
    const validFiles = newFiles.filter(file => !file.error)
    const errorFiles = newFiles.filter(file => file.error)

    if (errorFiles.length > 0) {
      console.warn('Some files had errors:', errorFiles)
    }

    setFiles(prev => {
      const updated = [...prev, ...validFiles]
      console.log('Updated files state:', updated)
      return updated
    })

    // Add valid files to RAG service
    if (validFiles.length > 0) {
      ragService.addFiles(validFiles)
      console.log('Valid files added to RAG service, total files in service:', ragService.getFiles().length)
    }
  }, [ragService, files])

  const handleFileRemove = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    ragService.removeFile(fileId)
    console.log('File removed from RAG service, remaining files:', ragService.getFiles().length)
  }, [ragService])

  const handleIndexFiles = useCallback(async () => {
    console.log('🚀 Starting RAG indexing process...')
    console.log('📁 Files to be indexed:', ragService.getFiles())

    setIsIndexing(true)

    // Show indexing in progress
    setFiles(prev => prev.map(file => ({
      ...file,
      indexed: false // Reset indexed status to show progress
    })))

    try {
      // Index files
      ragService.indexFiles()

      console.log('✅ RAG indexing completed successfully!')
      console.log('📊 RAG service stats:', ragService.getStats())
      console.log('🔍 Debug index info:', ragService.debugIndex())

      // Update files to reflect indexed status
      setFiles(prev => prev.map(file => ({
        ...file,
        indexed: !file.error
      })))

      console.log('🔄 UI updated - files marked as indexed')

      // Log summary of indexed files
      const indexedFiles = ragService.getFiles().filter(f => f.indexed)
      const totalChars = indexedFiles.reduce((sum, f) => sum + f.characterCount, 0)
      console.log(`📈 Indexing Summary: ${indexedFiles.length} files indexed with ${totalChars.toLocaleString()} total characters`)

    } catch (error) {
      console.error('❌ Error during RAG indexing:', error)

      // Reset indexed status on error
      setFiles(prev => prev.map(file => ({
        ...file,
        indexed: false
      })))
    } finally {
      setIsIndexing(false)
    }
  }, [ragService])

  // Don't render until we're on the client side
  if (!isClient) {
    return (
      <main className="flex h-screen bg-background">
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-screen bg-background">
      <Sidebar
        files={files}
        onFileAdd={handleFileAdd}
        onFileRemove={handleFileRemove}
        onIndexFiles={handleIndexFiles}
        isIndexing={isIndexing}
      />
      <ChatInterface ragService={ragService} files={files} />
      <DebugPanel ragService={ragService} files={files} />
    </main>
  )
}
