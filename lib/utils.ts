import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Error handling utility for toast notifications
export const showErrorToast = (error: unknown, defaultMessage: string = 'An error occurred') => {
  let message = defaultMessage
  
  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as { message: string }).message)
  }
  
  // Return error message for components to use with their toast system
  return message
}
