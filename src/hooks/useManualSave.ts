import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import { queryKeys } from "@/services/queryKeys";
import { API } from "@/services/apiEndpoints";

export function useManualSave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveResponse = useMutation({
    mutationFn: async ({
      userId,
      stepNumber,
      offerNumber,
      questionKey,
      responseText,
      sectionTitle,
    }: {
      userId: number;
      stepNumber: number;
      offerNumber?: number;
      questionKey: string;
      responseText: string;
      sectionTitle: string;
    }) => {
      if (
        !userId ||
        !stepNumber ||
        !questionKey ||
        responseText === undefined ||
        responseText === null
      ) {
        throw new Error("Missing required fields for save operation");
      }

      const requestBody = {
        userId: Number(userId),
        stepNumber: Number(stepNumber),
        offerNumber: Number(offerNumber ?? 1),
        questionKey: String(questionKey),
        responseText: String(responseText),
        sectionTitle: String(sectionTitle || questionKey.split("-")[0]),
      };

      const response = await apiRequest(
        "POST",
        API.WORKBOOK_RESPONSES,
        requestBody,
        { maxRetries: 2 }
      );

      const data = await response.json();
      return data;
    },
    onSuccess: (_data, variables) => {
      const offerNumber = variables.offerNumber ?? 1;
      queryClient.invalidateQueries({
        queryKey: queryKeys.workbookResponses(
          variables.userId,
          variables.stepNumber,
          offerNumber
        ),
      });
    },
    onError: (error: any) => {
      console.error("[MANUAL SAVE] Save failed:", error);
      const msg = error?.message ?? "";
      let errorMessage = "Your response couldn't be saved. Please try again.";
      if (msg.includes("Network") || msg.includes("connection failed")) {
        errorMessage =
          "Network connection failed. Please check your internet and try again.";
      } else if (msg.includes("500")) {
        errorMessage = "Server error occurred. Please try again in a moment.";
      } else if (msg.includes("400")) {
        errorMessage =
          "Invalid data format. Please check your response and try again.";
      } else if (msg.includes("401") || msg.includes("403")) {
        errorMessage =
          "Authentication error. Please refresh the page and try again.";
      }

      // Error toast notification
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });

      // Re-throw error so SaveButton can handle it
      throw error;
    },
  });

  return {
    saveResponse: saveResponse.mutateAsync,
    isSaving: saveResponse.isPending,
    error: saveResponse.error,
  };
}
