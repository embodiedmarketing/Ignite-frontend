import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import type {
  MessagingStrategy,
  InsertMessagingStrategy,
} from "@shared/schema";

export function useMessagingStrategies(userId: number) {
  return useQuery({
    queryKey: ["/api/messaging-strategies/user", userId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/messaging-strategies/user/${userId}`
      );
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useActiveMessagingStrategy(userId: number) {
  return useQuery({
    queryKey: ["/api/messaging-strategies/active", userId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/messaging-strategies/active/${userId}`
      );
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useCreateMessagingStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (strategyData: InsertMessagingStrategy) => {
      const res = await apiRequest(
        "POST",
        "/api/messaging-strategies",
        strategyData
      );
      return res.json();
    },
    onSuccess: (newStrategy: MessagingStrategy) => {
      // Invalidate and refetch strategies for this user
      queryClient.invalidateQueries({
        queryKey: ["/api/messaging-strategies/user", newStrategy.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/messaging-strategies/active", newStrategy.userId],
      });
    },
  });
}

export function useUpdateMessagingStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<MessagingStrategy>;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/messaging-strategies/${id}`,
        updates
      );
      return res.json();
    },
    onSuccess: (updatedStrategy: MessagingStrategy) => {
      // Invalidate and refetch strategies for this user
      queryClient.invalidateQueries({
        queryKey: ["/api/messaging-strategies/user", updatedStrategy.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/messaging-strategies/active", updatedStrategy.userId],
      });
    },
  });
}

export function useDeleteMessagingStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/messaging-strategies/${id}`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all messaging strategy queries since we don't know the userId
      queryClient.invalidateQueries({
        queryKey: ["/api/messaging-strategies"],
      });
    },
  });
}

export function useSetActiveMessagingStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      strategyId,
    }: {
      userId: number;
      strategyId: number;
    }) => {
      const res = await apiRequest(
        "POST",
        "/api/messaging-strategies/set-active",
        { userId, strategyId }
      );
      return res.json();
    },
    onSuccess: (_, { userId }) => {
      // Invalidate and refetch strategies for this user
      queryClient.invalidateQueries({
        queryKey: ["/api/messaging-strategies/user", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/messaging-strategies/active", userId],
      });
    },
  });
}

// Migration hook for localStorage to database
export function useMessagingStrategyMigration(userId: number) {
  const createStrategyMutation = useCreateMessagingStrategy();
  const setActiveMutation = useSetActiveMessagingStrategy();

  const migrateFromLocalStorage = async () => {
    if (!userId) return { success: false, error: "No user ID provided" };

    let migratedCount = 0;
    const migrationResults = [];

    try {
      // Check for messaging strategy in localStorage
      const messagingStrategyKeys = [
        "messagingStrategy",
        `messagingStrategy-${userId}`,
        "step-1-messaging-strategy",
        `step-1-messaging-strategy-${userId}`,
      ];

      for (const key of messagingStrategyKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsedData = JSON.parse(data);

            // Handle different localStorage formats
            if (typeof parsedData === "object" && parsedData !== null) {
              const strategyContent =
                typeof parsedData === "string"
                  ? parsedData
                  : JSON.stringify(parsedData);

              if (strategyContent.trim().length > 0) {
                const strategy = await createStrategyMutation.mutateAsync({
                  userId,
                  title: `Messaging Strategy - Migrated ${new Date().toLocaleDateString()}`,
                  content: strategyContent,
                  isActive: true,
                  sourceData: {
                    migratedFromLocalStorage: true,
                    originalKey: key,
                  },
                });

                // Set as active strategy
                await setActiveMutation.mutateAsync({
                  userId,
                  strategyId: strategy.id,
                });

                migratedCount++;
                migrationResults.push({
                  key,
                  strategyId: strategy.id,
                  success: true,
                });

                // Remove from localStorage after successful migration
                localStorage.removeItem(key);
              }
            }
          } catch (parseError) {
            console.error(
              `Error parsing localStorage data for key ${key}:`,
              parseError
            );
            migrationResults.push({
              key,
              success: false,
              error: "Failed to parse localStorage data",
            });
          }
        }
      }

      return {
        success: true,
        migratedCount,
        results: migrationResults,
      };
    } catch (error) {
      console.error("Error during messaging strategy migration:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown migration error",
        migratedCount,
        results: migrationResults,
      };
    }
  };

  return {
    migrateFromLocalStorage,
    isCreating: createStrategyMutation.isPending,
    isSettingActive: setActiveMutation.isPending,
    error: createStrategyMutation.error || setActiveMutation.error,
  };
}

// Complete messaging strategy management hook
export function useMessagingStrategyManager(userId: number) {
  const strategiesQuery = useMessagingStrategies(userId);
  const activeStrategyQuery = useActiveMessagingStrategy(userId);
  const createMutation = useCreateMessagingStrategy();
  const updateMutation = useUpdateMessagingStrategy();
  const deleteMutation = useDeleteMessagingStrategy();
  const setActiveMutation = useSetActiveMessagingStrategy();
  const migration = useMessagingStrategyMigration(userId);

  return {
    // Data
    strategies: strategiesQuery.data || [],
    activeStrategy: activeStrategyQuery.data,

    // Loading states
    isLoading: strategiesQuery.isLoading || activeStrategyQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingActive: setActiveMutation.isPending,

    // Actions
    createStrategy: createMutation.mutateAsync,
    updateStrategy: updateMutation.mutateAsync,
    deleteStrategy: deleteMutation.mutateAsync,
    setActiveStrategy: setActiveMutation.mutateAsync,

    // Migration
    migrateFromLocalStorage: migration.migrateFromLocalStorage,
    isMigrating: migration.isCreating || migration.isSettingActive,

    // Errors
    error:
      strategiesQuery.error ||
      activeStrategyQuery.error ||
      createMutation.error ||
      updateMutation.error ||
      deleteMutation.error ||
      setActiveMutation.error ||
      migration.error,

    // Refetch
    refetch: () => {
      strategiesQuery.refetch();
      activeStrategyQuery.refetch();
    },
  };
}
