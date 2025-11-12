import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import type { ChecklistItem } from '@shared/schema';

export function useChecklistItems(userId: number, sectionKey: string) {
  return useQuery({
    queryKey: [`/api/checklist-items/${userId}/${sectionKey}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/checklist-items/${userId}/${sectionKey}`);
      const data = await response.json() as ChecklistItem[];
      console.log('[HOOK] Checklist items loaded:', data);
      return data;
    },
    enabled: !!userId && !!sectionKey,
  });
}

export function useUpsertChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, sectionKey, itemKey, isCompleted }: { 
      userId: number; 
      sectionKey: string; 
      itemKey: string; 
      isCompleted: boolean 
    }) => {
      console.log('[HOOK] Upserting checklist item:', { userId, sectionKey, itemKey, isCompleted });
      const response = await apiRequest('POST', '/api/checklist-items', {
        userId,
        sectionKey,
        itemKey,
        isCompleted,
      });
      const result = await response.json() as ChecklistItem;
      console.log('[HOOK] Checklist item response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[HOOK] Checklist item upsert successful, invalidating cache for:', data.userId, data.sectionKey);
      // Invalidate the checklist items for this user and section
      queryClient.invalidateQueries({
        queryKey: [`/api/checklist-items/${data.userId}/${data.sectionKey}`],
      });
    },
    onError: (error) => {
      console.error('[HOOK] Checklist item upsert failed:', error);
    },
  });
}
