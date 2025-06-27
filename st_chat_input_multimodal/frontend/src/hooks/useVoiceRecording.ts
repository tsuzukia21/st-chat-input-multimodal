import { useState, useRef, useCallback } from 'react'
import { AudioMetadata } from '../types'
import { 
  checkWebSpeechSupport, 
  getSpeechRecognition, 
  transcribeWithOpenAI,
  formatRecordingTime 
} from '../utils/audioUtils'

interface UseVoiceRecordingProps {
  voiceRecognitionMethod: "web_speech" | "openai_whisper"
  openaiApiKey?: string
  voiceLanguage: string
  maxRecordingTime: number
  onTextUpdate: (text: string) => void
}

export const useVoiceRecording = ({
  voiceRecognitionMethod,
  openaiApiKey,
  voiceLanguage,
  maxRecordingTime,
  onTextUpdate
}: UseVoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null)
  
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])

  /**
   * Start recording timer
   */
  const startRecordingTimer = useCallback(() => {
    setRecordingTime(0)
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxRecordingTime) {
          stopVoiceRecording()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }, [maxRecordingTime])

  /**
   * Stop recording timer
   */
  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }, [])

  /**
   * Start voice recognition using Web Speech API
   */
  const startWebSpeechRecognition = useCallback(() => {
    if (!checkWebSpeechSupport()) return
    
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return
    
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = voiceLanguage
    
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      
      if (finalTranscript) {
        onTextUpdate(finalTranscript)
        setAudioMetadata({
          used_voice_input: true,
          transcription_method: "web_speech",
          recording_duration: recordingTime,
          confidence: event.results[event.results.length - 1][0].confidence || undefined,
          language: voiceLanguage
        })
      }
    }
    
    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error)
      if (event.error !== 'aborted') {
        alert(`Voice recognition error: ${event.error}`)
      }
    }
    
    recognitionRef.current = recognition
    recognition.start()
  }, [voiceLanguage, recordingTime, onTextUpdate])

  /**
   * Handle recording completion
   */
  const handleRecordingComplete = useCallback(async () => {
    if (voiceRecognitionMethod === "openai_whisper" && audioChunksRef.current.length > 0) {
      if (!openaiApiKey) {
        alert('OpenAI API key is not configured')
        return
      }

      setIsTranscribing(true)
      
      try {
        const transcription = await transcribeWithOpenAI(
          audioChunksRef.current,
          openaiApiKey,
          voiceLanguage
        )
        
        if (transcription) {
          onTextUpdate(transcription)
          setAudioMetadata({
            used_voice_input: true,
            transcription_method: "openai_whisper",
            recording_duration: recordingTime,
            language: voiceLanguage
          })
        }
        
      } catch (error) {
        console.error('OpenAI transcription error:', error)
        alert('Transcription failed. Please check your API key and connection.')
      } finally {
        setIsTranscribing(false)
      }
    }
  }, [voiceRecognitionMethod, openaiApiKey, voiceLanguage, recordingTime, onTextUpdate])

  /**
   * Start voice recording
   */
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        handleRecordingComplete()
      }
      
      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
      startRecordingTimer()
      
      // Start recognition in parallel when using Web Speech API
      if (voiceRecognitionMethod === "web_speech") {
        startWebSpeechRecognition()
      }
      
    } catch (error) {
      console.error('Microphone access error:', error)
      alert('Microphone access is not permitted. Please check your browser settings.')
    }
  }, [voiceRecognitionMethod, startRecordingTimer, startWebSpeechRecognition, handleRecordingComplete])

  /**
   * Stop voice recording
   */
  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    setIsRecording(false)
    stopRecordingTimer()
  }, [mediaRecorder, stopRecordingTimer])

  /**
   * Voice button click handler
   */
  const handleVoiceButtonClick = useCallback(() => {
    if (isRecording) {
      stopVoiceRecording()
    } else {
      startVoiceRecording()
    }
  }, [isRecording, stopVoiceRecording, startVoiceRecording])

  /**
   * Clear audio metadata
   */
  const clearAudioMetadata = useCallback(() => {
    setAudioMetadata(null)
  }, [])

  return {
    isRecording,
    recordingTime,
    isTranscribing,
    audioMetadata,
    handleVoiceButtonClick,
    clearAudioMetadata,
    formatRecordingTime: () => formatRecordingTime(recordingTime)
  }
} 