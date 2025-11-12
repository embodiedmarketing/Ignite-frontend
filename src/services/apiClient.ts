import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced API request with retry logic and error handling
export interface RequestQueue {
  id: string;
  request: () => Promise<Response>;
  resolve: (value: Response) => void;
  reject: (error: Error) => void;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
}

class EnhancedApiClient {
  private requestQueue: Map<string, RequestQueue> = new Map();
  private isProcessing = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Configuration
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1 second
  private readonly MAX_DELAY = 10000; // 10 seconds
  private readonly QUEUE_MAX_SIZE = 100;

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate exponential backoff delay
  private calculateDelay(retryCount: number): number {
    const delay = Math.min(
      this.BASE_DELAY * Math.pow(2, retryCount),
      this.MAX_DELAY
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  // Enhanced API request with retry and queue management
  async apiRequestWithRetry(
    method: string,
    url: string,
    data?: unknown,
    options: {
      maxRetries?: number;
      priority?: "high" | "medium" | "low";
      timeout?: number;
    } = {}
  ): Promise<Response> {
    const {
      maxRetries = this.MAX_RETRIES,
      priority = "medium",
      timeout = 30000,
    } = options;

    return new Promise<Response>((resolve, reject) => {
      const requestId = this.generateRequestId();

      // Check queue size limit
      if (this.requestQueue.size >= this.QUEUE_MAX_SIZE) {
        reject(new Error("Request queue is full. Please try again later."));
        return;
      }

      const requestPromise = async (): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const res = await fetch(url, {
            method,
            headers: data ? { "Content-Type": "application/json" } : {},
            body: data ? JSON.stringify(data) : undefined,
            credentials: "include",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Handle different error types
          if (!res.ok) {
            const errorText = await res.text();
            let errorMessage = errorText || res.statusText;

            // Try to parse JSON error response
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.message) {
                errorMessage = errorJson.message;
              }
            } catch {
              // Not JSON, use text as-is
            }

            const error = new Error(errorMessage);
            error.name = `HttpError${res.status}`;
            throw error;
          }

          return res;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      const queueItem: RequestQueue = {
        id: requestId,
        request: requestPromise,
        resolve,
        reject,
        retryCount: 0,
        maxRetries,
        timestamp: Date.now(),
      };

      // Add to queue based on priority
      this.requestQueue.set(requestId, queueItem);
      this.processQueue();
    });
  }

  // Process the request queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Sort queue by priority and timestamp
      const queueArray = Array.from(this.requestQueue.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      for (const item of queueArray) {
        if (!this.requestQueue.has(item.id)) continue; // Skip if removed

        try {
          const response = await item.request();

          // Success - remove from queue and resolve
          this.requestQueue.delete(item.id);
          this.clearRetryTimeout(item.id);
          item.resolve(response);
        } catch (error) {
          await this.handleRequestError(item, error as Error);
        }
      }
    } finally {
      this.isProcessing = false;

      // Continue processing if queue has items
      if (this.requestQueue.size > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  // Handle request errors with retry logic
  private async handleRequestError(
    item: RequestQueue,
    error: Error
  ): Promise<void> {
    const isRetryableError = this.isRetryableError(error);

    if (item.retryCount < item.maxRetries && isRetryableError) {
      item.retryCount++;
      const delay = this.calculateDelay(item.retryCount - 1);

      console.warn(
        `Request ${item.id} failed, retrying in ${delay}ms (attempt ${item.retryCount}/${item.maxRetries})`,
        error.message
      );

      // Schedule retry
      const timeoutId = setTimeout(() => {
        this.retryTimeouts.delete(item.id);
        // Request will be processed in next queue cycle
      }, delay);

      this.retryTimeouts.set(item.id, timeoutId);
    } else {
      // Max retries reached or non-retryable error
      this.requestQueue.delete(item.id);
      this.clearRetryTimeout(item.id);

      console.error(
        `Request ${item.id} failed permanently after ${item.retryCount} retries:`,
        error
      );
      item.reject(error);
    }
  }

  // Determine if an error is retryable
  private isRetryableError(error: Error): boolean {
    // Never retry authentication errors (they're permanent failures)
    if (
      error.message.includes("credentials") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("password")
    ) {
      return false;
    }

    // Network errors
    if (error.name === "TypeError" || error.message.includes("fetch"))
      return true;

    // Timeout errors
    if (error.name === "AbortError") return true;

    // HTTP status codes that are retryable
    if (error.name.startsWith("HttpError")) {
      const status = parseInt(error.name.replace("HttpError", ""));
      // Don't retry authentication/authorization errors (401, 403) or bad requests (400)
      if (status === 400 || status === 401 || status === 403) {
        return false;
      }
      return status >= 500 || status === 429 || status === 408;
    }

    return false;
  }

  // Clear retry timeout
  private clearRetryTimeout(requestId: string): void {
    const timeoutId = this.retryTimeouts.get(requestId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryTimeouts.delete(requestId);
    }
  }

  // Cancel a specific request
  cancelRequest(requestId: string): boolean {
    const item = this.requestQueue.get(requestId);
    if (item) {
      this.requestQueue.delete(requestId);
      this.clearRetryTimeout(requestId);
      item.reject(new Error("Request cancelled"));
      return true;
    }
    return false;
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    for (const [requestId, item] of this.requestQueue) {
      this.clearRetryTimeout(requestId);
      item.reject(new Error("All requests cancelled"));
    }
    this.requestQueue.clear();
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueSize: this.requestQueue.size,
      isProcessing: this.isProcessing,
      retryingCount: this.retryTimeouts.size,
    };
  }
}

// Create global instance
const enhancedApiClient = new EnhancedApiClient();

// Enhanced API request function (backward compatible)
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: {
    maxRetries?: number;
    priority?: "high" | "medium" | "low";
    timeout?: number;
  }
): Promise<Response> {
  return enhancedApiClient.apiRequestWithRetry(method, url, data, options);
}

// Backward compatible basic API request (with minimal retry)
export async function apiRequestBasic(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  return enhancedApiClient.apiRequestWithRetry(method, url, data, {
    maxRetries: 1,
  });
}

// Transaction support for atomic operations
export async function executeTransaction<T>(
  operations: Array<{
    method: string;
    url: string;
    data?: unknown;
  }>,
  options?: { rollbackOnFailure?: boolean }
): Promise<T[]> {
  const { rollbackOnFailure = true } = options || {};
  const results: T[] = [];
  const completedOperations: Array<{
    method: string;
    url: string;
    data?: unknown;
  }> = [];

  try {
    for (const operation of operations) {
      const response = await apiRequest(
        operation.method,
        operation.url,
        operation.data,
        { priority: "high" }
      );
      const result = await response.json();
      results.push(result);
      completedOperations.push(operation);
    }

    return results;
  } catch (error) {
    console.error("Transaction failed:", error);

    if (rollbackOnFailure && completedOperations.length > 0) {
      console.warn("Attempting rollback...");
      // Note: Rollback implementation would need backend support
      // For now, just log the operations that need rollback
      console.warn("Operations to rollback:", completedOperations);
    }

    throw error;
  }
}

// Export enhanced client for advanced usage
export { enhancedApiClient };

// Enhanced query function with retry support
export const getQueryFn: <T>(options: {
  on401: "returnNull" | "throw";
  maxRetries?: number;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, maxRetries = 2 }) =>
  async ({ queryKey }) => {
    try {
      const response = await apiRequest(
        "GET",
        queryKey[0] as string,
        undefined,
        {
          maxRetries,
          priority: "medium",
        }
      );
      return await response.json();
    } catch (error) {
      if (
        unauthorizedBehavior === "returnNull" &&
        error instanceof Error &&
        error.message.includes("401")
      ) {
        return null;
      }
      throw error;
    }
  };

// Enhanced Query Client with better error handling and retry logic
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", maxRetries: 2 }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408 and 429
        if (error instanceof Error && error.message.includes("4")) {
          const status = parseInt(error.message.split(":")[0]);
          if (
            status >= 400 &&
            status < 500 &&
            status !== 408 &&
            status !== 429
          ) {
            return false;
          }
        }
        // Don't retry on 5xx server errors to prevent infinite loops
        if (error instanceof Error && error.message.includes("5")) {
          return false;
        }
        // Don't retry if error message contains "500" or "Server error"
        if (
          error instanceof Error &&
          (error.message.includes("500") ||
            error.message.includes("Server error"))
        ) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors (4xx)
        if (error instanceof Error && error.message.includes("4")) {
          const status = parseInt(error.message.split(":")[0]);
          if (
            status >= 400 &&
            status < 500 &&
            status !== 408 &&
            status !== 429
          ) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});
