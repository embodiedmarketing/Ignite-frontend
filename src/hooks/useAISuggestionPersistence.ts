// AI Suggestion Persistence Hook
// Prevents suggestion loss across sessions and navigation

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface AISuggestion {
  id: string;
  sectionId: string;
  contextId: string;
  text: string;
  model: string;
  status: 'new' | 'accepted' | 'rejected' | 'saved_for_later';
  version: number;
  timestamp: string;
  metadata?: any;
}

export interface SuggestionBucket {
  userId: number;
  contextId: string;
  sectionId: string;
  suggestions: AISuggestion[];
  lastUpdated: string;
}

interface SuggestionActions {
  acceptSuggestion: (suggestionId: string, targetField?: string) => void;
  rejectSuggestion: (suggestionId: string) => void;
  saveForLater: (suggestionId: string) => void;
  addSuggestion: (suggestion: Omit<AISuggestion, 'id' | 'timestamp' | 'version'>) => void;
  clearSuggestions: (sectionId?: string) => void;
  getSuggestionsForSection: (sectionId: string) => AISuggestion[];
  hasPendingSuggestions: (sectionId?: string) => boolean;
}

export function useAISuggestionPersistence(userId: number, contextId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for suggestions with persistence
  const {
    data: suggestionBuckets = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/suggestions', userId, contextId],
    queryFn: async () => {
      try {
        // Try server first for latest data
        const response = await apiRequest('GET', `/api/suggestions/${userId}/${contextId}`);
        const serverData = await response.json();
        
        // Update localStorage cache
        localStorage.setItem(
          `ai-suggestions-${userId}-${contextId}`, 
          JSON.stringify(serverData)
        );
        
        return serverData;
      } catch (error) {
        // Fallback to localStorage on server error
        const cached = localStorage.getItem(`ai-suggestions-${userId}-${contextId}`);
        if (cached) {
          console.log('[AI SUGGESTIONS] Falling back to cached suggestions');
          return JSON.parse(cached);
        }
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    retry: 1
  });

  // Mutation for updating suggestions
  const updateSuggestionsMutation = useMutation({
    mutationFn: async (updatedBuckets: SuggestionBucket[]) => {
      // Optimistically update localStorage
      localStorage.setItem(
        `ai-suggestions-${userId}-${contextId}`, 
        JSON.stringify(updatedBuckets)
      );
      
      // Try to sync with server
      try {
        const response = await apiRequest('POST', `/api/suggestions/${userId}/${contextId}`, {
          buckets: updatedBuckets
        });
        return await response.json();
      } catch (error) {
        console.warn('[AI SUGGESTIONS] Server sync failed, using local cache');
        return updatedBuckets;
      }
    },
    onSuccess: (data) => {
      // Update query cache
      queryClient.setQueryData(['/api/suggestions', userId, contextId], data);
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: "Your suggestions are saved locally but couldn't sync with the server. They'll sync when you're back online.",
        variant: "default"
      });
    }
  });

  // Helper to get or create bucket for section
  const getBucket = useCallback((sectionId: string): SuggestionBucket => {
    const existing = suggestionBuckets.find((bucket: SuggestionBucket) => 
      bucket.sectionId === sectionId
    );
    
    if (existing) return existing;
    
    return {
      userId,
      contextId,
      sectionId,
      suggestions: [],
      lastUpdated: new Date().toISOString()
    };
  }, [suggestionBuckets, userId, contextId]);

  // Update suggestions in state
  const updateSuggestions = useCallback((
    sectionId: string, 
    updater: (suggestions: AISuggestion[]) => AISuggestion[]
  ) => {
    const updatedBuckets = suggestionBuckets.map((bucket: SuggestionBucket) => {
      if (bucket.sectionId === sectionId) {
        return {
          ...bucket,
          suggestions: updater(bucket.suggestions),
          lastUpdated: new Date().toISOString()
        };
      }
      return bucket;
    });

    // Add new bucket if section doesn't exist
    if (!suggestionBuckets.find((b: SuggestionBucket) => b.sectionId === sectionId)) {
      updatedBuckets.push({
        userId,
        contextId,
        sectionId,
        suggestions: updater([]),
        lastUpdated: new Date().toISOString()
      });
    }

    updateSuggestionsMutation.mutate(updatedBuckets);
  }, [suggestionBuckets, userId, contextId, updateSuggestionsMutation]);

  const acceptSuggestion = useCallback((suggestionId: string, targetField?: string) => {
    const bucket = suggestionBuckets.find((b: SuggestionBucket) => 
      b.suggestions.some(s => s.id === suggestionId)
    );
    
    if (!bucket) return;

    updateSuggestions(bucket.sectionId, (suggestions) => 
      suggestions.map(s => 
        s.id === suggestionId 
          ? { ...s, status: 'accepted' as const, metadata: { ...s.metadata, targetField } }
          : s
      )
    );

    toast({
      title: "Suggestion accepted",
      description: targetField ? `Applied to ${targetField}` : "Suggestion has been accepted",
      duration: 3000
    });
  }, [suggestionBuckets, updateSuggestions, toast]);

  const rejectSuggestion = useCallback((suggestionId: string) => {
    const bucket = suggestionBuckets.find((b: SuggestionBucket) => 
      b.suggestions.some(s => s.id === suggestionId)
    );
    
    if (!bucket) return;

    updateSuggestions(bucket.sectionId, (suggestions) => 
      suggestions.map(s => 
        s.id === suggestionId 
          ? { ...s, status: 'rejected' as const }
          : s
      )
    );
  }, [suggestionBuckets, updateSuggestions]);

  const saveForLater = useCallback((suggestionId: string) => {
    const bucket = suggestionBuckets.find((b: SuggestionBucket) => 
      b.suggestions.some(s => s.id === suggestionId)
    );
    
    if (!bucket) return;

    updateSuggestions(bucket.sectionId, (suggestions) => 
      suggestions.map(s => 
        s.id === suggestionId 
          ? { ...s, status: 'saved_for_later' as const }
          : s
      )
    );

    toast({
      title: "Saved for later",
      description: "This suggestion has been saved for later review",
      duration: 2000
    });
  }, [suggestionBuckets, updateSuggestions, toast]);

  const addSuggestion = useCallback((
    suggestion: Omit<AISuggestion, 'id' | 'timestamp' | 'version'>
  ) => {
    const newSuggestion: AISuggestion = {
      ...suggestion,
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      version: 1
    };

    updateSuggestions(suggestion.sectionId, (suggestions) => [
      newSuggestion,
      ...suggestions
    ]);
  }, [updateSuggestions]);

  const clearSuggestions = useCallback((sectionId?: string) => {
    if (sectionId) {
      updateSuggestions(sectionId, () => []);
    } else {
      // Clear all suggestions
      const clearedBuckets = suggestionBuckets.map((bucket: SuggestionBucket) => ({
        ...bucket,
        suggestions: [],
        lastUpdated: new Date().toISOString()
      }));
      updateSuggestionsMutation.mutate(clearedBuckets);
    }
  }, [suggestionBuckets, updateSuggestions, updateSuggestionsMutation]);

  const getSuggestionsForSection = useCallback((sectionId: string): AISuggestion[] => {
    const bucket = suggestionBuckets.find((b: SuggestionBucket) => b.sectionId === sectionId);
    return bucket?.suggestions || [];
  }, [suggestionBuckets]);

  const hasPendingSuggestions = useCallback((sectionId?: string): boolean => {
    const relevantBuckets = sectionId 
      ? suggestionBuckets.filter((b: SuggestionBucket) => b.sectionId === sectionId)
      : suggestionBuckets;

    return relevantBuckets.some((bucket: SuggestionBucket) => 
      bucket.suggestions.some(s => s.status === 'new')
    );
  }, [suggestionBuckets]);

  // Background sync check
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({
          queryKey: ['/api/suggestions', userId, contextId]
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(syncInterval);
  }, [queryClient, userId, contextId]);

  const actions: SuggestionActions = {
    acceptSuggestion,
    rejectSuggestion,
    saveForLater,
    addSuggestion,
    clearSuggestions,
    getSuggestionsForSection,
    hasPendingSuggestions
  };

  return {
    suggestions: suggestionBuckets,
    isLoading,
    error,
    isOffline: !navigator.onLine,
    ...actions
  };
}

export default useAISuggestionPersistence;
