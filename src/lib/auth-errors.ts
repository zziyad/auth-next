export type AuthErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_TOKEN'
  | 'REFRESH_REUSE'
  | 'RATE_LIMITED'
  | 'INVALID_CREDENTIALS'
  | 'INACTIVE_ACCOUNT'
  | 'CSRF_FORBIDDEN'
  | 'FORBIDDEN'
  | 'SERVER_ERROR'

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  AUTH_REQUIRED: 'Please sign in to continue.',
  INVALID_TOKEN: 'Your session expired. Please sign in again.',
  REFRESH_REUSE: 'Session security issue. Please sign in again.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  INACTIVE_ACCOUNT: 'Your account is inactive. Contact administrator.',
  CSRF_FORBIDDEN: 'Security check failed. Please refresh the page.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
}

export function mapAuthErrorCode(code?: string, fallback = 'Request failed') {
  if (!code) return fallback
  const key = code as AuthErrorCode
  return AUTH_ERROR_MESSAGES[key] || fallback
}


