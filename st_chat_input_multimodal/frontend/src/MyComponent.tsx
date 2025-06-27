import {
  Streamlit,
  withStreamlitConnection,
  ComponentProps,
} from "streamlit-component-lib"
import React, { useEffect, useState, useCallback, KeyboardEvent, ChangeEvent } from "react"

// Import types
import { ComponentArgs, ComponentResult } from './types'

// Import hooks
import { useFileUpload } from './hooks/useFileUpload'
import { useVoiceRecording } from './hooks/useVoiceRecording'
import { useStyles } from './hooks/useStyles'

// Import components
import { FilePreview } from './components/FilePreview'
import { FileUploadButton } from './components/FileUploadButton'
import { VoiceButton } from './components/VoiceButton'
import { TextInput } from './components/TextInput'

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
  // Get configuration values from Props
  const { 
    placeholder = "Type a message... (Ctrl+V to paste images)", 
    max_chars, 
    accepted_file_types = ['jpg', 'jpeg', 'png', 'gif', 'webp'], 
    max_file_size_mb = 10,
    // Voice functionality settings
    enable_voice_input = false,
    voice_recognition_method = "web_speech",
    openai_api_key,
    voice_language = "ja-JP",
    max_recording_time = 60
  }: ComponentArgs = args

  // Component state
  const [inputText, setInputText] = useState<string>("")
  const [isFocused, setIsFocused] = useState<boolean>(false)

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
    acceptedFileTypes: accepted_file_types,
    maxFileSizeMb: max_file_size_mb
  })

  // Voice recording hook
  const voiceHook = useVoiceRecording({
    voiceRecognitionMethod: voice_recognition_method,
    openaiApiKey: openai_api_key,
    voiceLanguage: voice_language,
    maxRecordingTime: max_recording_time,
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
   * Update frame height when dependencies change
   */
  useEffect(() => {
    // 固定位置の場合、適切な高さを設定
    const baseHeight = 80 // 基本の高さ
    const filePreviewHeight = uploadedFiles.length > 0 ? uploadedFiles.length * 45 + 10 : 0
    // 録音ステータスはコンテナ内に表示するため追加の高さは不要
    
    const totalHeight = baseHeight + filePreviewHeight
    Streamlit.setFrameHeight(Math.min(totalHeight, 300)) // 最大300pxに制限
  }, [uploadedFiles])

  /**
   * Text input value change handler
   */
  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    
    // Maximum character limit check
    if (max_chars && value.length > max_chars) {
      return
    }
    
    setInputText(value)
    // 高さ調整は useEffect で行うため、ここでは呼び出さない
  }, [max_chars])

  /**
   * Keyboard event handler (Enter to send)
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    
    // 高さ調整は useEffect で行うため、ここでは呼び出さない
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
          accept={accepted_file_types.map((type: string) => `.${type}`).join(',')}
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
        {enable_voice_input && (
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
          maxChars={max_chars}
          style={styles.textArea}
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
