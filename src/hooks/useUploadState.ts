// Upload State Management Hook
// Provides upload progress, conflict detection, and error recovery

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UploadOperation {
  id: string;
  operationType: 'transcript_upload' | 'text_extraction' | 'file_processing';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  fileName?: string;
  fileSize?: number;
  progress?: number;
  error?: string;
  startTime: Date;
}

export interface UploadState {
  activeOperations: UploadOperation[];
  isUploading: boolean;
  hasErrors: boolean;
  hasConflicts: boolean;
}

export interface UploadActions {
  startUpload: (operationType: UploadOperation['operationType'], fileName?: string) => string;
  updateProgress: (operationId: string, progress: number) => void;
  completeUpload: (operationId: string) => void;
  failUpload: (operationId: string, error: string) => void;
  cancelUpload: (operationId: string) => void;
  clearCompleted: () => void;
  retryUpload: (operationId: string, retryFunction: () => Promise<void>) => void;
}

export function useUploadState() {
  const { toast } = useToast();
  const [operations, setOperations] = useState<Map<string, UploadOperation>>(new Map());
  const retryFunctions = useRef<Map<string, () => Promise<void>>>(new Map());

  // Derived state
  const activeOperations = Array.from(operations.values())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  
  const isUploading = activeOperations.some(op => 
    op.status === 'pending' || op.status === 'in_progress'
  );
  
  const hasErrors = activeOperations.some(op => op.status === 'failed');
  
  const hasConflicts = activeOperations.filter(op => 
    op.status === 'pending' || op.status === 'in_progress'
  ).length > 1;

  // Auto-cleanup completed operations
  useEffect(() => {
    const cleanup = () => {
      setOperations(prev => {
        const updated = new Map(prev);
        const now = new Date().getTime();
        
        for (const [id, operation] of updated.entries()) {
          const age = now - operation.startTime.getTime();
          
          // Remove completed operations after 5 minutes
          if (operation.status === 'completed' && age > 5 * 60 * 1000) {
            updated.delete(id);
            retryFunctions.current.delete(id);
          }
          
          // Remove failed operations after 10 minutes
          if (operation.status === 'failed' && age > 10 * 60 * 1000) {
            updated.delete(id);
            retryFunctions.current.delete(id);
          }
        }
        
        return updated;
      });
    };

    const interval = setInterval(cleanup, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const startUpload = useCallback((
    operationType: UploadOperation['operationType'], 
    fileName?: string
  ): string => {
    // Check for conflicting operations
    const conflicting = activeOperations.find(op => 
      op.operationType === operationType && 
      (op.status === 'pending' || op.status === 'in_progress')
    );

    if (conflicting) {
      toast({
        title: "Upload already in progress",
        description: `Another ${operationType.replace('_', ' ')} is currently processing. Please wait for it to complete.`,
        variant: "destructive"
      });
      return conflicting.id;
    }

    const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: UploadOperation = {
      id: operationId,
      operationType,
      status: 'pending',
      fileName,
      progress: 0,
      startTime: new Date()
    };

    setOperations(prev => new Map(prev).set(operationId, operation));
    
    // Auto-timeout after 30 seconds
    setTimeout(() => {
      setOperations(prev => {
        const current = prev.get(operationId);
        if (current && (current.status === 'pending' || current.status === 'in_progress')) {
          const updated = new Map(prev);
          updated.set(operationId, {
            ...current,
            status: 'failed',
            error: 'Operation timed out'
          });
          return updated;
        }
        return prev;
      });
    }, 30000);

    return operationId;
  }, [activeOperations, toast]);

  const updateProgress = useCallback((operationId: string, progress: number) => {
    setOperations(prev => {
      const current = prev.get(operationId);
      if (!current) return prev;
      
      const updated = new Map(prev);
      updated.set(operationId, {
        ...current,
        status: 'in_progress',
        progress: Math.min(100, Math.max(0, progress))
      });
      return updated;
    });
  }, []);

  const completeUpload = useCallback((operationId: string) => {
    setOperations(prev => {
      const current = prev.get(operationId);
      if (!current) return prev;
      
      const updated = new Map(prev);
      updated.set(operationId, {
        ...current,
        status: 'completed',
        progress: 100
      });
      return updated;
    });

    // Success toast
    const operation = operations.get(operationId);
    if (operation) {
      toast({
        title: "Upload completed",
        description: `${operation.fileName || 'File'} processed successfully`,
        duration: 3000
      });
    }
  }, [operations, toast]);

  const failUpload = useCallback((operationId: string, error: string) => {
    setOperations(prev => {
      const current = prev.get(operationId);
      if (!current) return prev;
      
      const updated = new Map(prev);
      updated.set(operationId, {
        ...current,
        status: 'failed',
        error
      });
      return updated;
    });

    // Error toast with retry option
    const operation = operations.get(operationId);
    const hasRetry = retryFunctions.current.has(operationId);
    
    toast({
      title: "Upload failed",
      description: error,
      variant: "destructive",
      // Retry functionality available via retryUpload method
      duration: 10000
    });
  }, [operations, toast]);

  const cancelUpload = useCallback((operationId: string) => {
    setOperations(prev => {
      const current = prev.get(operationId);
      if (!current) return prev;
      
      const updated = new Map(prev);
      updated.set(operationId, {
        ...current,
        status: 'cancelled'
      });
      return updated;
    });

    retryFunctions.current.delete(operationId);
  }, []);

  const clearCompleted = useCallback(() => {
    setOperations(prev => {
      const updated = new Map(prev);
      for (const [id, operation] of updated.entries()) {
        if (operation.status === 'completed' || operation.status === 'failed' || operation.status === 'cancelled') {
          updated.delete(id);
          retryFunctions.current.delete(id);
        }
      }
      return updated;
    });
  }, []);

  const retryUpload = useCallback(async (operationId: string, retryFunction: () => Promise<void>) => {
    const operation = operations.get(operationId);
    if (!operation) return;

    // Reset operation to pending
    setOperations(prev => {
      const updated = new Map(prev);
      updated.set(operationId, {
        ...operation,
        status: 'pending',
        progress: 0,
        error: undefined
      });
      return updated;
    });

    try {
      await retryFunction();
    } catch (error) {
      failUpload(operationId, error instanceof Error ? error.message : 'Retry failed');
    }
  }, [operations, failUpload]);

  // Register retry function for an operation
  const registerRetry = useCallback((operationId: string, retryFunction: () => Promise<void>) => {
    retryFunctions.current.set(operationId, retryFunction);
  }, []);

  // Check if specific operation type is active
  const isOperationActive = useCallback((operationType: UploadOperation['operationType']) => {
    return activeOperations.some(op => 
      op.operationType === operationType && 
      (op.status === 'pending' || op.status === 'in_progress')
    );
  }, [activeOperations]);

  // Get operation by ID
  const getOperation = useCallback((operationId: string) => {
    return operations.get(operationId);
  }, [operations]);

  const state: UploadState = {
    activeOperations,
    isUploading,
    hasErrors,
    hasConflicts
  };

  const actions: UploadActions = {
    startUpload,
    updateProgress,
    completeUpload,
    failUpload,
    cancelUpload,
    clearCompleted,
    retryUpload
  };

  return {
    ...state,
    ...actions,
    registerRetry,
    isOperationActive,
    getOperation
  };
}

export default useUploadState;
