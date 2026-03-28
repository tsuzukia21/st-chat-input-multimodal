export type VoiceRecognitionMethod = 'web_speech' | 'openai_whisper'

export interface SpeechRecognitionAlternativeLike {
  transcript: string
  confidence: number
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternativeLike
}

export interface SpeechRecognitionResultListLike {
  length: number
  [index: number]: SpeechRecognitionResultLike
}

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}

export interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface FileData {
  name: string
  type: string
  size: number
  data: string
}

export interface AudioMetadata {
  used_voice_input: boolean
  transcription_method: string
  recording_duration: number
  confidence?: number
  language: string
}

export interface ErrorState {
  message: string | null
  type: 'error' | 'warning'
}

export interface TranscriptionRequest {
  type: 'transcription_request'
  audio_data: string
  language: string
  request_id: number
}

export interface RawComponentArgs {
  placeholder?: string
  max_chars?: number
  accepted_file_types?: string[]
  max_file_size_mb?: number
  max_files?: number
  enable_voice_input?: boolean
  voice_recognition_method?: VoiceRecognitionMethod
  voice_language?: string
  max_recording_time?: number
  transcription_result?: string
}

export interface ComponentArgs {
  placeholder?: string
  maxChars?: number
  acceptedFileTypes?: string[]
  maxFileSizeMb?: number
  maxFiles?: number
  enableVoiceInput?: boolean
  voiceRecognitionMethod?: VoiceRecognitionMethod
  voiceLanguage?: string
  maxRecordingTime?: number
  transcriptionResult?: string
}

export interface ComponentResult {
  text: string
  files: FileData[]
  audio_metadata: AudioMetadata | null
  _timestamp: number
}
