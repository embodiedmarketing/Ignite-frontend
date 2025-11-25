import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Magnet,
  BarChart3,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  History,
  Edit3,
  Calculator,
  AlertTriangle,
  XCircle,
  Mail,
  Save,
  Trash2,
  Info,
  Download,
} from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";
import {
  useMarkSectionComplete,
  useUnmarkSectionComplete,
} from "@/hooks/useSectionCompletions";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TrackAndOptimizeLiveLaunch() {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("tracker");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Today's date in YYYY-MM-DD format
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [setupInstructionsExpanded, setSetupInstructionsExpanded] =
    useState(true); // Show instructions by default

  // Launch management state
  const [selectedLaunchId, setSelectedLaunchId] = useState<number | null>(null);
  const [showCreateLaunchModal, setShowCreateLaunchModal] = useState(false);
  const [newLaunchLabel, setNewLaunchLabel] = useState("");
  const [showDeleteLaunchModal, setShowDeleteLaunchModal] = useState(false);
  const [launchToDelete, setLaunchToDelete] = useState<number | null>(null);

  // Bulk entry state
  const [bulkEntryMode, setBulkEntryMode] = useState(false); // Toggle between week view and bulk entry
  const [bulkStartDate, setBulkStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bulkDaysCount, setBulkDaysCount] = useState(5);
  const [bulkOverwriteExisting, setBulkOverwriteExisting] = useState(false);
  const [bulkData, setBulkData] = useState<
    Record<string, Record<string, string>>
  >({});

  // Edit suggestions state
  const [showEditSuggestionsDialog, setShowEditSuggestionsDialog] =
    useState(false);
  const [editedSuggestions, setEditedSuggestions] = useState<
    Array<{ type: string; title: string; issue: string; actions: string[] }>
  >([]);

  // State for tracking sections
  const [completedSections, setCompletedSections] = useState({
    leadMagnet: false,
    landingPage: false,
    automation: false,
    launch: false,
  });

  // State for input fields
  const [leadInput, setLeadInput] = useState("");

  const handleSectionComplete = async (
    section: keyof typeof completedSections
  ) => {
    const isCurrentlyComplete = completedSections[section];

    // Update local state
    setCompletedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));

    // Save to database for "launch" section (Optimize & Execute)
    if (section === "launch" && userId) {
      try {
        if (!isCurrentlyComplete) {
          await markSectionComplete.mutateAsync({
            userId,
            stepNumber: 5, // Live Launch is step 5
            sectionTitle: "Optimize & Execute",
          });
        } else {
          await unmarkSectionComplete.mutateAsync({
            userId,
            stepNumber: 5,
            sectionTitle: "Optimize & Execute",
          });
        }
      } catch (error) {
        console.error("Failed to save section completion:", error);
      }
    }
  };

  const handleCreateLaunch = async () => {
    if (!newLaunchLabel.trim()) {
      toast({
        title: "Error",
        description: "Please enter a launch name.",
        variant: "destructive",
      });
      return;
    }

    await createLaunchMutation.mutateAsync({
      userId,
      label: newLaunchLabel.trim(),
    });
  };

  // State for tracking funnel metrics - using date-based storage
  type MetricData = {
    step: string;
    goal: string;
    values: Record<string, number>;
    sevenDayAvg: number;
    thirtyDayAvg: number;
    isManual: boolean; // Whether this metric requires manual input
  };

  // Default organic funnel structure
  const getDefaultOrganicFunnelData = (): MetricData[] => {
    return [
      {
        step: "Landing Page Views - Organic",
        goal: "500",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Registrations - Organic",
        goal: "",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Landing Page Conversion Rate - Organic",
        goal: "30-40%",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: false,
      },
      {
        step: "Live Show Up Rate",
        goal: "18-25%",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Sales Page Views",
        goal: "",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Total Sales",
        goal: "",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Sales Page Conversion",
        goal: "2-5%",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: false,
      },
      {
        step: "Total Revenue",
        goal: "",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: false,
      },
      {
        step: "Total ROAS from Launch",
        goal: "3x",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: false,
      },
    ];
  };

  // Organic Funnel Data State
  const [organicFunnelData, setOrganicFunnelData] = useState<MetricData[]>(
    getDefaultOrganicFunnelData()
  );

  // New Email Form State
  const [newEmailForm, setNewEmailForm] = useState({
    type: "Invite",
    subject: "",
    openRate: "",
    clickRate: "",
  });

  // Fetch all launches for the user
  const { data: launches = [], isLoading: launchesLoading } = useQuery({
    queryKey: ["/api/live-launches/user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/live-launches/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch launches");
      return response.json();
    },
    enabled: !!userId,
  });

  // Set selected launch to the most recent one on initial load, or prompt to create first launch
  useEffect(() => {
    if (!launchesLoading) {
      if (launches.length > 0 && selectedLaunchId === null) {
        setSelectedLaunchId(launches[0].id);
      } else if (launches.length === 0 && !showCreateLaunchModal) {
        // Auto-open the create modal if user has no launches
        setShowCreateLaunchModal(true);
      }
    }
  }, [launches, selectedLaunchId, launchesLoading, showCreateLaunchModal]);

  // Load offer cost when selected launch changes
  useEffect(() => {
    if (selectedLaunchId && launches.length > 0) {
      const currentLaunch = launches.find(
        (l: any) => l.id === selectedLaunchId
      );
      if (currentLaunch && currentLaunch.offerCost) {
        setOfferCost(currentLaunch.offerCost);
      } else {
        setOfferCost("");
      }
    }
  }, [selectedLaunchId, launches]);

  // Create new launch mutation
  const createLaunchMutation = useMutation({
    mutationFn: async (data: { userId: number; label: string }) => {
      const response = await apiRequest("POST", "/api/live-launches", data);
      return await response.json();
    },
    onSuccess: (newLaunch: any) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/live-launches/user", userId],
      });
      setSelectedLaunchId(newLaunch.id);
      setShowCreateLaunchModal(false);
      setNewLaunchLabel("");
      toast({
        title: "Launch created",
        description: "Your new launch has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create launch. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete launch mutation
  const deleteLaunchMutation = useMutation({
    mutationFn: async (launchId: number) => {
      return apiRequest("DELETE", `/api/live-launches/${launchId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/live-launches/user", userId],
      });

      // If we deleted the currently selected launch, select another one
      if (launchToDelete === selectedLaunchId) {
        const remainingLaunches = launches.filter(
          (l: any) => l.id !== launchToDelete
        );
        if (remainingLaunches.length > 0) {
          setSelectedLaunchId(remainingLaunches[0].id);
        } else {
          setSelectedLaunchId(null);
          setShowCreateLaunchModal(true);
        }
      }

      setShowDeleteLaunchModal(false);
      setLaunchToDelete(null);
      toast({
        title: "Launch deleted",
        description: "The launch has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete launch. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteLaunch = (launchId: number) => {
    setLaunchToDelete(launchId);
    setShowDeleteLaunchModal(true);
  };

  const confirmDeleteLaunch = () => {
    if (launchToDelete) {
      deleteLaunchMutation.mutate(launchToDelete);
    }
  };

  // Query to fetch emails for the selected launch
  const { data: emailsForDate = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/live-launches", selectedLaunchId, "email-tracking"],
    queryFn: async () => {
      if (!selectedLaunchId) return [];
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/live-launches/${selectedLaunchId}/email-tracking?userId=${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch emails");
      return response.json();
    },
    enabled: !!selectedLaunchId && !!userId,
  });

  // Mutation to create new email
  const createEmailMutation = useMutation({
    mutationFn: async (emailData: {
      subject: string;
      type: string;
      openRate: number;
      clickRate: number;
      date: string;
      userId: number;
      liveLaunchId: number;
    }) => {
      return apiRequest("POST", "/api/email-tracking", emailData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/live-launches", selectedLaunchId, "email-tracking"],
      });
      toast({
        title: "Email saved",
        description: "Email tracking data has been saved successfully.",
      });
      setNewEmailForm({
        type: "Invite",
        subject: "",
        openRate: "",
        clickRate: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save email tracking data.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete email
  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: number) => {
      return apiRequest("DELETE", `/api/email-tracking/${emailId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/live-launches", selectedLaunchId, "email-tracking"],
      });
      toast({
        title: "Email deleted",
        description: "Email tracking data has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete email tracking data.",
        variant: "destructive",
      });
    },
  });

  // Submit new email from form
  const saveNewEmail = () => {
    if (!newEmailForm.subject.trim() || !selectedLaunchId) return;

    createEmailMutation.mutate({
      subject: newEmailForm.subject,
      type: newEmailForm.type,
      openRate: parseFloat(newEmailForm.openRate) || 0,
      clickRate: parseFloat(newEmailForm.clickRate) || 0,
      date: selectedDate,
      userId: userId,
      liveLaunchId: selectedLaunchId,
    });
  };

  // Fetch funnel metrics (Ads) for the selected launch
  const { data: funnelMetricsData = [] } = useQuery({
    queryKey: ["/api/live-launches", selectedLaunchId, "funnel-metrics"],
    queryFn: async () => {
      if (!selectedLaunchId) return [];
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/live-launches/${selectedLaunchId}/funnel-metrics`
      );
      if (!response.ok) throw new Error("Failed to fetch funnel metrics");
      return response.json();
    },
    enabled: !!selectedLaunchId,
  });

  // Fetch organic metrics for the selected launch
  const { data: organicMetricsData = [] } = useQuery({
    queryKey: ["/api/live-launches", selectedLaunchId, "organic-metrics"],
    queryFn: async () => {
      if (!selectedLaunchId) return [];
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/live-launches/${selectedLaunchId}/organic-metrics`
      );
      if (!response.ok) throw new Error("Failed to fetch organic metrics");
      return response.json();
    },
    enabled: !!selectedLaunchId,
  });

  // Fetch saved optimization suggestions for the selected launch
  const { data: savedSuggestions = [] } = useQuery({
    queryKey: [
      "/api/live-launches",
      selectedLaunchId,
      "optimization-suggestions",
    ],
    queryFn: async () => {
      if (!selectedLaunchId) return [];
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/live-launches/${selectedLaunchId}/optimization-suggestions`
      );
      if (!response.ok)
        throw new Error("Failed to fetch optimization suggestions");
      return response.json();
    },
    enabled: !!selectedLaunchId,
  });

  // Helper function to format suggestions as markdown
  const formatSuggestionsAsMarkdown = (
    suggestions: Array<{
      type: string;
      title: string;
      issue: string;
      actions: string[];
    }>,
    launchLabel: string = "Live Launch"
  ) => {
    let markdown = `# Live Launch Optimization Suggestions\n\n`;
    markdown += `**Launch:** ${launchLabel}\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    markdown += `---\n\n`;

    suggestions.forEach((suggestion, index) => {
      const icon =
        suggestion.type === "success"
          ? "✅"
          : suggestion.type === "warning"
          ? "⚠️"
          : "🚨";
      markdown += `## ${icon} ${suggestion.title}\n\n`;
      markdown += `**${
        suggestion.type === "success" ? "Insight" : "Issue"
      }:** ${suggestion.issue}\n\n`;
      markdown += `**${
        suggestion.type === "success" ? "Next Steps" : "Recommended Actions"
      }:**\n\n`;
      suggestion.actions.forEach((action) => {
        markdown += `- ${action}\n`;
      });
      markdown += `\n---\n\n`;
    });

    return markdown;
  };

  // Mutation to save optimization suggestions
  const saveOptimizationSuggestionsMutation = useMutation({
    mutationFn: async (data: {
      liveLaunchId: number;
      userId: number;
      suggestions: Array<{
        type: string;
        title: string;
        issue: string;
        actions: string[];
      }>;
      launchLabel?: string;
    }) => {
      // First save the optimization suggestions
      await apiRequest(
        "POST",
        `/api/live-launches/${data.liveLaunchId}/optimization-suggestions`,
        data
      );

      // Then save to IGNITE Docs
      const launchLabel = data.launchLabel || "Live Launch";
      // Capitalize first letter of launch label
      const capitalizedLabel =
        launchLabel.charAt(0).toUpperCase() + launchLabel.slice(1);

      const igniteDoc = {
        userId: data.userId,
        docType: "funnel_optimization",
        title: `${capitalizedLabel} - Optimization Suggestions`,
        contentMarkdown: formatSuggestionsAsMarkdown(
          data.suggestions,
          capitalizedLabel
        ),
        sourcePayload: {
          liveLaunchId: data.liveLaunchId,
          generatedAt: new Date().toISOString(),
          launchLabel: capitalizedLabel,
        },
      };

      await apiRequest("POST", "/api/ignite-docs", igniteDoc);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/live-launches",
          selectedLaunchId,
          "optimization-suggestions",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/ignite-docs/user", userId],
      });
    },
  });

  // Mutation to save/update funnel metric
  const saveFunnelMetricMutation = useMutation({
    mutationFn: async (data: {
      userId: number;
      liveLaunchId: number;
      date: string;
      metricType: string;
      value: string;
      goal: string;
    }) => {
      return apiRequest(
        "POST",
        `/api/live-launches/${data.liveLaunchId}/funnel-metrics`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/live-launches", selectedLaunchId, "funnel-metrics"],
      });
    },
  });

  // Mutation to save/update organic metric
  const saveOrganicMetricMutation = useMutation({
    mutationFn: async (data: {
      userId: number;
      liveLaunchId: number;
      date: string;
      metricType: string;
      value: string;
      goal: string;
    }) => {
      return apiRequest(
        "POST",
        `/api/live-launches/${data.liveLaunchId}/organic-metrics`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/live-launches", selectedLaunchId, "organic-metrics"],
      });
    },
  });

  // Remove email by ID
  const removeEmail = (date: string, emailId: number) => {
    deleteEmailMutation.mutate(emailId);
  };

  // Offer Cost State
  const [offerCost, setOfferCost] = useState("");

  // Mutation to update offer cost for the selected launch
  const updateOfferCostMutation = useMutation({
    mutationFn: async (data: { id: number; offerCost: string }) => {
      return apiRequest("PATCH", `/api/live-launches/${data.id}`, {
        offerCost: data.offerCost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/live-launches/user", userId],
      });
    },
  });

  // Default ads funnel structure
  const getDefaultAdsFunnelData = (): MetricData[] => {
    return [
      {
        step: "Ad Spend",
        goal: "",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Click Through Rate",
        goal: "1-3%",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Landing Page Views",
        goal: "",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Cost Per Landing Page View",
        goal: "$0.50-$2.00",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: false,
      },
      {
        step: "Registration - Ads",
        goal: "",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: true,
      },
      {
        step: "Landing Page Conversion Rate - Ads",
        goal: "30-40%",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: false,
      },
      {
        step: "Cost Per Registration",
        goal: "$2-$6",
        values: {} as Record<string, number>,
        sevenDayAvg: 0,
        thirtyDayAvg: 0,
        isManual: false,
      },
    ];
  };

  const [funnelData, setFunnelData] = useState<MetricData[]>(
    getDefaultAdsFunnelData()
  );

  // Transform database metrics into component format when they load or launch changes
  useEffect(() => {
    if (!selectedLaunchId) return;

    const transformed = getDefaultOrganicFunnelData();

    if (organicMetricsData && organicMetricsData.length > 0) {
      // Group metrics by type
      const metricsByType: Record<string, any[]> = {};
      organicMetricsData.forEach((metric: any) => {
        if (!metricsByType[metric.metricType]) {
          metricsByType[metric.metricType] = [];
        }
        metricsByType[metric.metricType].push(metric);
      });

      // Populate values for each metric type
      transformed.forEach((metricDef) => {
        const metrics = metricsByType[metricDef.step] || [];
        const values: Record<string, number> = {};

        metrics.forEach((metric: any) => {
          if (metric.value) {
            values[metric.date] = parseFloat(metric.value) || 0;
          }
        });

        metricDef.values = values;
        // Use the most recent goal value if available
        if (metrics.length > 0 && metrics[0].goal) {
          metricDef.goal = metrics[0].goal;
        }

        // Calculate totals/averages after populating values
        if (shouldUseTotals(metricDef.step)) {
          metricDef.sevenDayAvg = calculateAllTimeTotal(values);
          metricDef.thirtyDayAvg = calculateAllTimeTotal(values);
        } else {
          metricDef.sevenDayAvg = calculateAllTimeAverage(values);
          metricDef.thirtyDayAvg = calculateAllTimeAverage(values);
        }
      });
    }

    // Apply auto-goal calculation for Registrations - Organic (35% of Landing Page Views goal)
    const landingPageViewsGoal = parseFloat(transformed[0].goal) || 500; // Default 500
    const autoRegistrationGoal = Math.round(landingPageViewsGoal * 0.35); // 35% conversion
    transformed[1].goal = autoRegistrationGoal.toString();

    // Reset to fresh state for new launches or when switching launches
    setOrganicFunnelData(transformed);
  }, [organicMetricsData, selectedLaunchId]);

  useEffect(() => {
    if (!selectedLaunchId) return;

    const transformed = getDefaultAdsFunnelData();

    if (funnelMetricsData && funnelMetricsData.length > 0) {
      // Group metrics by type
      const metricsByType: Record<string, any[]> = {};
      funnelMetricsData.forEach((metric: any) => {
        if (!metricsByType[metric.metricType]) {
          metricsByType[metric.metricType] = [];
        }
        metricsByType[metric.metricType].push(metric);
      });

      // Populate values for each metric type
      transformed.forEach((metricDef) => {
        const metrics = metricsByType[metricDef.step] || [];
        const values: Record<string, number> = {};

        metrics.forEach((metric: any) => {
          if (metric.value) {
            values[metric.date] = parseFloat(metric.value) || 0;
          }
        });

        metricDef.values = values;
        // Use the most recent goal value if available
        if (metrics.length > 0 && metrics[0].goal) {
          metricDef.goal = metrics[0].goal;
        }

        // Calculate totals/averages after populating values
        if (shouldUseTotals(metricDef.step)) {
          metricDef.sevenDayAvg = calculateAllTimeTotal(values);
          metricDef.thirtyDayAvg = calculateAllTimeTotal(values);
        } else {
          metricDef.sevenDayAvg = calculateAllTimeAverage(values);
          metricDef.thirtyDayAvg = calculateAllTimeAverage(values);
        }
      });
    }

    // Reset to fresh state for new launches or when switching launches
    setFunnelData(transformed);
  }, [funnelMetricsData, selectedLaunchId]);

  // Auto-calculate ALL downstream goals when Ad Spend changes
  useEffect(() => {
    const updatedData = [...funnelData];
    let hasChanges = false;

    const adSpendGoal = parseFloat(
      updatedData[0]?.goal.replace(/[^0-9.]/g, "") || "0"
    );

    if (adSpendGoal > 0) {
      const defaultCostPerLPV = 1.25;
      const defaultConversionRate = 0.35; // 35%
      const defaultTripwireConversionRate = 0.035; // 3.5% (midpoint of 2-5%)

      // Calculate Landing Page Views
      const calculatedLPV = Math.round(adSpendGoal / defaultCostPerLPV);
      if (updatedData[2].goal !== calculatedLPV.toString()) {
        updatedData[2].goal = calculatedLPV.toString();
        hasChanges = true;
      }

      // Calculate Leads (Registration - Ads)
      const calculatedLeads = Math.round(calculatedLPV * defaultConversionRate);
      if (updatedData[4].goal !== calculatedLeads.toString()) {
        updatedData[4].goal = calculatedLeads.toString();
        hasChanges = true;
      }

      // Calculate Tripwire Sales (assuming we have a tripwire product)
      const calculatedTripwireSales = Math.round(
        calculatedLeads * defaultTripwireConversionRate
      );
      if (updatedData[4].goal && !updatedData[6]?.goal) {
        // Only set if we have leads and tripwire sales is empty
        // Note: This assumes index 6 is Tripwire Sales - may need adjustment
      }
    }

    if (hasChanges) {
      setFunnelData(updatedData);
    }
  }, [funnelData]);

  // Auto-save optimization suggestions when metrics change
  useEffect(() => {
    if (!selectedLaunchId || !userId) return;

    // Generate fresh suggestions based on current metrics
    const currentSuggestions = generateSuggestions();

    // Only save if we have suggestions and they've changed
    if (currentSuggestions.length > 0) {
      // Check if suggestions have actually changed by comparing to savedSuggestions
      const suggestionsChanged =
        JSON.stringify(currentSuggestions) !==
        JSON.stringify(
          savedSuggestions.map((s: any) => ({
            type: s.suggestionType,
            title: s.title,
            issue: s.issue,
            actions: s.actions,
          }))
        );

      if (suggestionsChanged) {
        // Debounce the save to avoid too many requests
        const timeoutId = setTimeout(() => {
          const currentLaunch = launches?.find(
            (l: any) => l.id === selectedLaunchId
          );
          const launchLabel = currentLaunch?.label || "Live Launch";

          saveOptimizationSuggestionsMutation.mutate({
            liveLaunchId: selectedLaunchId,
            userId,
            suggestions: currentSuggestions,
            launchLabel,
          });
        }, 2000); // Wait 2 seconds after last change before saving

        return () => clearTimeout(timeoutId);
      }
    }
  }, [
    funnelData,
    organicFunnelData,
    emailsForDate,
    selectedLaunchId,
    userId,
    launches,
    savedSuggestions,
  ]);

  // Utility functions for date calculations
  const getDatesBefore = (fromDate: string, days: number): string[] => {
    const dates = [];
    const date = new Date(fromDate);
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() - i);
      dates.push(currentDate.toISOString().split("T")[0]);
    }
    return dates;
  };

  const calculateAverage = (
    values: Record<string, number>,
    fromDate: string,
    days: number
  ): number => {
    const dates = getDatesBefore(fromDate, days);
    const validValues = dates
      .map((date) => values[date])
      .filter((val) => val !== undefined && !isNaN(val));
    if (validValues.length === 0) return 0;
    return (
      Math.round(
        (validValues.reduce((a, b) => a + b, 0) / validValues.length) * 100
      ) / 100
    );
  };

  const calculateTotal = (
    values: Record<string, number>,
    fromDate: string,
    days: number
  ): number => {
    const dates = getDatesBefore(fromDate, days);
    const validValues = dates
      .map((date) => values[date])
      .filter((val) => val !== undefined && !isNaN(val));
    if (validValues.length === 0) return 0;
    return Math.round(validValues.reduce((a, b) => a + b, 0) * 100) / 100;
  };

  // Calculate all-time total (sum of all values)
  const calculateAllTimeTotal = (values: Record<string, number>): number => {
    const allValues = Object.values(values).filter(
      (val) => val !== undefined && !isNaN(val)
    );
    if (allValues.length === 0) return 0;
    return Math.round(allValues.reduce((a, b) => a + b, 0) * 100) / 100;
  };

  // Calculate all-time average
  const calculateAllTimeAverage = (values: Record<string, number>): number => {
    const allValues = Object.values(values).filter(
      (val) => val !== undefined && !isNaN(val)
    );
    if (allValues.length === 0) return 0;
    return (
      Math.round(
        (allValues.reduce((a, b) => a + b, 0) / allValues.length) * 100
      ) / 100
    );
  };

  const shouldUseTotals = (stepName: string): boolean => {
    return [
      "Ad Spend",
      "Landing Page Views - Ads",
      "Registrations - Ads",
      "Landing Page Views - Organic",
      "Registrations - Organic",
      "Sales Page Views",
      "Total Sales",
      "Total Revenue",
    ].includes(stepName);
  };

  const formatCurrency = (value: number | string): string => {
    if (
      value === "" ||
      value === undefined ||
      value === null ||
      isNaN(Number(value))
    )
      return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const formatPercentage = (value: number | string): string => {
    if (
      value === "" ||
      value === undefined ||
      value === null ||
      isNaN(Number(value))
    )
      return "—";
    return `${Number(value).toFixed(2)}%`;
  };

  const isCurrencyMetric = (stepName: string): boolean => {
    return [
      "Ad Spend",
      "Cost Per Landing Page View",
      "Cost Per Registration",
      "Total Revenue",
    ].includes(stepName);
  };

  const isPercentageMetric = (stepName: string): boolean => {
    return [
      "Click Through Rate",
      "Landing Page Conversion Rate - Ads",
      "Landing Page Conversion Rate - Organic",
      "Live Show Up Rate",
      "Sales Page Conversion",
    ].includes(stepName);
  };

  // Helper function to check if metric has industry standard goal
  const hasIndustryStandardGoal = (stepName: string): boolean => {
    return [
      "Click Through Rate",
      "Cost Per Landing Page View",
      "Cost Per Registration",
      "Landing Page Conversion Rate - Ads",
    ].includes(stepName);
  };

  // Analysis functions for suggestions
  const getMetricValue = (
    metricName: string,
    useAverage: boolean = true
  ): number => {
    const metric = funnelData.find((m) => m.step === metricName);
    if (!metric) return 0;
    if (useAverage) {
      return metric.sevenDayAvg || 0;
    }
    return metric.values[selectedDate] || 0;
  };

  // Function to get performance status color based on goal comparison
  const getPerformanceStatus = (
    metricName: string,
    currentValue: number,
    goalString: string
  ): "excellent" | "good" | "warning" | "danger" | "neutral" => {
    if (!goalString || currentValue === 0) return "neutral";

    // Parse goal ranges
    const parseGoal = (goal: string) => {
      // Handle percentage ranges (e.g., "1-3%", "30-40%")
      const percentageRange = goal.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%/);
      if (percentageRange) {
        return {
          min: parseFloat(percentageRange[1]),
          max: parseFloat(percentageRange[2]),
          type: "percentage",
        };
      }

      // Handle currency ranges (e.g., "$2-$6", "$0.50-$2.00")
      const currencyRange = goal.match(/\$(\d+(?:\.\d+)?)-\$(\d+(?:\.\d+)?)/);
      if (currencyRange) {
        return {
          min: parseFloat(currencyRange[1]),
          max: parseFloat(currencyRange[2]),
          type: "currency",
        };
      }

      // Handle numeric goals (e.g., "175", "500") - treat as monthly targets
      const numericGoal = goal.match(/^(\d+(?:\.\d+)?)$/);
      if (numericGoal) {
        const target = parseFloat(numericGoal[1]);
        return {
          min: target * 0.8,
          max: target * 1.2,
          target,
          type: "numeric",
        }; // 20% tolerance range
      }

      return null;
    };

    const goalRange = parseGoal(goalString);
    if (!goalRange) return "neutral";

    // For "lower is better" metrics (costs)
    const isLowerBetter = metricName.toLowerCase().includes("cost");

    // Check if this is a percentage metric (daily rates shouldn't be projected to monthly)
    const isPercentageMetricType = isPercentageMetric(metricName);

    if (goalRange.type === "numeric" && !isPercentageMetricType) {
      // For numeric goals (counts like registrations, views), project daily performance to monthly
      const monthlyTarget = goalRange.target!;
      const projectedMonthly = currentValue * 30; // Project daily value to 30 days
      const tolerance = monthlyTarget * 0.2; // 20% tolerance

      if (projectedMonthly >= monthlyTarget) {
        return projectedMonthly >= monthlyTarget * 1.1 ? "excellent" : "good"; // 10%+ above monthly target is excellent
      } else if (projectedMonthly >= monthlyTarget - tolerance) {
        return "warning"; // Within 20% below monthly target
      } else {
        return "danger"; // More than 20% below monthly target
      }
    } else if (goalRange.type === "numeric" && isPercentageMetricType) {
      // For percentage metrics, don't project to monthly - compare directly
      const target = goalRange.target!;
      const tolerance = target * 0.2; // 20% tolerance

      if (currentValue >= target) {
        return currentValue >= target * 1.1 ? "excellent" : "good";
      } else if (currentValue >= target - tolerance) {
        return "warning";
      } else {
        return "danger";
      }
    } else {
      // Existing range logic for percentage and currency goals
      const { min, max } = goalRange;
      const range = max - min;
      const tolerance = range * 0.2; // 20% tolerance for warning zone

      if (isLowerBetter) {
        if (currentValue <= max) {
          return currentValue <= min ? "excellent" : "good";
        } else if (currentValue <= max + tolerance) {
          return "warning";
        } else {
          return "danger";
        }
      } else {
        // For "higher is better" metrics (rates, conversions)
        if (currentValue > max) {
          // Above the goal range is excellent for conversion rates
          return "excellent";
        } else if (currentValue >= min && currentValue <= max) {
          return currentValue >= (min + max) / 2 ? "excellent" : "good";
        } else if (currentValue >= min - tolerance) {
          return "warning";
        } else {
          return "danger";
        }
      }
    }
  };

  // Function to get CSS classes for performance status
  const getStatusClasses = (
    status: "excellent" | "good" | "warning" | "danger" | "neutral"
  ) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 border-green-300 text-green-800";
      case "good":
        return "bg-green-50 border-green-200 text-green-700";
      case "warning":
        return "bg-yellow-50 border-yellow-300 text-yellow-800";
      case "danger":
        return "bg-red-100 border-red-300 text-red-800";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  // Function to get status indicator icon
  const getStatusIcon = (
    status: "excellent" | "good" | "warning" | "danger" | "neutral"
  ) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "good":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "danger":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  // Function to get performance explanation for tooltips
  const getPerformanceExplanation = (
    metricName: string,
    value: number,
    goalString: string,
    isProjected: boolean = false
  ): string => {
    if (!goalString || value === 0)
      return "No goal set or no data available yet.";

    const status = getPerformanceStatus(metricName, value, goalString);
    const isPercentageMetricType = isPercentageMetric(metricName);
    const isCurrencyMetricType = isCurrencyMetric(metricName);

    // Parse goal for explanation
    const parseGoal = (goal: string) => {
      const percentageRange = goal.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%/);
      if (percentageRange) {
        return {
          min: parseFloat(percentageRange[1]),
          max: parseFloat(percentageRange[2]),
          type: "percentage",
        };
      }

      const currencyRange = goal.match(/\$(\d+(?:\.\d+)?)-\$(\d+(?:\.\d+)?)/);
      if (currencyRange) {
        return {
          min: parseFloat(currencyRange[1]),
          max: parseFloat(currencyRange[2]),
          type: "currency",
        };
      }

      const numericGoal = goal.match(/^(\d+(?:\.\d+)?)$/);
      if (numericGoal) {
        const target = parseFloat(numericGoal[1]);
        return { target, type: "numeric" };
      }

      return null;
    };

    const goalRange = parseGoal(goalString);
    if (!goalRange) return "Goal format not recognized.";

    let explanation = "";
    const formattedValue = formatMetricValue(
      { step: metricName } as MetricData,
      value
    );

    if (goalRange.type === "numeric" && !isPercentageMetricType) {
      // Monthly projection logic
      const monthlyTarget = goalRange.target!;
      const projectedMonthly = value * 30;

      explanation = `Daily average: ${formattedValue}\n`;
      explanation += `Monthly projection: ${Math.round(
        projectedMonthly
      ).toLocaleString()}\n`;
      explanation += `Monthly goal: ${monthlyTarget.toLocaleString()}\n\n`;

      switch (status) {
        case "excellent":
          explanation += `🟢 Excellent! You're tracking ${Math.round(
            (projectedMonthly / monthlyTarget) * 100
          )}% of your monthly goal.`;
          break;
        case "good":
          explanation += `🟢 Good! You're on pace to meet your monthly goal.`;
          break;
        case "warning":
          explanation += `🟡 Warning: You're ${Math.round(
            ((monthlyTarget - projectedMonthly) / monthlyTarget) * 100
          )}% below your monthly goal pace.`;
          break;
        case "danger":
          explanation += `🔴 Danger: You're significantly behind your monthly goal pace.`;
          break;
        default:
          explanation += "No performance data available.";
      }
    } else if (goalRange.type === "percentage") {
      const { min, max } = goalRange;
      explanation = `Current average: ${formattedValue}\n`;
      explanation += `Goal range: ${min}%-${max}%\n\n`;

      switch (status) {
        case "excellent":
          explanation += `🟢 Excellent! You're above the target range.`;
          break;
        case "good":
          explanation += `🟢 Good! You're within or above the target range.`;
          break;
        case "warning":
          explanation += `🟡 Warning: You're slightly below the target range.`;
          break;
        case "danger":
          explanation += `🔴 Danger: You're significantly below the target range.`;
          break;
        default:
          explanation += "No performance data available.";
      }
    } else if (goalRange.type === "currency") {
      const { min, max } = goalRange;
      const isLowerBetter = metricName.toLowerCase().includes("cost");
      explanation = `Current average: ${formattedValue}\n`;
      explanation += `Goal range: $${min}-$${max}\n\n`;

      if (isLowerBetter) {
        switch (status) {
          case "excellent":
            explanation += `🟢 Excellent! Your costs are well below the target range.`;
            break;
          case "good":
            explanation += `🟢 Good! Your costs are within the target range.`;
            break;
          case "warning":
            explanation += `🟡 Warning: Your costs are slightly above the target range.`;
            break;
          case "danger":
            explanation += `🔴 Danger: Your costs are significantly above the target range.`;
            break;
          default:
            explanation += "No performance data available.";
        }
      } else {
        switch (status) {
          case "excellent":
            explanation += `🟢 Excellent! You're above the target range.`;
            break;
          case "good":
            explanation += `🟢 Good! You're within the target range.`;
            break;
          case "warning":
            explanation += `🟡 Warning: You're slightly below the target range.`;
            break;
          case "danger":
            explanation += `🔴 Danger: You're significantly below the target range.`;
            break;
          default:
            explanation += "No performance data available.";
        }
      }
    } else {
      // Direct numeric or percentage comparison
      const target = goalRange.target || 0;
      explanation = `Current average: ${formattedValue}\n`;
      explanation += `Goal: ${target}${isPercentageMetricType ? "%" : ""}\n\n`;

      switch (status) {
        case "excellent":
          explanation += `🟢 Excellent! You're exceeding your goal.`;
          break;
        case "good":
          explanation += `🟢 Good! You're meeting your goal.`;
          break;
        case "warning":
          explanation += `🟡 Warning: You're slightly below your goal.`;
          break;
        case "danger":
          explanation += `🔴 Danger: You're significantly below your goal.`;
          break;
        default:
          explanation += "No performance data available.";
      }
    }

    return explanation;
  };

  const generateSuggestions = () => {
    const suggestions = [];

    // ADS FUNNEL METRICS
    const costPerRegistration = getMetricValue("Cost Per Registration");
    const landingPageConversion = getMetricValue(
      "Landing Page Conversion Rate - Ads"
    );
    const clickThroughRate = getMetricValue("Click Through Rate");
    const costPerLPV = getMetricValue("Cost Per Landing Page View");

    // ORGANIC FUNNEL METRICS
    const liveShowUpRate = organicFunnelData[3]?.sevenDayAvg || 0; // Live Show Up Rate
    const salesPageConversion = organicFunnelData[6]?.sevenDayAvg || 0; // Sales Page Conversion
    const totalRevenue = organicFunnelData[7]?.sevenDayAvg || 0; // Total Revenue
    const totalROAS = organicFunnelData[8]?.sevenDayAvg || 0; // Total ROAS from Launch

    // COMBINED METRICS
    const adsRegistrations = funnelData[2]?.sevenDayAvg || 0; // Registrations - Ads
    const organicRegistrations = organicFunnelData[1]?.sevenDayAvg || 0; // Registrations - Organic
    const totalRegistrations = adsRegistrations + organicRegistrations;

    // EMAIL METRICS - Calculate averages by type from selected date
    const emailsByType: Record<
      string,
      Array<{ openRate: number; clickRate: number }>
    > = {};
    emailsForDate.forEach((email: any) => {
      if (!emailsByType[email.type]) {
        emailsByType[email.type] = [];
      }
      emailsByType[email.type].push({
        openRate: email.openRate,
        clickRate: email.clickRate,
      });
    });

    const emailAverages: Record<
      string,
      { avgOpen: number; avgClick: number; count: number }
    > = {};
    Object.keys(emailsByType).forEach((type) => {
      const emails = emailsByType[type];
      const avgOpen =
        emails.reduce((sum, e) => sum + e.openRate, 0) / emails.length;
      const avgClick =
        emails.reduce((sum, e) => sum + e.clickRate, 0) / emails.length;
      emailAverages[type] = { avgOpen, avgClick, count: emails.length };
    });

    // ADS FUNNEL ANALYSIS
    if (costPerRegistration > 6) {
      suggestions.push({
        type: "warning",
        title: "High Cost Per Registration (Ads)",
        issue: `Your cost per registration ($${costPerRegistration.toFixed(
          2
        )}) is above the $2-$6 industry standard.`,
        actions: [
          "Improve your landing page conversion rate (currently " +
            (landingPageConversion
              ? landingPageConversion.toFixed(1) + "%"
              : "not tracked") +
            ")",
          "Optimize your ad targeting to reach more qualified prospects",
          "Test different ad creatives to improve click-through rate",
          "A/B test your landing page copy and design",
        ],
      });
    }

    if (landingPageConversion > 0 && landingPageConversion < 30) {
      suggestions.push({
        type: "warning",
        title: "Low Landing Page Conversion (Ads)",
        issue: `Your landing page conversion rate (${landingPageConversion.toFixed(
          1
        )}%) is below the 30-40% industry standard.`,
        actions: [
          "Test different headlines that match your ad messaging",
          "Simplify your opt-in form (reduce required fields)",
          "Add social proof like testimonials or logos",
          "Improve your lead magnet offer to be more compelling",
          "Test different page layouts and call-to-action buttons",
        ],
      });
    }

    if (clickThroughRate > 0 && clickThroughRate < 1) {
      suggestions.push({
        type: "warning",
        title: "Low Click-Through Rate",
        issue: `Your click-through rate (${clickThroughRate.toFixed(
          2
        )}%) is below the 1-3% industry standard.`,
        actions: [
          "Test new ad creatives with stronger hooks",
          "Refine your audience targeting",
          "Try different ad formats (video, carousel, single image)",
          "Update ad copy to better match your audience's pain points",
        ],
      });
    }

    if (costPerLPV > 2) {
      suggestions.push({
        type: "warning",
        title: "High Cost Per Landing Page View",
        issue: `Your cost per landing page view ($${costPerLPV.toFixed(
          2
        )}) is above the $0.50-$2.00 industry standard.`,
        actions: [
          "Broaden your audience targeting to reduce competition",
          "Improve ad relevance score with better targeting",
          "Test lower-cost ad placements",
          "Optimize for landing page views instead of clicks",
        ],
      });
    }

    // LIVE LAUNCH ORGANIC FUNNEL ANALYSIS
    if (liveShowUpRate > 0 && liveShowUpRate < 18) {
      suggestions.push({
        type: "warning",
        title: "Low Live Show Up Rate",
        issue: `Your live show up rate (${liveShowUpRate.toFixed(
          1
        )}%) is below the 18-25% industry standard for live launches.`,
        actions: [
          "Send more reminder emails leading up to the live event",
          "Create urgency with limited-time bonuses for attendees",
          "Use SMS reminders if you have phone numbers",
          "Host the event at a better time for your audience",
          "Build more excitement about what you'll reveal on the live",
        ],
      });
    }

    if (salesPageConversion > 0 && salesPageConversion < 2) {
      suggestions.push({
        type: "warning",
        title: "Low Sales Page Conversion",
        issue: `Your sales page conversion rate (${salesPageConversion.toFixed(
          2
        )}%) is below the 2-5% industry standard for live launches.`,
        actions: [
          "Strengthen your offer's value proposition and messaging",
          "Add more social proof and testimonials from past clients",
          "Create urgency with bonuses or price increases",
          "Improve your sales pitch delivery during the live event",
          "Add a strong FAQ section to address objections",
          "Test different payment options or payment plans",
        ],
      });
    }

    if (totalROAS > 0 && totalROAS < 3) {
      suggestions.push({
        type: "warning",
        title: "Low Return on Ad Spend",
        issue: `Your total ROAS from launch (${totalROAS.toFixed(
          1
        )}x) is below the 3x+ target for profitable launches.`,
        actions: [
          "Focus on improving sales conversion (currently " +
            (salesPageConversion
              ? salesPageConversion.toFixed(2) + "%"
              : "not tracked") +
            ")",
          "Reduce ad spend or pause underperforming ad sets",
          "Increase show-up rate to get more people to the sales presentation",
          "Test raising your offer price if market allows",
          "Improve your live presentation to convert more attendees",
        ],
      });
    }

    // POSITIVE REINFORCEMENT
    if (costPerRegistration > 0 && costPerRegistration <= 4) {
      suggestions.push({
        type: "success",
        title: "Great Cost Per Registration!",
        issue: `Your cost per registration ($${costPerRegistration.toFixed(
          2
        )}) is within the ideal range.`,
        actions: [
          "Scale up your ad spend to capitalize on this efficiency",
          "Document what's working so you can replicate it",
        ],
      });
    }

    if (landingPageConversion >= 35) {
      suggestions.push({
        type: "success",
        title: "Excellent Landing Page Conversion!",
        issue: `Your landing page conversion rate (${landingPageConversion.toFixed(
          1
        )}%) is above industry standards.`,
        actions: [
          "Scale your traffic to this high-converting page",
          "Use this page as a template for future campaigns",
        ],
      });
    }

    if (liveShowUpRate >= 20) {
      suggestions.push({
        type: "success",
        title: "Strong Live Show Up Rate!",
        issue: `Your live show up rate (${liveShowUpRate.toFixed(
          1
        )}%) is within or above the 18-25% industry standard.`,
        actions: [
          "Keep using the same reminder sequence for future launches",
          "Document your email/SMS reminder strategy to replicate success",
        ],
      });
    }

    if (salesPageConversion >= 3) {
      suggestions.push({
        type: "success",
        title: "Excellent Sales Conversion!",
        issue: `Your sales page conversion rate (${salesPageConversion.toFixed(
          2
        )}%) is above the 2-5% industry standard.`,
        actions: [
          "Scale your launch by increasing ad spend and registrations",
          "Record and reuse this sales presentation for evergreen funnels",
          "Test increasing your price point to maximize revenue",
        ],
      });
    }

    if (totalROAS >= 3) {
      suggestions.push({
        type: "success",
        title: "Profitable Launch ROAS!",
        issue: `Your total ROAS from launch (${totalROAS.toFixed(
          1
        )}x) meets or exceeds the 3x+ profitability target.`,
        actions: [
          "Scale this winning launch strategy to maximize revenue",
          "Reinvest profits into more ad spend to compound returns",
          "Document everything for your next live launch",
        ],
      });
    }

    // COMBINED FUNNEL INSIGHTS
    if (totalRegistrations > 0) {
      const adsPercent = (
        (adsRegistrations / totalRegistrations) *
        100
      ).toFixed(0);
      const organicPercent = (
        (organicRegistrations / totalRegistrations) *
        100
      ).toFixed(0);

      if (adsRegistrations > organicRegistrations * 3) {
        suggestions.push({
          type: "warning",
          title: "Over-Reliance on Paid Traffic",
          issue: `${adsPercent}% of your registrations are from ads vs ${organicPercent}% organic. This makes your launch expensive.`,
          actions: [
            "Build your email list to reduce ad dependency",
            "Create organic content to promote your live event",
            "Leverage social media and partnerships for free registrations",
            "Ask existing customers to refer friends to the live event",
          ],
        });
      }
    }

    // EMAIL PERFORMANCE ANALYSIS
    // Invite Emails (Goal: 25% open, 2% click)
    if (emailAverages["Invite"]) {
      const { avgOpen, avgClick } = emailAverages["Invite"];
      if (avgOpen < 25 || avgClick < 2) {
        suggestions.push({
          type: "warning",
          title: "Invite Email Performance Needs Improvement",
          issue: `Invite emails: ${avgOpen.toFixed(
            1
          )}% open rate (goal: 25%+), ${avgClick.toFixed(
            1
          )}% click rate (goal: 2%+)`,
          actions: [
            avgOpen < 25
              ? "Improve subject lines to increase open rates (test curiosity vs benefit-driven)"
              : "",
            avgClick < 2
              ? "Make your call-to-action more compelling and visible"
              : "",
            "Test sending at different times to find when your audience is most engaged",
            "Personalize the email content based on subscriber data",
          ].filter(Boolean),
        });
      } else if (avgOpen >= 25 && avgClick >= 2) {
        suggestions.push({
          type: "success",
          title: "Strong Invite Email Performance!",
          issue: `Invite emails: ${avgOpen.toFixed(
            1
          )}% open rate, ${avgClick.toFixed(
            1
          )}% click rate - both above goals!`,
          actions: [
            "Keep using similar subject lines and email formats",
            "Document what's working for future invite campaigns",
          ],
        });
      }
    }

    // Nurture Emails (Goal: 35% open, 1% click)
    if (emailAverages["Nurture"]) {
      const { avgOpen, avgClick } = emailAverages["Nurture"];
      if (avgOpen < 35 || avgClick < 1) {
        suggestions.push({
          type: "warning",
          title: "Nurture Email Performance Below Target",
          issue: `Nurture emails: ${avgOpen.toFixed(
            1
          )}% open rate (goal: 35%+), ${avgClick.toFixed(
            1
          )}% click rate (goal: 1%+)`,
          actions: [
            avgOpen < 35 ? "Test more personal, story-based subject lines" : "",
            avgClick < 1
              ? "Include a clear next step or soft CTA in every nurture email"
              : "",
            "Add valuable content that builds trust and engagement",
            "Segment your list and personalize nurture content",
          ].filter(Boolean),
        });
      } else if (avgOpen >= 35 && avgClick >= 1) {
        suggestions.push({
          type: "success",
          title: "Excellent Nurture Email Engagement!",
          issue: `Nurture emails: ${avgOpen.toFixed(
            1
          )}% open rate, ${avgClick.toFixed(1)}% click rate - exceeding goals!`,
          actions: [
            "Continue this nurture sequence for future campaigns",
            "Your audience is highly engaged - consider upselling opportunities",
          ],
        });
      }
    }

    // Reminder Emails (Goal: 25% open, 2% click)
    if (emailAverages["Reminder"]) {
      const { avgOpen, avgClick } = emailAverages["Reminder"];
      if (avgOpen < 25 || avgClick < 2) {
        suggestions.push({
          type: "warning",
          title: "Reminder Email Performance Needs Work",
          issue: `Reminder emails: ${avgOpen.toFixed(
            1
          )}% open rate (goal: 25%+), ${avgClick.toFixed(
            1
          )}% click rate (goal: 2%+)`,
          actions: [
            "Create urgency in subject lines (e.g., 'Starting in 2 hours!')",
            "Send reminders at strategic times (24h, 1h, 15min before event)",
            "Include what they'll miss if they don't attend",
            "Test SMS reminders if you have phone numbers",
          ],
        });
      } else if (avgOpen >= 25 && avgClick >= 2) {
        suggestions.push({
          type: "success",
          title: "Effective Reminder Emails!",
          issue: `Reminder emails: ${avgOpen.toFixed(
            1
          )}% open rate, ${avgClick.toFixed(1)}% click rate - both strong!`,
          actions: [
            "Your reminder strategy is working well",
            "Maintain this same cadence and messaging for future events",
          ],
        });
      }
    }

    // Sales Promo Emails (Goal: 25% open, 1% click)
    if (emailAverages["Sales Promo"]) {
      const { avgOpen, avgClick } = emailAverages["Sales Promo"];
      if (avgOpen < 25 || avgClick < 1) {
        suggestions.push({
          type: "warning",
          title: "Sales Promo Email Performance Low",
          issue: `Sales promo emails: ${avgOpen.toFixed(
            1
          )}% open rate (goal: 25%+), ${avgClick.toFixed(
            1
          )}% click rate (goal: 1%+)`,
          actions: [
            "Highlight the offer benefit in the subject line",
            "Create urgency with deadline-focused messaging",
            "Include social proof and testimonials in the email",
            "Test different discount/bonus offers to increase engagement",
          ],
        });
      } else if (avgOpen >= 25 && avgClick >= 1) {
        suggestions.push({
          type: "success",
          title: "Strong Sales Promo Performance!",
          issue: `Sales promo emails: ${avgOpen.toFixed(
            1
          )}% open rate, ${avgClick.toFixed(1)}% click rate - hitting targets!`,
          actions: [
            "Scale this promo email strategy",
            "Use this as a template for future sales campaigns",
          ],
        });
      }
    }

    return suggestions;
  };

  // Handle opening edit dialog with current suggestions
  const handleEditSuggestions = () => {
    const displaySuggestions =
      savedSuggestions && savedSuggestions.length > 0
        ? savedSuggestions.map((s: any) => ({
            type: s.suggestionType,
            title: s.title,
            issue: s.issue,
            actions: Array.isArray(s.actions) ? s.actions : [],
          }))
        : generateSuggestions();

    if (displaySuggestions.length === 0) {
      toast({
        title: "No suggestions to edit",
        description:
          "Add funnel data to generate optimization suggestions first.",
        variant: "destructive",
      });
      return;
    }

    setEditedSuggestions(displaySuggestions);
    setShowEditSuggestionsDialog(true);
  };

  // Save edited suggestions
  const handleSaveEditedSuggestions = async () => {
    if (!selectedLaunchId || !userId) return;

    try {
      const currentLaunch = launches?.find(
        (l: any) => l.id === selectedLaunchId
      );
      const launchLabel = currentLaunch?.label || "Live Launch";

      await saveOptimizationSuggestionsMutation.mutateAsync({
        liveLaunchId: selectedLaunchId,
        userId,
        suggestions: editedSuggestions,
        launchLabel,
      });

      setShowEditSuggestionsDialog(false);
      toast({
        title: "Suggestions updated successfully!",
        description:
          "Your optimization suggestions have been saved to Live Launch and IGNITE Docs.",
      });
    } catch (error) {
      toast({
        title: "Failed to save suggestions",
        description: "There was an error saving your changes.",
        variant: "destructive",
      });
    }
  };

  // Update a specific suggestion field
  const updateSuggestion = (index: number, field: string, value: any) => {
    setEditedSuggestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update a specific action in a suggestion
  const updateSuggestionAction = (
    suggestionIndex: number,
    actionIndex: number,
    value: string
  ) => {
    setEditedSuggestions((prev) => {
      const updated = [...prev];
      const actions = [...updated[suggestionIndex].actions];
      actions[actionIndex] = value;
      updated[suggestionIndex] = { ...updated[suggestionIndex], actions };
      return updated;
    });
  };

  // Add new action to a suggestion
  const addSuggestionAction = (suggestionIndex: number) => {
    setEditedSuggestions((prev) => {
      const updated = [...prev];
      const actions = [...updated[suggestionIndex].actions, ""];
      updated[suggestionIndex] = { ...updated[suggestionIndex], actions };
      return updated;
    });
  };

  // Remove an action from a suggestion
  const removeSuggestionAction = (
    suggestionIndex: number,
    actionIndex: number
  ) => {
    setEditedSuggestions((prev) => {
      const updated = [...prev];
      const actions = updated[suggestionIndex].actions.filter(
        (_, i) => i !== actionIndex
      );
      updated[suggestionIndex] = { ...updated[suggestionIndex], actions };
      return updated;
    });
  };

  // Remove a suggestion
  const removeSuggestion = (index: number) => {
    setEditedSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Export functions for Optimization Suggestions
  const handleDownloadOptimizationsPDF = async () => {
    const displaySuggestions =
      savedSuggestions && savedSuggestions.length > 0
        ? savedSuggestions.map((s: any) => ({
            type: s.suggestionType,
            title: s.title,
            issue: s.issue,
            actions: Array.isArray(s.actions) ? s.actions : [],
          }))
        : generateSuggestions();

    if (displaySuggestions.length === 0) {
      toast({
        title: "No suggestions to export",
        description:
          "Add funnel data to generate optimization suggestions first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = 20;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("AI Optimization Suggestions", margin, yPosition);
      yPosition += 15;

      displaySuggestions.forEach((suggestion, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        // Suggestion title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        const titleColor =
          suggestion.type === "success"
            ? [34, 197, 94]
            : suggestion.type === "warning"
            ? [234, 179, 8]
            : [239, 68, 68];
        pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
        pdf.text(suggestion.title, margin, yPosition);
        yPosition += 10;

        // Issue description
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const issueLines = pdf.splitTextToSize(suggestion.issue, maxWidth);
        pdf.text(issueLines, margin, yPosition);
        yPosition += issueLines.length * 6 + 5;

        // Actions heading
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          suggestion.type === "success"
            ? "Next Steps:"
            : "Recommended Actions:",
          margin,
          yPosition
        );
        yPosition += 7;

        // Actions list
        pdf.setFont("helvetica", "normal");
        suggestion.actions.forEach((action: string) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          const actionLines = pdf.splitTextToSize(`• ${action}`, maxWidth - 5);
          pdf.text(actionLines, margin + 5, yPosition);
          yPosition += actionLines.length * 5 + 2;
        });

        yPosition += 8;
      });

      pdf.save("Optimization_Suggestions.pdf");
      toast({
        title: "PDF downloaded successfully!",
        description: "Your optimization suggestions have been exported.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Export failed",
        description: "There was an error creating the PDF.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadOptimizationsDOCX = async () => {
    const displaySuggestions =
      savedSuggestions && savedSuggestions.length > 0
        ? savedSuggestions.map((s: any) => ({
            type: s.suggestionType,
            title: s.title,
            issue: s.issue,
            actions: Array.isArray(s.actions) ? s.actions : [],
          }))
        : generateSuggestions();

    if (displaySuggestions.length === 0) {
      toast({
        title: "No suggestions to export",
        description:
          "Add funnel data to generate optimization suggestions first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const docParagraphs: Paragraph[] = [];

      // Title
      docParagraphs.push(
        new Paragraph({
          text: "AI Optimization Suggestions",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 0, after: 300 },
        })
      );

      displaySuggestions.forEach((suggestion, index) => {
        // Suggestion title
        docParagraphs.push(
          new Paragraph({
            text: suggestion.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );

        // Issue description
        docParagraphs.push(
          new Paragraph({
            text: suggestion.issue,
            spacing: { after: 150 },
          })
        );

        // Actions heading
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text:
                  suggestion.type === "success"
                    ? "Next Steps:"
                    : "Recommended Actions:",
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        // Actions list
        suggestion.actions.forEach((action: string) => {
          docParagraphs.push(
            new Paragraph({
              text: action,
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docParagraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Optimization_Suggestions.docx");
      toast({
        title: "DOCX downloaded successfully!",
        description: "Your optimization suggestions have been exported.",
      });
    } catch (error) {
      console.error("Error generating DOCX:", error);
      toast({
        title: "Export failed",
        description: "There was an error creating the DOCX file.",
        variant: "destructive",
      });
    }
  };

  // Bulk entry helper functions
  const generateBulkDates = (startDate: string, days: number): string[] => {
    const dates = [];
    const date = new Date(startDate);
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() + i);
      dates.push(currentDate.toISOString().split("T")[0]);
    }
    return dates;
  };

  // Function to calculate suggested Landing Page Views goal based on Ad Spend Goal and Cost Per LPV
  const getSuggestedLandingPageViews = (
    date: string = selectedDate
  ): string => {
    const adSpendGoal = parseFloat(
      funnelData[0]?.goal.replace(/[^0-9.]/g, "") || "0"
    ); // Ad Spend Goal
    const actualCostPerLPV = funnelData[3]?.values[date] || 0; // Actual Cost Per Landing Page View
    const defaultCostPerLPV = 1.25; // Industry average cost per landing page view

    if (adSpendGoal > 0) {
      // Use actual cost if available, otherwise use default $1.25
      const costPerLPV =
        actualCostPerLPV > 0 ? actualCostPerLPV : defaultCostPerLPV;
      const suggested = Math.round(adSpendGoal / costPerLPV);
      const source =
        actualCostPerLPV > 0 ? "actual cost per view" : "avg $1.25 per view";
      return `~${suggested} (based on ${source})`;
    }
    return "Set goal";
  };

  const initializeBulkData = () => {
    const data: Record<string, Record<string, string>> = {};
    const manualMetrics = funnelData.filter((metric) => metric.isManual);
    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);

    manualMetrics.forEach((metric) => {
      data[metric.step] = {};
      dates.forEach((date) => {
        data[metric.step][date] = metric.values[date]?.toString() || "";
      });
    });

    setBulkData(data);
  };

  const initializeBulkDataOrganic = () => {
    const data: Record<string, Record<string, string>> = {};
    const manualMetrics = organicFunnelData.filter((metric) => metric.isManual);
    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);

    manualMetrics.forEach((metric) => {
      data[metric.step] = {};
      dates.forEach((date) => {
        data[metric.step][date] = metric.values[date]?.toString() || "";
      });
    });

    setBulkData(data);
  };

  const updateBulkValue = (metricName: string, date: string, value: string) => {
    setBulkData((prev) => ({
      ...prev,
      [metricName]: {
        ...prev[metricName],
        [date]: value,
      },
    }));
  };

  const fillRowWithSameValue = (metricName: string, value: string) => {
    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);
    setBulkData((prev) => ({
      ...prev,
      [metricName]: dates.reduce((acc, date) => {
        acc[date] = value;
        return acc;
      }, {} as Record<string, string>),
    }));
  };

  const applyBulkEntries = () => {
    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);

    // Check if we're working with organic data based on the metric names in bulkData
    const isOrganicData = Object.keys(bulkData).some((metricName) =>
      organicFunnelData.some((metric) => metric.step === metricName)
    );

    if (isOrganicData) {
      // Apply to organic funnel data
      const updatedData = [...organicFunnelData];

      Object.entries(bulkData).forEach(([metricName, dateValues]) => {
        const metricIndex = updatedData.findIndex((m) => m.step === metricName);
        if (metricIndex >= 0) {
          Object.entries(dateValues).forEach(([date, value]) => {
            const numericValue = parseFloat(value);
            if (!isNaN(numericValue) && value.trim() !== "") {
              if (
                bulkOverwriteExisting ||
                !updatedData[metricIndex].values[date]
              ) {
                updatedData[metricIndex].values[date] = numericValue;
              }
            }
          });
        }
      });

      // Recalculate auto metrics for all affected dates
      dates.forEach((date) => {
        const autoCalculatedData = calculateOrganicAutoMetrics(
          updatedData,
          date
        );
        autoCalculatedData.forEach((metric, index) => {
          updatedData[index] = metric;
        });
      });

      // Recalculate all-time totals/averages for all metrics
      updatedData.forEach((metric, index) => {
        if (shouldUseTotals(metric.step)) {
          updatedData[index].sevenDayAvg = calculateAllTimeTotal(metric.values);
          updatedData[index].thirtyDayAvg = calculateAllTimeTotal(
            metric.values
          );
        } else {
          updatedData[index].sevenDayAvg = calculateAllTimeAverage(
            metric.values
          );
          updatedData[index].thirtyDayAvg = calculateAllTimeAverage(
            metric.values
          );
        }
      });

      setOrganicFunnelData(updatedData);
    } else {
      // Apply to ads funnel data
      const updatedData = [...funnelData];

      Object.entries(bulkData).forEach(([metricName, dateValues]) => {
        const metricIndex = updatedData.findIndex((m) => m.step === metricName);
        if (metricIndex >= 0) {
          Object.entries(dateValues).forEach(([date, value]) => {
            const numericValue = parseFloat(value);
            if (!isNaN(numericValue) && value.trim() !== "") {
              if (
                bulkOverwriteExisting ||
                !updatedData[metricIndex].values[date]
              ) {
                updatedData[metricIndex].values[date] = numericValue;
              }
            }
          });
        }
      });

      // Recalculate auto metrics for all affected dates
      dates.forEach((date) => {
        const autoCalculatedData = calculateAutoMetrics(updatedData, date);
        autoCalculatedData.forEach((metric, index) => {
          updatedData[index] = metric;
        });
      });

      // Recalculate all-time totals/averages for all metrics
      updatedData.forEach((metric, index) => {
        if (shouldUseTotals(metric.step)) {
          updatedData[index].sevenDayAvg = calculateAllTimeTotal(metric.values);
          updatedData[index].thirtyDayAvg = calculateAllTimeTotal(
            metric.values
          );
        } else {
          updatedData[index].sevenDayAvg = calculateAllTimeAverage(
            metric.values
          );
          updatedData[index].thirtyDayAvg = calculateAllTimeAverage(
            metric.values
          );
        }
      });

      setFunnelData(updatedData);
    }

    setShowHistoryModal(false);

    // Show success message
    const daysUpdated = dates.filter((date) =>
      Object.values(bulkData).some(
        (dateValues) => dateValues[date] && dateValues[date].trim() !== ""
      )
    ).length;

    if (daysUpdated > 0) {
      // You could add a toast here if available
      console.log(`Successfully updated ${daysUpdated} days of data`);
    }
  };

  const navigateDate = (direction: "prev" | "next" | "today") => {
    const currentDate = new Date(selectedDate);
    if (direction === "prev") {
      currentDate.setDate(currentDate.getDate() - 1);
      setSelectedDate(currentDate.toISOString().split("T")[0]);
    } else if (direction === "next") {
      currentDate.setDate(currentDate.getDate() + 1);
      setSelectedDate(currentDate.toISOString().split("T")[0]);
    } else if (direction === "today") {
      setSelectedDate(new Date().toISOString().split("T")[0]);
    }
  };

  // Calculate organic auto metrics
  const calculateOrganicAutoMetrics = (data: MetricData[], date: string) => {
    const newData = [...data];

    // Get values for the specific date
    const landingPageViewsOrganic = newData[0].values[date] || 0; // Landing Page Views - Organic
    const salesPageViews = newData[4].values[date] || 0; // Sales Page Views
    const totalSales = newData[5].values[date] || 0; // Total Sales

    // Get ad spend from the ads tracking data for ROAS calculation
    const adSpend = funnelData[0].values[date] || 0; // Ad Spend from ads tracking
    const offerPrice = parseFloat(offerCost) || 0; // Offer Cost for revenue calculation

    // Get manually entered registrations for further calculations
    // Note: Registrations - Organic is now manual input only
    const registrationsOrganic = newData[1].values[date] || 0;

    // Calculate Landing Page Conversion Rate - Organic (Registrations - Organic / Landing Page Views - Organic) * 100
    if (landingPageViewsOrganic > 0) {
      newData[2].values[date] =
        (registrationsOrganic / landingPageViewsOrganic) * 100;
    } else {
      delete newData[2].values[date];
    }

    // Calculate Sales Page Conversion (Total Sales / Sales Page Views) * 100
    if (salesPageViews > 0) {
      newData[6].values[date] = (totalSales / salesPageViews) * 100;
    } else {
      delete newData[6].values[date];
    }

    // Calculate Total Revenue (Total Sales × Offer Cost) - Allow 0 values
    if (offerPrice > 0 || totalSales >= 0) {
      newData[7].values[date] = totalSales * offerPrice;
    } else {
      delete newData[7].values[date];
    }

    // Calculate Total ROAS from Launch (Total Revenue / Ad Spend) - Allow 0 values
    const totalRevenue =
      newData[7].values[date] !== undefined ? newData[7].values[date] : 0;
    if (adSpend > 0) {
      newData[8].values[date] = totalRevenue / adSpend;
    } else {
      delete newData[8].values[date];
    }

    return newData;
  };

  // Update organic metric value
  const updateOrganicMetricValue = (
    index: number,
    date: string,
    value: string
  ) => {
    const newData = [...organicFunnelData];
    const numValue = parseFloat(value) || 0;

    if (value === "") {
      delete newData[index].values[date];
    } else {
      newData[index].values[date] = numValue;
    }

    // Recalculate auto metrics
    const updatedData = calculateOrganicAutoMetrics(newData, date);

    // Recalculate all-time totals/averages for all metrics
    updatedData.forEach((metric, idx) => {
      if (shouldUseTotals(metric.step)) {
        updatedData[idx].sevenDayAvg = calculateAllTimeTotal(metric.values);
        updatedData[idx].thirtyDayAvg = calculateAllTimeTotal(metric.values);
      } else {
        updatedData[idx].sevenDayAvg = calculateAllTimeAverage(metric.values);
        updatedData[idx].thirtyDayAvg = calculateAllTimeAverage(metric.values);
      }
    });

    setOrganicFunnelData(updatedData);

    // Save to database
    if (selectedLaunchId && userId) {
      saveOrganicMetricMutation.mutate({
        userId,
        liveLaunchId: selectedLaunchId,
        date,
        metricType: organicFunnelData[index].step,
        value: value || "0",
        goal: organicFunnelData[index].goal,
      });
    }
  };

  // Update offer cost and recalculate metrics
  const updateOfferCost = (newCost: string) => {
    setOfferCost(newCost);

    // Recalculate auto metrics for the current date when offer cost changes
    const updatedData = calculateOrganicAutoMetrics(
      organicFunnelData,
      selectedDate
    );
    updatedData.forEach((metric, index) => {
      if (shouldUseTotals(metric.step)) {
        updatedData[index].sevenDayAvg = calculateAllTimeTotal(metric.values);
        updatedData[index].thirtyDayAvg = calculateAllTimeTotal(metric.values);
      } else {
        updatedData[index].sevenDayAvg = calculateAllTimeAverage(metric.values);
        updatedData[index].thirtyDayAvg = calculateAllTimeAverage(
          metric.values
        );
      }
    });
    setOrganicFunnelData(updatedData);

    // Save to database
    if (selectedLaunchId) {
      updateOfferCostMutation.mutate({
        id: selectedLaunchId,
        offerCost: newCost,
      });
    }
  };

  // Update organic metric goal
  const updateOrganicMetricGoal = (index: number, goal: string) => {
    const newData = [...organicFunnelData];
    newData[index].goal = goal;

    // If Landing Page Views goal changes, auto-update Registrations goal
    if (index === 0) {
      // Landing Page Views - Organic
      const landingPageViewsGoal = parseFloat(goal) || 500;
      const autoRegistrationGoal = Math.round(landingPageViewsGoal * 0.35); // 35% conversion
      newData[1].goal = autoRegistrationGoal.toString(); // Update Registrations - Organic goal
    }

    setOrganicFunnelData(newData);
  };

  // Email type options
  const emailTypes = ["Invite", "Nurture", "Reminder", "Sales Promo"];

  // Get email performance status based on type and rates
  const getEmailPerformanceStatus = (
    type: string,
    openRate: number,
    clickRate: number
  ) => {
    let openThreshold = 0;
    let clickThreshold = 0;

    switch (type) {
      case "Invite":
        openThreshold = 25;
        clickThreshold = 2;
        break;
      case "Nurture":
        openThreshold = 35;
        clickThreshold = 1;
        break;
      case "Sales Promo":
        openThreshold = 25;
        clickThreshold = 1;
        break;
      case "Reminder":
        openThreshold = 25;
        clickThreshold = 2;
        break;
      default:
        openThreshold = 25;
        clickThreshold = 2;
    }

    const openMeetsThreshold = openRate >= openThreshold;
    const clickMeetsThreshold = clickRate >= clickThreshold;

    if (openMeetsThreshold && clickMeetsThreshold) {
      return { status: "excellent", reason: "" }; // Green
    } else if (openMeetsThreshold || clickMeetsThreshold) {
      let reason = "";
      if (!openMeetsThreshold && clickMeetsThreshold) {
        reason = `Open rate below ${openThreshold}%`;
      } else if (openMeetsThreshold && !clickMeetsThreshold) {
        reason = `Click rate below ${clickThreshold}%`;
      }
      return { status: "warning", reason }; // Yellow
    } else {
      return {
        status: "danger",
        reason: `Both open rate (${openThreshold}%+) and click rate (${clickThreshold}%+) need improvement`,
      }; // Red
    }
  };

  // Get performance status classes
  const getEmailStatusClasses = (
    status: "excellent" | "warning" | "danger"
  ) => {
    switch (status) {
      case "excellent":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "danger":
        return "bg-red-50 border-red-200";
      default:
        return "bg-white border-slate-200";
    }
  };

  const calculateAutoMetrics = (data: MetricData[], date: string) => {
    const newData = [...data];

    // Get values for the specific date
    const adSpend = newData[0].values[date] || 0; // Ad Spend
    const landingPageViews = newData[2].values[date] || 0; // Landing Page Views
    const registrations = newData[4].values[date] || 0; // Registration - Ads

    // Calculate Cost Per Landing Page View (Ad Spend / Landing Page Views)
    if (landingPageViews > 0) {
      newData[3].values[date] = adSpend / landingPageViews;
    } else {
      delete newData[3].values[date];
    }

    // Calculate Landing Page Conversion Rate - Ads (Registration - Ads / Landing Page Views) * 100 for percentage
    if (landingPageViews > 0) {
      newData[5].values[date] = (registrations / landingPageViews) * 100;
    } else {
      delete newData[5].values[date];
    }

    // Calculate Cost Per Registration (Ad Spend / Registration - Ads)
    if (registrations > 0) {
      newData[6].values[date] = adSpend / registrations;
    } else {
      delete newData[6].values[date];
    }

    return newData;
  };

  const updateMetricValue = (
    metricIndex: number,
    date: string,
    value: string
  ) => {
    const newData = [...funnelData];
    if (value === "") {
      delete newData[metricIndex].values[date];
    } else {
      newData[metricIndex].values[date] = parseFloat(value) || 0;
    }

    // Calculate auto-metrics for this date
    const updatedData = calculateAutoMetrics(newData, date);

    // Recalculate all-time totals/averages for all metrics
    updatedData.forEach((metric, index) => {
      if (shouldUseTotals(metric.step)) {
        updatedData[index].sevenDayAvg = calculateAllTimeTotal(metric.values);
        updatedData[index].thirtyDayAvg = calculateAllTimeTotal(metric.values);
      } else {
        updatedData[index].sevenDayAvg = calculateAllTimeAverage(metric.values);
        updatedData[index].thirtyDayAvg = calculateAllTimeAverage(
          metric.values
        );
      }
    });

    setFunnelData(updatedData);

    // Save to database
    if (selectedLaunchId && userId) {
      saveFunnelMetricMutation.mutate({
        userId,
        liveLaunchId: selectedLaunchId,
        date,
        metricType: funnelData[metricIndex].step,
        value: value || "0",
        goal: funnelData[metricIndex].goal,
      });
    }
  };

  const updateMetricGoal = (metricIndex: number, goal: string) => {
    const newData = [...funnelData];
    newData[metricIndex].goal = goal;

    // Auto-update Registration - Ads goal when Landing Page Views goal changes
    if (newData[metricIndex].step === "Landing Page Views") {
      const landingPageViewsGoal = parseFloat(goal) || 0;
      const conversionRateGoal = 0.35; // 35% default conversion rate from Landing Page Conversion Rate - Ads goal

      if (landingPageViewsGoal > 0) {
        const registrationsGoal = Math.round(
          landingPageViewsGoal * conversionRateGoal
        );
        const registrationsIndex = newData.findIndex(
          (m) => m.step === "Registration - Ads"
        );
        if (registrationsIndex >= 0) {
          newData[registrationsIndex].goal = registrationsGoal.toString();
        }
      }
    }

    setFunnelData(newData);
  };

  const formatMetricValue = (
    metric: MetricData,
    value: number | undefined
  ): string => {
    // If value is undefined or NaN, show "—"
    if (value === undefined || isNaN(value)) return "—";

    // Format the value according to its type (even if it's 0)
    if (isCurrencyMetric(metric.step)) {
      return formatCurrency(value);
    } else if (isPercentageMetric(metric.step)) {
      return formatPercentage(value);
    } else if (
      metric.step === "ROAs" ||
      metric.step === "Total ROAS from Launch"
    ) {
      return `${value.toFixed(1)}x`;
    } else if (value === 0) {
      // For manual input fields, 0 should show as "—"
      // But this won't be reached for auto-calculated fields since they format above
      return "—";
    } else {
      return Math.round(value).toString();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Track & Execute
            </h1>
            <p className="text-slate-600 mt-2">
              Track performance and execute optimization strategies during your
              live launch
            </p>
          </div>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
            Active
          </Badge>
        </div>
      </div>

      {/* Launch Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium text-slate-700 whitespace-nowrap">
              Active Launch:
            </Label>
            <Select
              value={selectedLaunchId?.toString() || ""}
              onValueChange={(value) => setSelectedLaunchId(parseInt(value))}
              disabled={launchesLoading || launches.length === 0}
            >
              <SelectTrigger className="w-[300px]" data-testid="select-launch">
                <SelectValue placeholder="Select a launch..." />
              </SelectTrigger>
              <SelectContent>
                {launches.map((launch: any) => (
                  <SelectItem key={launch.id} value={launch.id.toString()}>
                    {launch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCreateLaunchModal(true)}
              variant="outline"
              size="sm"
              data-testid="button-create-launch"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Launch
            </Button>
            {selectedLaunchId && (
              <Button
                onClick={() => handleDeleteLaunch(selectedLaunchId)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid="button-delete-launch"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Launch
              </Button>
            )}
          </div>
          {launches.length === 0 && !launchesLoading && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Create your first launch to start tracking your live launch
                metrics.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Launch Modal */}
      <Dialog
        open={showCreateLaunchModal}
        onOpenChange={(open) => {
          setShowCreateLaunchModal(open);
          if (!open) setNewLaunchLabel(""); // Clear input when closing
        }}
      >
        <DialogContent data-testid="dialog-create-launch">
          <DialogHeader>
            <DialogTitle>
              {launches.length === 0
                ? "Create Your First Launch"
                : "Create New Launch"}
            </DialogTitle>
            <DialogDescription>
              {launches.length === 0
                ? "To start tracking your live launch metrics, give this launch a name. Each launch will have its own independent data and tracking."
                : "Give your launch a name to track its performance separately from other launches."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="launch-label">Launch Name</Label>
              <Input
                id="launch-label"
                placeholder="e.g., Spring 2025 Launch, Q1 Webinar"
                value={newLaunchLabel}
                onChange={(e) => setNewLaunchLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !createLaunchMutation.isPending) {
                    handleCreateLaunch();
                  }
                }}
                data-testid="input-launch-label"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateLaunchModal(false);
                setNewLaunchLabel("");
              }}
              disabled={createLaunchMutation.isPending}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLaunch}
              disabled={
                createLaunchMutation.isPending || !newLaunchLabel.trim()
              }
              data-testid="button-submit-create"
            >
              {createLaunchMutation.isPending ? "Creating..." : "Create Launch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Launch Confirmation Modal */}
      <Dialog
        open={showDeleteLaunchModal}
        onOpenChange={setShowDeleteLaunchModal}
      >
        <DialogContent data-testid="dialog-delete-launch">
          <DialogHeader>
            <DialogTitle>Delete Launch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this launch? This will permanently
              delete all tracking data, metrics, and history associated with
              this launch. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteLaunchModal(false);
                setLaunchToDelete(null);
              }}
              disabled={deleteLaunchMutation.isPending}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteLaunch}
              disabled={deleteLaunchMutation.isPending}
              variant="destructive"
              data-testid="button-confirm-delete"
            >
              {deleteLaunchMutation.isPending ? "Deleting..." : "Delete Launch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training Videos</TabsTrigger>
          <TabsTrigger value="tracker">Live Launch Tracking</TabsTrigger>
          <TabsTrigger value="analysis">Analysis & Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                  <p>
                    Once your live launch ads are running and registrants are
                    coming in, it's time to track and optimize. Live launches
                    move fast, and the goal here is to make sure you're filling
                    your event with quality leads, maximizing show-up rates, and
                    creating the momentum that drives sales of your core offer.
                  </p>
                  <p>
                    In this phase, you'll monitor registration numbers, ad
                    performance, and funnel data. You'll also track engagement
                    during your live launch delivery (attendance, participation,
                    replay views) and use that information to make small,
                    data-driven tweaks that improve your results throughout the
                    launch.
                  </p>
                  <p>
                    We will use this data both during your live launch but also
                    for future live launches.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Time */}
            <Card>
              <CardHeader>
                <CardTitle>⏱ Estimated Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-slate-700 leading-relaxed">
                  <p>
                    <strong>Ongoing</strong> (during the 2–3 weeks around your
                    live launch) Expect to check in daily on ad results,
                    registrations, and engagement so you can make timely
                    optimizations and maximize conversions while your event is
                    live.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* To-Do List */}
            <Card>
              <CardHeader>
                <CardTitle>✅ To-Do List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Monitor ad performance and track registrations coming into your launch.",
                    "Make optimizations to your ads based on performance. Balancing not changing too much and making changes quickly if a specific ad is not performing well.",
                    "Make small funnel tweaks if any metrics are not converting.",
                    "Continue to track sales conversions daily once your offer is live.",
                    "Reach out and engage with participants during the launch to deepen relationships. This is especially important in your open cart window.",
                    "Track your data all the way through the funnel to leverage for future live launches.",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Success Tips */}
            <Card>
              <CardHeader>
                <CardTitle>🌟 Success Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Watch both sides",
                      tip: "Track not just registrations, but also how many people actually show up and engage in your live delivery.",
                    },
                    {
                      title: "Engagement matters",
                      tip: "The more interaction you drive during your launch, the higher your sales conversion will be.",
                    },
                    {
                      title: "React quickly",
                      tip: "Small, timely tweaks (like boosting a winning ad or sending an extra reminder email) can create a big lift during a live launch window.",
                    },
                    {
                      title: "Measure the right metrics",
                      tip: "Look at cost per registrant, attendance rate, and conversion rate into your core offer.",
                    },
                    {
                      title: "Stay connected to your leads",
                      tip: "Conversations during your launch can lead to additional sales and give you insights for your next one.",
                    },
                    {
                      title: "Leverage support",
                      tip: "Use coaching calls and team resources to decide what optimizations will have the biggest impact in real time.",
                    },
                  ].map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-slate-900">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-slate-700 ml-6">{item.tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Launch Tracking Tab */}
        <TabsContent value="tracker" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <CardTitle>Live Launch Tracking</CardTitle>
              </div>
              <p className="text-slate-600">
                Track your live launch funnel from beginning to end. Optimize
                during your live launch and use this data to drive future
                launches!
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ads" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ads">
                    Live Launch Ads Tracking
                  </TabsTrigger>
                  <TabsTrigger value="organic">
                    Live Launch Organic & Funnel Tracking
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ads" className="space-y-6">
                  {/* Date Navigator and Controls */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            Daily Funnel Metrics
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Tracking Table */}
                      <div className="overflow-x-auto">
                        <div className="min-w-full">
                          {/* Date Navigation */}
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateDate("prev")}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) =>
                                  setSelectedDate(e.target.value)
                                }
                                className="w-auto"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateDate("next")}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateDate("today")}
                              >
                                Today
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                initializeBulkData();
                                setShowHistoryModal(true);
                              }}
                            >
                              <History className="w-4 h-4 mr-2" />
                              Add Bulk Data
                            </Button>
                          </div>
                          {/* Table Header */}
                          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-t-lg border border-slate-200 font-semibold text-slate-700">
                            <div>Funnel Step</div>
                            <div>Goal</div>
                            <div>
                              Value (
                              {new Date(selectedDate).toLocaleDateString()})
                            </div>
                            <div>Total Data</div>
                          </div>

                          {/* Table Rows */}
                          <div className="border border-t-0 border-slate-200 rounded-b-lg">
                            {funnelData.map((step, index) => {
                              const currentValue =
                                step.values[selectedDate] || 0;
                              const performanceStatus = getPerformanceStatus(
                                step.step,
                                currentValue,
                                step.goal
                              );
                              const statusClasses =
                                getStatusClasses(performanceStatus);
                              const statusIcon =
                                getStatusIcon(performanceStatus);
                              const isSpecialGoalMetric =
                                step.step === "Landing Page Views";

                              return (
                                <div
                                  key={index}
                                  className={`grid grid-cols-4 gap-4 p-4 border-b border-slate-100 last:border-b-0 transition-colors ${statusClasses}`}
                                >
                                  {/* Funnel Step Name */}
                                  <div className="font-medium flex items-center gap-2">
                                    {step.isManual ? (
                                      <Edit3 className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Calculator className="w-4 h-4 text-slate-500" />
                                    )}
                                    <span
                                      className={
                                        step.isManual
                                          ? "text-blue-900 font-medium"
                                          : "text-slate-700"
                                      }
                                    >
                                      {step.step}
                                    </span>
                                    <div className="ml-auto">{statusIcon}</div>
                                  </div>

                                  {/* Goal Input */}
                                  <div>
                                    <Input
                                      type="text"
                                      placeholder={
                                        step.step === "Landing Page Views"
                                          ? getSuggestedLandingPageViews(
                                              selectedDate
                                            )
                                          : step.step === "Ad Spend"
                                          ? "$0 (e.g. $500)"
                                          : "Set goal"
                                      }
                                      value={step.goal}
                                      onChange={(e) =>
                                        updateMetricGoal(index, e.target.value)
                                      }
                                      className={`w-full text-sm ${
                                        hasIndustryStandardGoal(step.step)
                                          ? "bg-green-50 border-green-200 text-green-700 focus:border-green-500 font-medium"
                                          : step.step ===
                                              "Landing Page Views" &&
                                            !step.goal &&
                                            getSuggestedLandingPageViews(
                                              selectedDate
                                            ) !== "Set goal"
                                          ? "bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500"
                                          : "border-slate-200 focus:border-blue-500"
                                      }`}
                                    />
                                    {step.step === "Landing Page Views" &&
                                      !step.goal &&
                                      getSuggestedLandingPageViews(
                                        selectedDate
                                      ) !== "Set goal" && (
                                        <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                          <Calculator className="w-3 h-3" />
                                          Auto-calculated from ad spend ÷ cost
                                          per view
                                        </div>
                                      )}
                                  </div>

                                  {/* Selected Date Value */}
                                  <div>
                                    {step.isManual ? (
                                      <Input
                                        type="number"
                                        placeholder={
                                          isCurrencyMetric(step.step)
                                            ? "$0.00"
                                            : isPercentageMetric(step.step)
                                            ? "0.00%"
                                            : "0"
                                        }
                                        value={step.values[selectedDate] || ""}
                                        onChange={(e) =>
                                          updateMetricValue(
                                            index,
                                            selectedDate,
                                            e.target.value
                                          )
                                        }
                                        className="w-full text-sm border-blue-200 focus:border-blue-500"
                                      />
                                    ) : (
                                      <div className="w-full text-sm p-2 bg-slate-100 rounded border text-slate-600 flex items-center justify-center">
                                        <Calculator className="w-4 h-4 mr-1" />
                                        <span>
                                          {formatMetricValue(
                                            step,
                                            step.values[selectedDate]
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Total Data (using all-time totals) */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">
                                      {formatMetricValue(
                                        step,
                                        step.sevenDayAvg
                                      )}
                                    </span>
                                    {step.sevenDayAvg > 0 && step.goal && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="text-sm whitespace-pre-line">
                                              {getPerformanceExplanation(
                                                step.step,
                                                step.sevenDayAvg,
                                                step.goal
                                              )}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Optimization Suggestions Section */}
                  <div className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        className="gap-2 bg-embodied-coral hover:bg-embodied-orange text-white"
                        onClick={handleEditSuggestions}
                        data-testid="button-edit-suggestions"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="gap-2 bg-embodied-coral hover:bg-embodied-orange text-white"
                          >
                            <Download className="w-4 h-4" />
                            Export Document
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={handleDownloadOptimizationsPDF}
                            className="hover:bg-slate-100 focus:bg-slate-100"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleDownloadOptimizationsDOCX}
                            className="hover:bg-slate-100 focus:bg-slate-100"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download as DOCX
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          Optimization Suggestions
                        </CardTitle>
                        <CardDescription>
                          AI-powered insights based on your current ads funnel
                          performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(() => {
                            // Use saved suggestions from DB if available, otherwise generate fresh ones
                            const displaySuggestions =
                              savedSuggestions && savedSuggestions.length > 0
                                ? savedSuggestions.map((s: any) => ({
                                    type: s.suggestionType,
                                    title: s.title,
                                    issue: s.issue,
                                    actions: Array.isArray(s.actions)
                                      ? s.actions
                                      : [],
                                  }))
                                : generateSuggestions();

                            return displaySuggestions.length > 0 ? (
                              displaySuggestions.map((suggestion, index) => (
                                <Alert
                                  key={index}
                                  className={
                                    suggestion.type === "success"
                                      ? "border-green-200 bg-green-50"
                                      : suggestion.type === "warning"
                                      ? "border-yellow-200 bg-yellow-50"
                                      : "border-red-200 bg-red-50"
                                  }
                                >
                                  <AlertTriangle
                                    className={`w-4 h-4 ${
                                      suggestion.type === "success"
                                        ? "text-green-600"
                                        : suggestion.type === "warning"
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  />
                                  <div className="ml-4">
                                    <h4
                                      className={`font-semibold mb-2 ${
                                        suggestion.type === "success"
                                          ? "text-green-800"
                                          : suggestion.type === "warning"
                                          ? "text-yellow-800"
                                          : "text-red-800"
                                      }`}
                                    >
                                      {suggestion.title}
                                    </h4>
                                    <p
                                      className={`text-sm mb-3 ${
                                        suggestion.type === "success"
                                          ? "text-green-700"
                                          : suggestion.type === "warning"
                                          ? "text-yellow-700"
                                          : "text-red-700"
                                      }`}
                                    >
                                      {suggestion.issue}
                                    </p>
                                    <div className="space-y-1">
                                      <p
                                        className={`text-xs font-medium ${
                                          suggestion.type === "success"
                                            ? "text-green-800"
                                            : suggestion.type === "warning"
                                            ? "text-yellow-800"
                                            : "text-red-800"
                                        }`}
                                      >
                                        {suggestion.type === "success"
                                          ? "Next Steps:"
                                          : "Recommended Actions:"}
                                      </p>
                                      <ul className="list-disc list-inside space-y-1">
                                        {suggestion.actions.map(
                                          (action, actionIndex) => (
                                            <li
                                              key={actionIndex}
                                              className={`text-xs ${
                                                suggestion.type === "success"
                                                  ? "text-green-700"
                                                  : suggestion.type ===
                                                    "warning"
                                                  ? "text-yellow-700"
                                                  : "text-red-700"
                                              }`}
                                            >
                                              {action}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </Alert>
                              ))
                            ) : (
                              <div className="text-center py-8 text-slate-500">
                                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                                <p className="text-slate-600 font-medium mb-2">
                                  No optimization suggestions yet
                                </p>
                                <p className="text-sm text-slate-500">
                                  Add some funnel data to get personalized
                                  optimization recommendations based on your
                                  performance metrics.
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="organic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Live Launch Organic & Funnel Tracking
                      </CardTitle>
                      <CardDescription>
                        Track organic traffic, email performance, and overall
                        funnel metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Organic Funnel Metrics */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            Organic Funnel & Sales Metrics
                          </h3>

                          {/* Offer Cost Input */}
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-blue-900">
                                  Offer Cost:
                                </span>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    placeholder="497.00"
                                    value={offerCost}
                                    onChange={(e) =>
                                      updateOfferCost(e.target.value)
                                    }
                                    className="pl-8 w-32 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="text-sm text-blue-700">
                                This will be used to calculate Total Revenue
                                (Total Sales × Offer Cost)
                              </div>
                            </div>
                          </div>

                          {/* Tracking Table */}
                          <div className="overflow-x-auto">
                            <div className="min-w-full">
                              {/* Date Navigation */}
                              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateDate("prev")}
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </Button>
                                  <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                      setSelectedDate(e.target.value)
                                    }
                                    className="w-auto"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateDate("next")}
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateDate("today")}
                                  >
                                    Today
                                  </Button>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    initializeBulkDataOrganic();
                                    setShowHistoryModal(true);
                                  }}
                                >
                                  <History className="w-4 h-4 mr-2" />
                                  Add Bulk Data
                                </Button>
                              </div>

                              {/* Table Header */}
                              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-t-lg border border-slate-200 font-semibold text-slate-700">
                                <div>Funnel Step</div>
                                <div>Goal</div>
                                <div>
                                  Value (
                                  {new Date(selectedDate).toLocaleDateString()})
                                </div>
                                <div>Total Data</div>
                              </div>

                              {/* Table Rows */}
                              <div className="border border-t-0 border-slate-200 rounded-b-lg">
                                {organicFunnelData.map((step, index) => {
                                  const currentValue =
                                    step.values[selectedDate] || 0;
                                  const performanceStatus =
                                    getPerformanceStatus(
                                      step.step,
                                      currentValue,
                                      step.goal
                                    );
                                  const statusClasses =
                                    getStatusClasses(performanceStatus);
                                  const statusIcon =
                                    getStatusIcon(performanceStatus);

                                  return (
                                    <div
                                      key={index}
                                      className={`grid grid-cols-4 gap-4 p-4 border-b border-slate-100 last:border-b-0 transition-colors ${statusClasses}`}
                                    >
                                      {/* Funnel Step Name */}
                                      <div className="font-medium flex items-center gap-2">
                                        {step.isManual ? (
                                          <Edit3 className="w-4 h-4 text-blue-600" />
                                        ) : (
                                          <Calculator className="w-4 h-4 text-slate-500" />
                                        )}
                                        <span
                                          className={
                                            step.isManual
                                              ? "text-blue-900 font-medium"
                                              : "text-slate-700"
                                          }
                                        >
                                          {step.step}
                                        </span>
                                        {index === 0 && ( // Show tooltip for "Landing Page Views - Organic" (index 0)
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-sm">
                                                <p className="text-sm">
                                                  We defaulted to 500 views but
                                                  this can be adjusted if you
                                                  feel you'll get more or less
                                                  views. You can also adjust
                                                  this number for future live
                                                  launches based on data.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        {index === 1 && ( // Show tooltip only for "Registrations - Organic" (index 1)
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-xs">
                                                <p className="text-sm">
                                                  Enter the actual number of
                                                  confirmed leads/registrations
                                                  you received. This should be
                                                  your real tracked data, not an
                                                  estimate.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        <div className="ml-auto">
                                          {statusIcon}
                                        </div>
                                      </div>

                                      {/* Goal Input */}
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="text"
                                          placeholder="Set goal"
                                          value={step.goal}
                                          onChange={(e) =>
                                            updateOrganicMetricGoal(
                                              index,
                                              e.target.value
                                            )
                                          }
                                          className={`w-full text-sm ${
                                            hasIndustryStandardGoal(step.step)
                                              ? "bg-green-50 border-green-200 text-green-700 focus:border-green-500 font-medium"
                                              : index === 1 // Registrations - Organic auto-calculated goal
                                              ? "bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500 font-medium"
                                              : "border-slate-200 focus:border-blue-500"
                                          }`}
                                          readOnly={index === 1} // Make Registrations - Organic goal read-only since it's auto-calculated
                                        />
                                        {index === 1 && ( // Show tooltip only for "Registrations - Organic" goal (index 1)
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="w-3 h-3 text-blue-400 hover:text-blue-600 cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-xs">
                                                <p className="text-sm">
                                                  Auto-calculated as 35% of
                                                  Landing Page Views goal (
                                                  {parseFloat(
                                                    organicFunnelData[0].goal
                                                  ) || 500}{" "}
                                                  × 0.35 = {step.goal}). This
                                                  gives you a realistic
                                                  registration target based on
                                                  industry conversion rates.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>

                                      {/* Selected Date Value */}
                                      <div>
                                        {step.isManual ? (
                                          <Input
                                            type="number"
                                            placeholder={
                                              isCurrencyMetric(step.step)
                                                ? "$0.00"
                                                : isPercentageMetric(step.step)
                                                ? "0.00%"
                                                : "0"
                                            }
                                            value={
                                              step.values[selectedDate] || ""
                                            }
                                            onChange={(e) =>
                                              updateOrganicMetricValue(
                                                index,
                                                selectedDate,
                                                e.target.value
                                              )
                                            }
                                            className="w-full text-sm border-blue-200 focus:border-blue-500"
                                          />
                                        ) : (
                                          <div className="w-full text-sm p-2 bg-slate-100 rounded border text-slate-600 flex items-center justify-center">
                                            <Calculator className="w-4 h-4 mr-1" />
                                            <span>
                                              {formatMetricValue(
                                                step,
                                                step.values[selectedDate]
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Total Data (using all-time totals) */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium">
                                          {formatMetricValue(
                                            step,
                                            step.sevenDayAvg
                                          )}
                                        </span>
                                        {step.sevenDayAvg > 0 && step.goal && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-xs">
                                                <p className="text-sm whitespace-pre-line">
                                                  {getPerformanceExplanation(
                                                    step.step,
                                                    step.sevenDayAvg,
                                                    step.goal
                                                  )}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Email Stats Section */}
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-purple-600" />
                            Email Performance
                          </h3>

                          {/* Add Email Form */}
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-slate-700">
                                  Email Type
                                </Label>
                                <Select
                                  value={newEmailForm.type}
                                  onValueChange={(value) =>
                                    setNewEmailForm((prev) => ({
                                      ...prev,
                                      type: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {emailTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-2">
                                <Label className="text-sm font-medium text-slate-700">
                                  Email Subject
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="Enter email subject..."
                                  value={newEmailForm.subject}
                                  onChange={(e) =>
                                    setNewEmailForm((prev) => ({
                                      ...prev,
                                      subject: e.target.value,
                                    }))
                                  }
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-slate-700">
                                  Open Rate (%)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={newEmailForm.openRate}
                                  onChange={(e) =>
                                    setNewEmailForm((prev) => ({
                                      ...prev,
                                      openRate: e.target.value,
                                    }))
                                  }
                                  className="mt-1"
                                />
                              </div>

                              <div className="flex flex-col">
                                <Label className="text-sm font-medium text-slate-700">
                                  Click Rate (%)
                                </Label>
                                <div className="flex gap-2 mt-1">
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={newEmailForm.clickRate}
                                    onChange={(e) =>
                                      setNewEmailForm((prev) => ({
                                        ...prev,
                                        clickRate: e.target.value,
                                      }))
                                    }
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={saveNewEmail}
                                    size="sm"
                                    disabled={!newEmailForm.subject.trim()}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Email List - Grouped by Category */}
                          <div className="space-y-6">
                            {(() => {
                              const emails = emailsForDate || [];
                              if (emails.length === 0) {
                                return (
                                  <div className="text-center py-8 text-slate-500">
                                    <Mail className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                    <p className="text-sm">
                                      No emails tracked yet. Use the form above
                                      to add your first email.
                                    </p>
                                  </div>
                                );
                              }

                              // Group emails by type
                              const groupedEmails = emails.reduce(
                                (
                                  groups: Record<string, typeof emails>,
                                  email: any
                                ) => {
                                  if (!groups[email.type]) {
                                    groups[email.type] = [];
                                  }
                                  groups[email.type].push(email);
                                  return groups;
                                },
                                {} as Record<string, typeof emails>
                              );

                              // Define order for email types
                              const typeOrder = [
                                "Invite",
                                "Nurture",
                                "Reminder",
                                "Sales Promo",
                              ];

                              return typeOrder
                                .map((type) => {
                                  const typeEmails = groupedEmails[type];
                                  if (!typeEmails || typeEmails.length === 0)
                                    return null;

                                  return (
                                    <div key={type} className="space-y-3">
                                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <h4 className="font-semibold text-slate-800">
                                          {type} Emails
                                        </h4>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {typeEmails.length} email
                                          {typeEmails.length !== 1 ? "s" : ""}
                                        </Badge>
                                      </div>

                                      <div className="space-y-2">
                                        {typeEmails.map((email: any) => {
                                          const performanceResult =
                                            getEmailPerformanceStatus(
                                              email.type,
                                              email.openRate,
                                              email.clickRate
                                            );
                                          const statusClasses =
                                            getEmailStatusClasses(
                                              performanceResult.status as
                                                | "excellent"
                                                | "warning"
                                                | "danger"
                                            );

                                          return (
                                            <div
                                              key={email.id}
                                              className={`rounded-lg p-4 border shadow-sm ${statusClasses}`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-medium text-slate-900">
                                                      {email.subject}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                      (
                                                      {new Date(
                                                        email.date
                                                      ).toLocaleDateString()}
                                                      )
                                                    </span>
                                                    {performanceResult.status ===
                                                      "excellent" && (
                                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                                        High Performance
                                                      </Badge>
                                                    )}
                                                    {performanceResult.status ===
                                                      "warning" && (
                                                      <div className="flex flex-col items-start gap-1">
                                                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                          Moderate Performance
                                                        </Badge>
                                                        {performanceResult.reason && (
                                                          <span className="text-xs text-yellow-700 italic">
                                                            {
                                                              performanceResult.reason
                                                            }
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                    {performanceResult.status ===
                                                      "danger" && (
                                                      <div className="flex flex-col items-start gap-1">
                                                        <Badge className="bg-red-100 text-red-800 text-xs">
                                                          Low Performance
                                                        </Badge>
                                                        {performanceResult.reason && (
                                                          <span className="text-xs text-red-700 italic">
                                                            {
                                                              performanceResult.reason
                                                            }
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-6 text-sm text-slate-600">
                                                    <span>
                                                      <span className="font-medium">
                                                        Open Rate:
                                                      </span>{" "}
                                                      {email.openRate}%
                                                    </span>
                                                    <span>
                                                      <span className="font-medium">
                                                        Click Rate:
                                                      </span>{" "}
                                                      {email.clickRate}%
                                                    </span>
                                                  </div>
                                                </div>
                                                <Button
                                                  onClick={() =>
                                                    removeEmail(
                                                      selectedDate,
                                                      email.id
                                                    )
                                                  }
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                                .filter(Boolean);
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis & Insights Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              className="gap-2 bg-embodied-coral hover:bg-embodied-orange text-white"
              onClick={handleEditSuggestions}
              data-testid="button-edit-analysis-suggestions"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2 bg-embodied-coral hover:bg-embodied-orange text-white"
                >
                  <Download className="w-4 h-4" />
                  Export Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDownloadOptimizationsPDF}
                  className="hover:bg-slate-100 focus:bg-slate-100"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadOptimizationsDOCX}
                  className="hover:bg-slate-100 focus:bg-slate-100"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download as DOCX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <CardTitle>
                  Performance Analysis & Optimization Suggestions
                </CardTitle>
              </div>
              <CardDescription>
                AI-powered insights analyzing your complete live launch
                performance (ads + organic funnels, registrations, and sales
                conversion)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  // Use saved suggestions from DB if available, otherwise generate fresh ones
                  const displaySuggestions =
                    savedSuggestions && savedSuggestions.length > 0
                      ? savedSuggestions.map((s: any) => ({
                          type: s.suggestionType,
                          title: s.title,
                          issue: s.issue,
                          actions: Array.isArray(s.actions) ? s.actions : [],
                        }))
                      : generateSuggestions();

                  return displaySuggestions.length > 0 ? (
                    displaySuggestions.map((suggestion: any, index: number) => (
                      <Alert
                        key={index}
                        className={
                          suggestion.type === "success"
                            ? "border-green-200 bg-green-50"
                            : suggestion.type === "warning"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-red-200 bg-red-50"
                        }
                      >
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            suggestion.type === "success"
                              ? "text-green-600"
                              : suggestion.type === "warning"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        />
                        <AlertDescription className="ml-2">
                          <div className="space-y-2">
                            <div>
                              <span
                                className={`font-semibold ${
                                  suggestion.type === "success"
                                    ? "text-green-800"
                                    : suggestion.type === "warning"
                                    ? "text-yellow-800"
                                    : "text-red-800"
                                }`}
                              >
                                {suggestion.title}
                              </span>
                              <p
                                className={`text-sm mt-1 ${
                                  suggestion.type === "success"
                                    ? "text-green-700"
                                    : suggestion.type === "warning"
                                    ? "text-yellow-700"
                                    : "text-red-700"
                                }`}
                              >
                                {suggestion.issue}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p
                                className={`text-sm font-medium ${
                                  suggestion.type === "success"
                                    ? "text-green-800"
                                    : suggestion.type === "warning"
                                    ? "text-yellow-800"
                                    : "text-red-800"
                                }`}
                              >
                                {suggestion.type === "success"
                                  ? "Keep doing:"
                                  : "Action items:"}
                              </p>
                              <ul className="space-y-1 ml-4">
                                {suggestion.actions.map(
                                  (action: string, actionIndex: number) => (
                                    <li
                                      key={actionIndex}
                                      className={`text-sm list-disc ${
                                        suggestion.type === "success"
                                          ? "text-green-700"
                                          : suggestion.type === "warning"
                                          ? "text-yellow-700"
                                          : "text-red-700"
                                      }`}
                                    >
                                      {action}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>
                        Enter some funnel data to get personalized optimization
                        suggestions
                      </p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Videos Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-red-600" />
                <CardTitle>Training Videos</CardTitle>
              </div>
              <p className="text-slate-600">
                Comprehensive training for your Live Launch success
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tracking" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tracking">
                    Tracking Your Live Launch
                  </TabsTrigger>
                  <TabsTrigger value="ads">
                    Optimizing Your Live Launch Ads
                  </TabsTrigger>
                  <TabsTrigger value="funnel">
                    Optimizing Your Live Launch Funnel
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tracking" className="space-y-4">
                  <Card className="border-slate-200">
                    <CardContent className="pt-6">
                      <VimeoEmbed
                        vimeoId="1125299814/fa80f740e4"
                        title="Tracking Your Live Launch"
                        userId={userId}
                        stepNumber={0}
                      />
                      <h3 className="font-semibold text-slate-900 mb-2 mt-4">
                        Setting Up Live Launch Tracking
                      </h3>
                      <p className="text-sm text-slate-600">
                        Learn how to properly track your Live Launch metrics
                        from ads to registrations for maximum visibility and
                        optimization opportunities.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ads" className="space-y-4">
                  <Card className="border-slate-200">
                    <CardContent className="pt-6">
                      <VimeoEmbed
                        vimeoId="1125176583/37b63f7549"
                        title="Optimizing Your Live Launch Ads"
                        userId={userId}
                        stepNumber={0}
                      />
                      <h3 className="font-semibold text-slate-900 mb-2 mt-4">
                        Live Launch Ad Optimization
                      </h3>
                      <p className="text-sm text-slate-600">
                        Discover proven strategies to improve your ad
                        performance, reduce costs, and maximize registrations
                        for your Live Launch.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="funnel" className="space-y-4">
                  <Card className="border-slate-200">
                    <CardContent className="pt-6">
                      <VimeoEmbed
                        vimeoId="1125887381/272b934da7"
                        title="Optimizing Your Live Launch Funnel"
                        userId={userId}
                        stepNumber={0}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Entry Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Data Entry</DialogTitle>
            <DialogDescription>
              Enter multiple days of data at once. Only manual metrics can be
              bulk entered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bulk Entry Controls */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-start-date">Start Date:</Label>
                <Input
                  id="bulk-start-date"
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-days">Days:</Label>
                <Input
                  id="bulk-days"
                  type="number"
                  min="1"
                  max="30"
                  value={bulkDaysCount}
                  onChange={(e) =>
                    setBulkDaysCount(parseInt(e.target.value) || 1)
                  }
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="overwrite-existing"
                  checked={bulkOverwriteExisting}
                  onCheckedChange={(checked) =>
                    setBulkOverwriteExisting(checked as boolean)
                  }
                />
                <Label htmlFor="overwrite-existing" className="text-sm">
                  Overwrite existing data
                </Label>
              </div>
              <Button onClick={initializeBulkData} variant="outline" size="sm">
                Load Data
              </Button>
            </div>

            {/* Bulk Entry Table */}
            {Object.keys(bulkData).length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 p-2 text-left font-semibold">
                        Metric
                      </th>
                      {generateBulkDates(bulkStartDate, bulkDaysCount).map(
                        (date) => (
                          <th
                            key={date}
                            className="border border-slate-300 p-2 text-center font-semibold text-sm"
                          >
                            {new Date(date).toLocaleDateString()}
                          </th>
                        )
                      )}
                      <th className="border border-slate-300 p-2 text-center font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bulkData).map(
                      ([metricName, dateValues]) => (
                        <tr key={metricName} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-2 font-medium text-sm">
                            {metricName}
                          </td>
                          {generateBulkDates(bulkStartDate, bulkDaysCount).map(
                            (date) => (
                              <td
                                key={date}
                                className="border border-slate-300 p-1"
                              >
                                <Input
                                  type="number"
                                  step={
                                    isCurrencyMetric(metricName)
                                      ? "0.01"
                                      : isPercentageMetric(metricName)
                                      ? "0.01"
                                      : "1"
                                  }
                                  value={dateValues[date] || ""}
                                  onChange={(e) =>
                                    updateBulkValue(
                                      metricName,
                                      date,
                                      e.target.value
                                    )
                                  }
                                  className="w-full text-center text-sm"
                                  placeholder="0"
                                />
                              </td>
                            )
                          )}
                          <td className="border border-slate-300 p-1 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const firstValue =
                                  Object.values(dateValues)[0] || "";
                                if (firstValue) {
                                  fillRowWithSameValue(metricName, firstValue);
                                }
                              }}
                              className="text-xs"
                            >
                              Fill Row
                            </Button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowHistoryModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={applyBulkEntries}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Suggestions Dialog */}
      <Dialog
        open={showEditSuggestionsDialog}
        onOpenChange={setShowEditSuggestionsDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Optimization Suggestions</DialogTitle>
            <DialogDescription>
              Customize your AI-generated optimization suggestions. Changes will
              be saved to your launch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {editedSuggestions.map((suggestion, index) => (
              <Card
                key={index}
                className={
                  suggestion.type === "success"
                    ? "border-green-200 bg-green-50"
                    : suggestion.type === "warning"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
                }
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 space-y-4">
                      {/* Suggestion Type */}
                      <div>
                        <Label htmlFor={`type-${index}`}>Type</Label>
                        <Select
                          value={suggestion.type}
                          onValueChange={(value) =>
                            updateSuggestion(index, "type", value)
                          }
                        >
                          <SelectTrigger id={`type-${index}`} className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="danger">Danger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Title */}
                      <div>
                        <Label htmlFor={`title-${index}`}>Title</Label>
                        <Input
                          id={`title-${index}`}
                          value={suggestion.title}
                          onChange={(e) =>
                            updateSuggestion(index, "title", e.target.value)
                          }
                          className="font-semibold"
                        />
                      </div>

                      {/* Issue */}
                      <div>
                        <Label htmlFor={`issue-${index}`}>
                          Issue Description
                        </Label>
                        <Textarea
                          id={`issue-${index}`}
                          value={suggestion.issue}
                          onChange={(e) =>
                            updateSuggestion(index, "issue", e.target.value)
                          }
                          rows={3}
                        />
                      </div>

                      {/* Actions */}
                      <div>
                        <Label>Recommended Actions</Label>
                        <div className="space-y-2 mt-2">
                          {suggestion.actions.map((action, actionIndex) => (
                            <div
                              key={actionIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={action}
                                onChange={(e) =>
                                  updateSuggestionAction(
                                    index,
                                    actionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Action ${actionIndex + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeSuggestionAction(index, actionIndex)
                                }
                                className="flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSuggestionAction(index)}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Action
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Suggestion Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSuggestion(index)}
                      className="ml-4"
                    >
                      <XCircle className="w-5 h-5 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {editedSuggestions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 font-medium">
                  No suggestions to edit
                </p>
                <p className="text-sm text-slate-500">
                  All suggestions have been removed.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setShowEditSuggestionsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedSuggestions}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
              disabled={editedSuggestions.length === 0}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
