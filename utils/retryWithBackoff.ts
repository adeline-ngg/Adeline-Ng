/**
 * Retry utility with exponential backoff and jitter
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  shouldRetry: (error: any) => {
    // Don't retry on non-retryable errors
    if (error?.name === 'QuotaExceededError' || 
        error?.name === 'FalConfigurationError' ||
        error?.message?.includes('quota') ||
        error?.message?.includes('configuration') ||
        error?.message?.includes('API key')) {
      return false;
    }
    
    // Retry on network errors, timeouts, and temporary API errors
    return true;
  }
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add jitter to prevent thundering herd problem
 */
function addJitter(delay: number): number {
  // Add random jitter of ±25% to the delay
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries + 1}`);
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Log error details for debugging
      console.log(`Retry attempt ${attempt + 1} failed:`, {
        error: error?.message || error,
        name: error?.name || 'Unknown',
        shouldRetry: config.shouldRetry(error)
      });
      
      // Check if we should retry this error
      if (!config.shouldRetry(error)) {
        console.log(`Error is not retryable: ${error?.message || error}`);
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        console.log(`Max retries (${config.maxRetries}) exceeded`);
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const baseDelay = config.initialDelayMs * Math.pow(2, attempt);
      const delay = Math.min(baseDelay, config.maxDelayMs);
      const jitteredDelay = addJitter(delay);
      
      console.log(`Retry in ${Math.round(jitteredDelay)}ms (attempt ${attempt + 1}/${config.maxRetries})`);
      await sleep(jitteredDelay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry configuration specifically for FAL API calls
 */
export const FAL_RETRY_CONFIG: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 2000, // Start with 2 seconds for FAL API
  maxDelayMs: 30000, // Max 30 seconds
  shouldRetry: (error: any) => {
    // Don't retry on quota or configuration errors
    if (error?.name === 'QuotaExceededError' || 
        error?.name === 'FalConfigurationError' ||
        error?.message?.includes('quota') ||
        error?.message?.includes('configuration') ||
        error?.message?.includes('API key')) {
      return false;
    }
    
    // Retry on network errors, timeouts, and temporary API errors
    if (error?.message?.includes('timeout') ||
        error?.message?.includes('network') ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('temporary') ||
        error?.message?.includes('rate limit') ||
        error?.message?.includes('server error')) {
      return true;
    }
    
    // Default to retry for unknown errors
    return true;
  }
};
