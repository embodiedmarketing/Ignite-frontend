import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";

interface ManualSaveParams {
  userId: number;
  stepNumber: number;
  offerNumber: number;
  questionKey: string;
  responseText: string;
  sectionTitle: string;
}

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
      console.log("[MANUAL SAVE] Saving response:", {
        userId,
        stepNumber,
        offerNumber,
        questionKey,
        responseText:
          responseText.substring(0, 100) +
          (responseText.length > 100 ? "..." : ""),
        sectionTitle,
        timestamp: new Date().toISOString(),
      });

      // Validate inputs before sending
      if (
        !userId ||
        !stepNumber ||
        !questionKey ||
        responseText === undefined ||
        responseText === null
      ) {
        throw new Error("Missing required fields for save operation");
      }

      try {
        const requestBody = {
          userId: Number(userId),
          stepNumber: Number(stepNumber),
          offerNumber: Number(offerNumber || 1),
          questionKey: String(questionKey),
          responseText: String(responseText),
          sectionTitle: String(sectionTitle || questionKey.split("-")[0]),
        };

        console.log("[MANUAL SAVE] Request body:", requestBody);

        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/workbook-responses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(requestBody),
          }
        );

        console.log(
          "[MANUAL SAVE] Response status:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          let errorText = "";
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = "Unable to read error response";
          }
          console.error("[MANUAL SAVE] Server error response:", errorText);
          throw new Error(
            `Save failed: ${response.status} ${response.statusText}`
          );
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          console.error("[MANUAL SAVE] JSON parse error:", e);
          throw new Error("Server returned invalid response format");
        }

        console.log("[MANUAL SAVE] Save successful:", data);
        return data;
      } catch (error: any) {
        console.error("[MANUAL SAVE] Save error:", error);

        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new Error(
            "Network connection failed. Please check your internet connection."
          );
        }

        if (error.message.includes("JSON")) {
          throw new Error("Server response format error. Please try again.");
        }

        // Re-throw with more specific error message
        throw new Error(error.message || "Unknown save error occurred");
      }
    },
    onSuccess: (data, variables) => {
      console.log("[MANUAL SAVE] Success callback triggered:", data);

      // Invalidate and refetch relevant queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: [
          "workbook-responses",
          variables.userId,
          variables.stepNumber,
        ],
      });

      // Silent save - no toast notification for auto-saves before generation
    },
    onError: (error: any) => {
      console.error("[MANUAL SAVE] Save failed:", error);

      // Detailed error messages based on error type
      let errorMessage = "Your response couldn't be saved. Please try again.";

      if (error.message.includes("Network connection failed")) {
        errorMessage =
          "Network connection failed. Please check your internet and try again.";
      } else if (error.message.includes("500")) {
        errorMessage = "Server error occurred. Please try again in a moment.";
      } else if (error.message.includes("400")) {
        errorMessage =
          "Invalid data format. Please check your response and try again.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
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
