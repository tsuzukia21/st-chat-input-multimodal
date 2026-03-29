import { useCallback } from 'react'
import { FRAME_HEIGHT, UI_LAYOUT, UI_STYLE } from '../constants'

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
      isRecording,
      isTranscribing,
      hasContent,
      disabled,
      uploadedFilesLength
    } = options
    
    return {
      outerContainer: {
        width: UI_LAYOUT.fullWidth,
        backgroundColor: backgroundColor,
        padding: UI_LAYOUT.outerContainerPadding,
        display: 'flex',
        flexDirection: 'column',
        gap: UI_LAYOUT.outerContainerGap,
        minHeight: UI_LAYOUT.outerContainerMinHeight,
      } as React.CSSProperties,

      filePreviewContainer: {
        marginBottom: uploadedFilesLength > 0 ? UI_LAYOUT.filePreviewGap : UI_LAYOUT.zeroSpacing,
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: UI_LAYOUT.filePreviewGap,
      } as React.CSSProperties,

      filePreview: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: secondaryBackgroundColor,
        border: '1px solid rgba(49, 51, 63, 0.2)',
        borderRadius: UI_LAYOUT.filePreviewBorderRadius,
        padding: UI_LAYOUT.filePreviewPadding,
        fontSize: UI_LAYOUT.filePreviewFontSize,
        color: textColor,
        gap: UI_LAYOUT.filePreviewGap,
      } as React.CSSProperties,

      fileInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: UI_LAYOUT.fileInfoGap,
      } as React.CSSProperties,

      fileName: {
        fontWeight: UI_STYLE.mediumFontWeight,
        maxWidth: UI_LAYOUT.fileNameMaxWidth,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      } as React.CSSProperties,

      fileSize: {
        color: '#9ca3af',
        fontSize: UI_LAYOUT.fileSizeFontSize,
      } as React.CSSProperties,

      removeButton: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: UI_LAYOUT.controlFontSize,
        lineHeight: UI_STYLE.removeButtonLineHeight,
        padding: UI_LAYOUT.removeButtonPadding,
        borderRadius: UI_LAYOUT.circleBorderRadius,
        width: UI_LAYOUT.removeButtonSize,
        height: UI_LAYOUT.removeButtonSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: UI_STYLE.backgroundTransition,
      } as React.CSSProperties,
      
      container: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: UI_LAYOUT.zeroSpacing,
        padding: UI_LAYOUT.zeroSpacing,
        backgroundColor: isDragOver ? `${primaryColor}20` : secondaryBackgroundColor,
        borderRadius: UI_LAYOUT.controlBorderRadius,
        border: `2px solid ${isDragOver ? primaryColor : (isFocused ? primaryColor : 'rgba(49, 51, 63, 0.2)')}`,
        transition: UI_STYLE.transition,
        fontFamily: theme?.font || 'sans-serif',
        minHeight: UI_LAYOUT.outerContainerMinHeight,
        position: 'relative',
        width: UI_LAYOUT.fullWidth,
      } as React.CSSProperties,

      addButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${FRAME_HEIGHT.base}px`,
        height: `${FRAME_HEIGHT.base}px`,
        backgroundColor: 'transparent',
        color: textColor,
        border: 'none',
        borderRadius: UI_LAYOUT.circleBorderRadius,
        cursor: 'pointer',
        transition: UI_STYLE.transition,
        marginLeft: UI_LAYOUT.controlMargin,
        marginTop: UI_LAYOUT.controlMargin,
        fontSize: UI_LAYOUT.controlFontSize,
        outline: 'none',
        alignSelf: 'flex-start',
      } as React.CSSProperties,

      voiceButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${FRAME_HEIGHT.base}px`,
        height: `${FRAME_HEIGHT.base}px`,
        backgroundColor: isRecording ? '#ef4444' : 'transparent',
        color: isRecording ? '#ffffff' : (isTranscribing ? '#f59e0b' : textColor),
        border: 'none',
        borderRadius: UI_LAYOUT.circleBorderRadius,
        cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
        transition: UI_STYLE.transition,
        fontSize: UI_LAYOUT.controlFontSize,
        outline: 'none',
        position: 'relative',
        marginTop: UI_LAYOUT.controlMargin,
        alignSelf: 'flex-start',
      } as React.CSSProperties,

      recordingStatus: {
        position: 'absolute',
        top: UI_LAYOUT.recordingStatusTop,
        left: UI_LAYOUT.recordingStatusLeft,
        transform: UI_LAYOUT.recordingStatusTransform,
        fontSize: UI_LAYOUT.recordingStatusFontSize,
        color: '#ef4444',
        whiteSpace: 'nowrap' as const,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: UI_LAYOUT.recordingStatusPadding,
        borderRadius: UI_LAYOUT.recordingStatusBorderRadius,
        border: '1px solid rgba(239, 68, 68, 0.3)',
        zIndex: UI_STYLE.floatingZIndex,
      } as React.CSSProperties,
      
      textArea: {
        flex: 1,
        minHeight: `${FRAME_HEIGHT.minTextArea}px`,
        maxHeight: `${FRAME_HEIGHT.maxTextArea}px`,
        padding: UI_LAYOUT.textAreaPadding,
        border: 'none',
        outline: 'none',
        resize: 'none' as const,
        fontSize: UI_LAYOUT.textAreaFontSize,
        lineHeight: UI_LAYOUT.textAreaLineHeight,
        backgroundColor: 'transparent',
        color: textColor,
        fontFamily: 'inherit',
        borderRadius: UI_LAYOUT.controlBorderRadius,
        opacity: isRecording || isTranscribing ? UI_STYLE.busyOpacity : 1,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        boxSizing: 'border-box',
      } as React.CSSProperties,
      
      sendButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${FRAME_HEIGHT.base}px`,
        height: `${FRAME_HEIGHT.base}px`,
        backgroundColor: 'transparent',
        color: hasContent && !isRecording && !isTranscribing ? primaryColor : 'rgba(49, 51, 63, 0.4)',
        border: 'none',
        borderRadius: UI_LAYOUT.circleBorderRadius,
        cursor: hasContent && !disabled && !isRecording && !isTranscribing ? 'pointer' : 'not-allowed',
        transition: UI_STYLE.transition,
        marginRight: UI_LAYOUT.controlMargin,
        marginTop: UI_LAYOUT.controlMargin,
        fontSize: UI_LAYOUT.controlFontSize,
        alignSelf: 'flex-start',
      } as React.CSSProperties,
      
      charCounter: {
        fontSize: UI_LAYOUT.filePreviewFontSize,
        color: '#9ca3af',
        marginRight: UI_LAYOUT.charCounterMarginRight,
        alignSelf: 'flex-end',
        paddingBottom: UI_LAYOUT.filePreviewGap,
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
        borderRadius: UI_LAYOUT.controlBorderRadius,
        display: isDragOver ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: UI_LAYOUT.dragOverlayFontSize,
        color: primaryColor,
        fontWeight: UI_STYLE.mediumFontWeight,
        pointerEvents: 'none',
      } as React.CSSProperties,
    }
  }, [theme, options])
} 
