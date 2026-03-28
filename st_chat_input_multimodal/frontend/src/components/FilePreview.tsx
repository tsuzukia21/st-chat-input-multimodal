import React from 'react'
import { FileData } from '../types'
import { formatFileSize, sanitizeFileName } from '../utils/fileUtils'

interface FilePreviewProps {
  files: FileData[]
  onRemoveFile: (index: number) => void
  styles: {
    filePreviewContainer: React.CSSProperties
    filePreview: React.CSSProperties
    fileInfo: React.CSSProperties
    fileName: React.CSSProperties
    fileSize: React.CSSProperties
    removeButton: React.CSSProperties
  }
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  onRemoveFile,
  styles
}) => {
  if (files.length === 0) return null

  return (
    <div style={styles.filePreviewContainer}>
      {files.map((file, index) => {
        const safeFileName = sanitizeFileName(file.name)

        return (
          <div key={index} style={styles.filePreview}>
            <div style={styles.fileInfo}>
              <div style={styles.fileName}>🖼️ {safeFileName}</div>
              <div style={styles.fileSize}>{formatFileSize(file.size)}</div>
            </div>
            <button
              onClick={() => onRemoveFile(index)}
              style={styles.removeButton}
              title="Remove file"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
