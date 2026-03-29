import { Streamlit } from 'streamlit-component-lib'
import type { SpeechRecognitionConstructor, TranscriptionRequest } from '../types'

/**
 * Format recording time in MM:SS format
 */
export const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Check Web Speech API support
 */
export const checkWebSpeechSupport = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

/**
 * Get SpeechRecognition constructor
 */
export const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to encode audio data'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read audio data'))
    }

    reader.readAsDataURL(blob)
  })

export const sendAudioForTranscription = async (
  audioChunks: Blob[],
  language: string,
  mimeType = 'audio/webm'
): Promise<void> => {
  if (audioChunks.length === 0) {
    throw new Error('Audio data is empty')
  }

  const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' })
  const request: TranscriptionRequest = {
    type: 'transcription_request',
    audio_data: await blobToDataUrl(audioBlob),
    language,
    request_id: Date.now(),
  }

  Streamlit.setComponentValue(request)
}
