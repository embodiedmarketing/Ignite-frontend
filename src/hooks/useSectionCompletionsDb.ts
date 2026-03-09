import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryKeys';
import type { SectionCompletion } from '@shared/schema';

export function useSectionCompletionsDb(userId: number) {
  return useQuery<SectionCompletion[]>({
    queryKey: queryKeys.sectionCompletionsUser(userId),
    enabled: !!userId,
  });
}

export function checkSectionComplete(
  completions: SectionCompletion[] | undefined,
  sectionTitle: string
): boolean {
  if (!completions) return false;
  return completions.some(c => c.sectionTitle === sectionTitle);
}
