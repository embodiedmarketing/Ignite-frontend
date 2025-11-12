import { useState, useCallback, useEffect } from 'react';

interface UnsavedChange {
  originalValue: string;
  currentValue: string;
  isDirty: boolean;
  lastModified: Date;
}

interface UnsavedChanges {
  [questionKey: string]: UnsavedChange;
}

export function useUnsavedChanges(userId: number, stepNumber: number, offerNumber: number = 1) {
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChanges>({});
  
  // Create backup key for localStorage
  const backupKey = `unsaved-changes-${userId}-${stepNumber}-${offerNumber}`;

  // Load unsaved changes from localStorage on mount
  useEffect(() => {
    const savedChanges = localStorage.getItem(backupKey);
    if (savedChanges) {
      try {
        const parsed = JSON.parse(savedChanges);
        setUnsavedChanges(parsed);
      } catch (error) {
        console.error('Failed to load unsaved changes from localStorage:', error);
      }
    }
  }, [backupKey]);

  // Save unsaved changes to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(unsavedChanges).length > 0) {
      localStorage.setItem(backupKey, JSON.stringify(unsavedChanges));
    } else {
      localStorage.removeItem(backupKey);
    }
  }, [unsavedChanges, backupKey]);

  // Track a change to a question
  const trackChange = useCallback((questionKey: string, currentValue: string, originalValue: string) => {
    const isDirty = currentValue !== originalValue;
    
    setUnsavedChanges(prev => {
      if (!isDirty) {
        // If not dirty, remove from tracking
        const newState = { ...prev };
        delete newState[questionKey];
        return newState;
      }
      
      return {
        ...prev,
        [questionKey]: {
          originalValue,
          currentValue,
          isDirty,
          lastModified: new Date()
        }
      };
    });
  }, []);

  // Clear a specific question's unsaved changes (after successful save)
  const clearChange = useCallback((questionKey: string) => {
    setUnsavedChanges(prev => {
      const newState = { ...prev };
      delete newState[questionKey];
      return newState;
    });
  }, []);

  // Clear all unsaved changes
  const clearAllChanges = useCallback(() => {
    setUnsavedChanges({});
  }, []);

  // Get dirty status for a specific question
  const isDirty = useCallback((questionKey: string) => {
    return unsavedChanges[questionKey]?.isDirty || false;
  }, [unsavedChanges]);

  // Get current value for a specific question
  const getCurrentValue = useCallback((questionKey: string) => {
    return unsavedChanges[questionKey]?.currentValue;
  }, [unsavedChanges]);

  // Get count of unsaved changes
  const unsavedCount = Object.keys(unsavedChanges).length;

  // Check if any changes exist
  const hasUnsavedChanges = unsavedCount > 0;

  // Get all dirty question keys
  const dirtyQuestions = Object.keys(unsavedChanges);

  return {
    trackChange,
    clearChange,
    clearAllChanges,
    isDirty,
    getCurrentValue,
    unsavedCount,
    hasUnsavedChanges,
    dirtyQuestions,
    unsavedChanges
  };
}
