import React, { useRef, useEffect, useCallback, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react'

interface TextInputProps {
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onFocus: () => void
  onBlur: () => void
  onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => void
  placeholder: string
  disabled: boolean
  maxChars?: number
  style: React.CSSProperties
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  onPaste,
  placeholder,
  disabled,
  maxChars,
  style
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus管理
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // 高さ自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={onPaste}
        placeholder={placeholder}
        disabled={disabled}
        style={style}
        rows={1}
      />
      {maxChars && (
        <div style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginRight: '8px',
          alignSelf: 'flex-end',
          paddingBottom: '8px',
        }}>
          {value.length}/{maxChars}
        </div>
      )}
    </>
  )
} 