import React, { useState } from 'react'

interface FileUploadButtonProps {
  onFileButtonClick: () => void
  disabled: boolean
  style: React.CSSProperties
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileButtonClick,
  disabled,
  style
}) => {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <button
      onClick={onFileButtonClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        ...style,
        backgroundColor: isPressed ? 'rgba(128, 128, 128, 0.2)' : style.backgroundColor
      }}
      title="Select file"
      disabled={disabled}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    </button>
  )
} 