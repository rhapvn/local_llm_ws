"use client"

import { useState, useCallback, useEffect } from "react"
import { ChatInterface } from "@/components/chatUi"
import { Sidebar } from "@/components/sidebarUi"
import { createClientRAGService } from "@/lib/client-rag-service"
import type { FileInfo } from "@/lib/types"
import { memoryUtils } from "@/lib/utils"

export default function Home() {
  const [ragService] = useState(() => createClientRAGService())
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memoryWarning, setMemoryWarning] = useState<string | null>(null)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Monitor memory usage
  useEffect(() => {
    const memoryCheckInterval = setInterval(() => {
      if (memoryUtils.isMemoryHigh(400)) { // 400MB threshold
        setMemoryWarning(`High memory usage detected: ${memoryUtils.getMemoryInfo()?.heapUsed} MB`);
      } else {
        setMemoryWarning(null);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(memoryCheckInterval);
  }, []);

  const handleFileAdd = useCallback((newFiles: FileInfo[]) => {
    console.log('handleFileAdd called with:', newFiles)
    console.log('Current files state before update:', files)

    // Check memory before adding files
    memoryUtils.logMemoryUsage('Before adding files');

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

    memoryUtils.logMemoryUsage('After adding files');
  }, [ragService, files])

  const handleFileRemove = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    ragService.removeFile(fileId)
    console.log('File removed from RAG service, remaining files:', ragService.getFiles().length)

    // Force garbage collection after file removal
    memoryUtils.forceGC();
  }, [ragService])

  const handleIndexFiles = useCallback(async () => {
    console.log('🚀 Starting Google RAG indexing process...')
    console.log('📁 Files to be indexed:', ragService.getFiles())

    // Check memory before starting
    memoryUtils.logMemoryUsage('Before indexing');

    if (memoryUtils.isMemoryHigh(300)) {
      console.warn('⚠️ High memory usage detected before indexing, forcing garbage collection');
      memoryUtils.forceGC();
    }

    setIsIndexing(true)
    setError(null) // Clear previous errors
    setMemoryWarning(null) // Clear memory warnings

    // Show indexing in progress
    setFiles(prev => prev.map(file => ({
      ...file,
      indexed: false // Reset indexed status to show progress
    })))

    // Add progress tracking with more aggressive timeout
    const startTime = Date.now()
    const maxIndexingTime = 60000; // 1 minute max for indexing

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      console.log(`⏱️ Indexing in progress... Elapsed time: ${elapsed}ms`)

      // Force timeout after 1 minute to prevent infinite hanging
      if (elapsed > maxIndexingTime) {
        console.error('⏰ Indexing timeout reached (1 minute)')
        clearInterval(progressInterval)
        setIsIndexing(false)
        setError('Indexing timeout - process took too long. Please try with a smaller file or check the console for errors.')

        // Force cleanup
        memoryUtils.forceGC();
        return
      }
    }, 2000) // Log every 2 seconds for more frequent updates

    try {
      console.log('🔍 Calling ragService.indexFiles()...')

      // Create a promise with timeout
      const indexingPromise = ragService.indexFiles();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Indexing timeout - process took too long')), maxIndexingTime);
      });

      // Race between indexing and timeout
      await Promise.race([indexingPromise, timeoutPromise]);

      console.log('✅ Google RAG indexing completed successfully!')
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

      // Check memory after indexing
      memoryUtils.logMemoryUsage('After indexing');

      // Force garbage collection after successful indexing
      memoryUtils.forceGC();

    } catch (error) {
      console.error('❌ Error during Google RAG indexing:', error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during indexing'
      setError(errorMessage)

      // Reset indexed status on error
      setFiles(prev => prev.map(file => ({
        ...file,
        indexed: false
      })))

      // Force garbage collection on error
      memoryUtils.forceGC();
    } finally {
      clearInterval(progressInterval)
      setIsIndexing(false)
      console.log('🏁 Indexing process finished (finally block executed)')
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
      <div className="flex flex-col w-80">
        <Sidebar
          files={files}
          onFileAdd={handleFileAdd}
          onFileRemove={handleFileRemove}
          onIndexFiles={handleIndexFiles}
          isIndexing={isIndexing}
        />

        {/* Memory Warning Display */}
        {memoryWarning && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">Memory Warning:</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">{memoryWarning}</p>
            <button
              onClick={() => {
                memoryUtils.forceGC();
                setMemoryWarning(null);
              }}
              className="text-xs text-yellow-600 hover:text-yellow-800 mt-2 underline"
            >
              Force Cleanup
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Indexing Error:</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      <ChatInterface ragService={ragService} files={files} />
    </main>
  )
}
