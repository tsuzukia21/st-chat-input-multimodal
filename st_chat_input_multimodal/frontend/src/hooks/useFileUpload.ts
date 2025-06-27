import { useState, useRef, useCallback, DragEvent, ChangeEvent, ClipboardEvent } from 'react'
import { FileData } from '../types'
import { processFiles } from '../utils/fileUtils'

interface UseFileUploadProps {
  acceptedFileTypes: string[]
  maxFileSizeMb: number
}

export const useFileUpload = ({ acceptedFileTypes, maxFileSizeMb }: UseFileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([])
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * + button click - open file explorer
   */
  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * File selection event
   */
  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = await processFiles(files, acceptedFileTypes, maxFileSizeMb)
      setUploadedFiles(prev => [...prev, ...newFiles])
    }
    // Reset file input (enable reselection of same file)
    e.target.value = ''
  }, [acceptedFileTypes, maxFileSizeMb])

  /**
   * Drag & drop related event handlers
   */
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const newFiles = await processFiles(files, acceptedFileTypes, maxFileSizeMb)
      setUploadedFiles(prev => [...prev, ...newFiles])
    }
  }, [acceptedFileTypes, maxFileSizeMb])

  /**
   * Clipboard paste handler (Ctrl+V)
   */
  const handlePaste = useCallback(async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageItems = Array.from(items).filter(item => 
      item.type.startsWith('image/')
    )

    if (imageItems.length > 0) {
      e.preventDefault()
      
      const files: File[] = []
      for (const item of imageItems) {
        const file = item.getAsFile()
        if (file) {
          files.push(file)
        }
      }
      
      if (files.length > 0) {
        const newFiles = await processFiles(files, acceptedFileTypes, maxFileSizeMb)
        setUploadedFiles(prev => [...prev, ...newFiles])
      }
    }
  }, [acceptedFileTypes, maxFileSizeMb])

  /**
   * File removal handler
   */
  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setUploadedFiles([])
  }, [])

  return {
    uploadedFiles,
    isDragOver,
    fileInputRef,
    handleFileButtonClick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    handleRemoveFile,
    clearFiles,
    setUploadedFiles
  }
} 