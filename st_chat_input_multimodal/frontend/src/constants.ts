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

export const KEYBOARD = {
  compositionEventKeyCode: 229,
} as const

export const SEND_BUTTON_ICON = {
  size: 25,
  viewBox: '0 0 16 16',
} as const

export const UI_LAYOUT = {
  outerContainerPadding: '12px 16px',
  outerContainerGap: '8px',
  outerContainerMinHeight: '48px',
  filePreviewGap: '8px',
  filePreviewBorderRadius: '8px',
  filePreviewPadding: '8px 12px',
  filePreviewFontSize: '12px',
  fileInfoGap: '2px',
  fileNameMaxWidth: '200px',
  fileSizeFontSize: '11px',
  zeroSpacing: '0px',
  controlBorderRadius: '24px',
  controlMargin: '4px',
  controlFontSize: '16px',
  circleBorderRadius: '50%',
  removeButtonSize: '20px',
  removeButtonPadding: '2px',
  recordingStatusTop: '2px',
  recordingStatusLeft: '50%',
  recordingStatusTransform: 'translateX(-50%)',
  recordingStatusFontSize: '8px',
  recordingStatusPadding: '1px 4px',
  recordingStatusBorderRadius: '3px',
  textAreaPadding: '12px 16px',
  textAreaFontSize: '16px',
  textAreaLineHeight: '1.5',
  charCounterMarginRight: '8px',
  dragOverlayFontSize: '14px',
  fullWidth: '100%',
} as const

export const UI_STYLE = {
  transition: 'all 0.2s ease',
  backgroundTransition: 'background-color 0.2s ease',
  removeButtonLineHeight: '1',
  mediumFontWeight: 500,
  busyOpacity: 0.6,
  floatingZIndex: 10,
} as const

export const RECORDING_TIMER_INTERVAL_MS = 1000
