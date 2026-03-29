import { useState, useRef, useCallback, useEffect } from 'react'
import {
  AudioMetadata,
  ErrorState,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
  VoiceRecognitionMethod,
} from '../types'
import { RECORDING_TIMER_INTERVAL_MS } from '../constants'
import { createErrorState, logError } from '../utils/errorUtils'
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
  transcriptionError?: string
  onTextUpdate: (text: string) => void
  onError?: (error: ErrorState) => void
  onClearError?: () => void
}

const getSpeechRecognitionErrorMessage = (error: string): string => {
  switch (error) {
    case 'audio-capture':
      return 'No microphone was detected. Please check your device settings.'
    case 'network':
      return 'Voice recognition is temporarily unavailable. Please try again.'
    case 'no-speech':
      return 'No speech was detected. Please try again.'
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is not permitted. Please check your browser settings.'
    default:
      return 'Voice recognition failed. Please try again.'
  }
}

export const useVoiceRecording = ({
  voiceRecognitionMethod,
  voiceLanguage,
  maxRecordingTime,
  transcriptionResult,
  transcriptionError,
  onTextUpdate,
  onError,
  onClearError,
}: UseVoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null)
  
  const recordingTimerRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimeRef = useRef<number>(0)
  const lastRecordingDurationRef = useRef<number>(0)
  const discardRecordingRef = useRef<boolean>(false)
  const isUnmountedRef = useRef<boolean>(false)

  const reportError = useCallback((
    message: string,
    type: ErrorState['type'] = 'error'
  ) => {
    onError?.(createErrorState(message, type))
  }, [onError])

  useEffect(() => {
    recordingTimeRef.current = recordingTime
  }, [recordingTime])

  useEffect(() => {
    if (transcriptionResult === undefined && transcriptionError === undefined) {
      return
    }

    if (transcriptionError) {
      reportError(transcriptionError)
      setIsTranscribing(false)
      return
    }

    if (transcriptionResult) {
      onClearError?.()
      onTextUpdate(transcriptionResult)
      setAudioMetadata({
        used_voice_input: true,
        transcription_method: 'openai_whisper',
        recording_duration: lastRecordingDurationRef.current,
        language: voiceLanguage
      })
    }

    setIsTranscribing(false)
  }, [
    transcriptionResult,
    transcriptionError,
    voiceLanguage,
    onTextUpdate,
    onClearError,
    reportError,
  ])

  const clearAudioChunks = useCallback(() => {
    audioChunksRef.current = []
  }, [])

  const releaseMediaStream = useCallback(() => {
    if (!mediaStreamRef.current) {
      return
    }

    mediaStreamRef.current.getTracks().forEach(track => track.stop())
    mediaStreamRef.current = null
  }, [])

  /**
   * Stop recording timer
   */
  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }, [])

  const stopSpeechRecognition = useCallback((abort = false) => {
    const recognition = recognitionRef.current
    recognitionRef.current = null

    if (!recognition) {
      return
    }

    try {
      recognition.stop()
    } catch (error) {
      logError('Voice recognition stop error', error)
    }

    if (!abort) {
      return
    }

    try {
      recognition.abort()
    } catch (error) {
      logError('Voice recognition abort error', error)
    }
  }, [])

  const stopMediaRecorder = useCallback((discardRecording = false) => {
    const recorder = mediaRecorderRef.current

    if (!recorder) {
      discardRecordingRef.current = false

      if (discardRecording) {
        clearAudioChunks()
      }

      releaseMediaStream()
      return
    }

    discardRecordingRef.current = discardRecording

    if (recorder.state === 'inactive') {
      mediaRecorderRef.current = null
      discardRecordingRef.current = false

      if (discardRecording) {
        clearAudioChunks()
      }

      releaseMediaStream()
      return
    }

    try {
      recorder.stop()
    } catch (error) {
      logError('MediaRecorder stop error', error)
      mediaRecorderRef.current = null
      discardRecordingRef.current = false

      if (discardRecording) {
        clearAudioChunks()
      }

      releaseMediaStream()
    }
  }, [clearAudioChunks, releaseMediaStream])

  const stopCurrentRecording = useCallback((options?: {
    abortRecognition?: boolean
    discardRecording?: boolean
    updateRecordingState?: boolean
  }) => {
    const {
      abortRecognition = false,
      discardRecording = false,
      updateRecordingState = true,
    } = options ?? {}

    lastRecordingDurationRef.current = recordingTimeRef.current
    stopRecordingTimer()
    stopSpeechRecognition(abortRecognition)
    stopMediaRecorder(discardRecording)

    if (updateRecordingState && !isUnmountedRef.current) {
      setIsRecording(false)
    }
  }, [stopMediaRecorder, stopRecordingTimer, stopSpeechRecognition])

  /**
   * Start recording timer
   */
  const startRecordingTimer = useCallback(() => {
    stopRecordingTimer()
    setRecordingTime(0)
    recordingTimeRef.current = 0
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxRecordingTime) {
          stopCurrentRecording()
          return prev
        }
        const next = prev + 1
        recordingTimeRef.current = next
        return next
      })
    }, RECORDING_TIMER_INTERVAL_MS)
  }, [maxRecordingTime, stopCurrentRecording, stopRecordingTimer])

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      stopCurrentRecording({
        abortRecognition: true,
        discardRecording: true,
        updateRecordingState: false,
      })
      clearAudioChunks()
    }
  }, [clearAudioChunks, stopCurrentRecording])

  /**
   * Start voice recognition using Web Speech API
   */
  const startWebSpeechRecognition = useCallback(() => {
    if (!checkWebSpeechSupport()) {
      reportError('Voice input is not supported in this browser.', 'warning')
      return
    }
    
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      reportError('Voice input is not supported in this browser.', 'warning')
      return
    }
    
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
          recording_duration: recordingTimeRef.current,
          confidence: event.results[event.results.length - 1][0].confidence || undefined,
          language: voiceLanguage
        })
      }
    }
    
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error !== 'aborted') {
        logError('Voice recognition error', event.error)
        reportError(getSpeechRecognitionErrorMessage(event.error))
      }
    }
    
    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (error) {
      recognitionRef.current = null
      logError('Voice recognition start error', error)
      reportError('Voice recognition failed. Please try again.')
    }
  }, [voiceLanguage, onTextUpdate, reportError])

  /**
   * Handle recording completion
   */
  const handleRecordingComplete = useCallback(async (mimeType?: string) => {
    if (voiceRecognitionMethod !== "openai_whisper" || audioChunksRef.current.length === 0) {
      clearAudioChunks()
      return
    }

    const audioChunks = [...audioChunksRef.current]
    setIsTranscribing(true)
    
    try {
      await sendAudioForTranscription(
        audioChunks,
        voiceLanguage,
        mimeType
      )

      clearAudioChunks()
    } catch (error) {
      if (!isUnmountedRef.current) {
        setIsTranscribing(false)
      }
      logError('Audio transcription request error', error)
      reportError('Transcription failed. Please try again.')
    }
  }, [clearAudioChunks, voiceRecognitionMethod, voiceLanguage, reportError])

  /**
   * Start voice recording
   */
  const startVoiceRecording = useCallback(async () => {
    if (voiceRecognitionMethod === 'web_speech') {
      const SpeechRecognition = getSpeechRecognition()

      if (!checkWebSpeechSupport() || !SpeechRecognition) {
        reportError('Voice input is not supported in this browser.', 'warning')
        return
      }
    }

    onClearError?.()

    let stream: MediaStream | null = null

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      discardRecordingRef.current = false
      clearAudioChunks()
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        releaseMediaStream()
        mediaRecorderRef.current = null

        if (discardRecordingRef.current) {
          discardRecordingRef.current = false
          clearAudioChunks()
          return
        }

        void handleRecordingComplete(recorder.mimeType)
      }
      
      recorder.start()
      setIsRecording(true)
      startRecordingTimer()
      
      // Start recognition in parallel when using Web Speech API
      if (voiceRecognitionMethod === "web_speech") {
        startWebSpeechRecognition()
      }
      
    } catch (error) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (mediaStreamRef.current === stream) {
        mediaStreamRef.current = null
      }
      mediaRecorderRef.current = null
      clearAudioChunks()
      logError('Microphone access error', error)
      reportError('Microphone access is not permitted. Please check your browser settings.')
    }
  }, [
    voiceRecognitionMethod,
    onClearError,
    reportError,
    startRecordingTimer,
    startWebSpeechRecognition,
    handleRecordingComplete,
    clearAudioChunks,
    releaseMediaStream,
  ])

  /**
   * Stop voice recording
   */
  const stopVoiceRecording = useCallback(() => {
    stopCurrentRecording()
  }, [stopCurrentRecording])

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
