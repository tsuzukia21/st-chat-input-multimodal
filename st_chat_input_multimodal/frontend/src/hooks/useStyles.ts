import { useCallback } from 'react'

interface Theme {
  primaryColor?: string
  backgroundColor?: string
  secondaryBackgroundColor?: string
  textColor?: string
  font?: string
}

interface StyleOptions {
  isFocused: boolean
  isDragOver: boolean
  isAddButtonPressed: boolean
  isRecording: boolean
  isTranscribing: boolean
  hasContent: boolean
  disabled: boolean
  uploadedFilesLength: number
}

export const useStyles = (theme: Theme | undefined, options: StyleOptions) => {
  return useCallback((): Record<string, React.CSSProperties> => {
    const primaryColor = theme?.primaryColor || "#ff6b6b"
    const backgroundColor = theme?.backgroundColor || "#ffffff"
    const secondaryBackgroundColor = theme?.secondaryBackgroundColor || "#f0f2f6"
    const textColor = theme?.textColor || "#262730"

    const {
      isFocused,
      isDragOver,
      isAddButtonPressed,
      isRecording,
      isTranscribing,
      hasContent,
      disabled,
      uploadedFilesLength
    } = options
    
    return {
      outerContainer: {
        width: '100%',
        backgroundColor: backgroundColor,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '48px',
      } as React.CSSProperties,

      filePreviewContainer: {
        marginBottom: uploadedFilesLength > 0 ? '8px' : '0',
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '8px',
      } as React.CSSProperties,

      filePreview: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: secondaryBackgroundColor,
        border: '1px solid rgba(49, 51, 63, 0.2)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        color: textColor,
        gap: '8px',
      } as React.CSSProperties,

      fileInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
      } as React.CSSProperties,

      fileName: {
        fontWeight: '500',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      } as React.CSSProperties,

      fileSize: {
        color: '#9ca3af',
        fontSize: '11px',
      } as React.CSSProperties,

      removeButton: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: '16px',
        lineHeight: '1',
        padding: '2px',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
      } as React.CSSProperties,
      
      container: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0px',
        padding: '0px',
        backgroundColor: isDragOver ? `${primaryColor}20` : secondaryBackgroundColor,
        borderRadius: '24px',
        border: `2px solid ${isDragOver ? primaryColor : (isFocused ? primaryColor : 'rgba(49, 51, 63, 0.2)')}`,
        transition: 'all 0.2s ease',
        fontFamily: theme?.font || 'sans-serif',
        minHeight: '48px',
        position: 'relative',
        width: '100%',
      } as React.CSSProperties,

      addButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        backgroundColor: isAddButtonPressed ? 'rgba(128, 128, 128, 0.2)' : 'transparent',
        color: textColor,
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginLeft: '4px',
        marginTop: '4px',
        fontSize: '16px',
        outline: 'none',
        alignSelf: 'flex-start',
      } as React.CSSProperties,

      voiceButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        backgroundColor: isRecording ? '#ef4444' : 'transparent',
        color: isRecording ? '#ffffff' : (isTranscribing ? '#f59e0b' : textColor),
        border: 'none',
        borderRadius: '50%',
        cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '16px',
        outline: 'none',
        position: 'relative',
        marginTop: '4px',
        alignSelf: 'flex-start',
      } as React.CSSProperties,

      recordingStatus: {
        position: 'absolute',
        top: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '8px',
        color: '#ef4444',
        whiteSpace: 'nowrap' as const,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '1px 4px',
        borderRadius: '3px',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        zIndex: 10,
      } as React.CSSProperties,
      
      textArea: {
        flex: 1,
        minHeight: '46px',
        maxHeight: '320px',
        padding: '12px 16px',
        border: 'none',
        outline: 'none',
        resize: 'none' as const,
        fontSize: '16px',
        lineHeight: '1.5',
        backgroundColor: 'transparent',
        color: textColor,
        fontFamily: 'inherit',
        borderRadius: '24px',
        opacity: isRecording || isTranscribing ? 0.6 : 1,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        boxSizing: 'border-box',
      } as React.CSSProperties,
      
      sendButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        backgroundColor: 'transparent',
        color: hasContent && !isRecording && !isTranscribing ? primaryColor : 'rgba(49, 51, 63, 0.4)',
        border: 'none',
        borderRadius: '50%',
        cursor: hasContent && !disabled && !isRecording && !isTranscribing ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s ease',
        marginRight: '4px',
        marginTop: '4px',
        fontSize: '16px',
        alignSelf: 'flex-start',
      } as React.CSSProperties,
      
      charCounter: {
        fontSize: '12px',
        color: '#9ca3af',
        marginRight: '8px',
        alignSelf: 'flex-end',
        paddingBottom: '8px',
      } as React.CSSProperties,

      hiddenFileInput: {
        display: 'none',
      } as React.CSSProperties,

      dragOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `${primaryColor}10`,
        borderRadius: '24px',
        display: isDragOver ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: primaryColor,
        fontWeight: '500',
        pointerEvents: 'none',
      } as React.CSSProperties,
    }
  }, [theme, options])
} 