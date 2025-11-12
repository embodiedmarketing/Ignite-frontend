import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import type { SectionCompletion, InsertSectionCompletion } from '@shared/schema';

export function useSectionCompletions(userId: number) {
  return useQuery({
    queryKey: [`/api/section-completions/user/${userId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/section-completions/user/${userId}`);
      const data = await response.json() as SectionCompletion[];
      console.log('[HOOK] Section completions loaded:', data);
      return data;
    },
    enabled: !!userId,
  });
}

export function useMarkSectionComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (completion: InsertSectionCompletion) => {
      console.log('[HOOK] Marking section complete with data:', completion);
      const response = await apiRequest('POST', '/api/section-completions', completion);
      const result = await response.json() as SectionCompletion;
      console.log('[HOOK] Section completion response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[HOOK] Section completion successful, invalidating cache for user:', data.userId);
      // Invalidate the completions for this user
      queryClient.invalidateQueries({
        queryKey: [`/api/section-completions/user/${data.userId}`],
      });
    },
    onError: (error) => {
      console.error('[HOOK] Section completion failed:', error);
    },
  });
}

export const useUnmarkSectionComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, stepNumber, sectionTitle, offerNumber }: { 
      userId: number; 
      stepNumber: number; 
      sectionTitle: string;
      offerNumber?: number;
    }) => {
      const response = await apiRequest('DELETE', '/api/section-completions', {
        userId,
        stepNumber,
        sectionTitle,
        offerNumber
      });

      if (!response.ok) {
        throw new Error('Failed to unmark section complete');
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/section-completions/user/${userId}`] 
      });
    },
  });
};

// Migration hook to transfer localStorage completions to database
export function useSectionCompletionMigration(userId: number) {
  const markComplete = useMarkSectionComplete();

  const migrateCompletions = async () => {
    const migrated: string[] = [];

    // Check for localStorage completion data
    for (let step = 1; step <= 4; step++) {
      const storageKey = `step-${step}-completed-sections-${userId}`;
      const storedData = localStorage.getItem(storageKey);

      if (storedData) {
        try {
          const completions = JSON.parse(storedData);

          for (const [sectionKey, isCompleted] of Object.entries(completions)) {
            if (isCompleted) {
              // Extract section title from the key (remove '-completed' suffix)
              const sectionTitle = sectionKey.replace('-completed', '');

              try {
                await markComplete.mutateAsync({
                  userId,
                  stepNumber: step,
                  sectionTitle,
                });
                migrated.push(`${step}-${sectionTitle}`);
              } catch (error) {
                console.error(`Failed to migrate completion for ${sectionTitle}:`, error);
              }
            }
          }

          // Remove localStorage data after successful migration
          localStorage.removeItem(storageKey);
        } catch (error) {
          console.error(`Failed to parse completion data for step ${step}:`, error);
        }
      }
    }

    return { migrated: migrated.length, completions: migrated };
  };

  return { migrateCompletions };
}
