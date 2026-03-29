import type { ErrorState } from '../types'

export const createErrorState = (
  message: string,
  type: ErrorState['type'] = 'error'
): ErrorState => ({
  message,
  type,
})

export const logError = (context: string, error: unknown): void => {
  if (!import.meta.env.PROD) {
    console.error(`[${context}]`, error)
  }
}
