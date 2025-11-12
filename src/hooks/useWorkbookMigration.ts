import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LocalStorageWorkbookData {
  stepNumber: number;
  responses: Array<{
    questionKey: string;
    responseText: string;
    sectionTitle: string;
  }>;
}

/**
 * Hook for automatically migrating localStorage workbook responses to database
 */
export function useWorkbookMigration(userId: number, stepNumber: number) {
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Parse localStorage data for specific step
  const getLocalStorageData = (step: number): LocalStorageWorkbookData | null => {
    const responses: Array<{
      questionKey: string;
      responseText: string;
      sectionTitle: string;
    }> = [];

    if (step === 2 || step === 3) {
      // Handle Steps 2-3: workbook_X_section-Y pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`workbook_${step}_`)) {
          const value = localStorage.getItem(key);
          if (value && value.trim().length > 0) {
            const sectionTitle = parseSectionTitle(key);
            responses.push({
              questionKey: key.replace(`workbook_${step}_`, ''),
              responseText: value,
              sectionTitle
            });
          }
        }
      }
    } else if (step === 4) {
      // Handle Step 4: Complex JSON objects
      const salesStrategyKey = `sales-strategy-responses-${userId}`;
      const dailyPlanKey = `daily-connection-plan-${userId}`;
      const locationsKey = `ai-location-suggestions-${userId}`;
      
      // Sales strategy responses
      const salesStrategyData = localStorage.getItem(salesStrategyKey);
      if (salesStrategyData) {
        try {
          const parsed = JSON.parse(salesStrategyData);
          Object.entries(parsed).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim().length > 0) {
              responses.push({
                questionKey: key,
                responseText: value,
                sectionTitle: 'Sales Strategy'
              });
            }
          });
        } catch (error) {
          console.log('Could not parse sales strategy data:', error);
        }
      }

      // Daily connection plan
      const dailyPlanData = localStorage.getItem(dailyPlanKey);
      if (dailyPlanData && dailyPlanData.trim().length > 0) {
        responses.push({
          questionKey: 'daily-connection-plan',
          responseText: dailyPlanData,
          sectionTitle: 'Daily Planning'
        });
      }

      // AI location suggestions
      const locationsData = localStorage.getItem(locationsKey);
      if (locationsData) {
        try {
          const parsed = JSON.parse(locationsData);
          if (parsed.suggestions || parsed.addedIds) {
            responses.push({
              questionKey: 'ai-location-suggestions',
              responseText: JSON.stringify(parsed),
              sectionTitle: 'Customer Locations'
            });
          }
        } catch (error) {
          console.log('Could not parse locations data:', error);
        }
      }
    }

    return responses.length > 0 ? { stepNumber: step, responses } : null;
  };

  // Parse section title from localStorage key
  const parseSectionTitle = (key: string): string => {
    const parts = key.split('_');
    if (parts.length >= 3) {
      const sectionPart = parts[2].split('-')[0];
      return sectionPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'Unknown Section';
  };

  // Migration mutation
  const migrateMutation = useMutation({
    mutationFn: async (data: LocalStorageWorkbookData) => {
      const response = await apiRequest('POST', '/api/workbook-responses/migrate', {
        userId,
        stepNumber: data.stepNumber,
        responses: data.responses
      });
      return response.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['workbook-responses', userId, stepNumber] });
      setMigrationComplete(true);
      
      console.log(`Migration successful: ${result.migrated || 0} responses transferred`);
      
      if (result.migrated > 0) {
        toast({
          title: "Data Synchronized",
          description: `${result.migrated} responses transferred to secure storage.`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Migration failed:', error);
      toast({
        title: "Sync Failed",
        description: "Could not transfer data to secure storage. Your work is preserved locally.",
        variant: "destructive"
      });
    }
  });

  // Check for migration need and trigger if needed
  useEffect(() => {
    if (migrationComplete || migrateMutation.isPending) return;

    const localData = getLocalStorageData(stepNumber);
    if (localData && localData.responses.length > 0) {
      setMigrationNeeded(true);
      
      // Trigger migration automatically
      setTimeout(() => {
        migrateMutation.mutate(localData);
      }, 1000); // Small delay to ensure component is fully mounted
    }
  }, [stepNumber, userId, migrationComplete, migrateMutation.isPending]);

  return {
    migrationComplete,
    migrationNeeded,
    isMigrating: migrateMutation.isPending,
    migrationError: migrateMutation.error
  };
}
