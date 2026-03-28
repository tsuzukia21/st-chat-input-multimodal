import { FileData } from '../types'

const MAGIC_BYTE_READ_LENGTH = 12

type SupportedImageType = 'jpeg' | 'png' | 'gif' | 'webp'

const normalizeFileType = (fileType: string): SupportedImageType | null => {
  const normalizedType = fileType.trim().toLowerCase()

  if (normalizedType === 'jpg' || normalizedType === 'jpeg') {
    return 'jpeg'
  }

  if (normalizedType === 'png' || normalizedType === 'gif' || normalizedType === 'webp') {
    return normalizedType
  }

  return null
}

const isJpeg = (bytes: Uint8Array): boolean =>
  bytes.length >= 3 &&
  bytes[0] === 0xFF &&
  bytes[1] === 0xD8 &&
  bytes[2] === 0xFF

const isPng = (bytes: Uint8Array): boolean =>
  bytes.length >= 4 &&
  bytes[0] === 0x89 &&
  bytes[1] === 0x50 &&
  bytes[2] === 0x4E &&
  bytes[3] === 0x47

const isGif = (bytes: Uint8Array): boolean =>
  bytes.length >= 3 &&
  bytes[0] === 0x47 &&
  bytes[1] === 0x49 &&
  bytes[2] === 0x46

const isWebp = (bytes: Uint8Array): boolean =>
  bytes.length >= 12 &&
  bytes[0] === 0x52 &&
  bytes[1] === 0x49 &&
  bytes[2] === 0x46 &&
  bytes[3] === 0x46 &&
  bytes[8] === 0x57 &&
  bytes[9] === 0x45 &&
  bytes[10] === 0x42 &&
  bytes[11] === 0x50

export const detectFileTypeFromMagicBytes = async (file: File): Promise<SupportedImageType | null> => {
  const buffer = await file.slice(0, MAGIC_BYTE_READ_LENGTH).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (isJpeg(bytes)) return 'jpeg'
  if (isPng(bytes)) return 'png'
  if (isGif(bytes)) return 'gif'
  if (isWebp(bytes)) return 'webp'

  return null
}

export const sanitizeFileName = (fileName: string): string =>
  fileName.replace(/[<>"'&/\\\u0000]/g, '')

/**
 * Validate file size and type
 */
export const validateFile = async (
  file: File,
  acceptedFileTypes: string[],
  maxFileSizeMb: number
): Promise<string | null> => {
  // File type check
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  const normalizedExtension = fileExtension ? normalizeFileType(fileExtension) : null
  const acceptedTypes = new Set(
    acceptedFileTypes
      .map(normalizeFileType)
      .filter((fileType): fileType is SupportedImageType => fileType !== null)
  )

  if (!normalizedExtension || !acceptedTypes.has(normalizedExtension)) {
    return `Unsupported file format. Supported formats: ${acceptedFileTypes.join(', ')}`
  }

  // File size check
  const maxSizeBytes = maxFileSizeMb * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return `File size exceeds limit. Maximum size: ${maxFileSizeMb}MB`
  }

  const detectedFileType = await detectFileTypeFromMagicBytes(file)
  if (!detectedFileType) {
    return `Unsupported file format. Supported formats: ${acceptedFileTypes.join(', ')}`
  }

  if (detectedFileType !== normalizedExtension) {
    return 'File content does not match the file extension.'
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
    const error = await validateFile(file, acceptedFileTypes, maxFileSizeMb)
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
