import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WorkbookResponse {
  id: number;
  userId: number;
  stepNumber: number;
  sectionTitle: string;
  questionKey: string;
  responseText: string;
  createdAt: string;
  updatedAt: string;
}

interface MessagingStrategy {
  id: number;
  userId: number;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  sourceData: any;
  completionPercentage: number;
  missingInformation: any;
  recommendations: any;
  createdAt: string;
  updatedAt: string;
}

interface UserOfferOutline {
  id: number;
  userId: number;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  sourceData: any;
  completionPercentage: number;
  missingInformation: any;
  recommendations: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook for managing workbook responses with database persistence
 * Enhanced for Step 4 with optimized indexes and complex data handling
 * Now supports independent offer management via offerNumber parameter
 */
export function useWorkbookResponses(userId: number, stepNumber: number, offerNumber: number = 1) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all responses for a user, step, and specific offer
  const {
    data: responses = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['workbook-responses', userId, stepNumber, offerNumber],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/workbook-responses/user/${userId}/step/${stepNumber}?offerNumber=${offerNumber}`);
      const data = await response.json();
      console.log(`[DATABASE DEBUG] Step ${stepNumber} raw response:`, data);
      return data;
    },
    staleTime: 0, // Always fetch fresh data from database
    gcTime: 0 // Don't cache responses
  });

  // Convert array to key-value object for backward compatibility
  const responsesMap = Array.isArray(responses) ? (responses as WorkbookResponse[]).reduce((acc: Record<string, string>, response: WorkbookResponse) => {
    console.log(`[DATABASE DEBUG] Processing response:`, { questionKey: response.questionKey, hasResponseText: !!response.responseText });
    
    // Check if this is a localStorage-style JSON blob that needs parsing
    if (response.questionKey.includes('step-1-responses-')) {
      try {
        const parsedResponses = JSON.parse(response.responseText);
        console.log(`[DATABASE DEBUG] Parsed localStorage blob:`, parsedResponses);
        Object.assign(acc, parsedResponses);
      } catch (error) {
        console.error('Error parsing localStorage responses:', error);
      }
    } else {
      // Individual response records
      acc[response.questionKey] = response.responseText;
    }
    return acc;
  }, {}) : {};

  console.log(`[DATABASE DEBUG] Final responsesMap for Step ${stepNumber}:`, responsesMap);



  // Upsert workbook response with enhanced state management
  const saveResponse = useMutation({
    mutationFn: async ({ questionKey, responseText, sectionTitle }: {
      questionKey: string;
      responseText: string;
      sectionTitle: string;
    }) => {
      console.log(`[TEXT PERSISTENCE] Database save attempt:`, {
        questionKey,
        responseText,
        textLength: responseText.length,
        isEmptyString: responseText === "",
        userId,
        stepNumber,
        sectionTitle,
        offerNumber
      });
      
      const response = await apiRequest('POST', '/api/workbook-responses', {
        userId,
        stepNumber,
        sectionTitle,
        questionKey,
        responseText,
        offerNumber
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log(`[TEXT PERSISTENCE] Database save success:`, {
        questionKey: variables.questionKey,
        savedValue: variables.responseText,
        isEmptyString: variables.responseText === ""
      });
      
      // Phase 3: Optimized state synchronization after successful database save
      // PHASE 2 FIX: Reduced from 3 invalidations to 1 to prevent query flooding
      queryClient.invalidateQueries({ queryKey: ['workbook-responses', userId, stepNumber, offerNumber] });
      
      // Clear localStorage backup after successful database save to prevent conflicts
      const localStorageKey = `workbook-${stepNumber}-${variables.questionKey}`;
      localStorage.removeItem(localStorageKey);
      
      console.log(`[PHASE 2 FIX] Optimized sync complete - single invalidation used, cleared localStorage key: ${localStorageKey}`);
    },
    onError: (error: any, variables) => {
      console.error('Failed to save workbook response:', error);
      console.log(`[TEXT PERSISTENCE] Database save failed for:`, {
        questionKey: variables.questionKey,
        responseText: variables.responseText
      });
      
      toast({
        title: "Save Failed",
        description: "Your response couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete workbook response
  const deleteResponse = useMutation({
    mutationFn: async (questionKey: string) => {
      const response = await apiRequest('DELETE', `/api/workbook-responses/user/${userId}/step/${stepNumber}/question/${questionKey}`);
      return response.json();
    },
    onSuccess: () => {
      // PHASE 2 FIX: Single invalidation for delete operations
      queryClient.invalidateQueries({ queryKey: ['workbook-responses', userId, stepNumber, offerNumber] });
    },
    onError: (error: any) => {
      console.error('Failed to delete workbook response:', error);
      toast({
        title: "Delete Failed",
        description: "The response couldn't be deleted. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update response mutation with Step 4 section mapping
  const updateResponse = useMutation({
    mutationFn: async (variables: { questionKey: string; responseText: string }) => {
      const { questionKey, responseText } = variables;
      // Step 4 specific section mapping
      let sectionTitle = 'General';
      
      if (stepNumber === 4) {
        const step4SectionMapping: Record<string, string> = {
          'sales-strategy': 'Sales Strategy',
          'customer-locations': 'Customer Locations',
          'daily-planning': 'Daily Planning',
          'connection-strategy': 'Connection Strategy',
          'sales-conversations': 'Sales Conversations'
        };
        
        const sectionKey = questionKey.split('-')[0];
        sectionTitle = step4SectionMapping[sectionKey] || 'Sales Strategy';
      } else if (stepNumber === 3) {
        // Step 3 section mapping
        const step3SectionMapping: Record<string, string> = {
          'customer-experience': 'Customer Experience Design',
          'sales-page': 'Sales Page Content',
          'project-plan': 'Project Planning'
        };
        
        const sectionKey = questionKey.split('-')[0];
        sectionTitle = step3SectionMapping[sectionKey] || 'Customer Experience Design';
      } else {
        // Default section mapping for other steps
        sectionTitle = questionKey.split('-')[0] || 'General';
      }
      
      const response = await apiRequest('POST', '/api/workbook-responses', {
        userId,
        stepNumber,
        questionKey,
        responseText,
        sectionTitle
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workbook-responses', userId, stepNumber, offerNumber] });
    },
    onError: (error: any) => {
      console.error('Failed to save workbook response:', error);
    }
  });

  // Get responses by section (useful for Step 3 & 4 organization)
  const getResponsesBySection = (sectionTitle: string) => {
    return responses.filter((response: WorkbookResponse) => response.sectionTitle === sectionTitle);
  };

  // Get completion percentage for the step
  const getCompletionPercentage = () => {
    const totalResponses = responses.filter((r: WorkbookResponse) => r.responseText.trim().length > 0).length;
    
    // Step-specific completion thresholds
    const completionThresholds = {
      1: 15, // Your Messaging - 15 questions
      2: 8,  // Create Your Offer - 8 questions
      3: 12  // Build Your Offer - estimated 12 questions
    };
    
    const threshold = completionThresholds[stepNumber as keyof typeof completionThresholds] || 10;
    return Math.min(100, (totalResponses / threshold) * 100);
  };

  return {
    responses: responsesMap,
    rawResponses: responses,
    isLoading,
    error,
    saveResponse,
    deleteResponse,
    getResponsesBySection,
    getCompletionPercentage
  };
}

/**
 * Hook for managing messaging strategies with database persistence
 */
export function useMessagingStrategy(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch active messaging strategy
  const {
    data: activeStrategy,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['messaging-strategy', 'active', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/messaging-strategies/active/${userId}`);
      return response.json();
    }
  });

  // Fetch all messaging strategies for user
  const {
    data: allStrategies = [],
    isLoading: isLoadingAll
  } = useQuery({
    queryKey: ['messaging-strategies', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/messaging-strategies/user/${userId}`);
      return response.json();
    }
  });

  // Create new messaging strategy
  const createStrategy = useMutation({
    mutationFn: async (strategyData: {
      title: string;
      content: string;
      completionPercentage?: number;
      sourceData?: any;
    }) => {
      const response = await apiRequest('POST', '/api/messaging-strategies', {
        userId,
        ...strategyData,
        version: 1,
        isActive: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-strategy', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['messaging-strategies', userId] });
      toast({
        title: "Strategy Saved",
        description: "Your messaging strategy has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to create messaging strategy:', error);
      toast({
        title: "Save Failed",
        description: "Your messaging strategy couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update existing messaging strategy
  const updateStrategy = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<MessagingStrategy> }) => {
      const response = await apiRequest('PUT', `/api/messaging-strategies/${id}`, updates);
      return response.json();
    },
    onSuccess: (updatedStrategy, variables, context: any) => {
      // Only invalidate cache for auto-regeneration, not manual saves
      // Manual saves are handled by direct API calls to prevent conflicts
      if (!context?.skipCacheInvalidation) {
        queryClient.invalidateQueries({ queryKey: ['messaging-strategy', 'active', userId] });
        queryClient.invalidateQueries({ queryKey: ['messaging-strategies', userId] });
      }
      
      // Only show toast for auto-regeneration
      if (!context?.skipToast) {
        toast({
          title: "Strategy Updated",
          description: "Your messaging strategy has been updated successfully.",
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to update messaging strategy:', error);
      toast({
        title: "Update Failed",
        description: "Your messaging strategy couldn't be updated. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Set active messaging strategy
  const setActiveStrategy = useMutation({
    mutationFn: async (strategyId: number) => {
      const response = await apiRequest('POST', `/api/messaging-strategies/${strategyId}/activate/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-strategy', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['messaging-strategies', userId] });
    },
    onError: (error: any) => {
      console.error('Failed to activate messaging strategy:', error);
      toast({
        title: "Activation Failed",
        description: "The strategy couldn't be activated. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete messaging strategy
  const deleteStrategy = useMutation({
    mutationFn: async (strategyId: number) => {
      return apiRequest('DELETE', `/api/messaging-strategies/${strategyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-strategy', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['messaging-strategies', userId] });
      toast({
        title: "Strategy Deleted",
        description: "The messaging strategy has been deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete messaging strategy:', error);
      toast({
        title: "Delete Failed",
        description: "The strategy couldn't be deleted. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    activeStrategy,
    allStrategies,
    isLoading,
    isLoadingAll,
    error,
    refetch,
    createStrategy,
    updateStrategy,
    setActiveStrategy,
    deleteStrategy
  };
}

/**
 * Hook for localStorage migration functionality
 */
export function useLocalStorageMigration(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if user has existing database data
  const {
    data: hasExistingData,
    isLoading: isCheckingData
  } = useQuery({
    queryKey: ['migration-check-existing', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/migration/check-existing/${userId}`);
      return response.json();
    }
  });

  // Migrate localStorage data to database
  const migrateData = useMutation({
    mutationFn: async (localStorageData: any) => {
      const response = await apiRequest('POST', '/api/migration/migrate', {
        userId,
        workbookResponses: localStorageData.workbookResponses || {},
        messagingStrategy: localStorageData.messagingStrategy,
        completedSections: localStorageData.completedSections || []
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['messaging-strategy', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['workbook-responses', userId] });
      
      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${result.migrated.strategies} strategies and ${result.migrated.responses} responses.`,
      });
    },
    onError: (error: any) => {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: "Your data couldn't be migrated. Please try again or contact support.",
        variant: "destructive"
      });
    }
  });

  return {
    hasExistingData: (hasExistingData as any)?.hasExistingData || false,
    isCheckingData,
    migrateData
  };
}

/**
 * Hook for managing offer outlines with database persistence
 */
export function useOfferOutlines(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch most recent offer outline (regardless of active status)
  const {
    data: activeOutline,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-offer-outline', 'active', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-offer-outlines/user/${userId}`);
      const data = await response.json();
      // Return the most recent outline if any exist
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }
  });

  // Fetch all offer outlines for user
  const {
    data: allOutlines = [],
    isLoading: isLoadingAll
  } = useQuery({
    queryKey: ['user-offer-outlines', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-offer-outlines/user/${userId}`);
      return response.json();
    }
  });

  // Create new offer outline
  const createOutline = useMutation({
    mutationFn: async (outlineData: {
      title: string;
      content: string;
      completionPercentage?: number;
      sourceData?: any;
    }) => {
      const response = await apiRequest('POST', '/api/user-offer-outlines', {
        userId,
        ...outlineData,
        version: 1,
        isActive: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-offer-outline', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-offer-outlines', userId] });
      toast({
        title: "Outline Saved",
        description: "Your offer outline has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to create offer outline:', error);
      toast({
        title: "Save Failed",
        description: "Your offer outline couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update existing offer outline
  const updateOutline = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<UserOfferOutline> }) => {
      const response = await apiRequest('PUT', `/api/user-offer-outlines/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-offer-outline', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-offer-outlines', userId] });
      toast({
        title: "Outline Updated",
        description: "Your offer outline has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to update offer outline:', error);
      toast({
        title: "Update Failed",
        description: "Your offer outline couldn't be updated. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Set active offer outline
  const setActiveOutline = useMutation({
    mutationFn: async (outlineId: number) => {
      const response = await apiRequest('POST', `/api/user-offer-outlines/${outlineId}/activate/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-offer-outline', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-offer-outlines', userId] });
    },
    onError: (error: any) => {
      console.error('Failed to activate offer outline:', error);
      toast({
        title: "Activation Failed",
        description: "The outline couldn't be activated. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete offer outline
  const deleteOutline = useMutation({
    mutationFn: async (outlineId: number) => {
      return apiRequest('DELETE', `/api/user-offer-outlines/${outlineId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-offer-outline', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-offer-outlines', userId] });
      toast({
        title: "Outline Deleted",
        description: "The offer outline has been deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete offer outline:', error);
      toast({
        title: "Delete Failed",
        description: "The outline couldn't be deleted. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    activeOutline,
    allOutlines,
    isLoading,
    isLoadingAll,
    error,
    createOutline,
    updateOutline,
    setActiveOutline,
    deleteOutline
  };
}

// Export migration interfaces for typing
export interface Step2MigrationData {
  workbookResponses: Record<string, string>;
}

export interface Step4MigrationData {
  workbookResponses?: Record<string, string>;
  salesStrategyResponses?: any;
  dailyConnectionPlan?: string;
  aiLocationSuggestions?: any;
}

/**
 * Hook for Step 2 migration from localStorage to database
 */
export function useStep2Migration(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (migrationData: Step2MigrationData) => {
      const response = await apiRequest('POST', '/api/migrate-step2-responses', {
        userId,
        ...migrationData
      });

      if (!response.ok) {
        throw new Error('Failed to migrate Step 2 responses');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/workbook-responses', userId, 2] });
      
      // Clean up localStorage after successful migration
      if (data.migrated && Array.isArray(data.migratedKeys)) {
        data.migratedKeys.forEach((key: string) => {
          localStorage.removeItem(`workbook-2-${key}`);
        });
        
        console.log('Step 2 localStorage cleanup completed after successful migration');
        
        toast({
          title: "Data Migrated",
          description: "Your Step 2 responses have been migrated to secure database storage.",
        });
      }
    },
    onError: (error: any) => {
      console.error('Step 2 migration failed:', error);
      toast({
        title: "Migration Failed",
        description: "Your Step 2 data couldn't be migrated. Please try again.",
        variant: "destructive"
      });
    }
  });
}

/**
 * Hook for Sell Your Offer localStorage migration functionality (Step 4)
 */
export function useSellOfferMigration(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Parse Step 4 localStorage patterns
  const parseStep4LocalStorage = () => {
    const step4Responses: Array<{
      sectionTitle: string;
      questionKey: string;
      responseText: string;
    }> = [];

    try {
      // Parse sales-strategy-responses-{userId}
      const salesStrategyKey = `sales-strategy-responses-${userId}`;
      const salesStrategyData = localStorage.getItem(salesStrategyKey);
      if (salesStrategyData) {
        const parsedData = JSON.parse(salesStrategyData);
        Object.entries(parsedData).forEach(([key, value]) => {
          if (typeof value === 'string' && value.trim()) {
            step4Responses.push({
              sectionTitle: 'Sales Strategy',
              questionKey: `sales-strategy-${key}`,
              responseText: value.trim()
            });
          }
        });
      }

      // Parse daily-connection-plan-{userId}
      const dailyPlanKey = `daily-connection-plan-${userId}`;
      const dailyPlanData = localStorage.getItem(dailyPlanKey);
      if (dailyPlanData && dailyPlanData.trim()) {
        step4Responses.push({
          sectionTitle: 'Daily Planning',
          questionKey: 'daily-connection-plan',
          responseText: dailyPlanData.trim()
        });
      }

      // Parse ai-location-suggestions-{userId}
      const aiLocationsKey = `ai-location-suggestions-${userId}`;
      const aiLocationsData = localStorage.getItem(aiLocationsKey);
      if (aiLocationsData) {
        try {
          const parsedLocations = JSON.parse(aiLocationsData);
          if (parsedLocations.suggestions && Array.isArray(parsedLocations.suggestions)) {
            step4Responses.push({
              sectionTitle: 'Customer Locations',
              questionKey: 'ai-location-suggestions',
              responseText: JSON.stringify(parsedLocations.suggestions)
            });
          }
        } catch (error) {
          console.log('Could not parse AI location suggestions:', error);
        }
      }

      // Parse customer location finder messages
      const locationMessagesKey = `customer-location-messages-${userId}`;
      const locationMessages = localStorage.getItem(locationMessagesKey);
      if (locationMessages) {
        try {
          const parsedMessages = JSON.parse(locationMessages);
          Object.entries(parsedMessages).forEach(([messageType, messageData]: [string, any]) => {
            if (messageData && messageData.content) {
              step4Responses.push({
                sectionTitle: 'Connection Strategy',
                questionKey: `location-message-${messageType}`,
                responseText: messageData.content
              });
            }
          });
        } catch (error) {
          console.log('Could not parse location messages:', error);
        }
      }

    } catch (error) {
      console.error('Error parsing Step 4 localStorage data:', error);
    }

    return step4Responses;
  };

  // Check for existing Step 4 migration data
  const hasPendingMigration = () => {
    const salesStrategyKey = `sales-strategy-responses-${userId}`;
    const dailyPlanKey = `daily-connection-plan-${userId}`;
    const aiLocationsKey = `ai-location-suggestions-${userId}`;
    
    return !!(
      localStorage.getItem(salesStrategyKey) ||
      localStorage.getItem(dailyPlanKey) ||
      localStorage.getItem(aiLocationsKey)
    );
  };

  // Migration mutation for Step 4 responses
  const migrationMutation = useMutation({
    mutationFn: async (responses: Array<{
      sectionTitle: string;
      questionKey: string;
      responseText: string;
    }>) => {
      const migrationData = {
        userId,
        stepNumber: 4,
        responses: responses.map(response => ({
          ...response,
          stepNumber: 4,
          userId
        }))
      };
      
      const response = await apiRequest('POST', "/api/workbook-responses/migrate", migrationData);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workbook-responses', userId, 4] });
      
      // Clean up localStorage after successful migration
      const keysToClean = [
        `sales-strategy-responses-${userId}`,
        `daily-connection-plan-${userId}`,
        `ai-location-suggestions-${userId}`,
        `customer-location-messages-${userId}`
      ];
      
      keysToClean.forEach(key => {
        localStorage.removeItem(key);
      });

      toast({
        title: "Data Migrated",
        description: `Successfully migrated ${result.migrated || 0} Sell Your Offer responses to secure storage.`,
      });
    },
    onError: (error: any) => {
      console.error('Step 4 migration failed:', error);
      toast({
        title: "Migration Failed",
        description: "Your Sell Your Offer data couldn't be migrated. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  });

  // Auto-migration function
  const migrateFromLocalStorage = async () => {
    const step4Data = parseStep4LocalStorage();
    
    if (step4Data.length > 0) {
      console.log(`Found ${step4Data.length} Step 4 responses in localStorage, initiating migration...`);
      return migrationMutation.mutateAsync(step4Data);
    }
    
    return { migrated: 0 };
  };

  return {
    parseStep4LocalStorage,
    hasPendingMigration: hasPendingMigration(),
    migrateFromLocalStorage,
    isMigrating: migrationMutation.isPending
  };
}

/**
 * Hook for Build Your Offer localStorage migration functionality (Step 3)
 */
export function useBuildOfferMigration(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Migration mutation for Step 3 responses
  const migrationMutation = useMutation({
    mutationFn: async (migrationData: any) => {
      const response = await apiRequest('POST', "/api/workbook-responses/migrate", migrationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workbook-responses', userId, 3] });
      toast({
        title: "Migration Complete",
        description: "Your Build Your Offer responses have been migrated to the database.",
      });
    },
    onError: (error: any) => {
      console.error('Step 3 migration failed:', error);
      toast({
        title: "Migration Failed",
        description: "Failed to migrate your responses. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Step 3 specific section mapping
  const step3SectionMapping: Record<string, string> = {
    'customer-experience': 'Customer Experience Design',
    'sales-page': 'Sales Page Content',
    'project-plan': 'Project Planning',
    'action-plan': 'Customer Action Plan',
    'sales-content': 'Generated Sales Content'
  };

  // Parse Step 3 localStorage keys
  const parseStep3LocalStorage = () => {
    const step3Responses: Array<{ questionKey: string; responseText: string; sectionTitle: string }> = [];
    const step3Pattern = /^workbook_3_([^_]+)_(\d+)$/;

    for (const key in localStorage) {
      const match = key.match(step3Pattern);
      if (match) {
        const [, sectionKey, questionIndex] = match;
        const sectionTitle = step3SectionMapping[sectionKey];
        const responseText = localStorage.getItem(key);
        
        if (sectionTitle && responseText && responseText.trim()) {
          step3Responses.push({
            questionKey: `${sectionKey}-${questionIndex}`,
            responseText,
            sectionTitle
          });
        }
      }
    }

    return step3Responses;
  };

  // Auto-migrate Step 3 data if found in localStorage
  const autoMigrate = async () => {
    const step3Data = parseStep3LocalStorage();
    
    if (step3Data.length > 0) {
      try {
        const migrationData = {
          userId,
          stepNumber: 3,
          responses: step3Data
        };
        
        const result = await migrationMutation.mutateAsync(migrationData);
        
        // Clean up localStorage after successful migration
        const step3Pattern = /^workbook_3_([^_]+)_(\d+)$/;
        for (const key in localStorage) {
          if (key.match(step3Pattern)) {
            localStorage.removeItem(key);
          }
        }
        
        return { migrated: step3Data.length, responses: step3Data, result };
      } catch (error) {
        console.error('Step 3 auto-migration failed:', error);
        throw error;
      }
    }
    
    return { migrated: 0, responses: [] };
  };

  // Manual migration with specific responses
  const migrateBatch = async (responses: Array<{ questionKey: string; responseText: string; sectionTitle: string }>) => {
    const migrationData = {
      userId,
      stepNumber: 3,
      responses
    };
    
    return migrationMutation.mutateAsync(migrationData);
  };

  return {
    autoMigrate,
    migrateBatch,
    parseStep3LocalStorage,
    step3SectionMapping,
    isMigrating: migrationMutation.isPending,
    migrationError: migrationMutation.error
  };
}

/**
 * Hook for offer outline localStorage migration functionality
 */
export function useOfferMigration(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if user has existing database data
  const {
    data: hasExistingData,
    isLoading: isCheckingData
  } = useQuery({
    queryKey: ['offer-migration-check-existing', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-offer-outlines/user/${userId}`);
      const data = await response.json();
      const hasOutline = Array.isArray(data) && data.length > 0;
      return { hasExistingData: hasOutline };
    }
  });

  // Migrate localStorage data to database
  const migrateData = useMutation({
    mutationFn: async (localStorageData: any) => {
      const response = await apiRequest('POST', '/api/user-offer-outlines', {
        userId,
        title: "Offer Outline",
        content: localStorageData.content || "",
        completionPercentage: localStorageData.completeness || 0,
        sourceData: {
          migratedFrom: "localStorage",
          originalTimestamp: localStorageData.lastUpdated,
          migrationTimestamp: new Date().toISOString(),
          workbookResponses: localStorageData.workbookResponses || {}
        },
        version: 1,
        isActive: true
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['user-offer-outline', 'active', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-offer-outlines', userId] });
      
      toast({
        title: "Migration Complete",
        description: "Your offer outline has been successfully migrated to the database.",
      });
    },
    onError: (error: any) => {
      console.error('Offer migration failed:', error);
      toast({
        title: "Migration Failed",
        description: "Your offer data couldn't be migrated. Please try again or contact support.",
        variant: "destructive"
      });
    }
  });

  return {
    hasExistingData: (hasExistingData as any)?.hasExistingData || false,
    isCheckingData,
    migrateData
  };
}
