import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Video,
  Target,
  Eye,
  Play,
  FileText,
  TrendingUp,
  Lightbulb,
  MessageCircle,
  Share2,
  Calendar,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";
import {
  useMarkSectionComplete,
  useUnmarkSectionComplete,
} from "@/hooks/useSectionCompletions";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/services/queryClient";
import debounce from "lodash.debounce";
import { useActiveMessagingStrategy } from "@/hooks/useMessagingStrategy";
import { useToast } from "@/hooks/use-toast";
import { validateAndNotify } from "@/utils/prerequisite-validator";

// Helper function to convert **text** to bold HTML
const formatEmailBody = (text: string): string => {
  if (!text) return "";

  // Convert **text** to <strong>text</strong>
  return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
};

// Character limits for all textarea fields
const CHARACTER_LIMITS = {
  // Email Input Fields
  inviteHooks: 1500,
  inviteFOMO: 800,
  confirmationDetails: 800,
  preEventActions: 800,
  nurtureContent: 1500,
  liveAttendanceValue: 1500,
  mythsBeliefs: 800,
  salesStories: 1500,
  finalPush: 1500,
  // Funnel Data Fields
  transformationResult: 500,
  topThreeOutcomes: 1200,
  specificProblem: 800,
  urgentProblem: 800,
  uniqueExperience: 1000,
  showUpBonus: 800,
  thankYouAction: 600,
  painPoints: 1000,
  quickWin: 800,
  objections: 1000,
  socialProofResults: 1200,
  salesPageAction: 600,
  salesPageUrgency: 800,
};

// Helper component for character counter
const CharacterCounter = ({
  current,
  max,
}: {
  current: number;
  max: number;
}) => {
  const remaining = max - current;
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 90;

  return (
    <div
      className={`text-xs mt-1 ${
        isNearLimit ? "text-red-600 font-medium" : "text-slate-500"
      }`}
    >
      {remaining} characters remaining
    </div>
  );
};

export default function LaunchSellStrategy() {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Track if initial data has been loaded to prevent overwriting user input
  const initialDataLoadedRef = useRef(false);

  // Load active messaging strategy
  const { data: messagingStrategy, refetch: refetchMessagingStrategy } =
    useActiveMessagingStrategy(userId);

  // Load core offer outline (most recent one, regardless of active status)
  const {
    data: coreOfferOutline,
    isLoading: isLoadingOfferOutline,
    refetch: refetchCoreOfferOutline,
  } = useQuery<any>({
    queryKey: [`/api/user-offer-outlines/user/${userId}`, userId],
    enabled: !!userId,
    select: (data) => {
      // Return the most recent outline if any exist
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    },
  });

  // State for implementation task expansion
  const [expandedTasks, setExpandedTasks] = useState({
    task1: false,
    task2: false,
    task3: false,
    task4: false,
    task5: false,
    task6: false,
  });

  const handleTaskExpand = (taskKey: keyof typeof expandedTasks) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey],
    }));
  };

  // State for implementation checkboxes
  const [checkboxStates, setCheckboxStates] = useState({
    "task-1": false,
    "task-2": false,
    "task-3": false,
    "task-4": false,
    "task-5": false,
    "task-6": false,
  });

  // Load saved checkbox states from database
  const { data: savedCheckboxes } = useQuery<any>({
    queryKey: ["/api/implementation-checkboxes/build-your-strategy", userId],
    enabled: !!userId,
  });

  // Apply saved checkbox states when loaded
  useEffect(() => {
    console.log(
      "[CHECKBOX] useEffect triggered. savedCheckboxes:",
      savedCheckboxes
    );
    if (savedCheckboxes?.checkboxStates) {
      console.log(
        "[CHECKBOX] Loading saved checkbox states:",
        savedCheckboxes.checkboxStates
      );
      setCheckboxStates(savedCheckboxes.checkboxStates);
      console.log(
        "[CHECKBOX] State updated to:",
        savedCheckboxes.checkboxStates
      );
    } else {
      console.log(
        "[CHECKBOX] No saved checkbox states found. savedCheckboxes:",
        savedCheckboxes
      );
    }
  }, [savedCheckboxes]);

  // Mutation to save checkbox states
  const saveCheckboxesMutation = useMutation({
    mutationFn: async (states: typeof checkboxStates) => {
      console.log("[CHECKBOX] Mutation function called with states:", states);
      return await apiRequest("POST", "/api/implementation-checkboxes", {
        pageIdentifier: "build-your-strategy",
        checkboxStates: states,
      });
    },
    onSuccess: (data) => {
      console.log("[CHECKBOX] Successfully saved to database:", data);
    },
    onError: (error) => {
      console.error("[CHECKBOX] Error saving to database:", error);
    },
  });

  // Handle checkbox change
  const handleCheckboxChange = (taskId: string, checked: boolean) => {
    console.log("[CHECKBOX] Checkbox changed:", taskId, "checked:", checked);
    const newStates = {
      ...checkboxStates,
      [taskId]: checked,
    };
    console.log("[CHECKBOX] New states:", newStates);
    setCheckboxStates(newStates);
    // Save to database
    console.log("[CHECKBOX] Saving to database...");
    saveCheckboxesMutation.mutate(newStates);
  };

  // State for launch & sell sections
  const [completedSections, setCompletedSections] = useState({
    salesPage: false,
    checkout: false,
    automation: false,
    launch: false,
    testing: false,
  });

  // State for input fields
  const [launchInput, setLaunchInput] = useState("");

  const [expandedSections, setExpandedSections] = useState({
    salesPage: false,
    checkout: false,
    automation: false,
    launch: false,
    testing: false,
  });

  // Launch Registration Funnel Data state
  const [funnelData, setFunnelData] = useState({
    launchDateTime: "",
    experienceType: "",
    transformationResult: "",
    topThreeOutcomes: "",
    specificProblem: "",
    urgentProblem: "",
    uniqueExperience: "",
    showUpBonus: "",
    thankYouAction: "",
    painPoints: "",
    quickWin: "",
    objections: "",
    socialProofResults: "",
    salesPageAction: "",
    salesPageUrgency: "",
  });

  // Generated copy state
  const [generatedCopy, setGeneratedCopy] = useState<{
    optInPage: string;
    thankYouPage: string;
  } | null>(null);

  // Edit mode state
  const [isEditingCopy, setIsEditingCopy] = useState(false);
  const [editedCopy, setEditedCopy] = useState<{
    optInPage: string;
    thankYouPage: string;
  } | null>(null);

  // Sales page copy state
  const [generatedSalesPageCopy, setGeneratedSalesPageCopy] = useState<
    string | null
  >(null);
  const [isEditingSalesPage, setIsEditingSalesPage] = useState(false);
  const [editedSalesPageCopy, setEditedSalesPageCopy] = useState<string | null>(
    null
  );
  const salesPageCopyRef = useRef<HTMLDivElement>(null);

  // Launch email sequence state
  const [emailInputs, setEmailInputs] = useState({
    inviteHooks: "",
    inviteFOMO: "",
    confirmationDetails: "",
    preEventActions: "",
    nurtureContent: "",
    liveAttendanceValue: "",
    mythsBeliefs: "",
    salesStories: "",
    finalPush: "",
  });

  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [editingEmailId, setEditingEmailId] = useState<number | null>(null);
  const [editedEmailContent, setEditedEmailContent] = useState({
    subject: "",
    body: "",
  });
  const emailSequenceRef = useRef<HTMLDivElement>(null);

  // Ref for scrolling to generated copy
  const generatedCopyRef = useRef<HTMLDivElement>(null);

  // Helper function to strip markdown code fences (```html, ```, etc.)
  const stripMarkdownCodeFences = (text: string): string => {
    // Remove code fence markers like ```html or ``` at the start/end
    return text
      .replace(/^```[\w]*\n?/m, "") // Remove opening fence (```html or ```js, etc.)
      .replace(/\n?```$/m, "") // Remove closing fence (```)
      .trim();
  };

  // Helper function to convert markdown bold (**text**) to HTML bold (<strong>text</strong>)
  const convertMarkdownBold = (text: string): string => {
    // Convert **text** to <strong>text</strong>
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  };

  // Validation function to check if any field exceeds character limits
  const hasCharacterLimitViolations = (): boolean => {
    // Check funnelData fields
    for (const [key, value] of Object.entries(funnelData)) {
      if (key in CHARACTER_LIMITS && typeof value === "string") {
        const limit = CHARACTER_LIMITS[key as keyof typeof CHARACTER_LIMITS];
        if (value.length > limit) {
          return true;
        }
      }
    }

    // Check emailInputs fields
    for (const [key, value] of Object.entries(emailInputs)) {
      if (key in CHARACTER_LIMITS && typeof value === "string") {
        const limit = CHARACTER_LIMITS[key as keyof typeof CHARACTER_LIMITS];
        if (value.length > limit) {
          return true;
        }
      }
    }

    return false;
  };

  // Helper function to remove emojis for PDF and DOCX export (they don't render properly)
  const removeEmojis = (text: string): string => {
    // Remove common emoji characters that don't render well in PDF/DOCX
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]/gu, "")
      .trim();
  };

  // Scroll to generated copy when it becomes available
  useEffect(() => {
    if (generatedCopy && generatedCopyRef.current) {
      generatedCopyRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [generatedCopy]);

  // Load saved data on component mount
  const { data: savedData, isLoading: isLoadingData } = useQuery<any>({
    queryKey: ["/api/launch-registration-funnel-data"],
    enabled: !!user,
  });

  // Update state when saved data is loaded (only on initial load)
  useEffect(() => {
    console.log("[LAUNCH FUNNEL] Saved data loaded:", savedData);
    // Only load data on initial mount, not on subsequent saves
    if (savedData && !initialDataLoadedRef.current) {
      console.log(
        "[LAUNCH FUNNEL] Setting funnel data from saved data (initial load)"
      );
      initialDataLoadedRef.current = true;

      // Always load email inputs (they may be empty strings, which is fine)
      console.log("[LAUNCH EMAILS] Loading saved email inputs:", {
        inviteHooks: savedData.emailInviteHooks,
        inviteFOMO: savedData.emailInviteFOMO,
        confirmationDetails: savedData.emailConfirmationDetails,
        preEventActions: savedData.emailPreEventActions,
        nurtureContent: savedData.emailNurtureContent,
        liveAttendanceValue: savedData.emailLiveAttendanceValue,
        mythsBeliefs: savedData.emailMythsBeliefs,
        salesStories: savedData.emailSalesStories,
        finalPush: savedData.emailFinalPush,
      });
      setEmailInputs({
        inviteHooks: savedData.emailInviteHooks || "",
        inviteFOMO: savedData.emailInviteFOMO || "",
        confirmationDetails: savedData.emailConfirmationDetails || "",
        preEventActions: savedData.emailPreEventActions || "",
        nurtureContent: savedData.emailNurtureContent || "",
        liveAttendanceValue: savedData.emailLiveAttendanceValue || "",
        mythsBeliefs: savedData.emailMythsBeliefs || "",
        salesStories: savedData.emailSalesStories || "",
        finalPush: savedData.emailFinalPush || "",
      });
      setFunnelData({
        launchDateTime: savedData.launchDateTime || "",
        experienceType: savedData.experienceType || "",
        transformationResult: savedData.transformationResult || "",
        topThreeOutcomes: savedData.topThreeOutcomes || "",
        specificProblem: savedData.specificProblem || "",
        urgentProblem: savedData.urgentProblem || "",
        uniqueExperience: savedData.uniqueExperience || "",
        showUpBonus: savedData.showUpBonus || "",
        thankYouAction: savedData.thankYouAction || "",
        painPoints: savedData.painPoints || "",
        quickWin: savedData.quickWin || "",
        objections: savedData.objections || "",
        socialProofResults: savedData.socialProofResults || "",
        salesPageAction: savedData.salesPageAction || "",
        salesPageUrgency: savedData.salesPageUrgency || "",
      });

      // Load generated copy if it exists
      if (savedData.generatedOptInPage && savedData.generatedThankYouPage) {
        console.log("[LAUNCH FUNNEL] Loading saved generated copy");
        // Strip markdown code fences in case they were saved with them
        setGeneratedCopy({
          optInPage: stripMarkdownCodeFences(savedData.generatedOptInPage),
          thankYouPage: stripMarkdownCodeFences(
            savedData.generatedThankYouPage
          ),
        });
      }

      // Load saved sales page copy if it exists
      if (savedData.generatedSalesPageCopy) {
        console.log("[SALES PAGE] Loading saved generated sales page copy");
        let loadedCopy = stripMarkdownCodeFences(
          savedData.generatedSalesPageCopy
        );
        loadedCopy = convertMarkdownBold(loadedCopy);
        setGeneratedSalesPageCopy(loadedCopy);
      }
    }
  }, [savedData]);

  // Mutation for saving data
  const saveMutation = useMutation({
    mutationFn: async (data: typeof funnelData) => {
      console.log("[LAUNCH FUNNEL] Saving data:", data);
      const response = await apiRequest(
        "POST",
        "/api/launch-registration-funnel-data",
        data
      );
      const result = await response.json();
      console.log("[LAUNCH FUNNEL] Save successful:", result);
      return result;
    },
    onSuccess: () => {
      console.log("[LAUNCH FUNNEL] Invalidating query cache");
      queryClient.invalidateQueries({
        queryKey: ["/api/launch-registration-funnel-data"],
      });
    },
    onError: (error) => {
      console.error("[LAUNCH FUNNEL] Save error:", error);
    },
  });

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: typeof funnelData) => {
      console.log("[LAUNCH FUNNEL] Debounced save triggered with data:", data);
      saveMutation.mutate(data);
    }, 1000),
    [saveMutation]
  );

  // Update field and auto-save
  const updateField = (field: keyof typeof funnelData, value: string) => {
    console.log("[LAUNCH FUNNEL] updateField called:", field, value);
    setFunnelData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log("[LAUNCH FUNNEL] New data to save:", newData);
      debouncedSave(newData);
      return newData;
    });
  };

  // Save generated copy to IGNITE Docs
  const saveToIgniteDocs = async (
    optInPage: string,
    thankYouPage: string
  ): Promise<boolean> => {
    if (!userId) {
      console.error(
        "[LAUNCH FUNNEL] Cannot save to IGNITE Docs: user not logged in"
      );
      toast({
        title: "Save Warning",
        description: "Could not save to IGNITE Docs: Please log in again.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // Combine both pages into markdown format
      const markdownContent = `# Launch Registration Funnel Copy\n\n## OPT-IN PAGE COPY\n\n${stripHTML(
        optInPage
      )}\n\n---\n\n## THANK YOU PAGE COPY\n\n${stripHTML(thankYouPage)}`;

      await apiRequest("POST", "/api/ignite-docs", {
        userId,
        docType: "launch_registration_funnel",
        title: `Launch Registration Funnel Copy - ${date}`,
        contentMarkdown: markdownContent,
        sourcePayload: {
          generatedDate: new Date().toISOString(),
          launchDateTime: funnelData.launchDateTime,
          experienceType: funnelData.experienceType,
        },
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/ignite-docs", "user", userId],
      });
      console.log("[LAUNCH FUNNEL] Copy automatically saved to IGNITE Docs");
      return true;
    } catch (error) {
      console.error("[LAUNCH FUNNEL] Error saving to IGNITE Docs:", error);
      toast({
        title: "Save to IGNITE Docs Failed",
        description:
          "Your copy was generated but could not be saved to IGNITE Docs. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Generate copy mutation
  const generateCopyMutation = useMutation({
    mutationFn: async () => {
      // Refetch messaging strategy to ensure we have the latest data
      const { data: latestMessagingStrategy } =
        await refetchMessagingStrategy();

      // Validate prerequisites before generation
      const isValid = validateAndNotify(
        { messagingStrategy: true },
        { messagingStrategy: latestMessagingStrategy?.content }
      );

      if (!isValid) {
        throw new Error("Missing prerequisites");
      }

      const response = await apiRequest(
        "POST",
        "/api/launch-registration-funnel/generate-copy",
        {
          messagingStrategy: latestMessagingStrategy.content,
          launchData: funnelData,
        }
      );
      return await response.json();
    },
    onSuccess: async (data) => {
      // Strip markdown code fences from generated content before setting
      const cleanedData = {
        optInPage: stripMarkdownCodeFences(data.optInPage),
        thankYouPage: stripMarkdownCodeFences(data.thankYouPage),
      };
      setGeneratedCopy(cleanedData);

      let dbSaveSuccess = false;
      let igniteSaveSuccess = false;

      // Save the generated copy to the database
      try {
        await apiRequest("POST", "/api/launch-registration-funnel-data", {
          ...funnelData,
          generatedOptInPage: cleanedData.optInPage,
          generatedThankYouPage: cleanedData.thankYouPage,
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/launch-registration-funnel-data"],
        });
        console.log("[LAUNCH FUNNEL] Generated copy saved to database");
        dbSaveSuccess = true;
      } catch (error) {
        console.error(
          "[LAUNCH FUNNEL] Error saving generated copy to database:",
          error
        );
        toast({
          title: "Database Save Failed",
          description:
            "Failed to save your copy to the database. Please try again.",
          variant: "destructive",
        });
      }

      // Only save to IGNITE Docs if database save was successful
      if (dbSaveSuccess) {
        igniteSaveSuccess = await saveToIgniteDocs(
          cleanedData.optInPage,
          cleanedData.thankYouPage
        );
      }

      // Show success toast only if both saves succeeded
      if (dbSaveSuccess && igniteSaveSuccess) {
        toast({
          title: "Copy Generated Successfully!",
          description:
            "Your opt-in and thank you page copy has been saved to IGNITE Docs.",
        });
      } else if (dbSaveSuccess && !igniteSaveSuccess) {
        toast({
          title: "Partially Saved",
          description:
            "Your copy was generated and saved, but could not be saved to IGNITE Docs.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      // Don't show duplicate toast if prerequisites are missing (validator already showed one)
      if (error.message === "Missing prerequisites") {
        return;
      }
      toast({
        title: "Generation Failed",
        description:
          error.message || "Failed to generate copy. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save sales page copy to IGNITE Docs
  const saveSalesPageToIgniteDocs = async (
    salesPageCopy: string
  ): Promise<boolean> => {
    console.log(
      "[SALES PAGE] saveSalesPageToIgniteDocs called with userId:",
      userId
    );

    if (!userId) {
      console.error(
        "[SALES PAGE] Cannot save to IGNITE Docs: user not logged in"
      );
      toast({
        title: "Save Warning",
        description: "Could not save to IGNITE Docs: Please log in again.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // Convert HTML to markdown format for storage
      const markdownContent = `# Sales Page Copy\n\n${stripHTML(
        salesPageCopy
      )}`;

      console.log("[SALES PAGE] Saving to IGNITE Docs with data:", {
        userId,
        docType: "sales_page",
        title: `Sales Page Copy - ${date}`,
      });

      await apiRequest("POST", "/api/ignite-docs", {
        userId,
        docType: "sales_page",
        title: `Sales Page Copy - ${date}`,
        contentMarkdown: markdownContent,
        sourcePayload: {
          generatedDate: new Date().toISOString(),
          action: funnelData.salesPageAction,
          urgency: funnelData.salesPageUrgency,
        },
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/ignite-docs", "user", userId],
      });
      console.log(
        "[SALES PAGE] Copy automatically saved to IGNITE Docs successfully"
      );
      return true;
    } catch (error) {
      console.error("[SALES PAGE] Error saving to IGNITE Docs:", error);
      toast({
        title: "IGNITE Docs Save Failed",
        description: "Failed to save sales page copy to IGNITE Docs.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Generate sales page copy mutation
  const generateSalesPageMutation = useMutation({
    mutationFn: async () => {
      console.log("[SALES PAGE] Starting validation checks...");

      // Refetch messaging strategy to ensure we have the latest data
      const { data: latestMessagingStrategy } =
        await refetchMessagingStrategy();
      console.log(
        "[SALES PAGE] Messaging strategy check:",
        latestMessagingStrategy ? "Found" : "Missing"
      );

      if (!latestMessagingStrategy) {
        throw new Error("Please complete your messaging strategy first");
      }

      // Refetch core offer outline to ensure we have the latest data
      const { data: latestCoreOfferOutline } = await refetchCoreOfferOutline();
      console.log(
        "[SALES PAGE] Core offer outline check:",
        latestCoreOfferOutline ? "Found" : "Missing"
      );
      console.log(
        "[SALES PAGE] Core offer outline data:",
        latestCoreOfferOutline
      );

      // Simple check: does user have an outline? If yes, use it. If no, show error.
      if (!latestCoreOfferOutline) {
        throw new Error("Please create your core offer outline first");
      }

      console.log(
        "[SALES PAGE] All validation checks passed. Generating copy..."
      );
      const response = await apiRequest(
        "POST",
        "/api/launch-sales-page/generate-copy",
        {
          salesPageAction: funnelData.salesPageAction,
          salesPageUrgency: funnelData.salesPageUrgency,
        }
      );
      return await response.json();
    },
    onSuccess: async (data) => {
      let cleanedCopy = stripMarkdownCodeFences(data.salesPageCopy);
      cleanedCopy = convertMarkdownBold(cleanedCopy);
      setGeneratedSalesPageCopy(cleanedCopy);

      let dbSaveSuccess = false;
      let igniteSaveSuccess = false;

      // Save to database
      try {
        await apiRequest("POST", "/api/launch-registration-funnel-data", {
          ...funnelData,
          generatedSalesPageCopy: cleanedCopy,
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/launch-registration-funnel-data"],
        });
        console.log("[SALES PAGE] Generated copy saved to database");
        dbSaveSuccess = true;
      } catch (error) {
        console.error(
          "[SALES PAGE] Error saving generated copy to database:",
          error
        );
        toast({
          title: "Database Save Failed",
          description:
            "Failed to save your sales page copy to the database. Please try again.",
          variant: "destructive",
        });
      }

      // Only save to IGNITE Docs if database save was successful
      if (dbSaveSuccess) {
        igniteSaveSuccess = await saveSalesPageToIgniteDocs(cleanedCopy);
      }

      // Show success toast only if both saves succeeded
      if (dbSaveSuccess && igniteSaveSuccess) {
        toast({
          title: "Sales Page Generated Successfully!",
          description: "Your sales page copy has been saved to IGNITE Docs.",
        });
      } else if (dbSaveSuccess && !igniteSaveSuccess) {
        toast({
          title: "Partially Saved",
          description:
            "Your sales page copy was generated and saved, but could not be saved to IGNITE Docs.",
          variant: "destructive",
        });
      }

      // Scroll to generated sales page
      setTimeout(() => {
        salesPageCopyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description:
          error.message ||
          "Failed to generate sales page copy. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Debounced save function for email inputs
  const debouncedSaveEmailInputs = useCallback(
    debounce((inputs: typeof emailInputs) => {
      console.log("[LAUNCH EMAILS] Auto-saving email inputs:", inputs);
      apiRequest("POST", "/api/launch-registration-funnel-data", {
        emailInviteHooks: inputs.inviteHooks,
        emailInviteFOMO: inputs.inviteFOMO,
        emailConfirmationDetails: inputs.confirmationDetails,
        emailPreEventActions: inputs.preEventActions,
        emailNurtureContent: inputs.nurtureContent,
        emailLiveAttendanceValue: inputs.liveAttendanceValue,
        emailMythsBeliefs: inputs.mythsBeliefs,
        emailSalesStories: inputs.salesStories,
        emailFinalPush: inputs.finalPush,
      })
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ["/api/launch-registration-funnel-data"],
          });
          console.log("[LAUNCH EMAILS] Email inputs auto-saved successfully");
        })
        .catch((error) => {
          console.error("[LAUNCH EMAILS] Auto-save error:", error);
        });
    }, 1000), // 1 second debounce
    []
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSaveEmailInputs.cancel();
    };
  }, [debouncedSaveEmailInputs]);

  // Helper function to update email input fields with auto-save
  const updateEmailInput = (field: keyof typeof emailInputs, value: string) => {
    const updatedInputs = {
      ...emailInputs,
      [field]: value,
    };
    setEmailInputs(updatedInputs);

    // Trigger auto-save only if data has been initially loaded
    if (initialDataLoadedRef.current) {
      debouncedSaveEmailInputs(updatedInputs);
    }
  };

  // Fetch existing launch emails when component loads
  const { data: existingEmails } = useQuery({
    queryKey: [`/api/launch-emails/${userId}`],
    enabled: !!userId,
  });

  // Update generatedEmails state when existing emails are fetched
  useEffect(() => {
    if (existingEmails && Array.isArray(existingEmails)) {
      setGeneratedEmails(existingEmails);
    }
  }, [existingEmails]);

  // Generate launch email sequence mutation
  const generateEmailsMutation = useMutation({
    mutationFn: async () => {
      // Refetch messaging strategy to ensure we have the latest data
      const { data: latestMessagingStrategy } =
        await refetchMessagingStrategy();

      // Validate prerequisites before generation
      const isValid = validateAndNotify(
        { messagingStrategy: true },
        { messagingStrategy: latestMessagingStrategy }
      );

      if (!isValid) {
        throw new Error("Missing prerequisites");
      }

      // Use extended timeout for email generation (5 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/launch-emails/generate-sequence`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailInputs),
            credentials: "include",
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to generate emails" }));
          throw new Error(
            errorData.message || "Failed to generate email sequence"
          );
        }

        return await response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error(
            "Request timed out after 5 minutes. Please try again."
          );
        }
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log("[LAUNCH EMAILS] Generation successful:", data);

      // Immediately invalidate and refetch the emails query
      await queryClient.invalidateQueries({
        queryKey: [`/api/launch-emails/${userId}`],
      });

      // Save to IGNITE Docs
      try {
        const date = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        // Create formatted content for IGNITE Docs
        const emailContent = data.emails
          .map((email: any) => {
            return `## ${email.emailType} - Email ${email.emailNumber}\n\n**Subject:** ${email.subject}\n\n${email.body}\n\n---\n`;
          })
          .join("\n");

        await apiRequest("POST", "/api/ignite-docs", {
          userId,
          docType: "launch_email_sequence",
          title: `Launch Emails Copy - ${date}`,
          contentMarkdown: emailContent,
          sourcePayload: {
            generatedDate: new Date().toISOString(),
            totalEmails: data.emails.length,
          },
        });

        await queryClient.invalidateQueries({
          queryKey: ["/api/ignite-docs", "user", userId],
        });

        toast({
          title: "Email Sequence Generated!",
          description: `Your ${data.totalEmails}-email launch sequence has been saved to IGNITE Docs.`,
        });
      } catch (error) {
        console.error("[LAUNCH EMAILS] Error saving to IGNITE Docs:", error);
        toast({
          title: "Emails Generated",
          description: "Your emails were generated successfully.",
        });
      }

      // Scroll to generated emails after state updates
      setTimeout(() => {
        if (emailSequenceRef.current) {
          const yOffset = -100; // Offset to show some content above
          const element = emailSequenceRef.current;
          const y =
            element.getBoundingClientRect().top + window.pageYOffset + yOffset;

          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 500);
    },
    onError: (error: any) => {
      console.error("[LAUNCH EMAILS] Generation error:", error);

      // Don't show duplicate toast if prerequisites are missing (validator already showed one)
      if (error.message === "Missing prerequisites") {
        return;
      }
      toast({
        title: "Generation Failed",
        description:
          error.message ||
          "Failed to generate email sequence. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to strip HTML tags and convert to plain text
  const stripHTML = (html: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  // Helper function to parse HTML and extract formatted text segments with preserved whitespace
  const parseHTMLToRuns = (
    html: string,
    stripEmojis: boolean = false
  ): Array<{ text: string; bold: boolean }> => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const runs: Array<{ text: string; bold: boolean }> = [];

    // Block-level elements that should create line breaks
    const blockElements = [
      "P",
      "DIV",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "UL",
      "OL",
      "LI",
    ];

    const processNode = (node: Node, isBold: boolean = false) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || "";
        // Remove emojis from text only if requested (for PDF export)
        if (stripEmojis) {
          text = removeEmojis(text);
        }
        // Preserve all whitespace, don't trim
        if (text) {
          runs.push({ text, bold: isBold });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        if (element.tagName === "STRONG" || element.tagName === "B") {
          // Process children with bold flag
          element.childNodes.forEach((child) => processNode(child, true));
        } else if (element.tagName === "BR") {
          // BR creates a line break
          runs.push({ text: "\n", bold: false });
        } else if (blockElements.includes(element.tagName)) {
          // Block elements: process children, then add line break
          element.childNodes.forEach((child) => processNode(child, isBold));
          // Add line break after block element
          runs.push({ text: "\n", bold: false });
        } else {
          // Inline elements: process children normally
          element.childNodes.forEach((child) => processNode(child, isBold));
        }
      }
    };

    temp.childNodes.forEach((node) => processNode(node));
    return runs;
  };

  // Export as PDF with proper inline formatting and whitespace preservation
  const exportAsPDF = () => {
    if (!generatedCopy) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;
    const lineHeight = 6;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Launch Registration Funnel Copy", margin, yPosition);
    yPosition += 15;

    // Function to add formatted text with inline bold support
    const addFormattedText = (html: string, heading: string) => {
      // Add heading
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(heading, margin, yPosition);
      yPosition += 10;

      // Parse content into runs (strip emojis for PDF)
      const runs = parseHTMLToRuns(html, true);
      doc.setFontSize(11);

      // Build text line by line, handling word wrapping and inline formatting
      let currentLineText = "";
      let currentX = margin;

      runs.forEach((run) => {
        const text = run.text;

        // Handle newlines
        if (text.includes("\n")) {
          const parts = text.split("\n");
          parts.forEach((part, idx) => {
            if (idx > 0) {
              // Finish current line and move to next
              yPosition += lineHeight;
              currentLineText = "";
              currentX = margin;

              // Check if we need a new page
              if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }
            }

            if (part) {
              doc.setFont("helvetica", run.bold ? "bold" : "normal");
              // Split by whitespace but keep the whitespace tokens
              const tokens = part.split(/(\s+)/);

              tokens.forEach((token) => {
                if (!token) return;

                // Test if adding this token would exceed line width
                const testText = currentLineText + token;
                const testWidth = doc.getTextWidth(testText);

                // If token is whitespace, always add it
                if (/^\s+$/.test(token)) {
                  doc.text(token, currentX, yPosition);
                  currentX += doc.getTextWidth(token);
                  currentLineText += token;
                } else {
                  // Token is a word
                  if (testWidth > maxWidth && currentLineText.trim()) {
                    // Start new line
                    yPosition += lineHeight;
                    currentLineText = token;
                    currentX = margin;

                    // Check if we need a new page
                    if (yPosition > pageHeight - 20) {
                      doc.addPage();
                      yPosition = 20;
                    }

                    doc.text(token, currentX, yPosition);
                    currentX += doc.getTextWidth(token);
                  } else {
                    // Add to current line
                    doc.text(token, currentX, yPosition);
                    currentX += doc.getTextWidth(token);
                    currentLineText = testText;
                  }
                }
              });
            }
          });
        } else {
          // No newlines, process with preserved whitespace
          doc.setFont("helvetica", run.bold ? "bold" : "normal");
          // Split by whitespace but keep the whitespace tokens
          const tokens = text.split(/(\s+)/);

          tokens.forEach((token) => {
            if (!token) return;

            // Test if adding this token would exceed line width
            const testText = currentLineText + token;
            const testWidth = doc.getTextWidth(testText);

            // If token is whitespace, always add it
            if (/^\s+$/.test(token)) {
              doc.text(token, currentX, yPosition);
              currentX += doc.getTextWidth(token);
              currentLineText += token;
            } else {
              // Token is a word
              if (testWidth > maxWidth && currentLineText.trim()) {
                // Start new line
                yPosition += lineHeight;
                currentLineText = token;
                currentX = margin;

                // Check if we need a new page
                if (yPosition > pageHeight - 20) {
                  doc.addPage();
                  yPosition = 20;
                }

                doc.text(token, currentX, yPosition);
                currentX += doc.getTextWidth(token);
              } else {
                // Add to current line
                doc.text(token, currentX, yPosition);
                currentX += doc.getTextWidth(token);
                currentLineText = testText;
              }
            }
          });
        }
      });

      // Move to next line after content
      yPosition += lineHeight + 5;
    };

    // Add Opt-In Page Copy
    addFormattedText(generatedCopy.optInPage, "OPT-IN PAGE COPY");

    // Add some space between sections
    yPosition += 10;

    // Check if we need a new page before Thank You section
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Add Thank You Page Copy
    addFormattedText(generatedCopy.thankYouPage, "THANK YOU PAGE COPY");

    doc.save("Launch_Registration_Funnel_Copy.pdf");
    toast({ title: "PDF downloaded successfully!" });
  };

  // Helper function to convert HTML to DOCX paragraphs - preserving exact line breaks
  const htmlToDOCXParagraphs = (html: string): Paragraph[] => {
    const paragraphs: Paragraph[] = [];

    // Parse the HTML into runs
    const runs = parseHTMLToRuns(html);

    // Group runs into lines based on newlines (matching on-screen display)
    const lines: Array<Array<{ text: string; bold: boolean }>> = [];
    let currentLine: Array<{ text: string; bold: boolean }> = [];

    runs.forEach((run) => {
      if (run.text.includes("\n")) {
        const parts = run.text.split("\n");
        parts.forEach((part, idx) => {
          if (idx > 0) {
            // Push current line and start a new one
            lines.push(currentLine);
            currentLine = [];
          }
          if (part) {
            currentLine.push({ text: part, bold: run.bold });
          }
        });
      } else {
        currentLine.push({ text: run.text, bold: run.bold });
      }
    });

    // Push the last line
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Convert each line to a paragraph
    lines.forEach((line) => {
      const textRuns = line.map(
        (segment) =>
          new TextRun({
            text: segment.text,
            bold: segment.bold,
            size: 22, // 11pt font size (22 half-points)
          })
      );

      paragraphs.push(
        new Paragraph({
          children:
            textRuns.length > 0
              ? textRuns
              : [new TextRun({ text: " ", size: 22 })],
          spacing: {
            after: 200,
            line: 432, // 1.8 line spacing in twips
          },
        })
      );
    });

    return paragraphs;
  };

  // Export as DOCX with proper formatting
  const exportAsDOCX = async () => {
    if (!generatedCopy) return;

    const optInParagraphs = htmlToDOCXParagraphs(generatedCopy.optInPage);
    const thankYouParagraphs = htmlToDOCXParagraphs(generatedCopy.thankYouPage);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "Launch Registration Funnel Copy",
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: "OPT-IN PAGE COPY",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 },
            }),
            ...optInParagraphs,
            new Paragraph({
              text: "THANK YOU PAGE COPY",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            ...thankYouParagraphs,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Launch_Registration_Funnel_Copy.docx");
    toast({ title: "DOCX downloaded successfully!" });
  };

  // Handle edit mode
  const handleEditCopy = () => {
    if (generatedCopy) {
      setEditedCopy({
        optInPage: generatedCopy.optInPage,
        thankYouPage: generatedCopy.thankYouPage,
      });
      setIsEditingCopy(true);
    }
  };

  // Handle save edited copy
  const handleSaveEditedCopy = async () => {
    if (editedCopy) {
      setGeneratedCopy(editedCopy);
      setIsEditingCopy(false);

      // Save to database
      try {
        await apiRequest("POST", "/api/launch-registration-funnel-data", {
          ...funnelData,
          generatedOptInPage: editedCopy.optInPage,
          generatedThankYouPage: editedCopy.thankYouPage,
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/launch-registration-funnel-data"],
        });
        toast({ title: "Changes saved successfully!" });
      } catch (error) {
        console.error("[LAUNCH FUNNEL] Error saving edited copy:", error);
        toast({
          title: "Failed to save changes",
          variant: "destructive",
        });
      }
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditingCopy(false);
    setEditedCopy(null);
  };

  // Handle edit sales page
  const handleEditSalesPage = () => {
    if (generatedSalesPageCopy) {
      setEditedSalesPageCopy(generatedSalesPageCopy);
      setIsEditingSalesPage(true);
    }
  };

  // Handle save edited sales page
  const handleSaveEditedSalesPage = async () => {
    if (editedSalesPageCopy) {
      setGeneratedSalesPageCopy(editedSalesPageCopy);
      setIsEditingSalesPage(false);

      // Save to database
      try {
        await apiRequest("POST", "/api/launch-registration-funnel-data", {
          ...funnelData,
          generatedSalesPageCopy: editedSalesPageCopy,
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/launch-registration-funnel-data"],
        });
        toast({ title: "Sales page changes saved successfully!" });
      } catch (error) {
        console.error("[SALES PAGE] Error saving edited copy:", error);
        toast({
          title: "Failed to save changes",
          variant: "destructive",
        });
      }
    }
  };

  // Handle cancel edit sales page
  const handleCancelEditSalesPage = () => {
    setIsEditingSalesPage(false);
    setEditedSalesPageCopy(null);
  };

  // Export Sales Page as PDF - matching Launch Emails format
  const exportSalesPageAsPDF = () => {
    if (!generatedSalesPageCopy) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;
    const lineHeight = 6;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Sales Page Copy", margin, yPosition);
    yPosition += 15;

    // Clean the HTML and remove emojis
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const cleanCopy = removeEmojis(stripHTML(generatedSalesPageCopy));
    const copyLines = doc.splitTextToSize(cleanCopy, maxWidth);

    copyLines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });

    doc.save("Sales_Page_Copy.pdf");
    toast({ title: "PDF downloaded successfully!" });
  };

  // Export Sales Page as DOCX - matching Launch Emails format
  const exportSalesPageAsDOCX = async () => {
    if (!generatedSalesPageCopy) return;

    const children: any[] = [
      new Paragraph({
        text: "Sales Page Copy",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      }),
    ];

    // Clean the HTML and remove emojis
    const cleanCopy = removeEmojis(stripHTML(generatedSalesPageCopy));
    const copyLines = cleanCopy.split("\n");

    copyLines.forEach((line: string) => {
      children.push(
        new Paragraph({
          text: line || "",
          spacing: { after: 100 },
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Sales_Page_Copy.docx");
    toast({ title: "DOCX downloaded successfully!" });
  };

  // Export Email Sequence as PDF
  const exportEmailsAsPDF = () => {
    if (generatedEmails.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;
    const lineHeight = 6;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Launch Email Sequence", margin, yPosition);
    yPosition += 15;

    const typeLabels: { [key: string]: string } = {
      registration_invite: "Registration Invite Emails",
      confirmation: "Confirmation Email",
      nurture: "Nurture Emails",
      reminder: "Reminder Emails",
      sales: "Sales Emails",
    };

    [
      "registration_invite",
      "confirmation",
      "nurture",
      "reminder",
      "sales",
    ].forEach((emailType) => {
      const emailsOfType = generatedEmails.filter(
        (e) => e.emailType === emailType
      );
      if (emailsOfType.length === 0) return;

      // Email type header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(typeLabels[emailType], margin, yPosition);
      yPosition += 10;

      emailsOfType.forEach((email: any) => {
        // Check for page break
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        // Email number
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Email ${email.emailNumber}`, margin, yPosition);
        yPosition += 8;

        // Subject line
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Subject:", margin, yPosition);
        yPosition += 6;

        doc.setFont("helvetica", "normal");
        const cleanSubject = removeEmojis(email.subject);
        const subjectLines = doc.splitTextToSize(cleanSubject, maxWidth);
        subjectLines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += 4;

        // Body
        doc.setFont("helvetica", "bold");
        doc.text("Email Body:", margin, yPosition);
        yPosition += 6;

        doc.setFont("helvetica", "normal");
        const cleanBody = removeEmojis(email.body);
        const bodyLines = doc.splitTextToSize(cleanBody, maxWidth);
        bodyLines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        yPosition += 10;
      });

      yPosition += 5;
    });

    doc.save("Launch_Email_Sequence.pdf");
    toast({ title: "PDF downloaded successfully!" });
  };

  // Export Email Sequence as DOCX
  const exportEmailsAsDOCX = async () => {
    if (generatedEmails.length === 0) return;

    const typeLabels: { [key: string]: string } = {
      registration_invite: "Registration Invite Emails",
      confirmation: "Confirmation Email",
      nurture: "Nurture Emails",
      reminder: "Reminder Emails",
      sales: "Sales Emails",
    };

    const children: any[] = [
      new Paragraph({
        text: "Launch Email Sequence",
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      }),
    ];

    [
      "registration_invite",
      "confirmation",
      "nurture",
      "reminder",
      "sales",
    ].forEach((emailType) => {
      const emailsOfType = generatedEmails.filter(
        (e) => e.emailType === emailType
      );
      if (emailsOfType.length === 0) return;

      // Email type header
      children.push(
        new Paragraph({
          text: typeLabels[emailType],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      emailsOfType.forEach((email: any) => {
        // Email number
        children.push(
          new Paragraph({
            text: `Email ${email.emailNumber}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );

        // Subject
        const cleanSubject = removeEmojis(email.subject);
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Subject: ", bold: true }),
              new TextRun(cleanSubject),
            ],
            spacing: { after: 100 },
          })
        );

        // Body
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "Email Body:", bold: true })],
            spacing: { before: 100, after: 50 },
          })
        );

        const cleanBody = removeEmojis(email.body);
        const bodyLines = cleanBody.split("\n");
        bodyLines.forEach((line: string) => {
          children.push(
            new Paragraph({
              text: line || "",
              spacing: { after: 100 },
            })
          );
        });

        children.push(
          new Paragraph({
            text: "",
            spacing: { after: 200 },
          })
        );
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Launch_Email_Sequence.docx");
    toast({ title: "DOCX downloaded successfully!" });
  };

  const handleSectionComplete = async (
    section: keyof typeof completedSections
  ) => {
    const isCurrentlyComplete = completedSections[section];

    // Update local state
    setCompletedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));

    // Save to database for "testing" section (Build Your Strategy)
    if (section === "testing" && userId) {
      try {
        if (!isCurrentlyComplete) {
          await markSectionComplete.mutateAsync({
            userId,
            stepNumber: 5, // Live Launch is step 5
            sectionTitle: "Build Your Strategy",
          });
        } else {
          await unmarkSectionComplete.mutateAsync({
            userId,
            stepNumber: 5,
            sectionTitle: "Build Your Strategy",
          });
        }
      } catch (error) {
        console.error("Failed to save section completion:", error);
      }
    }
  };

  const handleSectionExpand = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Launch & Sell Strategy
            </h2>
            <p className="text-lg text-slate-600">
              Build your launch strategy to maximize sales and revenue!
            </p>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            <Zap className="w-4 h-4 mr-1" />
            Launch Builder
          </Badge>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Training Videos
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Copy Generator
          </TabsTrigger>
          <TabsTrigger
            value="implementation"
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Implementation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overview Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-600" />
                  <CardTitle>Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                  <p>
                    It's time to build your Live Launch Funnel — the engine that
                    takes your new leads and turns them into buyers of your core
                    offer!
                  </p>
                  <p>
                    You'll create the live launch opt-in, build out the full
                    launch funnel, design your launch delivery, and craft a
                    sales page that converts for your core offer.
                  </p>
                  <p>
                    By the end, you'll have everything in place and be fully
                    ready to start ads!
                  </p>
                  <p>
                    You've been working so hard and this is such a big
                    milestone! A live launch can be a lot of work but trust our
                    process and we're here to support every step of the way.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Time Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <CardTitle>Estimated Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 mb-2">
                    14–30 Days
                  </p>
                  <p className="text-sm text-slate-600">
                    Depending on how much copy you already have and your pace
                    for building funnel pages, allow at least two weeks to get
                    your launch assets created, set up, and tested.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* To-Do List Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle>To-Do List</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-slate-700">
                      Watch the training videos for creating & building a live
                      launch funnel.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-slate-700">
                      Generate copy for your live launch opt-in page using the
                      Copy Generator.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-slate-700">
                      Build your live launch funnel pages (opt-in, confirmation,
                      delivery, etc.).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <p className="text-slate-700">
                      Create your live launch delivery (training, workshop,
                      webinar, or challenge).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      5
                    </div>
                    <p className="text-slate-700">
                      Generate sales page copy using the Copy Generator.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      6
                    </div>
                    <p className="text-slate-700">Build your sales page.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      7
                    </div>
                    <p className="text-slate-700">
                      Write your live launch emails.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      8
                    </div>
                    <p className="text-slate-700">
                      Connect all tech (emails, tags, automations, payment
                      links).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      9
                    </div>
                    <p className="text-slate-700">
                      Test the full funnel + delivery experience to confirm
                      everything works.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      10
                    </div>
                    <p className="text-slate-700">
                      Finalize assets and be ready to start ads for your live
                      launch.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Tips Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <CardTitle>Success Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">
                        Deliver transformation, not just information
                      </strong>
                      <span className="text-slate-600">
                        {" "}
                        → Whether it's a webinar, challenge, or workshop, design
                        your live launch delivery so participants feel connected
                        to you.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">
                        Messaging Is Key
                      </strong>
                      <span className="text-slate-600">
                        {" "}
                        → Ensure your opt-in, delivery, and sales page all speak
                        directly to the same pain point and desired outcome your
                        audience cares about most.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">
                        Keep it simple and clear
                      </strong>
                      <span className="text-slate-600">
                        {" "}
                        → A sales page doesn't need to be overwhelming. Focus on
                        the big promise, proof, and a clear call-to-action.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">
                        Practice the journey
                      </strong>
                      <span className="text-slate-600">
                        {" "}
                        → Walk through the funnel as if you're a new lead to
                        ensure everything flows seamlessly from sign-up to sales
                        page.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">
                        Leverage Our Team!
                      </strong>
                      <span className="text-slate-600">
                        {" "}
                        → There is no denying that a live launch can be
                        overwhelming, especially if it's your first one. Use our
                        team, show up messy and don't allow the overwhelm to
                        cause paralysis. You will learn so much just walking
                        through this experience!
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Training Videos Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-orange-600" />
                <CardTitle>Launch Strategy Training</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-700 mb-4">
                Watch these training videos for a complete breakdown of
                successful live launch strategies
              </p>

              {/* Nested Video Training Tabs */}
              <Tabs defaultValue="live-launch-strategy" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 gap-1">
                  <TabsTrigger
                    value="live-launch-strategy"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Live Launch Strategy
                  </TabsTrigger>
                  <TabsTrigger
                    value="webinar"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Live Launch: Webinar
                  </TabsTrigger>
                  <TabsTrigger
                    value="challenge"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Live Launch: Challenge
                  </TabsTrigger>
                  <TabsTrigger
                    value="tech-setup"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Live Launch Funnel Tech Set Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="live-launch-strategy" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Live Launch Strategy
                    </h3>
                    <p className="text-slate-700">
                      Master the fundamentals of creating a successful live
                      launch funnel that converts leads into customers.
                    </p>

                    <VimeoEmbed
                      vimeoId="1125607074/542d29bf0c"
                      title="Live Launch Strategy"
                      userId={1}
                      stepNumber={103}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="webinar" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Live Launch: Webinar
                    </h3>

                    <div className="flex justify-center">
                      <a
                        href="https://drive.google.com/file/d/17Kl9GrjEai5k4ZRrqmUAvkZ6Barqbw1y/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          View Sample Converting Webinars
                        </Button>
                      </a>
                    </div>

                    <VimeoEmbed
                      vimeoId="1125615931/ec9ff0731d"
                      title="Live Launch: Webinar"
                      userId={1}
                      stepNumber={103}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="challenge" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Live Launch: Challenge
                    </h3>

                    <VimeoEmbed
                      vimeoId="1125620193/f96da08c62"
                      title="Live Launch: Challenge"
                      userId={1}
                      stepNumber={103}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tech-setup" className="space-y-6">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Live Launch Challenge Live Launch Funnel Tech Setup
                    </h3>

                    {/* Video 1 */}
                    <div className="space-y-3">
                      <VimeoEmbed
                        vimeoId="1122891774/2e8b937144"
                        title="Live Launch Funnel Tech Setup - Video 1"
                        userId={1}
                        stepNumber={103}
                      />
                    </div>

                    {/* Video 2 */}
                    <div className="space-y-3">
                      <VimeoEmbed
                        vimeoId="1122891918/807253a923"
                        title="Live Launch Funnel Tech Setup - Video 2"
                        userId={1}
                        stepNumber={103}
                      />
                    </div>

                    {/* Video 3 */}
                    <div className="space-y-3">
                      <VimeoEmbed
                        vimeoId="1122891808/61cbbaed27"
                        title="Live Launch Funnel Tech Setup - Video 3"
                        userId={1}
                        stepNumber={103}
                      />
                    </div>

                    {/* Video 4 */}
                    <div className="space-y-3">
                      <VimeoEmbed
                        vimeoId="1122891864/1434827e75"
                        title="Live Launch Funnel Tech Setup - Video 4"
                        userId={1}
                        stepNumber={103}
                      />
                    </div>

                    {/* Video 5 */}
                    <div className="space-y-3">
                      <VimeoEmbed
                        vimeoId="1122891837/c07e2bc6fe"
                        title="Live Launch Funnel Tech Setup - Video 5"
                        userId={1}
                        stepNumber={103}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Copy Generator Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-orange-600" />
                <CardTitle>Copy Generator</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 mb-4">
                Use our tool to generate all of your live launch copy from the
                funnel to the sales page to the emails!
              </p>

              {/* Nested Copy Generator Tabs */}
              <Tabs defaultValue="registration-funnel" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 gap-1">
                  <TabsTrigger
                    value="registration-funnel"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Launch Registration Funnel
                  </TabsTrigger>
                  <TabsTrigger
                    value="sales-page"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Sales Page
                  </TabsTrigger>
                  <TabsTrigger
                    value="launch-emails"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Launch Emails
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="registration-funnel" className="space-y-6">
                  <div className="space-y-8">
                    {/* Registration Funnel Section */}
                    <div className="space-y-6">
                      {/* Header with Action Buttons */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-2xl font-bold text-slate-900">
                          Launch Registration Funnel Generator
                        </h2>

                        {/* Action Buttons - Only show when copy is generated */}
                        {generatedCopy && (
                          <div className="flex gap-3">
                            {isEditingCopy ? (
                              <>
                                <Button
                                  onClick={handleSaveEditedCopy}
                                  className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                  data-testid="button-save-edit"
                                >
                                  Save Changes
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                  data-testid="button-cancel-edit"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={handleEditCopy}
                                  className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                  data-testid="button-edit-copy"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                      data-testid="button-export-document"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Export Document
                                      <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={exportAsPDF}
                                      data-testid="button-export-pdf"
                                      className="hover:bg-gray-100 focus:bg-gray-100"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Download as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={exportAsDOCX}
                                      data-testid="button-export-docx"
                                      className="hover:bg-gray-100 focus:bg-gray-100"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Download as DOCX
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Generated Copy Display - Shows above questions when available */}
                      {generatedCopy && (
                        <Card
                          ref={generatedCopyRef}
                          className="border-2 border-orange-200"
                        >
                          <CardHeader className="bg-orange-50">
                            <CardTitle className="flex items-center gap-2 text-orange-900">
                              <Zap className="w-5 h-5" />
                              Your Generated Funnel Copy
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-8">
                            {/* Opt-In Page Copy */}
                            <div>
                              {isEditingCopy && editedCopy ? (
                                <Textarea
                                  value={stripHTML(editedCopy.optInPage)}
                                  onChange={(e) =>
                                    setEditedCopy((prev) =>
                                      prev
                                        ? { ...prev, optInPage: e.target.value }
                                        : null
                                    )
                                  }
                                  className="min-h-[300px] bg-white p-6 rounded-lg border font-mono text-sm"
                                  data-testid="textarea-optin-copy"
                                />
                              ) : (
                                <div
                                  className="bg-white p-6 rounded-lg border whitespace-pre-line"
                                  dangerouslySetInnerHTML={{
                                    __html: generatedCopy.optInPage,
                                  }}
                                  data-testid="generated-optin-copy"
                                  style={{ lineHeight: "1.8" }}
                                />
                              )}
                            </div>

                            {/* Thank You Page Copy */}
                            <div>
                              {isEditingCopy && editedCopy ? (
                                <Textarea
                                  value={stripHTML(editedCopy.thankYouPage)}
                                  onChange={(e) =>
                                    setEditedCopy((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            thankYouPage: e.target.value,
                                          }
                                        : null
                                    )
                                  }
                                  className="min-h-[300px] bg-white p-6 rounded-lg border font-mono text-sm"
                                  data-testid="textarea-thankyou-copy"
                                />
                              ) : (
                                <div
                                  className="bg-white p-6 rounded-lg border whitespace-pre-line"
                                  dangerouslySetInnerHTML={{
                                    __html: generatedCopy.thankYouPage,
                                  }}
                                  data-testid="generated-thankyou-copy"
                                  style={{ lineHeight: "1.8" }}
                                />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* About Your Live Launch Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>🎯</span>
                            About Your Live Launch
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="launchDateTime">
                              1. When is the date and time of your live launch
                              experience? Please include the time zone.
                            </Label>
                            <Input
                              id="launchDateTime"
                              placeholder="Enter date, time, and time zone..."
                              value={funnelData.launchDateTime}
                              onChange={(e) =>
                                updateField("launchDateTime", e.target.value)
                              }
                              data-testid="input-launch-date-time"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="experienceType">
                              2. What type of experience is this? Webinar,
                              series, challenge, etc.
                            </Label>
                            <Input
                              id="experienceType"
                              placeholder="Enter the type of experience..."
                              value={funnelData.experienceType}
                              onChange={(e) =>
                                updateField("experienceType", e.target.value)
                              }
                              data-testid="input-experience-type"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="transformationResult">
                              3. In one sentence, what result or transformation
                              will someone get from this experience? The main
                              outcome and use your ICA's language!
                            </Label>
                            <Textarea
                              id="transformationResult"
                              placeholder="Describe the transformation they'll get..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.transformationResult}
                              value={funnelData.transformationResult}
                              onChange={(e) =>
                                updateField(
                                  "transformationResult",
                                  e.target.value
                                )
                              }
                              data-testid="textarea-transformation-result"
                            />
                            <CharacterCounter
                              current={funnelData.transformationResult.length}
                              max={CHARACTER_LIMITS.transformationResult}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="topThreeOutcomes">
                              4. What are the top 3 things they will be able to
                              know/be/do after participating in this live
                              launch?
                            </Label>
                            <Textarea
                              id="topThreeOutcomes"
                              placeholder="List the top 3 outcomes..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.topThreeOutcomes}
                              value={funnelData.topThreeOutcomes}
                              onChange={(e) =>
                                updateField("topThreeOutcomes", e.target.value)
                              }
                              data-testid="textarea-top-three-outcomes"
                            />
                            <CharacterCounter
                              current={funnelData.topThreeOutcomes.length}
                              max={CHARACTER_LIMITS.topThreeOutcomes}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="specificProblem">
                              5. What specific problem does it solve for your
                              ideal customer right now?
                            </Label>
                            <Textarea
                              id="specificProblem"
                              placeholder="Describe the specific problem..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.specificProblem}
                              value={funnelData.specificProblem}
                              onChange={(e) =>
                                updateField("specificProblem", e.target.value)
                              }
                              data-testid="textarea-specific-problem"
                            />
                            <CharacterCounter
                              current={funnelData.specificProblem.length}
                              max={CHARACTER_LIMITS.specificProblem}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="urgentProblem">
                              6. Why is this problem urgent or important to
                              solve?
                            </Label>
                            <Textarea
                              id="urgentProblem"
                              placeholder="Explain why it's urgent..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.urgentProblem}
                              value={funnelData.urgentProblem}
                              onChange={(e) =>
                                updateField("urgentProblem", e.target.value)
                              }
                              data-testid="textarea-urgent-problem"
                            />
                            <CharacterCounter
                              current={funnelData.urgentProblem.length}
                              max={CHARACTER_LIMITS.urgentProblem}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="uniqueExperience">
                              7. What's unique about this experience? Think
                              about the outcome and how you help them achieve
                              that outcome, why is that better than other
                              options out there?
                            </Label>
                            <Textarea
                              id="uniqueExperience"
                              placeholder="Describe what makes this unique..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.uniqueExperience}
                              value={funnelData.uniqueExperience}
                              onChange={(e) =>
                                updateField("uniqueExperience", e.target.value)
                              }
                              data-testid="textarea-unique-experience"
                            />
                            <CharacterCounter
                              current={funnelData.uniqueExperience.length}
                              max={CHARACTER_LIMITS.uniqueExperience}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="showUpBonus">
                              8. Will you have a show up bonus for people who
                              show up and participate live? If so, what is the
                              OUTCOME of this show up bonus? Why do I want it?
                            </Label>
                            <Textarea
                              id="showUpBonus"
                              placeholder="Describe the show up bonus outcome..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.showUpBonus}
                              value={funnelData.showUpBonus}
                              onChange={(e) =>
                                updateField("showUpBonus", e.target.value)
                              }
                              data-testid="textarea-show-up-bonus"
                            />
                            <CharacterCounter
                              current={funnelData.showUpBonus.length}
                              max={CHARACTER_LIMITS.showUpBonus}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="thankYouAction">
                              9. Where would you like to send people on the
                              thank you page of your funnel? (Ex: DM you on
                              Instagram, FB group or just to add the event to
                              their calendar). Provide details on why they
                              should take this action
                            </Label>
                            <Textarea
                              id="thankYouAction"
                              placeholder="Describe where to send them and why..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.thankYouAction}
                              value={funnelData.thankYouAction}
                              onChange={(e) =>
                                updateField("thankYouAction", e.target.value)
                              }
                              data-testid="textarea-thank-you-action"
                            />
                            <CharacterCounter
                              current={funnelData.thankYouAction.length}
                              max={CHARACTER_LIMITS.thankYouAction}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Value & Positioning Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>💡</span>
                            Value & Positioning
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="painPoints">
                              1. What's the main pain points, frustrations, or
                              challenges this resource addresses for them? List
                              multiple and be specific.
                            </Label>
                            <Textarea
                              id="painPoints"
                              placeholder="List specific pain points and frustrations..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.painPoints}
                              value={funnelData.painPoints}
                              onChange={(e) =>
                                updateField("painPoints", e.target.value)
                              }
                              data-testid="textarea-pain-points"
                            />
                            <CharacterCounter
                              current={funnelData.painPoints.length}
                              max={CHARACTER_LIMITS.painPoints}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="quickWin">
                              2. What's the quick win they'll walk away with
                              after participating?
                            </Label>
                            <Textarea
                              id="quickWin"
                              placeholder="Describe the quick win..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.quickWin}
                              value={funnelData.quickWin}
                              onChange={(e) =>
                                updateField("quickWin", e.target.value)
                              }
                              data-testid="textarea-quick-win"
                            />
                            <CharacterCounter
                              current={funnelData.quickWin.length}
                              max={CHARACTER_LIMITS.quickWin}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="objections">
                              3. What objections might someone have before
                              opting in? (e.g. "I don't have time," "I've
                              already tried this," "I don't want spam.")
                            </Label>
                            <Textarea
                              id="objections"
                              placeholder="List common objections..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.objections}
                              value={funnelData.objections}
                              onChange={(e) =>
                                updateField("objections", e.target.value)
                              }
                              data-testid="textarea-objections"
                            />
                            <CharacterCounter
                              current={funnelData.objections.length}
                              max={CHARACTER_LIMITS.objections}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="socialProofResults">
                              5. Do you have any results or social proof that
                              you'd use to showcase how great this experience
                              will be?
                            </Label>
                            <Textarea
                              id="socialProofResults"
                              placeholder="Share results and social proof..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.socialProofResults}
                              value={funnelData.socialProofResults}
                              onChange={(e) =>
                                updateField(
                                  "socialProofResults",
                                  e.target.value
                                )
                              }
                              data-testid="textarea-social-proof-results"
                            />
                            <CharacterCounter
                              current={funnelData.socialProofResults.length}
                              max={CHARACTER_LIMITS.socialProofResults}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Generate Button */}
                      <div className="flex justify-center pt-6">
                        <Button
                          size="lg"
                          className="min-w-[200px]"
                          onClick={() => {
                            if (hasCharacterLimitViolations()) {
                              toast({
                                title: "Character Limit Exceeded",
                                description:
                                  "Please reduce the content in fields marked in red before generating.",
                                variant: "destructive",
                              });
                              return;
                            }
                            generateCopyMutation.mutate();
                          }}
                          disabled={
                            generateCopyMutation.isPending ||
                            hasCharacterLimitViolations()
                          }
                          data-testid="button-generate-funnel-copy"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          {generateCopyMutation.isPending
                            ? "Generating..."
                            : "Generate Registration Funnel Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sales-page" className="space-y-6">
                  <div className="space-y-8">
                    {/* Display Generated Sales Page Copy */}
                    {generatedSalesPageCopy && (
                      <div ref={salesPageCopyRef}>
                        <Card className="border-2 border-blue-200">
                          <CardHeader className="bg-blue-50">
                            <CardTitle className="flex items-center justify-between text-blue-900">
                              <span className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Your Sales Page Copy
                              </span>
                              <div className="flex gap-3">
                                {isEditingSalesPage ? (
                                  <>
                                    <Button
                                      onClick={handleSaveEditedSalesPage}
                                      className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                      data-testid="button-save-sales-edit"
                                    >
                                      Save Changes
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditSalesPage}
                                      className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                      data-testid="button-cancel-sales-edit"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      onClick={handleEditSalesPage}
                                      className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                      data-testid="button-edit-sales-page"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Edit
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                          data-testid="button-export-sales-page"
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          Export Document
                                          <ChevronDown className="w-4 h-4 ml-2" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem
                                          onClick={exportSalesPageAsPDF}
                                          data-testid="button-export-sales-pdf"
                                          className="hover:bg-gray-100 focus:bg-gray-100"
                                        >
                                          <FileText className="w-4 h-4 mr-2" />
                                          Download as PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={exportSalesPageAsDOCX}
                                          data-testid="button-export-sales-docx"
                                          className="hover:bg-gray-100 focus:bg-gray-100"
                                        >
                                          <FileText className="w-4 h-4 mr-2" />
                                          Download as DOCX
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            {isEditingSalesPage && editedSalesPageCopy ? (
                              <Textarea
                                value={stripHTML(editedSalesPageCopy)}
                                onChange={(e) =>
                                  setEditedSalesPageCopy(e.target.value)
                                }
                                className="min-h-[500px] bg-white p-6 rounded-lg border font-mono text-sm"
                                data-testid="textarea-sales-page-copy"
                              />
                            ) : (
                              <div
                                className="bg-white p-6 rounded-lg border whitespace-pre-line"
                                dangerouslySetInnerHTML={{
                                  __html: generatedSalesPageCopy,
                                }}
                                data-testid="generated-sales-page-copy"
                                style={{ lineHeight: "1.8" }}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Sales Page Section */}
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Sales Page Generator
                      </h2>

                      {/* Live Launch Specific Messaging Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>🔥</span>
                            Live Launch Specific Messaging
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="salesPageAction">
                              What do you want people to do after reading the
                              page? (buy now, book a call, etc.)
                            </Label>
                            <Textarea
                              id="salesPageAction"
                              placeholder="Describe the desired action..."
                              rows={2}
                              maxLength={CHARACTER_LIMITS.salesPageAction}
                              value={funnelData.salesPageAction}
                              onChange={(e) =>
                                updateField("salesPageAction", e.target.value)
                              }
                              data-testid="textarea-sales-page-action"
                            />
                            <CharacterCounter
                              current={funnelData.salesPageAction.length}
                              max={CHARACTER_LIMITS.salesPageAction}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="salesPageUrgency">
                              Do you have urgency or scarcity elements? (limited
                              spots, enrollment deadline, bonuses expiring,
                              etc.)
                            </Label>
                            <Textarea
                              id="salesPageUrgency"
                              placeholder="Describe urgency or scarcity elements..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.salesPageUrgency}
                              value={funnelData.salesPageUrgency}
                              onChange={(e) =>
                                updateField("salesPageUrgency", e.target.value)
                              }
                              data-testid="textarea-sales-page-urgency"
                            />
                            <CharacterCounter
                              current={funnelData.salesPageUrgency.length}
                              max={CHARACTER_LIMITS.salesPageUrgency}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Generate Button */}
                      <div className="flex justify-center pt-6">
                        <Button
                          size="lg"
                          className="min-w-[200px]"
                          onClick={() => {
                            if (hasCharacterLimitViolations()) {
                              toast({
                                title: "Character Limit Exceeded",
                                description:
                                  "Please reduce the content in fields marked in red before generating.",
                                variant: "destructive",
                              });
                              return;
                            }
                            generateSalesPageMutation.mutate();
                          }}
                          disabled={
                            generateSalesPageMutation.isPending ||
                            !funnelData.salesPageAction ||
                            hasCharacterLimitViolations()
                          }
                          data-testid="button-generate-sales-page"
                        >
                          {generateSalesPageMutation.isPending ? (
                            <>
                              <Zap className="w-5 h-5 mr-2 animate-pulse" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5 mr-2" />
                              Generate Sales Page Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="launch-emails" className="space-y-6">
                  <div className="space-y-8">
                    {/* Display Generated Email Sequence */}
                    {generatedEmails.length > 0 && (
                      <div ref={emailSequenceRef}>
                        <Card className="border-2 border-blue-200">
                          <CardHeader className="bg-blue-50">
                            <CardTitle className="flex items-center justify-between text-blue-900">
                              <span className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Your Launch Email Sequence (
                                {generatedEmails.length} Emails)
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                    data-testid="button-export-email-sequence"
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Document
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => exportEmailsAsPDF()}
                                    data-testid="button-export-emails-pdf"
                                    className="hover:bg-gray-100 focus:bg-gray-100"
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Download as PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => exportEmailsAsDOCX()}
                                    data-testid="button-export-emails-docx"
                                    className="hover:bg-gray-100 focus:bg-gray-100"
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Download as DOCX
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-6">
                            {[
                              "registration_invite",
                              "confirmation",
                              "nurture",
                              "reminder",
                              "sales",
                            ].map((emailType) => {
                              const emailsOfType = generatedEmails.filter(
                                (e) => e.emailType === emailType
                              );
                              if (emailsOfType.length === 0) return null;

                              const typeLabels: { [key: string]: string } = {
                                registration_invite:
                                  "📩 Registration Invite Emails",
                                confirmation: "✅ Confirmation Email",
                                nurture: "💡 Nurture Emails",
                                reminder: "⏰ Reminder Emails",
                                sales: "💰 Sales Emails",
                              };

                              return (
                                <div key={emailType} className="space-y-4">
                                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                                    {typeLabels[emailType]}
                                  </h3>
                                  {emailsOfType.map((email) => (
                                    <Card
                                      key={email.id}
                                      className="border border-slate-200"
                                    >
                                      <CardHeader className="bg-slate-50 pb-3">
                                        <CardTitle className="text-base flex items-center justify-between">
                                          <span className="text-slate-700">
                                            Email {email.emailNumber}
                                          </span>
                                          {editingEmailId === email.id ? (
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={async () => {
                                                  try {
                                                    await apiRequest(
                                                      "PUT",
                                                      `/api/launch-emails/${email.id}`,
                                                      editedEmailContent
                                                    );
                                                    const updatedEmails =
                                                      generatedEmails.map((e) =>
                                                        e.id === email.id
                                                          ? {
                                                              ...e,
                                                              ...editedEmailContent,
                                                            }
                                                          : e
                                                      );
                                                    setGeneratedEmails(
                                                      updatedEmails
                                                    );
                                                    setEditingEmailId(null);
                                                    toast({
                                                      title: "Email Updated",
                                                      description:
                                                        "Your changes have been saved.",
                                                    });
                                                  } catch (error) {
                                                    toast({
                                                      title: "Save Failed",
                                                      description:
                                                        "Could not save your changes.",
                                                      variant: "destructive",
                                                    });
                                                  }
                                                }}
                                                className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                              >
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  setEditingEmailId(null);
                                                  setEditedEmailContent({
                                                    subject: "",
                                                    body: "",
                                                  });
                                                }}
                                                className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                setEditingEmailId(email.id);
                                                setEditedEmailContent({
                                                  subject: email.subject,
                                                  body: email.body,
                                                });
                                              }}
                                              className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                            >
                                              <FileText className="w-4 h-4 mr-2" />
                                              Edit
                                            </Button>
                                          )}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="pt-4 space-y-4">
                                        {editingEmailId === email.id ? (
                                          <>
                                            <div>
                                              <Label className="text-sm font-semibold text-slate-700">
                                                Subject Line:
                                              </Label>
                                              <Input
                                                value={
                                                  editedEmailContent.subject
                                                }
                                                onChange={(e) =>
                                                  setEditedEmailContent(
                                                    (prev) => ({
                                                      ...prev,
                                                      subject: e.target.value,
                                                    })
                                                  )
                                                }
                                                className="mt-1"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm font-semibold text-slate-700">
                                                Email Body:
                                              </Label>
                                              <Textarea
                                                value={editedEmailContent.body}
                                                onChange={(e) =>
                                                  setEditedEmailContent(
                                                    (prev) => ({
                                                      ...prev,
                                                      body: e.target.value,
                                                    })
                                                  )
                                                }
                                                className="mt-1 min-h-[300px]"
                                              />
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div>
                                              <span className="text-sm font-semibold text-slate-700">
                                                Subject Line:
                                              </span>
                                              <p className="text-slate-900 mt-1 font-medium">
                                                {email.subject}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-sm font-semibold text-slate-700">
                                                Email Body:
                                              </span>
                                              <div
                                                className="mt-2 text-slate-800 whitespace-pre-line leading-relaxed border-l-4 border-blue-200 pl-4 py-2 bg-slate-50 rounded"
                                                dangerouslySetInnerHTML={{
                                                  __html: formatEmailBody(
                                                    email.body
                                                  ),
                                                }}
                                              />
                                            </div>
                                          </>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Launch Emails Section */}
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Launch Email Templates
                      </h2>

                      {/* Email Overview Note */}
                      <Collapsible defaultOpen={true}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between border-blue-200 bg-blue-50 hover:bg-blue-100"
                          >
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-600" />
                              <span className="text-blue-900 font-medium">
                                Live Launch Email Sequence Overview
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Card className="border-blue-200 bg-blue-50/50">
                            <CardContent className="pt-6">
                              <div className="space-y-4 text-slate-700">
                                <p className="font-medium text-blue-900">
                                  We'll be writing 5 different types of emails
                                  for your live launch email sequence. Please
                                  remember the tool is meant to get this copy
                                  70% of the way there and you finish it off!
                                </p>

                                <div className="space-y-4">
                                  <p className="font-semibold text-slate-800">
                                    Here are the emails you'll need for your
                                    live launch:
                                  </p>

                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-slate-800 mb-1">
                                        📩 Registration Invite Emails (5)
                                      </h4>
                                      <p className="text-sm mb-1">
                                        <strong>Purpose:</strong> Drives your
                                        leads to sign up for the live launch
                                        event.
                                      </p>
                                      <ul className="text-sm space-y-1 ml-4">
                                        <li>
                                          • Each email highlights a different
                                          hook, pain point, or desired outcome.
                                        </li>
                                        <li>
                                          • Overcomes objections and creates
                                          urgency to register.
                                        </li>
                                        <li>
                                          • Builds anticipation around the
                                          transformation the event promises.
                                        </li>
                                      </ul>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold text-slate-800 mb-1">
                                        📩 Confirmation Email (1)
                                      </h4>
                                      <p className="text-sm mb-1">
                                        <strong>Purpose:</strong> Welcome new
                                        registrants and lock in attendance.
                                      </p>
                                      <ul className="text-sm space-y-1 ml-4">
                                        <li>
                                          • Confirms date, time, and access
                                          details.
                                        </li>
                                        <li>
                                          • Reinforces the value of showing up
                                          live.
                                        </li>
                                        <li>
                                          • Encourages next steps (join group,
                                          add to calendar, send DM, etc.).
                                        </li>
                                      </ul>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold text-slate-800 mb-1">
                                        📩 Nurture Emails (3)
                                      </h4>
                                      <p className="text-sm mb-1">
                                        <strong>Purpose:</strong> Build
                                        excitement and trust before the event.
                                      </p>
                                      <ul className="text-sm space-y-1 ml-4">
                                        <li>
                                          • Share your story, authority, or
                                          client success stories.
                                        </li>
                                        <li>
                                          • Break down limiting beliefs or myths
                                          holding your audience back.
                                        </li>
                                        <li>
                                          • Warm up registrants so they show up
                                          ready to engage.
                                        </li>
                                      </ul>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold text-slate-800 mb-1">
                                        📩 Reminder Emails (3)
                                      </h4>
                                      <p className="text-sm mb-1">
                                        <strong>Purpose:</strong> Maximize live
                                        attendance.
                                      </p>
                                      <ul className="text-sm space-y-1 ml-4">
                                        <li>
                                          • Sent at key times (24 hours before,
                                          1 hour before & live now).
                                        </li>
                                        <li>
                                          • Reinforce what they'll gain by
                                          showing up live.
                                        </li>
                                      </ul>
                                    </div>

                                    <div>
                                      <h4 className="font-semibold text-slate-800 mb-1">
                                        📩 Sales Emails (5)
                                      </h4>
                                      <p className="text-sm mb-1">
                                        <strong>Purpose:</strong> Convert
                                        attendees and registrants into buyers of
                                        your core offer.
                                      </p>
                                      <ul className="text-sm space-y-1 ml-4">
                                        <li>
                                          • Highlight the big promise and
                                          transformation of your offer.
                                        </li>
                                        <li>
                                          • Show what's included and why it's
                                          valuable.
                                        </li>
                                        <li>
                                          • Overcome objections with proof,
                                          testimonials, and guarantees.
                                        </li>
                                        <li>
                                          • Drive urgency with cart close dates,
                                          limited spots, or bonuses.
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Registration Invite Category */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>✉️</span>
                            Registration Invite Emails
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="inviteHooks">
                              List out some main hooks and promises we can use
                              in your emails to get leads to sign up. Why should
                              somebody sign up for this experience right now?
                            </Label>
                            <Textarea
                              id="inviteHooks"
                              placeholder="List your main hooks and promises..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.inviteHooks}
                              value={emailInputs.inviteHooks}
                              onChange={(e) =>
                                updateEmailInput("inviteHooks", e.target.value)
                              }
                              data-testid="textarea-invite-hooks"
                            />
                            <CharacterCounter
                              current={emailInputs.inviteHooks.length}
                              max={CHARACTER_LIMITS.inviteHooks}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="inviteFOMO">
                              What are they missing out on if they miss this
                              experience?
                            </Label>
                            <Textarea
                              id="inviteFOMO"
                              placeholder="Describe what they'll miss out on..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.inviteFOMO}
                              value={emailInputs.inviteFOMO}
                              onChange={(e) =>
                                updateEmailInput("inviteFOMO", e.target.value)
                              }
                              data-testid="textarea-invite-fomo"
                            />
                            <CharacterCounter
                              current={emailInputs.inviteFOMO.length}
                              max={CHARACTER_LIMITS.inviteFOMO}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Confirmation Email Category */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>✉️</span>
                            Confirmation Email for Registrants
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="confirmationDetails">
                              What key details do registrants need immediately?
                              (time, date, link, how to prepare)
                            </Label>
                            <Textarea
                              id="confirmationDetails"
                              placeholder="List key details they need..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.confirmationDetails}
                              value={emailInputs.confirmationDetails}
                              onChange={(e) =>
                                updateEmailInput(
                                  "confirmationDetails",
                                  e.target.value
                                )
                              }
                              data-testid="textarea-confirmation-details"
                            />
                            <CharacterCounter
                              current={emailInputs.confirmationDetails.length}
                              max={CHARACTER_LIMITS.confirmationDetails}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="preEventActions">
                              Is there something they should do before the
                              event? (join a group, add event to calendar, DM
                              you, etc.)
                            </Label>
                            <Textarea
                              id="preEventActions"
                              placeholder="Describe pre-event actions..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.preEventActions}
                              value={emailInputs.preEventActions}
                              onChange={(e) =>
                                updateEmailInput(
                                  "preEventActions",
                                  e.target.value
                                )
                              }
                              data-testid="textarea-pre-event-actions"
                            />
                            <CharacterCounter
                              current={emailInputs.preEventActions.length}
                              max={CHARACTER_LIMITS.preEventActions}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Nurture Emails Category */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>✉️</span>
                            Nurture Emails for Registrants
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="nurtureContent">
                              What stories, tips, or insights can you share that
                              build excitement before the event?
                            </Label>
                            <Textarea
                              id="nurtureContent"
                              placeholder="Share stories, tips, or insights..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.nurtureContent}
                              value={emailInputs.nurtureContent}
                              onChange={(e) =>
                                updateEmailInput(
                                  "nurtureContent",
                                  e.target.value
                                )
                              }
                              data-testid="textarea-nurture-content"
                            />
                            <CharacterCounter
                              current={emailInputs.nurtureContent.length}
                              max={CHARACTER_LIMITS.nurtureContent}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="liveAttendanceValue">
                              WHY should somebody show up live for this event?
                              What would you tell a friend on why they can't
                              afford to miss this?
                            </Label>
                            <Textarea
                              id="liveAttendanceValue"
                              placeholder="Explain why they need to show up live..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.liveAttendanceValue}
                              value={emailInputs.liveAttendanceValue}
                              onChange={(e) =>
                                updateEmailInput(
                                  "liveAttendanceValue",
                                  e.target.value
                                )
                              }
                              data-testid="textarea-live-attendance-value"
                            />
                            <CharacterCounter
                              current={emailInputs.liveAttendanceValue.length}
                              max={CHARACTER_LIMITS.liveAttendanceValue}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="mythsBeliefs">
                              What common myths or limiting beliefs do you want
                              to start breaking down before they attend?
                            </Label>
                            <Textarea
                              id="mythsBeliefs"
                              placeholder="List myths or limiting beliefs to address..."
                              rows={3}
                              maxLength={CHARACTER_LIMITS.mythsBeliefs}
                              value={emailInputs.mythsBeliefs}
                              onChange={(e) =>
                                updateEmailInput("mythsBeliefs", e.target.value)
                              }
                              data-testid="textarea-myths-beliefs"
                            />
                            <CharacterCounter
                              current={emailInputs.mythsBeliefs.length}
                              max={CHARACTER_LIMITS.mythsBeliefs}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sales Emails Category */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>✉️</span>
                            Sales Emails
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="salesStories">
                              Are there any stories you feel would fit well in
                              your sales emails? It's okay if they are not
                              official testimonials.
                            </Label>
                            <Textarea
                              id="salesStories"
                              placeholder="Share relevant stories..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.salesStories}
                              value={emailInputs.salesStories}
                              onChange={(e) =>
                                updateEmailInput("salesStories", e.target.value)
                              }
                              data-testid="textarea-sales-stories"
                            />
                            <CharacterCounter
                              current={emailInputs.salesStories.length}
                              max={CHARACTER_LIMITS.salesStories}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="finalPush">
                              What will get people on the fence over the edge?
                              What would you say to a friend or potential client
                              who's been reading all the emails and hasn't said
                              yes yet?
                            </Label>
                            <Textarea
                              id="finalPush"
                              placeholder="Describe what will push them over the edge..."
                              rows={4}
                              maxLength={CHARACTER_LIMITS.finalPush}
                              value={emailInputs.finalPush}
                              onChange={(e) =>
                                updateEmailInput("finalPush", e.target.value)
                              }
                              data-testid="textarea-final-push"
                            />
                            <CharacterCounter
                              current={emailInputs.finalPush.length}
                              max={CHARACTER_LIMITS.finalPush}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Generate Button */}
                      <div className="flex justify-center pt-6">
                        <Button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            if (generateEmailsMutation.isPending) return;

                            if (hasCharacterLimitViolations()) {
                              toast({
                                title: "Character Limit Exceeded",
                                description:
                                  "Please reduce the content in fields marked in red before generating.",
                                variant: "destructive",
                              });
                              return;
                            }

                            generateEmailsMutation.mutate();
                          }}
                          disabled={
                            generateEmailsMutation.isPending ||
                            !emailInputs.inviteHooks ||
                            hasCharacterLimitViolations()
                          }
                          data-testid="button-generate-launch-emails"
                        >
                          {generateEmailsMutation.isPending ? (
                            <>
                              <Zap className="w-5 h-5 mr-2 animate-pulse" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5 mr-2" />
                              Generate Launch Emails
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                <CardTitle>Implementation Checklist</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-700 mb-6">
                  Follow these steps to complete your funnel and have it fully
                  ready to launch ads to!
                </p>

                {/* Implementation Checklist */}
                <div className="space-y-4">
                  {/* Task 1 */}
                  <Collapsible
                    open={expandedTasks.task1}
                    onOpenChange={() => handleTaskExpand("task1")}
                  >
                    <Card className="border border-slate-200">
                      <CollapsibleTrigger asChild>
                        <CardContent className="py-4 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              id="task-1"
                              checked={checkboxStates["task-1"]}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("task-1", !!checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-task-1"
                            />
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                1
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-800 flex-1">
                              Create Your Launch Registration Funnel Copy
                            </h4>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                expandedTasks.task1
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="ml-16 space-y-2">
                            <p className="text-slate-600 text-sm">
                              Answer the questions in the launch registration
                              funnel copy generator and get your first draft of
                              copy created.
                            </p>
                            <p className="text-slate-600 text-sm">
                              Take that copy and finalize it. It's meant to get
                              you 70% of the way there and you finish the last
                              30%! By the end of this process you will have
                              finalized opt in and thank you page for your live
                              launch experience.
                            </p>
                            <p className="text-slate-600 text-sm">
                              If you get stuck with the questions or are missing
                              depth, come to our Messaging Strategy Call and
                              workshop it!
                            </p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Task 2 */}
                  <Collapsible
                    open={expandedTasks.task3}
                    onOpenChange={() => handleTaskExpand("task3")}
                  >
                    <Card className="border border-slate-200">
                      <CollapsibleTrigger asChild>
                        <CardContent className="py-4 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              id="task-3"
                              checked={checkboxStates["task-3"]}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("task-3", !!checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-task-3"
                            />
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                2
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-800 flex-1">
                              Create Your Sales Page Copy
                            </h4>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                expandedTasks.task3
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="ml-16">
                            <p className="text-slate-600 text-sm">
                              Use our copy generator to draft your sales page
                              copy. We will pull from your messaging strategy
                              and irresistible offer outline to draft your
                              initial copy. Use this to finalize your sales page
                              copy!
                            </p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Task 3 */}
                  <Collapsible
                    open={expandedTasks.task4}
                    onOpenChange={() => handleTaskExpand("task4")}
                  >
                    <Card className="border border-slate-200">
                      <CollapsibleTrigger asChild>
                        <CardContent className="py-4 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              id="task-4"
                              checked={checkboxStates["task-4"]}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("task-4", !!checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-task-4"
                            />
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                3
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-800 flex-1">
                              Build Your Sales Funnel
                            </h4>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                expandedTasks.task4
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="ml-16 space-y-4">
                            <p className="text-slate-600 text-sm">
                              Take your finalized copy and create your funnel
                              using our easy templates. This will include your
                              live launch opt in page, confirmation page, sales
                              page and purchase confirmation page once you're
                              finished.
                            </p>
                            <div className="text-center space-y-3">
                              <a
                                href="https://affiliates.gohighlevel.com/?fp_ref=embodied-marketing59&funnel_share=68d5127baf4b491eb268f132"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="lg"
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                                >
                                  Access our GHL Templates Here
                                </Button>
                              </a>
                              <div className="flex gap-2 justify-center">
                                <a
                                  href="https://get.embodiedmarketing.com/webinar-registration"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                                  >
                                    View our Live Launch Page Here
                                  </Button>
                                </a>
                                <a
                                  href="https://get.embodiedmarketing.com/sales-page"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                                  >
                                    View our Sales Page Here
                                  </Button>
                                </a>
                                <a
                                  href="https://get.embodiedmarketing.com/order-form"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                                  >
                                    View our Order Form Page Here
                                  </Button>
                                </a>
                              </div>
                              <div className="flex justify-center">
                                <a
                                  href="https://get.embodiedmarketing.com/order-confirmation"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                                  >
                                    View our Confirmation Page Here
                                  </Button>
                                </a>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Task 4 */}
                  <Collapsible
                    open={expandedTasks.task2}
                    onOpenChange={() => handleTaskExpand("task2")}
                  >
                    <Card className="border border-slate-200">
                      <CollapsibleTrigger asChild>
                        <CardContent className="py-4 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              id="task-2"
                              checked={checkboxStates["task-2"]}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("task-2", !!checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-task-2"
                            />
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                4
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-800 flex-1">
                              Write Your Email Copy
                            </h4>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                expandedTasks.task2
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="ml-16 space-y-2">
                            <p className="text-slate-600 text-sm">
                              Use the copy generator to create draft email copy
                              for your funnel. You will end up with invite copy,
                              a confirmation email, nurture emails and sales
                              emails.
                            </p>
                            <p className="text-slate-600 text-sm">
                              Create the draft and then edit it so you have
                              fully complete email copy ready to load into your
                              automation. If you get stuck, leverage our
                              Messaging Support Call!
                            </p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Task 5 */}
                  <Collapsible
                    open={expandedTasks.task5}
                    onOpenChange={() => handleTaskExpand("task5")}
                  >
                    <Card className="border border-slate-200">
                      <CollapsibleTrigger asChild>
                        <CardContent className="py-4 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              id="task-5"
                              checked={checkboxStates["task-5"]}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("task-5", !!checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-task-5"
                            />
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                5
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-800 flex-1">
                              Set Up Your Tech
                            </h4>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                expandedTasks.task5
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="ml-16">
                            <p className="text-slate-600 text-sm">
                              Now that you have all your email copy ready you
                              can set up your automations and load the emails
                              into your CRM. Reference our training video on how
                              to set up your emails in GHL. Your funnel should
                              be fully ready for ads to launch once you've
                              finished this step!
                            </p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Task 6 */}
                  <Collapsible
                    open={expandedTasks.task6}
                    onOpenChange={() => handleTaskExpand("task6")}
                  >
                    <Card className="border border-slate-200">
                      <CollapsibleTrigger asChild>
                        <CardContent className="py-4 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              id="task-6"
                              checked={checkboxStates["task-6"]}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange("task-6", !!checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-task-6"
                            />
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                6
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-800 flex-1">
                              Test Your Funnel
                            </h4>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                expandedTasks.task6
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          <div className="ml-16">
                            <p className="text-slate-600 text-sm">
                              Test your complete funnel to ensure everything
                              works properly before launching ads.
                            </p>
                            <p className="text-slate-600 text-sm mt-2">
                              Opt in to it as a lead and click every link in
                              your emails. Make sure to also check your pages on
                              mobile and desktop.
                            </p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
