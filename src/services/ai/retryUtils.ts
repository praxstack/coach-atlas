/**
 * Retry Utilities with Exponential Backoff
 * Handles transient network errors and rate limiting
 */

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay between retries */
  maxDelayMs: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatusCodes: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoff(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (±20%) to prevent thundering herd
  const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(
  error: unknown,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // Check for HTTP status code in error
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limited
    if (message.includes("rate limit") || message.includes("429")) {
      return true;
    }

    // Overloaded
    if (message.includes("overload") || message.includes("529")) {
      return true;
    }

    // Server errors
    if (
      message.includes("500") ||
      message.includes("502") ||
      message.includes("503") ||
      message.includes("504")
    ) {
      return true;
    }

    // Timeout
    if (message.includes("timeout") || message.includes("timed out")) {
      return true;
    }
  }

  return false;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Result of the function
 * @throws Last error after all retries exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < fullConfig.maxRetries && isRetryableError(error, fullConfig)) {
        const delay = calculateBackoff(attempt, fullConfig);

        if (import.meta.env.DEV) {
          console.debug(
            `[Retry] Attempt ${attempt + 1}/${fullConfig.maxRetries} failed. ` +
              `Retrying in ${delay}ms...`
          );
        }

        await sleep(delay);
      } else {
        // Not retryable or max retries reached
        throw lastError;
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error("Retry failed");
}

/**
 * Retry a streaming generator with backoff
 * Note: Only retries the initial connection, not mid-stream failures
 */
export async function* withStreamRetry<T>(
  fn: () => AsyncGenerator<T>,
  config: Partial<RetryConfig> = {}
): AsyncGenerator<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      // Try to start the generator
      const generator = fn();

      // If we get here, the connection succeeded
      // Yield all values from the generator
      for await (const value of generator) {
        yield value;
      }

      // Successfully completed
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < fullConfig.maxRetries && isRetryableError(error, fullConfig)) {
        const delay = calculateBackoff(attempt, fullConfig);

        if (import.meta.env.DEV) {
          console.debug(
            `[StreamRetry] Attempt ${attempt + 1}/${fullConfig.maxRetries} failed. ` +
              `Retrying in ${delay}ms...`
          );
        }

        await sleep(delay);
      } else {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Stream retry failed");
}
