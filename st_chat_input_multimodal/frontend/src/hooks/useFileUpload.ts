import { useState, useRef, useCallback, DragEvent, ChangeEvent, ClipboardEvent } from 'react'
import { ErrorState, FileData } from '../types'
import { processFiles } from '../utils/fileUtils'
import { createErrorState } from '../utils/errorUtils'

interface UseFileUploadProps {
  acceptedFileTypes: string[]
  maxFileSizeMb: number
  maxFiles?: number
  onError?: (error: ErrorState) => void
  onClearError?: () => void
}

export const useFileUpload = ({
  acceptedFileTypes,
  maxFileSizeMb,
  maxFiles,
  onError,
  onClearError,
}: UseFileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([])
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reportError = useCallback((
    message: string,
    type: ErrorState['type'] = 'error'
  ) => {
    onError?.(createErrorState(message, type))
  }, [onError])

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    if (fileArray.length === 0) {
      return
    }

    onClearError?.()

    let filesToProcess = fileArray

    if (maxFiles !== undefined) {
      const remainingSlots = maxFiles - uploadedFiles.length

      if (remainingSlots <= 0) {
        reportError(`File limit reached. Maximum ${maxFiles} files allowed.`, 'warning')
        return
      }

      if (fileArray.length > remainingSlots) {
        reportError(
          `Only ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'} can be added.`,
          'warning'
        )
        filesToProcess = fileArray.slice(0, remainingSlots)
      }
    }

    const newFiles = await processFiles(
      filesToProcess,
      acceptedFileTypes,
      maxFileSizeMb,
      (message) => reportError(message)
    )
    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [acceptedFileTypes, maxFileSizeMb, maxFiles, onClearError, reportError, uploadedFiles.length])

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
      await addFiles(files)
    }
    // Reset file input (enable reselection of same file)
    e.target.value = ''
  }, [addFiles])

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
      await addFiles(files)
    }
  }, [addFiles])

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
        await addFiles(files)
      }
    }
  }, [addFiles])

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
