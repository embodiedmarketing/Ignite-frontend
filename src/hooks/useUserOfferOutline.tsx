import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import type { UserOfferOutline, InsertUserOfferOutline } from '@shared/schema';

// Hook for managing user offer outlines with database persistence
export function useUserOfferOutline(userId: number) {
  const queryClient = useQueryClient();

  // Fetch all offer outlines for user
  const {
    data: outlines = [],
    isLoading,
    error
  } = useQuery({
    queryKey: [`/api/user-offer-outlines/user/${userId}`, userId],
    enabled: !!userId
  });

  // Fetch active offer outline
  const {
    data: activeOutline,
    isLoading: isLoadingActive
  } = useQuery({
    queryKey: [`/api/user-offer-outlines/active/${userId}`, userId],
    enabled: !!userId
  });

  // Create new offer outline
  const createOutlineMutation = useMutation({
    mutationFn: async (data: InsertUserOfferOutline) => {
      return apiRequest('/api/user-offer-outlines', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/user/${userId}`, userId] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/active/${userId}`, userId] });
    }
  });

  // Update offer outline
  const updateOutlineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserOfferOutline> }) => {
      return apiRequest(`/api/user-offer-outlines/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/user/${userId}`, userId] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/active/${userId}`, userId] });
    }
  });

  // Delete offer outline
  const deleteOutlineMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/user-offer-outlines/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/user/${userId}`, userId] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/active/${userId}`, userId] });
    }
  });

  // Set active offer outline
  const setActiveMutation = useMutation({
    mutationFn: async (outlineId: number) => {
      return apiRequest('/api/user-offer-outlines/set-active', 'POST', { userId, outlineId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/user/${userId}`, userId] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-offer-outlines/active/${userId}`, userId] });
    }
  });

  // Migration function to move localStorage data to database
  const migrateFromLocalStorage = async () => {
    try {
      const localStorageKey = `offer_outline_user_${userId}`;
      const storedData = localStorage.getItem(localStorageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Create database entry from localStorage data
        await createOutlineMutation.mutateAsync({
          userId,
          title: parsedData.title || 'My Offer Outline',
          content: parsedData.content || JSON.stringify(parsedData),
          isActive: true,
          sourceData: {
            migratedFromLocalStorage: true,
            originalKey: localStorageKey
          }
        });

        // Remove from localStorage after successful migration
        localStorage.removeItem(localStorageKey);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error migrating offer outline from localStorage:', error);
      return false;
    }
  };

  return {
    outlines,
    activeOutline,
    isLoading: isLoading || isLoadingActive,
    error,
    createOutline: createOutlineMutation.mutateAsync,
    updateOutline: updateOutlineMutation.mutateAsync,
    deleteOutline: deleteOutlineMutation.mutateAsync,
    setActive: setActiveMutation.mutateAsync,
    migrateFromLocalStorage,
    isCreating: createOutlineMutation.isPending,
    isUpdating: updateOutlineMutation.isPending,
    isDeleting: deleteOutlineMutation.isPending,
    isSettingActive: setActiveMutation.isPending
  };
}
