import { useQuery } from '@tanstack/react-query';

interface WorkbookResponse {
  id: number;
  userId: number;
  stepNumber: number;
  sectionTitle: string;
  questionKey: string; // Database uses questionKey, not promptKey
  responseText: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SalesPageData {
  messagingStrategy: Record<string, string>;
  offerOutline: Record<string, string>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and transform workbook data for sales page generation
 * Replaces localStorage dependencies with database API calls
 */
export function useSalesPageData(userId: string): SalesPageData {
  // Fetch Step 1 (messaging strategy) responses
  const { 
    data: step1Data, 
    isLoading: step1Loading, 
    error: step1Error 
  } = useQuery({
    queryKey: [`/api/workbook-responses/user/${userId}/step/1`],
    enabled: !!userId
  });

  // Fetch Step 2 (offer outline) responses  
  const { 
    data: step2Data, 
    isLoading: step2Loading, 
    error: step2Error 
  } = useQuery({
    queryKey: [`/api/workbook-responses/user/${userId}/step/2`],
    enabled: !!userId
  });

  // Transform database responses to sales page format
  const transformResponsesToKeyValue = (responses: unknown): Record<string, string> => {
    const result: Record<string, string> = {};
    
    if (Array.isArray(responses)) {
      responses.forEach((response: any) => {
        if (response?.questionKey && response?.responseText) {
          result[response.questionKey] = response.responseText;
        }
      });
    }
    
    return result;
  };

  // Process and return transformed data
  const messagingStrategy = transformResponsesToKeyValue(step1Data);
  const offerOutline = transformResponsesToKeyValue(step2Data);
  
  const isLoading = step1Loading || step2Loading;
  const error = step1Error || step2Error;

  return {
    messagingStrategy,
    offerOutline,
    isLoading,
    error: error as Error | null
  };
}
