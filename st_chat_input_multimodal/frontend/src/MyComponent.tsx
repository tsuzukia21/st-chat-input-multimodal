import {
  Streamlit,
  withStreamlitConnection,
  ComponentProps,
} from "streamlit-component-lib"
import React, { useEffect, useState, useCallback, KeyboardEvent, ChangeEvent } from "react"

import {
  DEFAULT_ACCEPTED_FILE_TYPES,
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_MAX_RECORDING_TIME,
  DEFAULT_PLACEHOLDER,
  DEFAULT_VOICE_LANGUAGE,
  DEFAULT_VOICE_RECOGNITION_METHOD,
  FRAME_HEIGHT,
} from './constants'
import { ComponentArgs, ComponentResult, RawComponentArgs } from './types'

// Import hooks
import { useFileUpload } from './hooks/useFileUpload'
import { useVoiceRecording } from './hooks/useVoiceRecording'
import { useStyles } from './hooks/useStyles'

// Import components
import { FilePreview } from './components/FilePreview'
import { FileUploadButton } from './components/FileUploadButton'
import { VoiceButton } from './components/VoiceButton'
import { TextInput } from './components/TextInput'

const normalizeComponentArgs = (rawArgs: RawComponentArgs): ComponentArgs => ({
  placeholder: rawArgs.placeholder,
  maxChars: rawArgs.max_chars,
  acceptedFileTypes: rawArgs.accepted_file_types,
  maxFileSizeMb: rawArgs.max_file_size_mb,
  maxFiles: rawArgs.max_files,
  enableVoiceInput: rawArgs.enable_voice_input,
  voiceRecognitionMethod: rawArgs.voice_recognition_method,
  voiceLanguage: rawArgs.voice_language,
  maxRecordingTime: rawArgs.max_recording_time,
  transcriptionResult: rawArgs.transcription_result,
})

/**
 * Multimodal Chat Input Component
 * 
 * Provides text input, image upload, and voice input functionality
 * Adopts design aligned with Streamlit's standard theme
 */
function MultimodalChatInput({ 
  args, 
  disabled, 
  theme 
}: ComponentProps): React.ReactElement {
  const normalizedArgs = normalizeComponentArgs((args ?? {}) as RawComponentArgs)
  const {
    placeholder = DEFAULT_PLACEHOLDER,
    maxChars,
    acceptedFileTypes = [...DEFAULT_ACCEPTED_FILE_TYPES],
    maxFileSizeMb = DEFAULT_MAX_FILE_SIZE_MB,
    enableVoiceInput = false,
    voiceRecognitionMethod = DEFAULT_VOICE_RECOGNITION_METHOD,
    voiceLanguage = DEFAULT_VOICE_LANGUAGE,
    maxRecordingTime = DEFAULT_MAX_RECORDING_TIME,
    transcriptionResult,
  } = normalizedArgs

  // Component state
  const [inputText, setInputText] = useState<string>("")
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [textAreaHeight, setTextAreaHeight] = useState<number>(FRAME_HEIGHT.minTextArea)
  const [frameHeightUpdateTimer, setFrameHeightUpdateTimer] = useState<number | null>(null)
  const [lastFrameHeight, setLastFrameHeight] = useState<number>(0) // 前回のフレーム高さを記録

  // File upload hook
  const {
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
    clearFiles
  } = useFileUpload({
    acceptedFileTypes,
    maxFileSizeMb
  })

  // Voice recording hook
  const voiceHook = useVoiceRecording({
    voiceRecognitionMethod,
    voiceLanguage,
    maxRecordingTime,
    transcriptionResult,
    onTextUpdate: (text: string) => {
      setInputText(prev => prev + text)
    }
  })

  // Styles hook
  const getStyles = useStyles(theme, {
    isFocused,
    isDragOver,
    isAddButtonPressed: false,
    isRecording: voiceHook.isRecording,
    isTranscribing: voiceHook.isTranscribing,
    hasContent: inputText.trim().length > 0 || uploadedFiles.length > 0,
    disabled: disabled || false,
    uploadedFilesLength: uploadedFiles.length
  })

  const styles = getStyles() || {}

  /**
   * Update frame height when dependencies change with debounce
   */
  useEffect(() => {
    // 既存のタイマーをクリア
    if (frameHeightUpdateTimer) {
      window.clearTimeout(frameHeightUpdateTimer)
    }

    // 新しいタイマーを設定（デバウンス）
    const timer = window.setTimeout(() => {
      // 基本の高さ
      const baseHeight = FRAME_HEIGHT.base
      const filePreviewHeight = uploadedFiles.length > 0
        ? uploadedFiles.length * FRAME_HEIGHT.filePreviewItem + FRAME_HEIGHT.filePreviewOffset
        : 0
      
      // テキストエリアの高さを最大値で制限
      const actualTextAreaHeight = Math.min(textAreaHeight, FRAME_HEIGHT.maxTextArea)
      
      // フレーム高さを計算（最大値を設定して一定以上大きくならないようにする）
      const totalHeight = baseHeight + filePreviewHeight + actualTextAreaHeight
      
      // フレーム高さを設定（安定化のため小さな調整を加える）
      const finalHeight = Math.min(totalHeight, FRAME_HEIGHT.maxFrame)
      
      // 前回の高さと比較して、変更があった場合のみ更新
      if (Math.abs(finalHeight - lastFrameHeight) > FRAME_HEIGHT.updateThreshold) {
        setLastFrameHeight(finalHeight)
        
        // 高さが一定以上になった場合は固定値を使用（コンポーネントが上に動くのを防ぐ）
        if (finalHeight >= FRAME_HEIGHT.maxFrame) {
          Streamlit.setFrameHeight(FRAME_HEIGHT.maxFrame)
        } else {
          Streamlit.setFrameHeight(finalHeight)
        }
      }
    }, FRAME_HEIGHT.debounceMs)

    setFrameHeightUpdateTimer(timer)

    // クリーンアップ
    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [uploadedFiles, textAreaHeight, lastFrameHeight])

  /**
   * Text area height change handler
   */
  const handleTextAreaHeightChange = useCallback((height: number) => {
    setTextAreaHeight(height)
  }, [])

  /**
   * Text input value change handler
   */
  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Maximum character limit check
    if (maxChars && value.length > maxChars) {
      return
    }
    
    setInputText(value)
  }, [maxChars])

  /**
   * Keyboard event handler (Enter to send)
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中は送信しない（日本語、中国語などの入力時）
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [inputText, uploadedFiles, voiceHook.audioMetadata, disabled, voiceHook.isRecording, voiceHook.isTranscribing])

  /**
   * Send button click handler
   */
  const handleSubmit = useCallback(() => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || disabled || voiceHook.isRecording || voiceHook.isTranscribing) return

    // Send value to Streamlit with unique timestamp to allow duplicate submissions
    const result: ComponentResult = {
      text: inputText.trim(),
      files: uploadedFiles,
      audio_metadata: voiceHook.audioMetadata,
      _timestamp: Date.now(), // Add unique timestamp for each submission
    }
    
    Streamlit.setComponentValue(result)
    
    // Clear input
    setInputText("")
    clearFiles()
    voiceHook.clearAudioMetadata()
    
    // 高さを確実にリセット
    setTextAreaHeight(FRAME_HEIGHT.minTextArea)
    setLastFrameHeight(0) // 前回の高さ記録もリセット
    
    // フレーム高さを基本の高さに戻す
    window.setTimeout(() => {
      const minFrameHeight = FRAME_HEIGHT.base + FRAME_HEIGHT.minTextArea
      Streamlit.setFrameHeight(minFrameHeight)
    }, FRAME_HEIGHT.resetDelayMs)
  }, [inputText, uploadedFiles, voiceHook.audioMetadata, disabled, voiceHook.isRecording, voiceHook.isTranscribing, clearFiles, voiceHook.clearAudioMetadata])

  /**
   * Focus state management
   */
  const handleFocus = useCallback(() => setIsFocused(true), [])
  const handleBlur = useCallback(() => setIsFocused(false), [])

  /**
   * Get placeholder text based on state
   */
  const getPlaceholder = (): string => {
    if (voiceHook.isRecording) return "Recording..."
    if (voiceHook.isTranscribing) return "Transcribing..."
    return placeholder
  }

  return (
    <div style={styles.outerContainer}>
      {/* File preview area */}
      <FilePreview
        files={uploadedFiles}
        onRemoveFile={handleRemoveFile}
        styles={{
          filePreviewContainer: styles.filePreviewContainer,
          filePreview: styles.filePreview,
          fileInfo: styles.fileInfo,
          fileName: styles.fileName,
          fileSize: styles.fileSize,
          removeButton: styles.removeButton
        }}
      />

      {/* Main input area */}
      <div 
        style={styles.container}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.map((type: string) => `.${type}`).join(',')}
          onChange={handleFileChange}
          style={styles.hiddenFileInput}
        />

        {/* File upload button */}
        <FileUploadButton
          onFileButtonClick={handleFileButtonClick}
          disabled={disabled || false}
          style={styles.addButton}
        />

        {/* Voice button */}
        {enableVoiceInput && (
          <VoiceButton
            isRecording={voiceHook.isRecording}
            isTranscribing={voiceHook.isTranscribing}
            recordingTime={voiceHook.formatRecordingTime()}
            onVoiceButtonClick={voiceHook.handleVoiceButtonClick}
            disabled={disabled || false}
            styles={{
              voiceButton: styles.voiceButton,
              recordingStatus: styles.recordingStatus
            }}
          />
        )}

        {/* Text input */}
        <TextInput
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={getPlaceholder()}
          disabled={disabled || voiceHook.isRecording || voiceHook.isTranscribing}
          maxChars={maxChars}
          style={styles.textArea}
          onHeightChange={handleTextAreaHeightChange}
        />
        
        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={(!inputText.trim() && uploadedFiles.length === 0) || disabled || voiceHook.isRecording || voiceHook.isTranscribing}
          style={styles.sendButton}
          title="Send (Enter)"
        >
          <svg
            width="25"
            height="25"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 2L14 8L2 14V9.5L10 8L2 6.5V2Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* Drag over overlay */}
        <div style={styles.dragOverlay}>
          📎 Drop files here
        </div>
      </div>
    </div>
  )
}

export default withStreamlitConnection(MultimodalChatInput)
