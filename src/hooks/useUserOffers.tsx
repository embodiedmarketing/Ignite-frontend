import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api.config";
import type { UserOffer, InsertUserOffer } from "@shared/schema";

// Hook to get all user offers
export function useUserOffers(userId: number) {
  return useQuery({
    queryKey: ["/api/user-offers/user", userId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/user-offers/user/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

// Hook to get active user offer
export function useActiveUserOffer(userId: number) {
  return useQuery({
    queryKey: ["/api/user-offers/active", userId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/user-offers/active/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

// Hook to get specific user offer
export function useUserOffer(offerId: number) {
  return useQuery({
    queryKey: ["/api/user-offers", offerId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/user-offers/${offerId}`);
      return data;
    },
    enabled: !!offerId,
  });
}

// Hook to create user offer
export function useCreateUserOffer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (offerData: InsertUserOffer) => {
      const { data } = await apiClient.post("/api/user-offers", offerData);
      return data;
    },
    onSuccess: (newOffer, variables) => {
      // Invalidate and refetch user offers
      queryClient.invalidateQueries({ queryKey: ["/api/user-offers/user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-offers/active", variables.userId] });
    },
  });
}

// Hook to update user offer
export function useUpdateUserOffer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<UserOffer> }) => {
      const { data } = await apiClient.put(`/api/user-offers/${id}`, updates);
      return data;
    },
    onSuccess: (updatedOffer, variables) => {
      // Update individual offer cache
      queryClient.setQueryData(["/api/user-offers", variables.id], updatedOffer);
      
      // Invalidate user offers list if the offer exists
      if (updatedOffer) {
        queryClient.invalidateQueries({ queryKey: ["/api/user-offers/user", updatedOffer.userId] });
        queryClient.invalidateQueries({ queryKey: ["/api/user-offers/active", updatedOffer.userId] });
      }
    },
  });
}

// Hook to delete user offer
export function useDeleteUserOffer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/api/user-offers/${id}`);
      return data;
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: ["/api/user-offers", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-offers/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-offers/active"] });
    },
  });
}

// Hook to set offer as active
export function useSetActiveOffer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ offerId, userId }: { offerId: number; userId: number }) => {
      const { data } = await apiClient.post(`/api/user-offers/${offerId}/set-active`);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch active offer queries
      queryClient.invalidateQueries({ queryKey: ["/api/user-offers/active", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-offers/user", variables.userId] });
    },
  });
}

// Hook to get active offer for a user
export function useActiveOffer(userId: number) {
  return useQuery({
    queryKey: ["/api/user-offers/active", userId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/api/user-offers/active/${userId}`);
        return data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // No active offer found
        }
        throw error;
      }
    },
    enabled: !!userId,
  });
}
