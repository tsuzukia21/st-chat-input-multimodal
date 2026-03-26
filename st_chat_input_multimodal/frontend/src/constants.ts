import type { VoiceRecognitionMethod } from './types'

export const DEFAULT_PLACEHOLDER = 'Type a message... (Ctrl+V to paste images)'
export const DEFAULT_ACCEPTED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const
export const DEFAULT_MAX_FILE_SIZE_MB = 10
export const DEFAULT_MAX_RECORDING_TIME = 60
export const DEFAULT_VOICE_LANGUAGE = 'ja-JP'
export const DEFAULT_VOICE_RECOGNITION_METHOD: VoiceRecognitionMethod = 'web_speech'

export const FRAME_HEIGHT = {
  base: 40,
  minTextArea: 46,
  maxTextArea: 320,
  filePreviewItem: 45,
  filePreviewOffset: 10,
  maxFrame: 400,
  updateThreshold: 5,
  debounceMs: 100,
  resetDelayMs: 150,
} as const

export const RECORDING_TIMER_INTERVAL_MS = 1000
