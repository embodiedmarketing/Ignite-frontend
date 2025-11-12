import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// Save status types
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'offline';

export interface SaveState {
  status: SaveStatus;
  message: string;
  lastSaved?: Date;
  error?: Error;
  retryCount?: number;
  conflictData?: any;
}

export interface SaveOperation {
  id: string;
  key: string; // unique identifier for the data being saved (e.g., questionKey, strategyId)
  status: SaveStatus;
  message: string;
  timestamp: Date;
  error?: Error;
  data?: any;
}

interface SaveStatusContextType {
  // Global save state
  globalSaveState: SaveState;
  
  // Individual save operations
  saveOperations: Map<string, SaveOperation>;
  
  // Actions
  setSaveStatus: (key: string, status: SaveStatus, message?: string, error?: Error) => void;
  markSaved: (key: string, data?: any) => void;
  markSaving: (key: string, message?: string) => void;
  markError: (key: string, error: Error, retryCount?: number) => void;
  clearSaveStatus: (key: string) => void;
  clearAllSaveStatus: () => void;
  
  // Utilities
  getSaveStatus: (key: string) => SaveOperation | undefined;
  hasUnsavedChanges: () => boolean;
  getFailedSaves: () => SaveOperation[];
  retryFailedSave: (key: string) => Promise<void>;
  
  // Manual save functionality
  manualSave: (key: string, saveFunction: () => Promise<void>) => Promise<void>;
  manualSaveAll: (saveAllFunction: () => Promise<void>) => Promise<void>;
}

const SaveStatusContext = createContext<SaveStatusContextType | null>(null);

export function useSaveStatus() {
  const context = useContext(SaveStatusContext);
  if (!context) {
    throw new Error('useSaveStatus must be used within a SaveStatusProvider');
  }
  return context;
}

// Save status hook implementation
export function useSaveStatusManager(): SaveStatusContextType {
  const [globalSaveState, setGlobalSaveState] = useState<SaveState>({
    status: 'idle',
    message: '',
  });
  
  const [saveOperations, setSaveOperations] = useState<Map<string, SaveOperation>>(new Map());
  const retryFunctions = useRef<Map<string, () => Promise<void>>>(new Map());
  
  // Auto-clear saved status after delay
  const clearTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const setSaveStatus = useCallback((
    key: string, 
    status: SaveStatus, 
    message = '', 
    error?: Error
  ) => {
    const operation: SaveOperation = {
      id: `${key}_${Date.now()}`,
      key,
      status,
      message,
      timestamp: new Date(),
      error,
    };
    
    setSaveOperations(prev => {
      const updated = new Map(prev);
      updated.set(key, operation);
      return updated;
    });
    
    // Update global state based on individual operations
    setSaveOperations(current => {
      const operations = Array.from(current.values());
      const hasErrors = operations.some(op => op.status === 'error');
      const hasSaving = operations.some(op => op.status === 'saving');
      const hasUnsaved = operations.some(op => op.status !== 'saved' && op.status !== 'idle');
      
      let globalStatus: SaveStatus = 'idle';
      let globalMessage = '';
      
      if (hasErrors) {
        globalStatus = 'error';
        const errorCount = operations.filter(op => op.status === 'error').length;
        globalMessage = `${errorCount} save error${errorCount > 1 ? 's' : ''}`;
      } else if (hasSaving) {
        globalStatus = 'saving';
        const savingCount = operations.filter(op => op.status === 'saving').length;
        globalMessage = `Saving ${savingCount} item${savingCount > 1 ? 's' : ''}...`;
      } else if (hasUnsaved) {
        globalStatus = 'conflict';
        globalMessage = 'Some items need saving';
      } else {
        globalStatus = 'saved';
        globalMessage = 'All changes saved';
      }
      
      setGlobalSaveState({
        status: globalStatus,
        message: globalMessage,
        lastSaved: new Date(),
      });
      
      return current;
    });
    
    // Auto-clear successful saves after 3 seconds
    if (status === 'saved') {
      const existingTimeout = clearTimeouts.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeoutId = setTimeout(() => {
        setSaveOperations(prev => {
          const updated = new Map(prev);
          if (updated.get(key)?.status === 'saved') {
            updated.delete(key);
          }
          return updated;
        });
        clearTimeouts.current.delete(key);
      }, 3000);
      
      clearTimeouts.current.set(key, timeoutId);
    }
  }, []);
  
  const markSaved = useCallback((key: string, data?: any) => {
    setSaveStatus(key, 'saved', 'Saved successfully');
  }, [setSaveStatus]);
  
  const markSaving = useCallback((key: string, message = 'Saving...') => {
    setSaveStatus(key, 'saving', message);
  }, [setSaveStatus]);
  
  const markError = useCallback((key: string, error: Error, retryCount = 0) => {
    const message = retryCount > 0 
      ? `Save failed (attempt ${retryCount + 1}): ${error.message}`
      : `Save failed: ${error.message}`;
    setSaveStatus(key, 'error', message, error);
  }, [setSaveStatus]);
  
  const clearSaveStatus = useCallback((key: string) => {
    setSaveOperations(prev => {
      const updated = new Map(prev);
      updated.delete(key);
      return updated;
    });
    
    const existingTimeout = clearTimeouts.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      clearTimeouts.current.delete(key);
    }
  }, []);
  
  const clearAllSaveStatus = useCallback(() => {
    setSaveOperations(new Map());
    clearTimeouts.current.forEach(timeout => clearTimeout(timeout));
    clearTimeouts.current.clear();
    setGlobalSaveState({ status: 'idle', message: '' });
  }, []);
  
  const getSaveStatus = useCallback((key: string) => {
    return saveOperations.get(key);
  }, [saveOperations]);
  
  const hasUnsavedChanges = useCallback(() => {
    return Array.from(saveOperations.values()).some(
      op => op.status === 'error' || op.status === 'saving'
    );
  }, [saveOperations]);
  
  const getFailedSaves = useCallback(() => {
    return Array.from(saveOperations.values()).filter(op => op.status === 'error');
  }, [saveOperations]);
  
  const retryFailedSave = useCallback(async (key: string) => {
    const retryFunction = retryFunctions.current.get(key);
    if (retryFunction) {
      try {
        markSaving(key, 'Retrying...');
        await retryFunction();
        markSaved(key);
      } catch (error) {
        markError(key, error as Error);
      }
    }
  }, [markSaving, markSaved, markError]);
  
  const manualSave = useCallback(async (key: string, saveFunction: () => Promise<void>) => {
    try {
      markSaving(key, 'Manual save...');
      retryFunctions.current.set(key, saveFunction);
      await saveFunction();
      markSaved(key);
    } catch (error) {
      markError(key, error as Error);
      throw error;
    }
  }, [markSaving, markSaved, markError]);
  
  const manualSaveAll = useCallback(async (saveAllFunction: () => Promise<void>) => {
    try {
      setGlobalSaveState({
        status: 'saving',
        message: 'Saving all changes...',
      });
      await saveAllFunction();
      setGlobalSaveState({
        status: 'saved',
        message: 'All changes saved',
        lastSaved: new Date(),
      });
    } catch (error) {
      setGlobalSaveState({
        status: 'error',
        message: `Failed to save all changes: ${(error as Error).message}`,
        error: error as Error,
      });
      throw error;
    }
  }, []);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  return {
    globalSaveState,
    saveOperations,
    setSaveStatus,
    markSaved,
    markSaving,
    markError,
    clearSaveStatus,
    clearAllSaveStatus,
    getSaveStatus,
    hasUnsavedChanges,
    getFailedSaves,
    retryFailedSave,
    manualSave,
    manualSaveAll,
  };
}

// Provider component would be created in App.tsx or root component
export { SaveStatusContext };
