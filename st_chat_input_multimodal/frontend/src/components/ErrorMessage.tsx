import React from 'react'
import type { ErrorState } from '../types'

interface ErrorMessageProps {
  error: ErrorState | null
  onDismiss?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onDismiss,
}) => {
  if (!error?.message) {
    return null
  }

  const isWarning = error.type === 'warning'

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '8px',
        border: `1px solid ${isWarning ? '#f59e0b' : '#ef4444'}`,
        backgroundColor: isWarning ? '#fffbeb' : '#fef2f2',
        color: isWarning ? '#92400e' : '#991b1b',
        fontSize: '14px',
      }}
    >
      <span>{error.message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
