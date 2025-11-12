import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiClient } from "@/services/api.config";

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ["/auth/user"], // just a unique key, can be relative
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<User>("/api/auth/user");
        return data;
      } catch (err: any) {
        if (!err.response) {
          console.error("Network error: server may be down");
          return null;
        }

        const status = err.response.status;
        if (status === 401) return null;
        if (status >= 500) {
          console.error("Server error during auth check:", status);
          return null;
        }

        throw err;
      }
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
