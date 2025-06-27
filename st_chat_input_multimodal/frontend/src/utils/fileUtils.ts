import { FileData } from '../types'

/**
 * Validate file size and type
 */
export const validateFile = (
  file: File,
  acceptedFileTypes: string[],
  maxFileSizeMb: number
): string | null => {
  // File type check
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !acceptedFileTypes.includes(fileExtension)) {
    return `Unsupported file format. Supported formats: ${acceptedFileTypes.join(', ')}`
  }

  // File size check
  const maxSizeBytes = maxFileSizeMb * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return `File size exceeds limit. Maximum size: ${maxFileSizeMb}MB`
  }

  return null
}

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert file size to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Process multiple files and convert to FileData array
 */
export const processFiles = async (
  files: FileList | File[],
  acceptedFileTypes: string[],
  maxFileSizeMb: number
): Promise<FileData[]> => {
  const fileArray = Array.from(files)
  const newFiles: FileData[] = []

  for (const file of fileArray) {
    const error = validateFile(file, acceptedFileTypes, maxFileSizeMb)
    if (error) {
      alert(error)
      continue
    }

    try {
      const base64Data = await fileToBase64(file)
      newFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64Data
      })
    } catch (error) {
      console.error('File reading error:', error)
      alert(`Failed to read file "${file.name}"`)
    }
  }

  return newFiles
} 