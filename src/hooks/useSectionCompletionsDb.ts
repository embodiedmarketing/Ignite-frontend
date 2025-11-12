import { useQuery } from '@tanstack/react-query';
import type { SectionCompletion } from '@shared/schema';

export function useSectionCompletionsDb(userId: number) {
  return useQuery<SectionCompletion[]>({
    queryKey: [`/api/section-completions/user/${userId}`],
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
