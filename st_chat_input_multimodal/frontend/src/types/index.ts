// File information type definition
export interface FileData {
  name: string
  type: string
  size: number
  data: string // base64 encoded data
}

// Audio metadata type definition
export interface AudioMetadata {
  used_voice_input: boolean
  transcription_method: string
  recording_duration: number
  confidence?: number
  language: string
}

// Component arguments type definition
export interface ComponentArgs {
  placeholder?: string
  max_chars?: number
  accepted_file_types?: string[]
  max_file_size_mb?: number
  // Voice functionality settings
  enable_voice_input?: boolean
  voice_recognition_method?: "web_speech" | "openai_whisper"
  openai_api_key?: string
  voice_language?: string
  max_recording_time?: number
}

// Component result type definition
export interface ComponentResult {
  text: string
  files: FileData[]
  audio_metadata: AudioMetadata | null
  _timestamp: number // Unique timestamp for each submission to allow duplicate content
} 