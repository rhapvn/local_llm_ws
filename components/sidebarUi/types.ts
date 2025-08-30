export interface FileInfo {
  id: string
  name: string
  size: number
  content: string
  characterCount: number
  indexed: boolean
  fileType: 'txt' | 'pdf'
  pageCount?: number
  error?: string
}

export interface SidebarProps {
  files: FileInfo[]
  onFileAdd: (files: FileInfo[]) => void
  onFileRemove: (fileId: string) => void
  onIndexFiles: () => void
  isIndexing?: boolean
}
