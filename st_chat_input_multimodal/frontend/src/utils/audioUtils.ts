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
export const getSpeechRecognition = (): any => {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
}

/**
 * Transcribe with OpenAI Whisper API
 */
export const transcribeWithOpenAI = async (
  audioChunks: Blob[],
  apiKey: string,
  language: string
): Promise<string> => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', language.split('-')[0]) // "ja-JP" -> "ja"
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }
  
  const result = await response.json()
  return result.text || ''
} 