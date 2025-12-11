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
  onHeightChange?: (height: number) => void
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
  style,
  onHeightChange
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
      const maxHeight = 320 // useStyles.tsの設定と同じ
      const minHeight = 46 // 最小高さ

      // テキストが空の場合は最小高さに戻す
      if (value === '') {
        textareaRef.current.style.height = `${minHeight}px`
        textareaRef.current.style.overflowY = 'hidden'
        if (onHeightChange) {
          onHeightChange(minHeight)
        }
        return
      }

      // 高さを一旦最小値に設定してからscrollHeightを取得
      // これにより正確な必要高さを計算できる
      textareaRef.current.style.height = `${minHeight}px`
      const scrollHeight = textareaRef.current.scrollHeight

      // 最大高さを制限
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.height = `${maxHeight}px`
        textareaRef.current.style.overflowY = 'auto'

        // 最大高さに達した場合は固定値を報告
        if (onHeightChange) {
          onHeightChange(maxHeight)
        }
      } else {
        const actualHeight = Math.max(scrollHeight, minHeight)
        textareaRef.current.style.height = `${actualHeight}px`
        textareaRef.current.style.overflowY = 'hidden'

        // 実際の高さを報告
        if (onHeightChange) {
          onHeightChange(actualHeight)
        }
      }
    }
  }, [value, onHeightChange])

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