import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import type { SalesPageDraft, InsertSalesPageDraft } from '@shared/schema';

// Hook for managing sales page drafts with database persistence
export function useSalesPageDrafts(userId: number) {
  const queryClient = useQueryClient();

  // Fetch all sales page drafts for user
  const {
    data: drafts = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/sales-page-drafts/user', userId],
    enabled: !!userId
  });

  // Fetch active sales page drafts
  const {
    data: activeDrafts = [],
    isLoading: isLoadingActive
  } = useQuery({
    queryKey: ['/api/sales-page-drafts/active', userId],
    enabled: !!userId
  });

  // Create new sales page draft
  const createDraftMutation = useMutation({
    mutationFn: async (data: InsertSalesPageDraft) => {
      return apiRequest('/api/sales-page-drafts', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/active', userId] });
    }
  });

  // Update sales page draft
  const updateDraftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SalesPageDraft> }) => {
      return apiRequest(`/api/sales-page-drafts/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/active', userId] });
    }
  });

  // Delete sales page draft
  const deleteDraftMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/sales-page-drafts/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/active', userId] });
    }
  });

  // Set active sales page draft
  const setActiveMutation = useMutation({
    mutationFn: async (draftId: number) => {
      return apiRequest('/api/sales-page-drafts/set-active', 'POST', { userId, draftId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-page-drafts/active', userId] });
    }
  });

  // Migration function to move localStorage data to database
  const migrateFromLocalStorage = async () => {
    try {
      const localStorageKeys = [
        `salesPageDrafts_${userId}`,
        `salesPage_${userId}`,
        'salesPageDrafts',
        'salesPage'
      ];
      
      let migratedCount = 0;
      
      for (const key of localStorageKeys) {
        const storedData = localStorage.getItem(key);
        
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            
            // Handle array of drafts
            if (Array.isArray(parsedData)) {
              for (const draft of parsedData) {
                await createDraftMutation.mutateAsync({
                  userId,
                  title: draft.title || draft.name || `Sales Page Draft ${Date.now()}`,
                  content: draft.content || JSON.stringify(draft),
                  isActive: draft.isActive || false,
                  sourceData: {
                    migratedFromLocalStorage: true,
                    originalKey: key
                  }
                });
                migratedCount++;
              }
            } 
            // Handle single draft object
            else if (typeof parsedData === 'object') {
              await createDraftMutation.mutateAsync({
                userId,
                title: parsedData.title || parsedData.name || `Sales Page Draft ${Date.now()}`,
                content: parsedData.content || JSON.stringify(parsedData),
                isActive: true,
                sourceData: {
                  migratedFromLocalStorage: true,
                  originalKey: key
                }
              });
              migratedCount++;
            }
            
            // Remove from localStorage after successful migration
            localStorage.removeItem(key);
          } catch (parseError) {
            console.error(`Error parsing localStorage data for key ${key}:`, parseError);
          }
        }
      }
      
      return migratedCount > 0;
    } catch (error) {
      console.error('Error migrating sales page drafts from localStorage:', error);
      return false;
    }
  };

  return {
    drafts,
    activeDrafts,
    isLoading: isLoading || isLoadingActive,
    error,
    createDraft: createDraftMutation.mutateAsync,
    updateDraft: updateDraftMutation.mutateAsync,
    deleteDraft: deleteDraftMutation.mutateAsync,
    setActive: setActiveMutation.mutateAsync,
    migrateFromLocalStorage,
    isCreating: createDraftMutation.isPending,
    isUpdating: updateDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending,
    isSettingActive: setActiveMutation.isPending
  };
}
