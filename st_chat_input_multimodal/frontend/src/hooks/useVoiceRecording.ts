import { useState, useRef, useCallback, useEffect } from 'react'
import {
  AudioMetadata,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  VoiceRecognitionMethod,
} from '../types'
import { RECORDING_TIMER_INTERVAL_MS } from '../constants'
import { 
  checkWebSpeechSupport, 
  getSpeechRecognition, 
  sendAudioForTranscription,
  formatRecordingTime 
} from '../utils/audioUtils'

interface UseVoiceRecordingProps {
  voiceRecognitionMethod: VoiceRecognitionMethod
  voiceLanguage: string
  maxRecordingTime: number
  transcriptionResult?: string
  onTextUpdate: (text: string) => void
}

export const useVoiceRecording = ({
  voiceRecognitionMethod,
  voiceLanguage,
  maxRecordingTime,
  transcriptionResult,
  onTextUpdate
}: UseVoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null)
  
  const recordingTimerRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeRef = useRef<number>(0)
  const lastRecordingDurationRef = useRef<number>(0)

  useEffect(() => {
    recordingTimeRef.current = recordingTime
  }, [recordingTime])

  useEffect(() => {
    if (voiceRecognitionMethod !== 'openai_whisper' || transcriptionResult === undefined) {
      return
    }

    if (transcriptionResult) {
      onTextUpdate(transcriptionResult)
      setAudioMetadata({
        used_voice_input: true,
        transcription_method: 'openai_whisper',
        recording_duration: lastRecordingDurationRef.current,
        language: voiceLanguage
      })
    }

    setIsTranscribing(false)
  }, [voiceRecognitionMethod, transcriptionResult, voiceLanguage, onTextUpdate])

  /**
   * Start recording timer
   */
  const startRecordingTimer = useCallback(() => {
    setRecordingTime(0)
    recordingTimeRef.current = 0
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxRecordingTime) {
          stopVoiceRecording()
          return prev
        }
        const next = prev + 1
        recordingTimeRef.current = next
        return next
      })
    }, RECORDING_TIMER_INTERVAL_MS)
  }, [maxRecordingTime])

  /**
   * Stop recording timer
   */
  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current)
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
    
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
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
    
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
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
  const handleRecordingComplete = useCallback(async (mimeType?: string) => {
    if (voiceRecognitionMethod === "openai_whisper" && audioChunksRef.current.length > 0) {
      setIsTranscribing(true)
      
      try {
        await sendAudioForTranscription(
          audioChunksRef.current,
          voiceLanguage,
          mimeType
        )

        audioChunksRef.current = []
      } catch (error) {
        setIsTranscribing(false)
        console.error('Audio transcription request error:', error)
        alert('Transcription failed. Please try again.')
      }
    }
  }, [voiceRecognitionMethod, voiceLanguage])

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
        handleRecordingComplete(recorder.mimeType)
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
    lastRecordingDurationRef.current = recordingTimeRef.current

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
