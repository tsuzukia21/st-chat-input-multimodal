import React from 'react'

interface VoiceButtonProps {
  isRecording: boolean
  isTranscribing: boolean
  recordingTime: string
  onVoiceButtonClick: () => void
  disabled: boolean
  styles: {
    voiceButton: React.CSSProperties
    recordingStatus: React.CSSProperties
  }
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isRecording,
  isTranscribing,
  recordingTime,
  onVoiceButtonClick,
  disabled,
  styles
}) => {
  return (
    <button
      onClick={onVoiceButtonClick}
      style={styles.voiceButton}
      title={isRecording ? "Stop recording" : (isTranscribing ? "Transcribing..." : "Voice input")}
      disabled={disabled || isTranscribing}
    >

      {isRecording ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      ) : isTranscribing ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M10,8V16L16,12"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14c-3.31 0-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8h-2c0 3.31-2.69 6-6 6z"/>
        </svg>
      )}
    </button>
  )
} 