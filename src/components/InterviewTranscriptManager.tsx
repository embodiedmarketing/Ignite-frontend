import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Trash2,
  Edit3,
  Plus,
  Calendar,
  User,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Upload,
  File,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import type {
  IcaInterviewTranscript,
  InsertIcaInterviewTranscript,
} from "@shared/schema";

interface InterviewTranscriptManagerProps {
  userId: number;
}

// Status badge component for four states
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "draft":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          draft
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
        >
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          processing
        </Badge>
      );
    case "processed":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 hover:bg-green-200"
        >
          processed
        </Badge>
      );
    case "updated":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          updated
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          {status}
        </Badge>
      );
  }
};

export function InterviewTranscriptManager({
  userId,
}: InterviewTranscriptManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTranscript, setEditingTranscript] =
    useState<IcaInterviewTranscript | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<number>>(
    new Set()
  );
  const [newTranscript, setNewTranscript] = useState({
    title: "",
    customerName: "",
    interviewDate: "",
    rawTranscript: "",
  });
  const [uploadedFileName, setUploadedFileName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`transcript-draft-${userId}`);
    const savedFileName = localStorage.getItem(
      `transcript-draft-filename-${userId}`
    );

    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setNewTranscript(parsedDraft);
        console.log("Loaded saved transcript draft:", parsedDraft);
      } catch (error) {
        console.error("Failed to load transcript draft:", error);
      }
    }

    if (savedFileName) {
      setUploadedFileName(savedFileName);
    }
  }, [userId]);

  // Save draft to localStorage whenever it changes
  useEffect(() => {
    if (
      newTranscript.title ||
      newTranscript.customerName ||
      newTranscript.interviewDate ||
      newTranscript.rawTranscript
    ) {
      localStorage.setItem(
        `transcript-draft-${userId}`,
        JSON.stringify(newTranscript)
      );
      console.log("Auto-saved transcript draft to localStorage");
    }
  }, [newTranscript, userId]);

  // Save uploaded file name to localStorage
  useEffect(() => {
    if (uploadedFileName) {
      localStorage.setItem(
        `transcript-draft-filename-${userId}`,
        uploadedFileName
      );
    }
  }, [uploadedFileName, userId]);

  const { data: transcripts = [], isLoading } = useQuery<
    IcaInterviewTranscript[]
  >({
    queryKey: [`/api/interview-transcripts/user/${userId}`],
    enabled: !!userId,
  });

  // AUTOMATIC CLEANUP: Reset stuck "processing" transcripts when component mounts or data refreshes
  useEffect(() => {
    if (!transcripts || transcripts.length === 0) return;

    const stuckTranscripts = transcripts.filter((t: IcaInterviewTranscript) => {
      if (t.status !== "processing") return false;

      // Check if it's been processing for more than 3 minutes (stuck)
      const updatedAt = new Date(t.updatedAt).getTime();
      const now = Date.now();
      const minutesElapsed = (now - updatedAt) / (1000 * 60);

      return minutesElapsed > 3;
    });

    if (stuckTranscripts.length > 0) {
      console.log(
        `🔧 Found ${stuckTranscripts.length} stuck transcripts - resetting to draft`
      );

      // Reset each stuck transcript to draft
      stuckTranscripts.forEach(async (transcript: IcaInterviewTranscript) => {
        try {
          await apiRequest(
            "PUT",
            `/api/interview-transcripts/${transcript.id}`,
            {
              status: "draft",
            }
          );
          console.log(
            `✅ Reset stuck transcript ${transcript.id} (${transcript.title}) to draft`
          );
        } catch (error) {
          console.error(
            `❌ Failed to reset transcript ${transcript.id}:`,
            error
          );
        }
      });

      // Refresh the list after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [`/api/interview-transcripts/user/${userId}`],
        });
      }, 1000);
    }
  }, [transcripts, userId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertIcaInterviewTranscript) => {
      const response = await apiRequest(
        "POST",
        `/api/interview-transcripts`,
        data
      );
      return await response.json();
    },
    onSuccess: async (createdTranscript, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/interview-transcripts/user/${userId}`],
      });

      // Save transcript to IGNITE Docs automatically
      try {
        const transcriptMarkdown = `# ${variables.title}\n\n**Customer:** ${
          variables.customerName || "Not specified"
        }\n**Date:** ${
          variables.interviewDate
            ? new Date(variables.interviewDate).toLocaleDateString()
            : "Not specified"
        }\n\n---\n\n## Transcript\n\n${variables.rawTranscript}`;

        await apiRequest("POST", "/api/ignite-docs", {
          userId,
          docType: "interview_transcript",
          title: variables.title,
          contentMarkdown: transcriptMarkdown,
          sourcePayload: {
            transcriptId: createdTranscript.id,
            customerName: variables.customerName,
            interviewDate: variables.interviewDate,
          },
        });

        console.log("Automatically saved transcript to IGNITE Docs");

        // Invalidate IGNITE Docs cache to refresh the Resources page
        queryClient.invalidateQueries({
          queryKey: ["/api/ignite-docs/user", userId],
        });
      } catch (error) {
        console.error("Failed to save transcript to IGNITE Docs:", error);
      }

      setIsCreateDialogOpen(false);
      setNewTranscript({
        title: "",
        customerName: "",
        interviewDate: "",
        rawTranscript: "",
      });
      setUploadedFileName("");

      // Clear localStorage draft after successful save
      localStorage.removeItem(`transcript-draft-${userId}`);
      localStorage.removeItem(`transcript-draft-filename-${userId}`);
      console.log(
        "Cleared transcript draft from localStorage after successful save"
      );

      toast({ title: "Interview transcript saved and added to Resources" });
    },
    onError: () => {
      toast({
        title: "Failed to save interview transcript",
        variant: "destructive",
      });
    },
  });

  const intelligentProcessingMutation = useMutation({
    mutationFn: async ({
      transcript,
      existingMessagingStrategy,
      transcriptId,
    }: {
      transcript: string;
      existingMessagingStrategy: Record<string, string>;
      transcriptId: number | null;
    }) => {
      console.log(
        `🚀 Starting intelligent processing for transcript ${
          transcriptId || "batch"
        }`
      );

      // First update status to processing (only for individual transcripts)
      if (transcriptId) {
        try {
          await apiRequest(
            "PUT",
            `/api/interview-transcripts/${transcriptId}`,
            {
              status: "processing",
            }
          );
          queryClient.invalidateQueries({
            queryKey: [`/api/interview-transcripts/user/${userId}`],
          });
          console.log(
            `✅ Updated transcript ${transcriptId} status to 'processing'`
          );
        } catch (statusError) {
          console.error(
            `❌ Failed to update status to 'processing':`,
            statusError
          );
          throw new Error(
            `Failed to update transcript status: ${
              statusError instanceof Error
                ? statusError.message
                : "Unknown error"
            }`
          );
        }
      }

      // Then process with AI (with extended timeout for large transcripts)
      try {
        console.log(
          `🤖 Calling AI processing endpoint with 120 second timeout...`
        );

        // Use fetch directly with extended timeout for AI processing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds for AI processing

        const response = await fetch(
          "/api/interview/intelligent-interview-processing",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript,
              userId,
              existingMessagingStrategy,
            }),
            credentials: "include",
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `AI processing request failed: ${response.status} ${errorText}`
          );
        }

        const aiResponse = await response.json();
        console.log(`✅ AI processing completed successfully`);
        return { aiResponse, transcriptId };
      } catch (aiError) {
        console.error(`❌ AI processing failed:`, aiError);
        if (aiError instanceof Error && aiError.name === "AbortError") {
          throw new Error(
            "AI processing timed out after 120 seconds. Please try again with a shorter transcript."
          );
        }
        throw new Error(
          `AI processing failed: ${
            aiError instanceof Error ? aiError.message : "Unknown error"
          }`
        );
      }
    },
    onSuccess: async ({ aiResponse, transcriptId }) => {
      console.log("AI Processing Success - Full Response:", aiResponse);

      // Only update transcript status if it's individual processing
      if (transcriptId) {
        try {
          const updateResponse = await apiRequest(
            "PUT",
            `/api/interview-transcripts/${transcriptId}`,
            {
              status: "processed",
            }
          );
          const updatedTranscript = await updateResponse.json();

          // Store extracted insights for Content Strategy tab
          if (updatedTranscript.extractedInsights) {
            const insightsData = {
              extractedInsights: updatedTranscript.extractedInsights,
              transcriptId: transcriptId,
              processedAt: new Date().toISOString(),
            };
            localStorage.setItem(
              `latest-transcript-insights-${userId}`,
              JSON.stringify(insightsData)
            );
            console.log(
              "✅ Stored extracted insights for Content Strategy tab"
            );

            // Dispatch event to notify ContentPillarGenerator
            window.dispatchEvent(
              new CustomEvent("transcriptInsightsUpdated", {
                detail: insightsData,
              })
            );
          }

          queryClient.invalidateQueries({
            queryKey: [`/api/interview-transcripts/user/${userId}`],
          });
          console.log(
            `✅ Successfully updated transcript ${transcriptId} status to 'processed'`
          );
        } catch (statusUpdateError) {
          console.error(
            `❌ Failed to update transcript ${transcriptId} status to 'processed':`,
            statusUpdateError
          );
          // Still allow the rest of the processing to continue even if status update fails
          toast({
            title: "Status update failed",
            description:
              "Interview processed successfully but status update failed. Please refresh the page.",
            variant: "destructive",
          });
        }
      }

      // Fix: Extract the actual updates from the response structure
      const messagingUpdatesResponse = aiResponse.messagingUpdates;
      const messagingUpdates =
        messagingUpdatesResponse?.updates || messagingUpdatesResponse;
      const wasTruncated = messagingUpdatesResponse?.wasTruncated || false;

      console.log("Messaging Updates Response:", messagingUpdatesResponse);
      console.log("Extracted Updates:", messagingUpdates);
      console.log("Was Truncated:", wasTruncated);

      if (messagingUpdates && Object.keys(messagingUpdates).length > 0) {
        // Save to interview-notes which is what customer research questions actually read from
        const existingNotes = JSON.parse(
          localStorage.getItem(`interview-notes-${userId}`) || "{}"
        );
        console.log("Existing interview-notes:", existingNotes);

        const updatedNotes = { ...existingNotes, ...messagingUpdates };
        console.log("Updated interview-notes to save:", updatedNotes);

        localStorage.setItem(
          `interview-notes-${userId}`,
          JSON.stringify(updatedNotes)
        );

        // Save to database as well
        try {
          const savePromises = Object.entries(messagingUpdates).map(
            ([noteKey, content]) =>
              apiRequest("POST", "/api/interview-notes", {
                userId,
                noteKey,
                content: content as string,
                source: "ai-processing",
              })
          );

          await Promise.all(savePromises);
          console.log(
            `Successfully saved ${
              Object.keys(messagingUpdates).length
            } interview insights to database`
          );
        } catch (error) {
          console.error(
            "Failed to save interview insights to database:",
            error
          );
        }

        // Verify save
        const savedNotes = JSON.parse(
          localStorage.getItem(`interview-notes-${userId}`) || "{}"
        );
        console.log("Verified saved interview-notes:", savedNotes);

        // Step 6: Update UI feedback to distinguish between individual and batch
        const isProcessingAll = !transcriptId;
        const truncationMessage = wasTruncated
          ? " (Some content was truncated due to length)"
          : "";

        toast({
          title: isProcessingAll
            ? "All interviews processed!"
            : "Interview processed!",
          description: isProcessingAll
            ? `Intelligently processed ${transcripts.length} interviews and updated customer research.${truncationMessage}`
            : `Intelligently processed interview insights and updated ${
                Object.keys(messagingUpdates).length
              } questions.${truncationMessage}`,
        });

        // Trigger re-render by dispatching a custom event that the parent component can listen to
        window.dispatchEvent(
          new CustomEvent("interviewNotesUpdated", {
            detail: {
              messagingUpdates,
              wasTruncated,
              shouldUpdateTextAreas: !transcriptId,
            },
          })
        );
      } else {
        console.log("No messaging updates received");
        toast({
          title: "Processing completed",
          description: "Interview processed but no new insights extracted.",
          variant: "destructive",
        });
      }
    },
    onError: async (error: any, variables) => {
      console.error("❌ AI Processing Error - Full Details:", {
        error,
        message: error?.message,
        stack: error?.stack,
        transcriptId: variables.transcriptId,
        isNetworkError:
          error?.message?.includes("network") ||
          error?.message?.includes("fetch"),
      });

      // NETWORK RECOVERY LOGIC: Check if processing actually succeeded despite connection loss
      const isNetworkError =
        error?.message?.includes("network") ||
        error?.message?.includes("fetch") ||
        error?.message?.includes("Failed to fetch");

      if (isNetworkError) {
        console.log(
          "🔍 Network error detected - checking if processing actually succeeded..."
        );

        try {
          // Wait 2 seconds for potential background completion
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Refetch transcripts to check actual database status
          const transcriptsResponse = await fetch(
            `/api/interview-transcripts/user/${userId}`,
            {
              credentials: "include",
            }
          );

          if (transcriptsResponse.ok) {
            const latestTranscripts = await transcriptsResponse.json();
            const processingCount = latestTranscripts.filter(
              (t: any) => t.status === "processing"
            ).length;

            console.log(
              `📊 Status check: ${processingCount} transcripts still processing`
            );

            // If no transcripts are processing, the job actually completed!
            if (processingCount === 0) {
              console.log(
                "✅ RECOVERY: Processing actually completed despite network error!"
              );

              // Refetch interview notes to update UI
              queryClient.invalidateQueries({
                queryKey: [`/api/interview-transcripts/user/${userId}`],
              });
              queryClient.invalidateQueries({
                queryKey: ["/api/interview-notes"],
              });

              // Trigger UI update
              window.dispatchEvent(
                new CustomEvent("interviewNotesUpdated", {
                  detail: {
                    messagingUpdates: {},
                    wasTruncated: false,
                    shouldUpdateTextAreas: true,
                  },
                })
              );

              toast({
                title: "Processing completed successfully!",
                description:
                  "Your interview insights have been saved. Connection was lost but the processing finished.",
              });

              return; // Exit early - don't show error or revert status
            }
          }
        } catch (recoveryError) {
          console.error("Recovery check failed:", recoveryError);
          // Continue to normal error handling
        }
      }

      // Normal error handling: Revert status back to draft on error (only for individual transcripts)
      if (variables.transcriptId) {
        try {
          console.log(
            `🔄 Reverting transcript ${variables.transcriptId} status to 'draft'`
          );
          await apiRequest(
            "PUT",
            `/api/interview-transcripts/${variables.transcriptId}`,
            {
              status: "draft",
            }
          );
          queryClient.invalidateQueries({
            queryKey: [`/api/interview-transcripts/user/${userId}`],
          });
          console.log(`✅ Successfully reverted status to 'draft'`);
        } catch (updateError) {
          console.error("❌ Failed to revert status:", updateError);
        }
      }

      // Show user-friendly error message with technical details
      const errorMessage = error?.message || "Unknown error occurred";
      toast({
        title: "Processing failed",
        description: `Error: ${errorMessage}. Check console for details.`,
        variant: "destructive",
      });
    },
  });

  const triggerIntelligentProcessing = (
    transcript: string,
    transcriptId: number
  ) => {
    console.log(
      "Triggering intelligent processing with transcript:",
      transcript?.substring(0, 100) + "..."
    );
    // Get existing messaging strategy from localStorage
    const existingMessagingStrategy = JSON.parse(
      localStorage.getItem(`step-1-responses-${userId}`) || "{}"
    );
    console.log("Existing messaging strategy:", existingMessagingStrategy);

    intelligentProcessingMutation.mutate({
      transcript,
      existingMessagingStrategy,
      transcriptId,
    });
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("transcript", file);

      const response = await fetch("/api/interview/upload-transcript", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNewTranscript((prev) => ({
          ...prev,
          rawTranscript: data.transcriptText,
        }));
        toast({ title: "File uploaded successfully" });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload failed",
        description: "Please try again or paste the transcript text manually.",
        variant: "destructive",
      });
    }
  };

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<IcaInterviewTranscript>;
    }) => {
      // Check if this is a content update on a processed transcript
      const currentTranscript = transcripts.find((t) => t.id === id);

      // If the transcript is currently processed and we're updating any content fields,
      // automatically transition to 'updated' status
      if (currentTranscript?.status === "processed") {
        data.status = "updated";
      }

      return apiRequest("PUT", `/api/interview-transcripts/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/interview-transcripts/user/${userId}`],
      });
      setEditingTranscript(null);

      // Show appropriate success message based on status transition
      const currentTranscript = transcripts.find((t) => t.id === variables.id);
      const wasProcessed = currentTranscript?.status === "processed";

      if (wasProcessed) {
        toast({
          title: "Transcript updated - Process with AI button now available",
        });
      } else {
        toast({ title: "Interview transcript updated successfully" });
      }
    },
    onError: () => {
      toast({
        title: "Failed to update interview transcript",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/interview-transcripts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/interview-transcripts/user/${userId}`],
      });
      toast({ title: "Interview transcript deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete interview transcript",
        variant: "destructive",
      });
    },
  });

  // Create combined transcript from all transcripts
  const createCombinedTranscript = () => {
    return transcripts
      .map(
        (t) =>
          `Interview: ${t.title}\nDate: ${t.interviewDate || "Unknown"}\n\n${
            t.rawTranscript
          }`
      )
      .join("\n\n---INTERVIEW SEPARATOR---\n\n");
  };

  // Handle processing all transcripts using the same intelligent processing
  const handleProcessAll = () => {
    const combinedTranscript = createCombinedTranscript();
    const existingMessagingStrategy = JSON.parse(
      localStorage.getItem(`step-1-responses-${userId}`) || "{}"
    );

    // Use the SAME mutation as individual processing
    intelligentProcessingMutation.mutate({
      transcript: combinedTranscript,
      existingMessagingStrategy,
      transcriptId: null, // indicates batch processing
    });
  };

  const toggleExpanded = (transcriptId: number) => {
    const newExpanded = new Set(expandedTranscripts);
    if (newExpanded.has(transcriptId)) {
      newExpanded.delete(transcriptId);
    } else {
      newExpanded.add(transcriptId);
    }
    setExpandedTranscripts(newExpanded);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">Loading interview transcripts...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">ICA Interview Transcripts</h3>
          <p className="text-sm text-muted-foreground">
            Organize and reference your customer interview transcripts
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Transcript
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-[hsl(35,33%,95%)] border-[hsl(35,20%,85%)]">
              <DialogHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-semibold text-[hsl(217,42%,14%)]">
                    Add Interview Transcript
                  </DialogTitle>
                  {(newTranscript.title ||
                    newTranscript.customerName ||
                    newTranscript.interviewDate ||
                    newTranscript.rawTranscript) && (
                    <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Draft saved
                    </span>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Interview Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="text-sm font-semibold text-[hsl(217,42%,14%)]"
                    >
                      Interview Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Marketing Consultant Interview #1"
                      value={newTranscript.title}
                      onChange={(e) =>
                        setNewTranscript((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="bg-white border border-[hsl(35,20%,85%)] focus-visible:ring-1 focus-visible:ring-[hsl(213,81%,59%)] text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="customerName"
                      className="text-sm font-semibold text-[hsl(217,42%,14%)]"
                    >
                      Customer Name
                    </Label>
                    <Input
                      id="customerName"
                      placeholder="e.g., Sarah Johnson"
                      value={newTranscript.customerName}
                      onChange={(e) =>
                        setNewTranscript((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      className="bg-white border border-[hsl(35,20%,85%)] focus-visible:ring-1 focus-visible:ring-[hsl(213,81%,59%)] text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="interviewDate"
                    className="text-sm font-semibold text-[hsl(217,42%,14%)]"
                  >
                    Interview Date
                  </Label>
                  <Input
                    id="interviewDate"
                    type="date"
                    value={newTranscript.interviewDate}
                    onChange={(e) =>
                      setNewTranscript((prev) => ({
                        ...prev,
                        interviewDate: e.target.value,
                      }))
                    }
                    className="bg-white border border-[hsl(35,20%,85%)] focus-visible:ring-1 focus-visible:ring-[hsl(213,81%,59%)] max-w-xs text-base"
                  />
                </div>

                {/* Transcript Upload Section */}
                <div className="space-y-3 pt-2">
                  <Label className="text-base font-semibold text-[hsl(217,42%,14%)]">
                    Upload Transcript
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[hsl(217,20%,40%)]">
                        Upload file (.txt, .docx, .pdf, or .vtt):
                      </Label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".txt,.docx,.pdf,.vtt"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="transcript-file-upload"
                        />
                        <label
                          htmlFor="transcript-file-upload"
                          className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-[hsl(213,81%,59%)] rounded-lg bg-white hover:bg-[hsl(213,81%,59%)]/5 transition-all duration-200 group"
                        >
                          <div className="text-center">
                            <File className="w-8 h-8 text-[hsl(213,81%,59%)] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-[hsl(217,42%,14%)]">
                              Click to upload
                            </span>
                          </div>
                        </label>
                        {uploadedFileName && (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                            <span className="text-green-600">✓</span>
                            <span className="font-medium">
                              {uploadedFileName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Text Paste */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[hsl(217,20%,40%)]">
                        Or paste transcript text:
                      </Label>
                      <Textarea
                        placeholder="Paste the full transcript here..."
                        value={newTranscript.rawTranscript}
                        onChange={(e) =>
                          setNewTranscript((prev) => ({
                            ...prev,
                            rawTranscript: e.target.value,
                          }))
                        }
                        rows={5}
                        spellCheck={true}
                        className="resize-none bg-white border border-[hsl(35,20%,85%)] focus-visible:ring-1 focus-visible:ring-[hsl(213,81%,59%)] text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(35,20%,85%)]">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      // Don't clear form data on cancel - let user continue later
                    }}
                    className="px-6 border-2 border-[hsl(35,20%,85%)] hover:bg-[hsl(35,20%,90%)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      createMutation.mutate({
                        userId: String(userId),
                        title: newTranscript.title || "Untitled Interview",
                        customerName: newTranscript.customerName || undefined,
                        interviewDate: newTranscript.interviewDate as any,
                        rawTranscript: newTranscript.rawTranscript,
                        status: "draft",
                      })
                    }
                    disabled={
                      !newTranscript.rawTranscript.trim() ||
                      createMutation.isPending
                    }
                    className="px-6 bg-[hsl(12,85%,76%)] hover:bg-[hsl(12,85%,70%)] text-[hsl(217,42%,14%)] font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    {createMutation.isPending ? "Saving..." : "Save Interview"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {transcripts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No interview transcripts yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Start organizing your customer interviews by adding your first
              transcript
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Transcript
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transcripts.map((transcript) => (
            <Card key={transcript.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-3">
                      {transcript.title}
                      {transcript.status && (
                        <StatusBadge status={transcript.status} />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {transcript.customerName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {transcript.customerName}
                        </div>
                      )}
                      {transcript.interviewDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(transcript.interviewDate)}
                        </div>
                      )}
                      {transcript.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {transcript.duration}
                        </div>
                      )}
                      {transcript.platform && (
                        <Badge variant="outline">{transcript.platform}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(transcript.status === "draft" ||
                      transcript.status === "updated") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          triggerIntelligentProcessing(
                            transcript.rawTranscript,
                            transcript.id
                          )
                        }
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      >
                        Process with AI
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(transcript.id)}
                    >
                      {expandedTranscripts.has(transcript.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTranscript(transcript)}
                      disabled={transcript.status === "processing"}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(transcript.id)}
                      disabled={transcript.status === "processing"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Collapsible open={expandedTranscripts.has(transcript.id)}>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {transcript.notes && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {transcript.notes}
                        </p>
                      </div>
                    )}

                    {transcript.tags && transcript.tags.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {transcript.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Transcript</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-60 overflow-y-auto">
                        {transcript.rawTranscript}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {editingTranscript && (
        <Dialog
          open={!!editingTranscript}
          onOpenChange={() => setEditingTranscript(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Interview Transcript</DialogTitle>
            </DialogHeader>
            <InterviewTranscriptForm
              userId={userId}
              initialData={editingTranscript}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editingTranscript.id, data })
              }
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface InterviewTranscriptFormProps {
  userId: number;
  initialData?: IcaInterviewTranscript;
  onSubmit: (data: InsertIcaInterviewTranscript) => void;
  isLoading: boolean;
}

function InterviewTranscriptForm({
  userId,
  initialData,
  onSubmit,
  isLoading,
}: InterviewTranscriptFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    customerName: initialData?.customerName || "",
    interviewDate: initialData?.interviewDate
      ? new Date(initialData.interviewDate).toISOString().split("T")[0]
      : "",
    platform: initialData?.platform || "",
    duration: initialData?.duration || "",
    rawTranscript: initialData?.rawTranscript || "",
    tags: initialData?.tags?.join(", ") || "",
    notes: initialData?.notes || "",
  });

  const isProcessing = initialData?.status === "processing";
  const isFormDisabled = isLoading || isProcessing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: InsertIcaInterviewTranscript = {
      userId: String(userId),
      title: formData.title,
      customerName: formData.customerName || null,
      interviewDate: formData.interviewDate as any,
      platform: formData.platform || null,
      duration: formData.duration || null,
      rawTranscript: formData.rawTranscript,
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : null,
      notes: formData.notes || null,
      extractedInsights: null,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Interview with [Customer Name]"
            disabled={isFormDisabled}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            placeholder="John Smith"
            disabled={isFormDisabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="interviewDate">Interview Date</Label>
          <Input
            id="interviewDate"
            type="date"
            value={formData.interviewDate}
            onChange={(e) =>
              setFormData({ ...formData, interviewDate: e.target.value })
            }
            disabled={isFormDisabled}
          />
        </div>
        <div>
          <Label htmlFor="platform">Platform</Label>
          <Select
            value={formData.platform}
            onValueChange={(value) =>
              setFormData({ ...formData, platform: value })
            }
            disabled={isFormDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zoom">Zoom</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="in-person">In Person</SelectItem>
              <SelectItem value="teams">Microsoft Teams</SelectItem>
              <SelectItem value="meet">Google Meet</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
            placeholder="45 minutes"
            disabled={isFormDisabled}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rawTranscript">Transcript *</Label>
        <Textarea
          id="rawTranscript"
          value={formData.rawTranscript}
          onChange={(e) =>
            setFormData({ ...formData, rawTranscript: e.target.value })
          }
          placeholder="Paste your interview transcript here..."
          className="min-h-[200px]"
          spellCheck={true}
          disabled={isFormDisabled}
          required
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="pain points, goals, objections (comma-separated)"
          disabled={isFormDisabled}
        />
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional observations or insights from this interview..."
          spellCheck={true}
          disabled={isFormDisabled}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isFormDisabled}>
          {isLoading
            ? "Saving..."
            : isProcessing
            ? "Processing..."
            : initialData
            ? "Update Transcript"
            : "Save Transcript"}
        </Button>
        {isProcessing && (
          <p className="text-sm text-muted-foreground flex items-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            This transcript is being processed by AI
          </p>
        )}
      </div>
    </form>
  );
}
