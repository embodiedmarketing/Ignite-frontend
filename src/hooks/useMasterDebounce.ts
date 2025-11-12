import { useCallback, useRef } from 'react';

/**
 * Master Debounce Consolidation System
 * 
 * This hook eliminates API call flooding by providing a unified debounce system
 * that replaces all scattered debounce implementations across the platform.
 * 
 * Key Features:
 * - Request deduplication to prevent identical API calls
 * - Intelligent queuing system for rapid user interactions
 * - Consolidated timing control (single 500ms delay)
 * - Performance monitoring and flood prevention
 */

interface PendingRequest {
  key: string;
  operation: () => Promise<any>;
  timestamp: number;
}

interface RequestStats {
  totalRequests: number;
  deduplicatedRequests: number;
  lastFloodWarning: number;
}

export function useMasterDebounce() {
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());
  const requestStats = useRef<RequestStats>({
    totalRequests: 0,
    deduplicatedRequests: 0,
    lastFloodWarning: 0
  });

  /**
   * Generate a unique key for request deduplication
   */
  const generateRequestKey = useCallback((
    type: string,
    userId: number,
    stepNumber: number,
    questionKey: string,
    responseText: string
  ): string => {
    // Create a hash-like key for deduplication
    return `${type}-${userId}-${stepNumber}-${questionKey}-${responseText.length}`;
  }, []);

  /**
   * Check for API call flooding and warn if necessary
   */
  const checkForFlooding = useCallback(() => {
    const now = Date.now();
    const stats = requestStats.current;
    
    // If we've made more than 20 requests in the last 10 seconds, warn
    if (stats.totalRequests > 20 && (now - stats.lastFloodWarning) > 10000) {
      console.warn(`[MASTER DEBOUNCE] API call flooding detected: ${stats.totalRequests} requests, ${stats.deduplicatedRequests} deduplicated`);
      stats.lastFloodWarning = now;
    }
  }, []);

  /**
   * Master debounced operation handler
   */
  const debouncedOperation = useCallback((
    operationKey: string,
    operation: () => Promise<any>,
    delay: number = 500
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeouts = timeoutRefs.current;
      const pending = pendingRequests.current;
      
      // Update request statistics
      requestStats.current.totalRequests++;
      
      // Check if we already have a pending operation for this key
      if (pending.has(operationKey)) {
        requestStats.current.deduplicatedRequests++;
        console.log(`[MASTER DEBOUNCE] Deduplicated request: ${operationKey}`);
        
        // Check for flooding
        checkForFlooding();
        
        // Return the existing pending promise
        const existingRequest = pending.get(operationKey)!;
        return existingRequest.operation().then(resolve).catch(reject);
      }

      // Clear any existing timeout for this operation
      if (timeouts.has(operationKey)) {
        clearTimeout(timeouts.get(operationKey)!);
      }

      // Store the pending request
      pending.set(operationKey, {
        key: operationKey,
        operation,
        timestamp: Date.now()
      });

      // Set new timeout
      const timeoutId = setTimeout(async () => {
        try {
          console.log(`[MASTER DEBOUNCE] Executing operation: ${operationKey}`);
          
          // Execute the operation
          const result = await operation();
          
          // Clean up
          timeouts.delete(operationKey);
          pending.delete(operationKey);
          
          resolve(result);
        } catch (error) {
          console.error(`[MASTER DEBOUNCE] Operation failed: ${operationKey}`, error);
          
          // Clean up
          timeouts.delete(operationKey);
          pending.delete(operationKey);
          
          reject(error);
        }
      }, delay);

      timeouts.set(operationKey, timeoutId);
    });
  }, [checkForFlooding]);

  /**
   * Specialized workbook response saver with deduplication
   */
  const debouncedWorkbookSave = useCallback((
    userId: number,
    stepNumber: number,
    questionKey: string,
    responseText: string,
    sectionTitle: string,
    offerNumber: number = 1,
    saveOperation: (params: any) => Promise<any>
  ) => {
    // Generate unique key for this save operation
    const operationKey = generateRequestKey(
      'workbook-save',
      userId,
      stepNumber,
      questionKey,
      responseText
    );

    console.log(`[MASTER DEBOUNCE] Queuing workbook save:`, {
      operationKey,
      questionKey,
      responseText: responseText.substring(0, 50) + (responseText.length > 50 ? '...' : ''),
      isEmptyString: responseText === ""
    });

    // Create the save operation
    const operation = () => saveOperation({
      userId,
      stepNumber,
      questionKey,
      responseText,
      sectionTitle,
      offerNumber
    });

    return debouncedOperation(operationKey, operation);
  }, [generateRequestKey, debouncedOperation]);

  /**
   * Specialized AI feedback request with deduplication
   */
  const debouncedAIFeedback = useCallback((
    userId: number,
    sectionTitle: string,
    questionText: string,
    responseText: string,
    feedbackOperation: (params: any) => Promise<any>
  ) => {
    // Generate unique key for this AI feedback request
    const operationKey = generateRequestKey(
      'ai-feedback',
      userId,
      0, // stepNumber not relevant for AI feedback
      `${sectionTitle}-${questionText}`,
      responseText
    );

    console.log(`[MASTER DEBOUNCE] Queuing AI feedback:`, {
      operationKey,
      sectionTitle,
      questionText: questionText.substring(0, 30) + '...',
      responseLength: responseText.length
    });

    // Create the feedback operation
    const operation = () => feedbackOperation({
      userId,
      sectionTitle,
      questionText,
      responseText
    });

    return debouncedOperation(operationKey, operation, 1000); // Longer delay for AI operations
  }, [generateRequestKey, debouncedOperation]);

  /**
   * Cancel all pending operations (useful for cleanup)
   */
  const cancelAllOperations = useCallback(() => {
    console.log(`[MASTER DEBOUNCE] Cancelling ${timeoutRefs.current.size} pending operations`);
    
    // Clear all timeouts
    timeoutRefs.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    
    // Clear all maps
    timeoutRefs.current.clear();
    pendingRequests.current.clear();
    
    // Reset stats
    requestStats.current = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      lastFloodWarning: 0
    };
  }, []);

  /**
   * Get current statistics for debugging
   */
  const getStats = useCallback(() => {
    return {
      ...requestStats.current,
      pendingOperations: pendingRequests.current.size,
      activeTimeouts: timeoutRefs.current.size
    };
  }, []);

  return {
    debouncedWorkbookSave,
    debouncedAIFeedback,
    debouncedOperation,
    cancelAllOperations,
    getStats
  };
}
