import toast from 'react-hot-toast';

// Error types for different scenarios
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  MICROPHONE: 'MICROPHONE_ERROR',
  AUDIO: 'AUDIO_ERROR',
  API: 'API_ERROR',
  FIREBASE: 'FIREBASE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Error messages for different scenarios
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
    userMessage: 'Network connection issue. Please try again.'
  },
  [ERROR_TYPES.AUTH]: {
    title: 'Authentication Error',
    message: 'There was an issue with authentication.',
    userMessage: 'Please sign in again.'
  },
  [ERROR_TYPES.MICROPHONE]: {
    title: 'Microphone Access Denied',
    message: 'Microphone permission was denied or not available.',
    userMessage: 'Please allow microphone access to use voice features.'
  },
  [ERROR_TYPES.AUDIO]: {
    title: 'Audio Error',
    message: 'There was an issue with audio playback.',
    userMessage: 'Audio playback failed. Please try again.'
  },
  [ERROR_TYPES.API]: {
    title: 'Service Error',
    message: 'The AI service is temporarily unavailable.',
    userMessage: 'VIBE is having trouble responding. Please try again.'
  },
  [ERROR_TYPES.FIREBASE]: {
    title: 'Data Error',
    message: 'There was an issue saving your data.',
    userMessage: 'Unable to save your conversation. Please try again.'
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    userMessage: 'Something went wrong. Please try again.'
  }
};

// Rate limiting error messages
const RATE_LIMIT_MESSAGES = {
  title: 'Rate Limit Exceeded',
  message: 'Too many requests. Please wait a moment before trying again.',
  userMessage: 'Please wait a moment before sending another message.'
};

// API quota exceeded messages
const QUOTA_MESSAGES = {
  title: 'Service Limit Reached',
  message: 'The AI service has reached its daily limit.',
  userMessage: 'VIBE is temporarily unavailable due to high usage.'
};

/**
 * Determine error type based on error object
 */
export const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || 
      errorMessage.includes('connection') || error.name === 'TypeError') {
    return ERROR_TYPES.NETWORK;
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('permission') ||
      errorCode.includes('auth')) {
    return ERROR_TYPES.AUTH;
  }

  // Microphone errors
  if (errorMessage.includes('microphone') || errorMessage.includes('permission denied') ||
      error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
    return ERROR_TYPES.MICROPHONE;
  }

  // Audio errors
  if (errorMessage.includes('audio') || errorMessage.includes('playback') ||
      error.name === 'NotSupportedError') {
    return ERROR_TYPES.AUDIO;
  }

  // Firebase errors
  if (errorMessage.includes('firebase') || errorMessage.includes('firestore') ||
      errorCode.includes('firestore')) {
    return ERROR_TYPES.FIREBASE;
  }

  // API errors
  if (errorMessage.includes('api') || errorMessage.includes('service') ||
      error.status >= 400) {
    return ERROR_TYPES.API;
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * Get appropriate error message based on error type and context
 */
export const getErrorMessage = (error, context = '') => {
  const errorType = getErrorType(error);
  
  // Check for specific error conditions
  if (error.status === 429) {
    return RATE_LIMIT_MESSAGES;
  }
  
  if (error.status === 503 || error.message?.includes('quota')) {
    return QUOTA_MESSAGES;
  }

  return ERROR_MESSAGES[errorType];
};

/**
 * Log error for debugging
 */
export const logError = (error, context = '') => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    type: getErrorType(error),
    message: error.message,
    stack: error.stack,
    status: error.status,
    code: error.code
  };

  console.error('VIBE Error:', errorInfo);
  
  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service (e.g., Sentry, LogRocket)
  }
};

/**
 * Handle error and show user-friendly notification
 */
export const handleError = (error, context = '', showToast = true) => {
  const errorInfo = getErrorMessage(error, context);
  
  // Log the error
  logError(error, context);
  
  // Show user-friendly toast notification
  if (showToast) {
    toast.error(errorInfo.userMessage, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#dc2626',
        color: '#ffffff',
        border: '1px solid #ef4444',
      },
    });
  }
  
  return errorInfo;
};

/**
 * Handle API response errors
 */
export const handleApiError = async (response, context = '') => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP ${response.status}` };
    }
    
    const error = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    
    return handleError(error, context);
  }
  
  return null;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Check if user is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Handle offline/online state changes
 */
export const handleConnectivityChange = () => {
  if (!isOnline()) {
    toast.error('You are offline. Some features may not work.', {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#f59e0b',
        color: '#ffffff',
        border: '1px solid #fbbf24',
      },
    });
  } else {
    toast.success('Back online!', {
      duration: 2000,
      position: 'top-right',
    });
  }
};

/**
 * Initialize connectivity monitoring
 */
export const initConnectivityMonitoring = () => {
  window.addEventListener('online', handleConnectivityChange);
  window.addEventListener('offline', handleConnectivityChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleConnectivityChange);
    window.removeEventListener('offline', handleConnectivityChange);
  };
}; 