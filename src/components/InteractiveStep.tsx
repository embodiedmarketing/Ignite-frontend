import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AutoExpandingTextarea } from "@/components/ui/auto-expanding-textarea";
import { Input } from "@/components/ui/input";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import {
  useWorkbookResponses,
  useMessagingStrategy,
  useOfferOutlines,
  useOfferMigration,
  useBuildOfferMigration,
  useSellOfferMigration,
  useStep2Migration,
} from "@/hooks/useDatabasePersistence";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useManualSave } from "@/hooks/useManualSave";
import { useWorkbookMigration } from "@/hooks/useWorkbookMigration";
import {
  useSectionCompletions,
  useMarkSectionComplete,
  useSectionCompletionMigration,
} from "@/hooks/useSectionCompletions";
import MigrationPrompt from "@/components/MigrationPrompt";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  FileText,
  CheckCircle,
  Circle,
  Download,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  ThumbsUp,
  Brain,
  Target,
  Star,
  Heart,
  Users,
  User,
  Settings,
  Sparkles,
  Mic,
  ArrowUp,
  Upload,
  File,
  X,
  MessageCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Shield,
  TrendingUp,
  ExternalLink,
  Video,
  RefreshCw,
  History,
  Copy,
  Loader2,
  Clock,
  CheckSquare,
  Save,
  AlertCircle,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

import EmotionalSalesPageGenerator from "@/components/EmotionalSalesPageGenerator";
import CustomerExperienceActionPlan from "@/components/CustomerExperienceActionPlan";
import CustomerLocationFinder from "@/components/CustomerLocationFinder";
import VoiceRecorder from "@/components/VoiceRecorder";
import OfferOutlinePanel from "@/components/OfferOutlinePanel";
import CustomerExperienceBuilder from "@/components/CustomerExperienceBuilder";
import { InterviewTranscriptManager } from "@/components/InterviewTranscriptManager";
import InterviewNoteHistory from "@/components/InterviewNoteHistory";
import VimeoEmbed from "./VimeoEmbed";
import Resources from "@/pages/Resources";
import { OfferManager } from "@/components/OfferManager";
import SecondOfferWorkbook from "@/components/SecondOfferWorkbook";
import CoreOfferOutlineSectionEditor from "@/components/CoreOfferOutlineSectionEditor";
import RealTimeFeedbackPanel from "@/components/RealTimeFeedbackPanel";
import { useActiveOffer } from "@/hooks/useUserOffers";
import type { userProgressSchema } from "@shared/schema";

interface InteractiveStepProps {
  stepNumber: number;
  userId: string;
  offerId?: number;
  offerNumber?: number;
}

interface StepContent {
  title?: string;
  description?: string;
  tips?: string[];
  workbookUrl?: string;
  videos?: any;
  interactivePrompts?: any[];
}

function FormattedMessagingStrategy({ content }: { content: string }) {
  // Helper function to parse text with bold formatting
  const parseBoldText = (text: string, keyPrefix: string = "") => {
    if (!text.includes("**")) {
      return text;
    }

    const parts = text.split("**");
    return parts.map((part, partIndex) =>
      partIndex % 2 === 1 ? (
        <strong
          key={`${keyPrefix}-bold-${partIndex}`}
          className="font-bold text-slate-900"
        >
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const formatContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip separator lines (---)
      if (line.trim().match(/^-{3,}$/)) {
        i++;
        continue;
      }

      // Handle main headers (# Header) - MESSAGING STRATEGY with darker coral color
      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-lg font-bold mt-8 mb-4 pb-2"
            style={{ color: "rgba(235, 150, 140, 255)" }}
          >
            {parseBoldText(line.replace("# ", ""), `h1-${i}`)}
          </h1>
        );
        i++;
        continue;
      }

      // Handle subheaders (## Header) - with circular number badges
      if (line.startsWith("## ")) {
        const headerText = line.replace("## ", "");
        // Check if it starts with a number (e.g., "1. CORE PROMISE")
        const numberMatch = headerText.match(/^(\d+)\.\s+(.+)$/);

        if (numberMatch) {
          const number = numberMatch[1];
          const title = numberMatch[2];

          elements.push(
            <h2 key={`h2-${i}`} className="flex items-center gap-3 mt-6 mb-3">
              <span
                className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: "#689cf2" }}
              >
                {number}
              </span>
              <span className="text-base font-bold text-slate-900">
                {parseBoldText(title, `h2-${i}`)}
              </span>
            </h2>
          );
        } else {
          // Regular subheader without number
          elements.push(
            <h2
              key={`h2-${i}`}
              className="text-base font-bold text-slate-900 mt-6 mb-3"
            >
              {parseBoldText(headerText, `h2-${i}`)}
            </h2>
          );
        }
        i++;
        continue;
      }

      // Handle section headers (### Header)
      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-sm font-semibold text-slate-900 mt-4 mb-2"
          >
            {parseBoldText(line.replace("### ", ""), `h3-${i}`)}
          </h3>
        );
        i++;
        continue;
      }

      // Handle bullet points - group consecutive bullets into <ul>
      if (line.trim().startsWith("- ")) {
        const bulletItems: JSX.Element[] = [];
        let bulletIndex = 0;
        while (i < lines.length && lines[i].trim().startsWith("- ")) {
          const bulletText = lines[i].trim().replace("- ", "");
          bulletItems.push(
            <li
              key={bulletIndex}
              className="text-slate-700 mb-1 leading-relaxed"
            >
              {parseBoldText(bulletText, `bullet-${i}-${bulletIndex}`)}
            </li>
          );
          bulletIndex++;
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="list-disc ml-6 mb-2">
            {bulletItems}
          </ul>
        );
        continue;
      }

      // Handle numbered lists - group consecutive numbers into <ol>
      if (/^\d+\.\s/.test(line.trim())) {
        const numberedItems: JSX.Element[] = [];
        let numberedIndex = 0;
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          const numberedText = lines[i].trim().replace(/^\d+\.\s/, "");
          numberedItems.push(
            <li
              key={numberedIndex}
              className="text-slate-700 mb-1 leading-relaxed"
            >
              {parseBoldText(numberedText, `numbered-${i}-${numberedIndex}`)}
            </li>
          );
          numberedIndex++;
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="list-decimal ml-6 mb-2">
            {numberedItems}
          </ol>
        );
        continue;
      }

      // Handle empty lines
      if (line.trim() === "") {
        elements.push(<br key={`br-${i}`} />);
        i++;
        continue;
      }

      // Regular text (including bold)
      elements.push(
        <p key={`p-${i}`} className="text-slate-700 mb-2 leading-relaxed">
          {parseBoldText(line, `p-${i}`)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return <div className="space-y-1">{formatContent(content)}</div>;
}

function TripwireFunnelPageEditor({
  page,
  pageType,
  offerId,
  userId,
}: {
  page: any;
  pageType: string;
  offerId: number;
  userId: number;
}) {
  const [sections, setSections] = useState(page?.sections || {});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSectionChange = (field: string, value: string | string[]) => {
    setSections((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest(
        "PATCH",
        `/api/tripwire-templates/${page.id}`,
        { sections }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to save");
      }

      // Invalidate React Query cache to refresh UI
      queryClient.invalidateQueries({
        queryKey: ["/api/tripwire-templates", offerId],
      });

      setIsEditing(false);

      toast({
        title: "Saved!",
        description: "Page updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF();
    let y = 20;
    const margin = 15;
    const pageHeight = pdf.internal.pageSize.height;
    const maxWidth = pdf.internal.pageSize.width - 2 * margin;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(pageType, margin, y);
    y += 15;

    const addSection = (title: string, content: string | string[]) => {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const text = Array.isArray(content) ? content.join("\n• ") : content;
      const splitText = pdf.splitTextToSize(text, maxWidth);
      pdf.text(splitText, margin, y);
      y += splitText.length * 5 + 5;
    };

    Object.entries(sections).forEach(([key, value]) => {
      const title =
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      addSection(title, value as string | string[]);
    });

    pdf.save(`${pageType.toLowerCase().replace(/\s+/g, "-")}.pdf`);

    toast({
      title: "Downloaded!",
      description: "Page exported as PDF",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{pageType}</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              data-testid="button-export-pdf"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="border-[#689cf2] text-[#689cf2] hover:bg-[#689cf2] hover:text-white"
                data-testid="button-edit-template"
              >
                <FileText className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setSections(page?.sections || {});
                    setIsEditing(false);
                  }}
                  variant="outline"
                  size="sm"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-[#689cf2] hover:bg-[#5a8ce0] text-white"
                  data-testid="button-save-template"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(sections).map(([key, value]) => {
          const label =
            key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, " $1");
          const isArray = Array.isArray(value);

          return (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                {label}
              </label>
              {isEditing ? (
                isArray ? (
                  <div className="space-y-2">
                    {(value as string[]).map((item, index) => (
                      <Input
                        key={index}
                        value={item}
                        onChange={(e) => {
                          const newArray = [...(value as string[])];
                          newArray[index] = e.target.value;
                          handleSectionChange(key, newArray);
                        }}
                        className="w-full"
                        data-testid={`input-${key}-${index}`}
                      />
                    ))}
                  </div>
                ) : (
                  <Textarea
                    value={value as string}
                    onChange={(e) => handleSectionChange(key, e.target.value)}
                    className="w-full resize-none"
                    rows={4}
                    data-testid={`textarea-${key}`}
                  />
                )
              ) : (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {isArray ? (
                    <ul className="list-disc list-inside space-y-1">
                      {(value as string[]).map((item, index) => (
                        <li key={index} className="text-slate-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {value as string}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Demographics Fields Component with local state to fix spacebar issue
function DemographicsFields({
  promptKey,
  currentValue,
  onUpdate,
}: {
  promptKey: string;
  currentValue: string;
  onUpdate: (value: string) => void;
}) {
  const fields = [
    { label: "Age Range", key: "ageRange" },
    { label: "Gender", key: "gender" },
    { label: "Income Level", key: "incomeLevel" },
    { label: "Job Title or Role", key: "jobTitle" },
    { label: "Relationship Status", key: "relationshipStatus" },
    { label: "Children", key: "children" },
  ];

  // Helper to extract field value from combined string
  const extractFieldValue = (
    responseText: string,
    fieldLabel: string
  ): string => {
    if (!responseText) return "";
    const lines = responseText.split("\n");
    for (const line of lines) {
      if (line.includes(fieldLabel + ":")) {
        return line.split(fieldLabel + ":")[1]?.trim() || "";
      }
    }
    return "";
  };

  // Initialize local state from current value
  const [localFields, setLocalFields] = useState<{ [key: string]: string }>(
    () => {
      const initial: { [key: string]: string } = {};
      fields.forEach((field) => {
        initial[field.label] = extractFieldValue(currentValue, field.label);
      });
      return initial;
    }
  );

  // Sync local state when currentValue changes externally (e.g., from prefill)
  useEffect(() => {
    const newFields: { [key: string]: string } = {};
    fields.forEach((field) => {
      newFields[field.label] = extractFieldValue(currentValue, field.label);
    });
    setLocalFields(newFields);
  }, [currentValue]);

  // Debounced update to parent
  const debouncedUpdate = useRef<NodeJS.Timeout | null>(null);

  const updateParent = useCallback(
    (updatedFields: { [key: string]: string }) => {
      // Construct the combined string
      let result = "";
      fields.forEach((field) => {
        result += `${field.label}: ${updatedFields[field.label] || ""}\n`;
      });
      onUpdate(result.trim());
    },
    [onUpdate]
  );

  const handleFieldChange = (fieldLabel: string, value: string) => {
    // Update local state immediately for responsive UI
    const updatedFields = { ...localFields, [fieldLabel]: value };
    setLocalFields(updatedFields);

    // Debounce parent update to avoid too many writes
    if (debouncedUpdate.current) {
      clearTimeout(debouncedUpdate.current);
    }
    debouncedUpdate.current = setTimeout(() => {
      updateParent(updatedFields);
    }, 300);
  };

  const handleFieldBlur = () => {
    // Update parent immediately on blur
    if (debouncedUpdate.current) {
      clearTimeout(debouncedUpdate.current);
    }
    updateParent(localFields);
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {field.label}:
          </label>
          <Input
            value={localFields[field.label] || ""}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            onBlur={handleFieldBlur}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="text-sm md:text-base"
          />
        </div>
      ))}
    </div>
  );
}

export default function InteractiveStep({
  stepNumber,
  userId,
  offerId,
  offerNumber = 1,
}: InteractiveStepProps) {
  // PHASE 3 FIX: Memoize userId to prevent parseInt recalculation on every render
  const memoizedUserId = useMemo(() => parseInt(userId), [userId]);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Navigation hook for redirecting to strategy results
  const [, navigate] = useLocation();

  // Active offer hook with memoized userId
  const { data: activeOffer, isLoading: isLoadingActiveOffer } =
    useActiveOffer(memoizedUserId);

  // PHASE 1: Manual Save System - Replace auto-save with manual save buttons
  const unsavedChanges = useUnsavedChanges(
    memoizedUserId,
    stepNumber,
    offerNumber
  );
  const manualSave = useManualSave();

  // Auto-save system completely removed - using manual save only

  // Database persistence hooks with memoized userId
  const {
    responses,
    rawResponses,
    isLoading: isLoadingResponses,
    saveResponse,
  } = useWorkbookResponses(memoizedUserId, stepNumber, offerNumber);

  console.log("responses", responses, rawResponses);

  // PHASE 3 FIX: Automatic localStorage migration with memoized userId
  const { migrationComplete, migrationNeeded, isMigrating } =
    useWorkbookMigration(memoizedUserId, stepNumber);

  const {
    activeStrategy,
    isLoading: isLoadingStrategy,
    createStrategy,
    updateStrategy,
  } = useMessagingStrategy(memoizedUserId);

  // Offer outline hooks for Step 2
  const {
    activeOutline,
    isLoading: isLoadingOutline,
    createOutline,
    updateOutline,
  } = useOfferOutlines(memoizedUserId);

  const {
    hasExistingData: hasExistingOfferData,
    migrateData: migrateOfferData,
  } = useOfferMigration(memoizedUserId);

  // PHASE 3 FIX: Build Your Offer migration hooks for Step 3 with memoized userId
  const {
    autoMigrate: autoMigrateBuildOffer,
    parseStep3LocalStorage,
    isMigrating: isMigratingBuildOffer,
  } = useBuildOfferMigration(memoizedUserId);

  // Removed step-specific response states - now using unified responses from useWorkbookResponses

  // PHASE 3 FIX: Section completions database persistence with memoized userId
  const { data: sectionCompletions = [], isLoading: isLoadingCompletions } =
    useSectionCompletions(memoizedUserId);
  const markSectionComplete = useMarkSectionComplete();
  const { migrateCompletions } = useSectionCompletionMigration(memoizedUserId);

  const {
    parseStep4LocalStorage,
    migrateFromLocalStorage: migrateStep4Data,
    hasPendingMigration: hasStep4Migration,
    isMigrating: isMigratingStep4,
  } = useSellOfferMigration(Number(userId));

  // Step 2 Create Your Offer: Auto-migration from localStorage
  const step2Migration = useStep2Migration(Number(userId));
  const { mutate: migrateStep2Responses, isPending: isStep2MigrationLoading } =
    step2Migration;

  const [activeVideo, setActiveVideo] = useState(0);
  const [completedVideos, setCompletedVideos] = useState<number[]>([]);
  const [localResponses, setLocalResponses] = useState<Record<string, string>>(
    {}
  );
  const prevResponsesRef = useRef<Record<string, string>>({});

  // CRITICAL FIX: Initialize localResponses with database data on component mount
  useEffect(() => {
    if (responses && !isLoadingResponses) {
      // Check if responses actually changed by comparing JSON strings
      const responsesJSON = JSON.stringify(responses);
      const prevResponsesJSON = JSON.stringify(prevResponsesRef.current);

      if (responsesJSON !== prevResponsesJSON) {
        prevResponsesRef.current = responses;

        if (Object.keys(responses).length > 0) {
          console.log(
            "[MANUAL SAVE] Loading database responses into local state"
          );
          setLocalResponses(responses);
        } else {
          console.log(
            "[MANUAL SAVE] Database responses empty - clearing local state"
          );
          setLocalResponses({});
        }
      }
    }
  }, [responses, isLoadingResponses, stepNumber, offerNumber]);

  // Individual button loading states for transfer functionality
  const [transferringButtons, setTransferringButtons] = useState<
    Record<string, boolean>
  >({});
  const [transferSuccessButtons, setTransferSuccessButtons] = useState<
    Record<string, boolean>
  >({});
  const [transferErrorButtons, setTransferErrorButtons] = useState<
    Record<string, boolean>
  >({});
  const [lastClickTime, setLastClickTime] = useState<Record<string, number>>(
    {}
  );

  // Debug tracking for transfer button activity
  const [transferButtonHistory, setTransferButtonHistory] = useState<
    Array<{
      timestamp: string;
      buttonKey: string;
      promptKey: string;
      questionText: string;
      action: "pressed" | "success" | "error";
      content?: string;
      error?: string;
    }>
  >([]);

  // Bulk transfer state for "Transfer All" functionality
  const [bulkTransferInProgress, setBulkTransferInProgress] = useState(false);
  const [bulkTransferProgress, setBulkTransferProgress] = useState({
    current: 0,
    total: 0,
  });
  const [bulkTransferResults, setBulkTransferResults] = useState<{
    succeeded: number;
    failed: number;
  }>({ succeeded: 0, failed: 0 });

  // ENHANCED FIX: Database-first with proper handling of multiple database entries and key mapping
  const getCurrentValue = (promptKey: string): string => {
    console.log(`[MANUAL SAVE] getCurrentValue for ${promptKey}:`, {
      hasLocalResponse: localResponses[promptKey] !== undefined,
      localValue: localResponses[promptKey],
      hasDbResponse: responses[promptKey] !== undefined,
      dbValue: responses[promptKey],
      hasUnsavedChange: unsavedChanges.isDirty(promptKey),
      unsavedValue: unsavedChanges.getCurrentValue(promptKey),
      rawResponsesLength: rawResponses ? rawResponses.length : 0,
      timestamp: new Date().toISOString(),
    });

    // Priority 1: Use unsaved changes first (for active editing)
    if (unsavedChanges.isDirty(promptKey)) {
      const unsavedValue = unsavedChanges.getCurrentValue(promptKey);
      if (unsavedValue !== undefined) {
        console.log(
          `[MANUAL SAVE] Using unsaved change value (highest priority):`,
          unsavedValue
        );
        return unsavedValue;
      }
    }

    // Priority 2: Check raw database responses first (handles duplicates properly)
    if (rawResponses && Array.isArray(rawResponses)) {
      // Try exact match first
      let matchingResponses = rawResponses.filter(
        (r: any) => r.questionKey === promptKey
      );

      // If no exact match, try alternative key formats for demographics and other questions
      if (matchingResponses.length === 0) {
        const alternativeKeys = [];

        // Handle demographics questions with multiple possible keys
        if (
          promptKey.includes("demographics") ||
          promptKey.includes("age range") ||
          promptKey.includes("income level") ||
          promptKey.includes("job title")
        ) {
          alternativeKeys.push(
            "Customer Avatar Deep Dive-What is their age range, income level, and job title or role?",
            "Customer Avatar Deep Dive-What is your ideal customer's age range, gender, income level, and job title or role?",
            "Customer Avatar Deep Dive-What are their demographics (age range, income level, job title, gender)?",
            "Customer Avatar Deep Dive-What is your ideal customer's age range, income level, and job title or role?"
          );
        }

        // Also check if this promptKey should map to the demographics question
        if (
          promptKey ===
            "Customer Avatar Deep Dive-What is your ideal customer's age range, gender, income level, and job title or role?" ||
          promptKey ===
            "Customer Avatar Deep Dive-What are their demographics (age range, income level, job title, gender)?" ||
          (promptKey.includes("Customer Avatar Deep Dive") &&
            promptKey.includes("age range"))
        ) {
          alternativeKeys.push(
            "Customer Avatar Deep Dive-What is their age range, income level, and job title or role?",
            "Customer Avatar Deep Dive-What is your ideal customer's age range, gender, income level, and job title or role?",
            "Customer Avatar Deep Dive-What are their demographics (age range, income level, job title, gender)?",
            "Customer Avatar Deep Dive-What is your ideal customer's age range, income level, and job title or role?"
          );
        }

        // Try each alternative key
        for (const altKey of alternativeKeys) {
          matchingResponses = rawResponses.filter(
            (r: any) => r.questionKey === altKey
          );
          if (matchingResponses.length > 0) {
            console.log(
              `[MANUAL SAVE] Found match using alternative key: ${altKey} for promptKey: ${promptKey}`
            );
            break;
          }
        }

        // Filter out empty string responses but keep null responses for question 5 demographics
        if (
          promptKey.includes(
            "Customer Avatar Deep Dive-What is their age range, income level, and job title or role?"
          )
        ) {
          matchingResponses = matchingResponses.filter(
            (r: any) =>
              r.responseText !== "" ||
              r.responseText === null ||
              r.responseText === undefined
          );
        }
      }

      if (matchingResponses.length > 0) {
        // Sort by updatedAt timestamp to get the most recent response
        const sortedResponses = matchingResponses.sort(
          (a: any, b: any) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        );
        const latestResponse = sortedResponses[0];
        console.log(
          `[MANUAL SAVE] Using latest database response from ${matchingResponses.length} records:`,
          {
            responseText: latestResponse.responseText,
            updatedAt: latestResponse.updatedAt,
            totalMatches: matchingResponses.length,
            allResponseIds: matchingResponses.map((r) => r.id),
            questionKey: latestResponse.questionKey,
          }
        );
        return latestResponse.responseText || "";
      }
    }

    // Priority 3: Use processed responses from database (fallback for edge cases)
    if (responses[promptKey] !== undefined) {
      console.log(
        `[MANUAL SAVE] Using processed database response:`,
        responses[promptKey]
      );
      return responses[promptKey];
    }

    // Priority 4: Use local responses only if no database data exists
    if (localResponses[promptKey] !== undefined) {
      console.log(
        `[MANUAL SAVE] Using local response:`,
        localResponses[promptKey]
      );
      return localResponses[promptKey];
    }

    // Priority 5: Empty fallback
    console.log(`[MANUAL SAVE] No value found for ${promptKey}`);
    return "";
  };

  // Helper function to get section title for any step
  const getSectionTitle = (promptKey: string, stepNumber: number): string => {
    const sectionKey = promptKey.split("-")[0];

    if (stepNumber === 2) {
      const step2SectionMapping: Record<string, string> = {
        "offer-foundation": "Offer Foundation",
        "offer-structure": "Offer Structure",
        "offer-pricing": "Offer Pricing",
        "offer-presentation": "Offer Presentation",
        "offer-guarantee": "Offer Guarantee",
        core: "Core Offer Outline",
      };
      return step2SectionMapping[sectionKey] || "Offer Foundation";
    } else if (stepNumber === 3) {
      const step3SectionMapping: Record<string, string> = {
        "customer-experience": "Customer Experience Design",
        "sales-page": "Sales Page Content",
        "project-plan": "Project Planning",
        "action-plan": "Customer Action Plan",
        "sales-content": "Generated Sales Content",
      };
      return step3SectionMapping[sectionKey] || "Customer Experience Design";
    } else if (stepNumber === 4) {
      const step4SectionMapping: Record<string, string> = {
        "sales-strategy": "Sales Strategy",
        "customer-locations": "Customer Locations",
        "daily-planning": "Daily Planning",
        "connection-strategy": "Connection Strategy",
        "sales-conversations": "Sales Conversations",
      };
      return step4SectionMapping[sectionKey] || "Sales Strategy";
    } else {
      // Step 1 and other steps
      return sectionKey || "General";
    }
  };

  // Auto-save system removed - using manual save buttons only

  // Simplified response management - no longer needed for multi-offer
  // const updateOfferResponse = (offerId: number, question: string, value: string) => {
  //   const key = `${offerId}-${question}`;
  //   setResponses(prev => ({ ...prev, [key]: value }));
  //   localStorage.setItem(`offer-responses-${userId}`, JSON.stringify({ ...responses, [key]: value }));
  // };
  const [activeTab, setActiveTab] = useState("overview");
  const [activeOfferOutlineTab, setActiveOfferOutlineTab] =
    useState("tripwire-outline");

  // Tripwire offer outline state
  const [tripwireResponses, setTripwireResponses] = useState({
    offerName: "",
    quickWin: "",
    problems: "",
    differentFromFree: "",
    urgency: "",
    frustrations: "",
    triedEverything: "",
    falseBeliefs: "",
    mainComponents: "",
    directBenefits: "",
    emotionalBenefits: "",
    credibility: "",
    testimonials: "",
    personalStory: "",
    format: "",
    timeCommitment: "",
    tools: "",
    pricing: "",
    regularPrice: "",
    valuePositioning: "",
  });

  const [tripwireOutline, setTripwireOutline] = useState("");
  const [showTripwireOutline, setShowTripwireOutline] = useState(false);
  const [tripwireTemplates, setTripwireTemplates] = useState<any[]>([]);
  const [isEditingTripwireOutline, setIsEditingTripwireOutline] =
    useState(false);
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isGeneratingTripwire, setIsGeneratingTripwire] = useState(false);
  const [currentFunnelStep, setCurrentFunnelStep] = useState<
    "thankyou" | "checkout" | "confirmation" | null
  >(null);

  // Core offer outline state
  const [coreResponses, setCoreResponses] = useState({
    // Name
    offerName: "",
    // Core Transformation & Messaging
    headlineTransformation: "",
    clearStatement: "",
    uniqueDifference: "",
    // Ideal Customer & Pain Points
    problemsFrustrations: "",
    notFor: "",
    alreadyTried: "",
    stakes: "",
    objections: "",
    // Features & Benefits
    howItWorks: "",
    allComponents: "",
    componentBenefits: "",
    emotionalBenefit: "",
    // Proof & Authority
    offerDifference: "",
    personalStoryCore: "",
    qualifications: "",
    testimonialsCore: "",
    evidence: "",
    // Pricing & Value
    investment: "",
    bonuses: "",
    framePricing: "",
    guarantee: "",
    // Delivery Method & Structure
    deliveryMethod: "",
    timeframe: "",
    support: "",
  });

  // Load Core Offer responses from localStorage (primary) or database (fallback)
  useEffect(() => {
    if (stepNumber === 2 && userId) {
      // Try localStorage first
      try {
        const savedData = localStorage.getItem(
          `core-offer-responses-${userId}`
        );
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setCoreResponses(parsed);
          console.log("Loaded Core Offer responses from localStorage");
          return;
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }

      // Fallback to database if localStorage is empty
      if (responses && Object.keys(responses).length > 0) {
        const coreOfferFields = {
          offerName: responses["core-offerName"] || "",
          headlineTransformation:
            responses["core-headlineTransformation"] || "",
          clearStatement: responses["core-clearStatement"] || "",
          uniqueDifference: responses["core-uniqueDifference"] || "",
          problemsFrustrations: responses["core-problemsFrustrations"] || "",
          notFor: responses["core-notFor"] || "",
          alreadyTried: responses["core-alreadyTried"] || "",
          stakes: responses["core-stakes"] || "",
          objections: responses["core-objections"] || "",
          howItWorks: responses["core-howItWorks"] || "",
          allComponents: responses["core-allComponents"] || "",
          componentBenefits: responses["core-componentBenefits"] || "",
          emotionalBenefit: responses["core-emotionalBenefit"] || "",
          offerDifference: responses["core-offerDifference"] || "",
          personalStoryCore: responses["core-personalStoryCore"] || "",
          qualifications: responses["core-qualifications"] || "",
          testimonialsCore: responses["core-testimonialsCore"] || "",
          evidence: responses["core-evidence"] || "",
          investment: responses["core-investment"] || "",
          bonuses: responses["core-bonuses"] || "",
          framePricing: responses["core-framePricing"] || "",
          guarantee: responses["core-guarantee"] || "",
          deliveryMethod: responses["core-deliveryMethod"] || "",
          timeframe: responses["core-timeframe"] || "",
          support: responses["core-support"] || "",
        };

        // Only update if we have data from database
        const hasData = Object.values(coreOfferFields).some(
          (val) => val !== ""
        );
        if (hasData) {
          setCoreResponses(coreOfferFields);
          // Also save to localStorage for next time
          localStorage.setItem(
            `core-offer-responses-${userId}`,
            JSON.stringify(coreOfferFields)
          );
          console.log(
            "Loaded Core Offer responses from database and cached to localStorage"
          );
        }
      }
    }
  }, [stepNumber, userId, responses]);

  // Load Tripwire Offer responses from localStorage (primary) or database (fallback)
  useEffect(() => {
    if (stepNumber === 2 && userId) {
      // Try localStorage first
      try {
        const savedData = localStorage.getItem(
          `tripwire-offer-responses-${userId}`
        );
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setTripwireResponses(parsed);
          console.log("Loaded Tripwire Offer responses from localStorage");
          return;
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }

      // Fallback to database if localStorage is empty
      if (responses && Object.keys(responses).length > 0) {
        const tripwireOfferFields = {
          offerName: responses["tripwire-offerName"] || "",
          quickWin: responses["tripwire-quickWin"] || "",
          problems: responses["tripwire-problems"] || "",
          differentFromFree: responses["tripwire-differentFromFree"] || "",
          urgency: responses["tripwire-urgency"] || "",
          frustrations: responses["tripwire-frustrations"] || "",
          triedEverything: responses["tripwire-triedEverything"] || "",
          falseBeliefs: responses["tripwire-falseBeliefs"] || "",
          mainComponents: responses["tripwire-mainComponents"] || "",
          directBenefits: responses["tripwire-directBenefits"] || "",
          emotionalBenefits: responses["tripwire-emotionalBenefits"] || "",
          credibility: responses["tripwire-credibility"] || "",
          testimonials: responses["tripwire-testimonials"] || "",
          personalStory: responses["tripwire-personalStory"] || "",
          format: responses["tripwire-format"] || "",
          timeCommitment: responses["tripwire-timeCommitment"] || "",
          tools: responses["tripwire-tools"] || "",
          pricing: responses["tripwire-pricing"] || "",
          regularPrice: responses["tripwire-regularPrice"] || "",
          valuePositioning: responses["tripwire-valuePositioning"] || "",
        };

        // Only update if we have data from database
        const hasData = Object.values(tripwireOfferFields).some(
          (val) => val !== ""
        );
        if (hasData) {
          setTripwireResponses(tripwireOfferFields);
          // Also save to localStorage for next time
          localStorage.setItem(
            `tripwire-offer-responses-${userId}`,
            JSON.stringify(tripwireOfferFields)
          );
          console.log(
            "Loaded Tripwire Offer responses from database and cached to localStorage"
          );
        }
      }
    }
  }, [stepNumber, userId, responses]);

  const [coreOutline, setCoreOutline] = useState("");
  const [isGeneratingCore, setIsGeneratingCore] = useState(false);
  const [isEditingCoreOutline, setIsEditingCoreOutline] = useState(false);
  const [showCoreOutline, setShowCoreOutline] = useState(false);
  const [coreEvaluation, setCoreEvaluation] = useState<{
    overall_score: number;
    strengths: string[];
    improvements_needed: string[];
    coaching_feedback: string;
  } | null>(null);
  const [coreRecommendations, setCoreRecommendations] = useState<string[]>([]);

  // Coaching state for Core Offer questions
  const [coachingSessions, setCoachingSessions] = useState<Record<string, any>>(
    {}
  );
  const [evaluatingQuestions, setEvaluatingQuestions] = useState<Set<string>>(
    new Set()
  );

  // Fetch existing coaching sessions on load
  const { data: existingCoachingSessions } = useQuery({
    queryKey: ["/api/core-offer/coaching-sessions"],
    enabled: stepNumber === 2 && !!userId,
  });

  // Update coaching sessions when data loads
  useEffect(() => {
    if (existingCoachingSessions && Array.isArray(existingCoachingSessions)) {
      const sessionsMap: Record<string, any> = {};
      existingCoachingSessions.forEach((session: any) => {
        sessionsMap[session.questionKey] = session;
      });
      setCoachingSessions(sessionsMap);
    }
  }, [existingCoachingSessions]);

  // Coach question mutation
  const coachQuestionMutation = useMutation({
    mutationFn: async ({ questionKey, questionText, userResponse }: any) => {
      const response = await apiRequest(
        "POST",
        `/api/core-offer/coach/${questionKey}`,
        {
          questionText,
          userResponse,
          mainTransformation: coreResponses.headlineTransformation,
          allResponses: coreResponses,
        }
      );
      return await response.json();
    },
    onSuccess: (data, variables) => {
      setCoachingSessions((prev) => ({
        ...prev,
        [variables.questionKey]: {
          ...prev[variables.questionKey],
          ...data,
          lastEvaluated: new Date().toISOString(),
        },
      }));
      setEvaluatingQuestions((prev) => {
        const next = new Set(prev);
        next.delete(variables.questionKey);
        return next;
      });
    },
    onError: (error, variables) => {
      console.error("Coaching error:", error);
      setEvaluatingQuestions((prev) => {
        const next = new Set(prev);
        next.delete(variables.questionKey);
        return next;
      });
      toast({
        title: "Evaluation failed",
        description: "Could not evaluate your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Rewrite mutation
  const rewriteMutation = useMutation({
    mutationFn: async ({
      questionKey,
      questionText,
      originalResponse,
    }: any) => {
      const response = await apiRequest(
        "POST",
        `/api/core-offer/rewrite/${questionKey}`,
        {
          questionText,
          originalResponse,
          mainTransformation: coreResponses.headlineTransformation,
          specificIssues: coachingSessions[questionKey]?.alignmentIssues || [],
        }
      );
      return await response.json();
    },
    onSuccess: (data, variables) => {
      setCoachingSessions((prev) => ({
        ...prev,
        [variables.questionKey]: {
          ...prev[variables.questionKey],
          rewriteSuggestion: data,
        },
      }));
    },
  });

  // Accept rewrite mutation
  const acceptRewriteMutation = useMutation({
    mutationFn: async ({ questionKey, rewrittenText }: any) => {
      const response = await apiRequest(
        "POST",
        `/api/core-offer/accept-rewrite/${questionKey}`,
        {
          rewrittenText,
        }
      );
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Update the response with the rewritten text
      handleCoreResponseChange(variables.questionKey, variables.rewrittenText);

      // Update coaching session
      setCoachingSessions((prev) => ({
        ...prev,
        [variables.questionKey]: {
          ...prev[variables.questionKey],
          status: "accepted",
          rewriteSuggestion: null,
        },
      }));

      toast({
        title: "Rewrite accepted",
        description:
          "Your response has been updated with the improved version.",
      });
    },
  });

  // Summary mutation
  const summaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/core-offer/summary");
      return await response.json();
    },
  });

  // Check if all questions are resolved
  const allQuestionsResolved = useMemo(() => {
    const totalQuestions = Object.keys(coreResponses).filter(
      (key) =>
        coreResponses[key as keyof typeof coreResponses].trim().length > 0
    ).length;
    if (totalQuestions === 0) return false;

    const resolvedCount = Object.values(coachingSessions).filter(
      (session) =>
        session?.status === "resolved" ||
        session?.status === "accepted" ||
        session?.qualityScore >= 80
    ).length;

    return totalQuestions > 0 && resolvedCount === totalQuestions;
  }, [coreResponses, coachingSessions]);

  // Fetch summary when all questions are resolved
  useEffect(() => {
    if (
      allQuestionsResolved &&
      !summaryMutation.data &&
      !summaryMutation.isPending
    ) {
      summaryMutation.mutate();
    }
  }, [allQuestionsResolved]);

  // Debounced evaluation handler
  const handleQuestionBlur = useCallback(
    (questionKey: string, questionText: string, userResponse: string) => {
      if (!userResponse.trim() || userResponse.length < 10) return;

      const session = coachingSessions[questionKey];

      // Only evaluate if response changed since last evaluation
      if (session?.lastEvaluatedText === userResponse) return;

      setEvaluatingQuestions((prev) => new Set(prev).add(questionKey));

      // Debounce the actual evaluation
      setTimeout(() => {
        coachQuestionMutation.mutate({
          questionKey,
          questionText,
          userResponse,
        });
      }, 1000);
    },
    [coachingSessions, coachQuestionMutation]
  );

  // Fetch Tripwire Outline from database
  const { data: tripwireOutlineData } = useQuery({
    queryKey: ["/api/user-offer-outlines/user", userId, "tripwire"],
    queryFn: async () => {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/user-offer-outlines/user/${userId}`
      );
      if (!response.ok) return null;
      const outlines = await response.json();
      // Find the Tripwire outline (offerNumber = 2)
      return outlines.find(
        (outline: any) =>
          outline.offerNumber === 2 ||
          outline.title?.toLowerCase().includes("tripwire")
      );
    },
    enabled: !!userId && stepNumber === 2,
  });

  // Load Tripwire Outline from database when available
  useEffect(() => {
    if (tripwireOutlineData && tripwireOutlineData.content) {
      console.log(
        "Loading Tripwire Outline from database:",
        tripwireOutlineData
      );
      setTripwireOutline(tripwireOutlineData.content);
      setShowTripwireOutline(true); // Show the outline

      // Also save to localStorage for quick access
      try {
        localStorage.setItem(
          `tripwire-offer-outline-${userId}`,
          tripwireOutlineData.content
        );
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    } else if (userId && stepNumber === 2) {
      // Fallback to localStorage if database doesn't have it
      try {
        const saved = localStorage.getItem(`tripwire-offer-outline-${userId}`);
        if (saved) {
          console.log("Loading Tripwire Outline from localStorage as fallback");
          setTripwireOutline(saved);
          setShowTripwireOutline(true); // Show the outline
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
    }
  }, [tripwireOutlineData, userId, stepNumber]);

  // Load generated outline from localStorage on mount
  useEffect(() => {
    if (stepNumber === 2 && userId) {
      try {
        const savedOutline = localStorage.getItem(
          `core-offer-outline-${userId}`
        );
        const savedEvaluation = localStorage.getItem(
          `core-offer-evaluation-${userId}`
        );
        const savedRecommendations = localStorage.getItem(
          `core-offer-recommendations-${userId}`
        );

        if (savedOutline) {
          setCoreOutline(savedOutline);
          setShowCoreOutline(true);
        }
        if (savedEvaluation) {
          setCoreEvaluation(JSON.parse(savedEvaluation));
        }
        if (savedRecommendations) {
          setCoreRecommendations(JSON.parse(savedRecommendations));
        }
      } catch (error) {
        console.error("Error loading outline from localStorage:", error);
      }
    }
  }, [stepNumber, userId]);

  // Check if all questions are answered
  const allTripwireQuestionsAnswered = Object.values(tripwireResponses).every(
    (response) => response.trim().length > 0
  );
  const allCoreQuestionsAnswered = Object.values(coreResponses).every(
    (response) => response.trim().length > 0
  );

  // Handle response changes
  const handleTripwireResponseChange = (field: string, value: string) => {
    setTripwireResponses((prev) => {
      const updated = { ...prev, [field]: value };

      // Save to localStorage immediately
      try {
        localStorage.setItem(
          `tripwire-offer-responses-${userId}`,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }

      return updated;
    });

    // Also save to database using the unified persistence system (fallback)
    const promptKey = `tripwire-${field}`;
    handleResponseChange(promptKey, value);
  };

  const handleCoreResponseChange = (field: string, value: string) => {
    setCoreResponses((prev) => {
      const updated = { ...prev, [field]: value };

      // Save to localStorage immediately
      try {
        localStorage.setItem(
          `core-offer-responses-${userId}`,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }

      return updated;
    });

    // Also save to database using the unified persistence system (fallback)
    const promptKey = `core-${field}`;
    handleResponseChange(promptKey, value);
  };

  // Generate tripwire outline using AI
  const generateTripwireOutline = async () => {
    setIsGeneratingTripwire(true);

    try {
      // Map tripwireResponses to the format expected by the API
      const tripwireData = {
        offerName: tripwireResponses.offerName,
        bigPromise: tripwireResponses.quickWin,
        problems: tripwireResponses.problems,
        differentFromFree: tripwireResponses.differentFromFree,
        urgency: tripwireResponses.urgency,
        frustrations: tripwireResponses.frustrations,
        triedEverything: tripwireResponses.triedEverything,
        objections: tripwireResponses.falseBeliefs,
        components: tripwireResponses.mainComponents,
        benefits: tripwireResponses.directBenefits,
        emotionalBenefit: tripwireResponses.emotionalBenefits,
        credibility: tripwireResponses.credibility,
        testimonials: tripwireResponses.testimonials,
        personalStory: tripwireResponses.personalStory,
        format: tripwireResponses.format,
        timeCommitment: tripwireResponses.timeCommitment,
        tools: tripwireResponses.tools,
        price: tripwireResponses.pricing,
        regularPrice: tripwireResponses.regularPrice,
        valuePosition: tripwireResponses.valuePositioning,
      };

      const response = await apiRequest(
        "POST",
        "/api/core-offer/generate-tripwire-outline",
        {
          tripwireResponses: tripwireData,
          offerNumber: offerNumber,
        },
        {
          timeout: 120000, // 120 seconds for AI processing
          priority: "high",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      const { outline, completeness, missingInformation, savedId } =
        await response.json();

      // Handle low completeness cases
      if (completeness < 0.4) {
        toast({
          title: "Incomplete Information",
          description: `Please complete more fields to generate a full outline. Missing: ${missingInformation.join(
            ", "
          )}`,
          variant: "destructive",
        });
        return;
      }

      setTripwireOutline(outline);
      setShowTripwireOutline(true); // Show the generated outline

      // Invalidate offer outline queries to refresh the UI (including IGNITE Docs)
      if (savedId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/user-offer-outlines", "active", memoizedUserId],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/user-offer-outlines", "user", memoizedUserId],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/user-offer-outlines/user", memoizedUserId],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "/api/user-offer-outlines/user",
            memoizedUserId,
            "tripwire",
          ],
        });
      }

      if (completeness < 0.7) {
        toast({
          title: "Outline Generated with Limited Data",
          description: `Consider adding: ${missingInformation
            .slice(0, 3)
            .join(", ")} for a more complete outline.`,
        });
      } else {
        toast({
          title: "Success!",
          description: "Your Tripwire Offer Outline has been generated.",
        });
      }
    } catch (error) {
      console.error("Error generating tripwire outline:", error);
      const errorMessage =
        error instanceof Error
          ? error.message.includes("timeout") ||
            error.message.includes("Timeout") ||
            error.message.includes("ECONNABORTED")
            ? "The request took too long. This may happen if the server is processing a large amount of data. Please try again."
            : error.message
          : "Failed to generate tripwire outline. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTripwire(false);
    }
  };

  // Generate single tripwire template (step-by-step funnel flow)
  const generateSingleTemplate = async (
    templateType: "thankyou" | "checkout" | "confirmation"
  ) => {
    setIsGeneratingTemplates(true);

    try {
      if (!tripwireOutline) {
        toast({
          title: "No Outline Found",
          description: "Please generate a tripwire outline first.",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest(
        "POST",
        "/api/generate-single-tripwire-template",
        {
          offerId: offerNumber,
          outlineText: tripwireOutline,
          templateType,
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      // Add or update the template in the array
      setTripwireTemplates((prev) => {
        const filtered = prev.filter((t) => t.templateType !== templateType);
        return [...filtered, data.page];
      });

      setCurrentFunnelStep(templateType);
      setShowTemplates(true);

      const stepNames = {
        thankyou: "Thank You + Offer Page",
        checkout: "Checkout Page",
        confirmation: "Confirmation Page",
      };

      toast({
        title: "Success!",
        description: `${stepNames[templateType]} generated successfully.`,
      });
    } catch (error) {
      console.error("Error generating template:", error);
      toast({
        title: "Error",
        description: "Failed to generate template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTemplates(false);
    }
  };

  // Generate initial tripwire funnel template (Thank You page)
  const handleGenerateTripwireTemplates = async () => {
    await generateSingleTemplate("thankyou");
  };

  // Convert HTML back to markdown format
  const convertHTMLToMarkdown = (element: HTMLElement): string => {
    let markdown = "";

    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        markdown += node.textContent || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        if (tagName === "h1") {
          markdown += "\n# " + (el.textContent || "") + "\n";
        } else if (tagName === "h2") {
          markdown += "\n## " + (el.textContent || "") + "\n";
        } else if (tagName === "h3") {
          markdown += "\n### " + (el.textContent || "") + "\n";
        } else if (tagName === "strong") {
          markdown += "**" + (el.textContent || "") + "**";
        } else if (tagName === "hr") {
          markdown += "\n---\n";
        } else if (tagName === "p") {
          // Check if paragraph contains strong tags
          let pContent = "";
          el.childNodes.forEach((pNode) => {
            if (pNode.nodeType === Node.TEXT_NODE) {
              pContent += pNode.textContent || "";
            } else if (pNode.nodeType === Node.ELEMENT_NODE) {
              const pEl = pNode as HTMLElement;
              if (pEl.tagName.toLowerCase() === "strong") {
                pContent += "**" + (pEl.textContent || "") + "**";
              } else {
                pContent += pEl.textContent || "";
              }
            }
          });
          markdown += pContent + "\n";
        } else if (tagName === "div") {
          // Empty divs represent blank lines
          if (!el.textContent || el.textContent.trim() === "") {
            markdown += "\n";
          } else {
            markdown += convertHTMLToMarkdown(el);
          }
        } else {
          markdown += el.textContent || "";
        }
      }
    });

    return markdown;
  };

  // Format markdown text to JSX with proper styling
  const formatMarkdownOutline = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Single # heading (h1)
      if (line.startsWith("# ")) {
        const content = line.substring(2);
        return (
          <h1 key={idx} className="text-2xl font-bold text-slate-900 mt-6 mb-3">
            {content}
          </h1>
        );
      }
      // Double ## heading (h2)
      else if (line.startsWith("## ")) {
        const content = line.substring(3);
        return (
          <h2 key={idx} className="text-xl font-bold text-slate-800 mt-5 mb-2">
            {content}
          </h2>
        );
      }
      // Triple ### heading (h3)
      else if (line.startsWith("### ")) {
        const content = line.substring(4);
        return (
          <h3 key={idx} className="text-lg font-bold text-slate-700 mt-4 mb-2">
            {content}
          </h3>
        );
      }
      // Bold text with **text**
      else if (line.includes("**")) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx} className="text-slate-700 mb-2 leading-relaxed">
            {parts.map((part, partIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={partIdx} className="font-bold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={partIdx}>{part}</span>;
            })}
          </p>
        );
      }
      // Horizontal rule
      else if (line.trim() === "---") {
        return <hr key={idx} className="my-4 border-slate-200" />;
      }
      // Empty line
      else if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      // Regular text
      else {
        return (
          <p key={idx} className="text-slate-700 mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    });
  };

  // Coaching Panel Component
  const CoachingPanel = ({
    questionKey,
    questionText,
    userResponse,
  }: {
    questionKey: string;
    questionText: string;
    userResponse: string;
  }) => {
    const session = coachingSessions[questionKey];
    const isEvaluating = evaluatingQuestions.has(questionKey);
    const isRequestingRewrite =
      rewriteMutation.isPending &&
      rewriteMutation.variables?.questionKey === questionKey;

    if (!session && !isEvaluating) return null;

    const getStatusBadge = () => {
      if (isEvaluating)
        return (
          <Badge className="bg-blue-500">
            <Loader2 className="w-3 h-3 animate-spin mr-1" /> Evaluating...
          </Badge>
        );
      if (session?.status === "accepted")
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> Accepted
          </Badge>
        );
      if (session?.status === "resolved")
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> Resolved
          </Badge>
        );
      if (session?.needsRewrite)
        return (
          <Badge className="bg-orange-500">
            <AlertTriangle className="w-3 h-3 mr-1" /> Needs Work
          </Badge>
        );
      return (
        <Badge className="bg-blue-500">
          <ThumbsUp className="w-3 h-3 mr-1" /> Solid
        </Badge>
      );
    };

    const getScoreColor = (score: number) => {
      if (score >= 4) return "text-green-600 bg-green-50";
      if (score >= 3) return "text-yellow-600 bg-yellow-50";
      return "text-orange-600 bg-orange-50";
    };

    const categoryDefinitions: Record<
      string,
      { definition: string; weak: string; excellent: string }
    > = {
      clarity: {
        definition: "Transformation is obvious",
        weak: "Confusing",
        excellent: "Instantly clear",
      },
      specificity: {
        definition: "Measurable/tangible",
        weak: "Vague",
        excellent: "Concrete",
      },
      differentiation: {
        definition: "Stands apart from free options",
        weak: "Generic",
        excellent: "Distinct",
      },
      emotion: {
        definition: "Creates feeling/urgency",
        weak: "Flat",
        excellent: "Emotionally charged",
      },
      proof: {
        definition: "Shows credibility",
        weak: "Missing",
        excellent: "Convincing",
      },
      alignment: {
        definition: "Consistent throughout",
        weak: "Scattered",
        excellent: "Cohesive",
      },
    };

    return (
      <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">
              AI Coaching
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Quick Diagnostic Summary */}
        {(session?.strongPoints || session?.needsWork) && (
          <div className="bg-white p-4 rounded-lg border border-slate-300 space-y-3">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="text-purple-500">⚙️</span>
              Quick Diagnostic Summary
            </h3>
            <p className="text-sm text-slate-700">
              &quot;Here&apos;s what&apos;s strong and what to improve:
            </p>

            {session?.strongPoints && session.strongPoints.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                  <span>✅</span>
                  <span>Strong: [list 2-3 highlights]</span>
                </p>
                <ul className="ml-6 space-y-1">
                  {session.strongPoints.map((point: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-700">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {session?.needsWork && session.needsWork.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                  <span>⚡</span>
                  <span>Needs Work: [list 2-3 key fixes].&quot;</span>
                </p>
                <ul className="ml-6 space-y-1">
                  {session.needsWork.map((point: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-700">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Optional Scoring System (1-5 scale) */}
        {session?.categoryScores && (
          <div className="bg-white p-4 rounded-lg border border-slate-300 space-y-3">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <span className="text-slate-400">☐</span>
              Optional Scoring System (1–5 scale)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 font-semibold text-slate-700">
                      Category
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-slate-700">
                      Definition
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-slate-700">
                      1 = Weak
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-slate-700">
                      5 = Excellent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(session.categoryScores).map(
                    ([category, data]: [string, any]) => {
                      const def = categoryDefinitions[category];
                      return (
                        <tr
                          key={category}
                          className="border-b border-slate-100"
                        >
                          <td className="py-2 px-2 font-medium text-slate-900 capitalize">
                            {category}
                          </td>
                          <td className="py-2 px-2 text-slate-700">
                            {def?.definition || ""}
                          </td>
                          <td className="py-2 px-2 text-slate-700">
                            {def?.weak || ""}
                          </td>
                          <td className="py-2 px-2 text-slate-700">
                            {def?.excellent || ""}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {session?.totalScore !== undefined && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-sm text-slate-700">
                  <strong>Example summary:</strong>
                  <br />
                  &quot;Your outline scores{" "}
                  <strong>{session.totalScore}/30</strong>.
                  {session.totalScore >= 24
                    ? " Your outline is strong and cohesive — ready for the next step."
                    : " The biggest opportunity is tightening your core promise so it's simpler and more direct."}
                  &quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Coaching Feedback */}
        {session?.coachingFeedback && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Brain className="w-3 h-3 mr-1" />
              Coach's Guidance
            </h4>
            <p className="text-sm text-blue-800 leading-relaxed italic">
              &quot;{session.coachingFeedback}&quot;
            </p>
          </div>
        )}

        {/* Rewrite Offer Button */}
        {session?.recommendedRewrite && !session.rewriteSuggestion && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              rewriteMutation.mutate({
                questionKey,
                questionText,
                originalResponse: userResponse,
              })
            }
            disabled={isRequestingRewrite}
            className="w-full border-coral-300 text-coral-700 hover:bg-coral-50"
            data-testid={`button-request-rewrite-${questionKey}`}
          >
            {isRequestingRewrite ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" /> Generating
                rewrite...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-2" /> Would you like me to
                rewrite that for clarity?
              </>
            )}
          </Button>
        )}

        {/* Rewrite Suggestion */}
        {session?.rewriteSuggestion && (
          <div className="space-y-3 pt-2 border-t border-slate-300">
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Suggested Rewrite:
              </h4>
              <div className="bg-white p-3 rounded border border-slate-200 text-sm text-slate-700">
                {session.rewriteSuggestion.rewrittenText}
              </div>
            </div>

            {session.rewriteSuggestion.rationale && (
              <p className="text-xs text-slate-600 italic">
                <strong>Why this works better:</strong>{" "}
                {session.rewriteSuggestion.rationale}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  acceptRewriteMutation.mutate({
                    questionKey,
                    rewrittenText: session.rewriteSuggestion.rewrittenText,
                  })
                }
                disabled={acceptRewriteMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid={`button-accept-rewrite-${questionKey}`}
              >
                <CheckCircle className="w-3 h-3 mr-1" /> Accept Rewrite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCoachingSessions((prev) => ({
                    ...prev,
                    [questionKey]: {
                      ...prev[questionKey],
                      rewriteSuggestion: null,
                    },
                  }))
                }
                data-testid={`button-dismiss-rewrite-${questionKey}`}
              >
                <X className="w-3 h-3 mr-1" /> Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Download Tripwire Offer Outline as PDF
  const downloadTripwireOutlineAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Content (no title - it's already in the content)
    const lines = tripwireOutline.split("\n");
    lines.forEach((line) => {
      // Comprehensive text cleaning for PDF export
      let cleanLine = line
        // Remove emojis
        .replace(/\d\uFE0F?\u20E3/gu, "")
        .replace(
          /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uFE00-\uFE0F]|[\u{1F1E6}-\u{1F1FF}]/gu,
          ""
        )
        // Remove markdown formatting
        .replace(/\*\*/g, "")
        // Normalize Unicode (NFD to NFC) to remove combining characters
        .normalize("NFC")
        // Replace smart quotes with regular quotes
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Remove zero-width characters and invisible Unicode
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // Remove other problematic Unicode variation selectors
        .replace(/[\uFE00-\uFE0F]/g, "");
      // Clean up extra spaces and normalize whitespace
      cleanLine = cleanLine.replace(/\s+/g, " ").trim();

      // Skip empty lines after emoji removal
      if (!cleanLine) {
        yPosition += 3;
        return;
      }

      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Single # heading (h1) - Large bold (matching text-2xl font-bold)
      if (cleanLine.startsWith("# ")) {
        yPosition += 8; // Extra spacing before heading
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        const text = cleanLine.substring(2);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 8 + 6; // Spacing after heading
      }
      // Double ## heading (h2) - Medium bold (matching text-xl font-bold)
      else if (cleanLine.startsWith("## ")) {
        yPosition += 6; // Extra spacing before heading
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        const text = cleanLine.substring(3);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 7 + 4; // Spacing after heading
      }
      // Triple ### heading (h3) - Smaller bold (matching text-lg font-bold)
      else if (cleanLine.startsWith("### ")) {
        yPosition += 5; // Extra spacing before heading
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        const text = cleanLine.substring(4);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 6 + 4; // Spacing after heading
      }
      // Horizontal rule
      else if (cleanLine === "---") {
        yPosition += 4;
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;
      }
      // Bullet points (lines starting with "- ")
      else if (cleanLine.startsWith("- ")) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        const bulletIndent = 5;
        const textIndent = 10;
        const contentMaxWidth = maxWidth - textIndent;

        // Draw bullet
        doc.text("•", margin + bulletIndent, yPosition);

        // Get text after bullet
        const bulletText = cleanLine.substring(2).trim();

        // Split text to fit within available width
        const splitText = doc.splitTextToSize(bulletText, contentMaxWidth);

        // Render each line
        splitText.forEach((line: string, idx: number) => {
          doc.text(line, margin + textIndent, yPosition);
          if (idx < splitText.length - 1) {
            yPosition += 6;
          }
        });

        yPosition += 6;
      }
      // Regular text
      else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(cleanLine, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 6;
      }
    });

    doc.save("tripwire-offer-outline.pdf");
  };

  // Download Tripwire Offer Outline as DOCX
  const downloadTripwireOutlineAsDOCX = () => {
    const paragraphs: Paragraph[] = [];
    const lines = tripwireOutline.split("\n");

    lines.forEach((line) => {
      // Comprehensive text cleaning for PDF export
      let cleanLine = line
        // Remove emojis
        .replace(/\d\uFE0F?\u20E3/gu, "")
        .replace(
          /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uFE00-\uFE0F]|[\u{1F1E6}-\u{1F1FF}]/gu,
          ""
        )
        // Remove markdown formatting
        .replace(/\*\*/g, "")
        // Normalize Unicode (NFD to NFC) to remove combining characters
        .normalize("NFC")
        // Replace smart quotes with regular quotes
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Remove zero-width characters and invisible Unicode
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // Remove other problematic Unicode variation selectors
        .replace(/[\uFE00-\uFE0F]/g, "");
      // Clean up extra spaces and normalize whitespace
      cleanLine = cleanLine.replace(/\s+/g, " ").trim();

      // Skip empty lines after emoji removal
      if (!cleanLine) {
        paragraphs.push(new Paragraph({ text: "" }));
        return;
      }

      // Single # heading (h1)
      if (cleanLine.startsWith("# ")) {
        paragraphs.push(
          new Paragraph({
            text: cleanLine.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 320, after: 160 },
          })
        );
      }
      // Double ## heading (h2)
      else if (cleanLine.startsWith("## ")) {
        paragraphs.push(
          new Paragraph({
            text: cleanLine.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
      }
      // Triple ### heading (h3)
      else if (cleanLine.startsWith("### ")) {
        paragraphs.push(
          new Paragraph({
            text: cleanLine.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
      }
      // Horizontal rule
      else if (cleanLine === "---") {
        paragraphs.push(
          new Paragraph({
            text: "",
            border: {
              bottom: {
                color: "CCCCCC",
                space: 1,
                style: "single",
                size: 6,
              },
            },
            spacing: { before: 160, after: 160 },
          })
        );
      }
      // Regular text with bold formatting
      else {
        const runs: TextRun[] = [];
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

        parts.forEach((part) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
          } else if (part) {
            runs.push(new TextRun({ text: part }));
          }
        });

        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 120 },
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch in twips
                right: 1440, // 1 inch in twips
                bottom: 1440, // 1 inch in twips
                left: 1440, // 1 inch in twips
              },
            },
          },
          children: paragraphs,
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "tripwire-offer-outline.docx");
    });
  };

  // Download Core Offer Outline as PDF
  const downloadCoreOutlineAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Content (no title - it's already in the content)
    const lines = coreOutline.split("\n");
    lines.forEach((line) => {
      // Comprehensive text cleaning for PDF export
      let cleanLine = line
        // Remove emojis
        .replace(/\d\uFE0F?\u20E3/gu, "")
        .replace(
          /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uFE00-\uFE0F]|[\u{1F1E6}-\u{1F1FF}]/gu,
          ""
        )
        // Remove markdown formatting
        .replace(/\*\*/g, "")
        // Normalize Unicode (NFD to NFC) to remove combining characters
        .normalize("NFC")
        // Replace smart quotes with regular quotes
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Remove zero-width characters and invisible Unicode
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // Remove other problematic Unicode variation selectors
        .replace(/[\uFE00-\uFE0F]/g, "");
      // Clean up extra spaces and normalize whitespace
      cleanLine = cleanLine.replace(/\s+/g, " ").trim();

      // Skip empty lines after emoji removal
      if (!cleanLine) {
        yPosition += 3;
        return;
      }

      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Single # heading (h1) - Large bold (matching text-2xl font-bold)
      if (cleanLine.startsWith("# ")) {
        yPosition += 8; // Extra spacing before heading
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        const text = cleanLine.substring(2);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 8 + 6; // Spacing after heading
      }
      // Double ## heading (h2) - Medium bold (matching text-xl font-bold)
      else if (cleanLine.startsWith("## ")) {
        yPosition += 6; // Extra spacing before heading
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        const text = cleanLine.substring(3);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 7 + 4; // Spacing after heading
      }
      // Triple ### heading (h3) - Smaller bold (matching text-lg font-bold)
      else if (cleanLine.startsWith("### ")) {
        yPosition += 5; // Extra spacing before heading
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        const text = cleanLine.substring(4);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 6 + 4; // Spacing after heading
      }
      // Horizontal rule
      else if (cleanLine === "---") {
        yPosition += 4;
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;
      }
      // Bullet points (lines starting with "- ")
      else if (cleanLine.startsWith("- ")) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        const bulletIndent = 5;
        const textIndent = 10;
        const contentMaxWidth = maxWidth - textIndent;

        // Draw bullet
        doc.text("•", margin + bulletIndent, yPosition);

        // Get text after bullet
        const bulletText = cleanLine.substring(2).trim();

        // Split text to fit within available width
        const splitText = doc.splitTextToSize(bulletText, contentMaxWidth);

        // Render each line
        splitText.forEach((line: string, idx: number) => {
          doc.text(line, margin + textIndent, yPosition);
          if (idx < splitText.length - 1) {
            yPosition += 6;
          }
        });

        yPosition += 6;
      }
      // Regular text
      else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(cleanLine, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 6;
      }
    });

    doc.save("core-offer-outline.pdf");
  };

  // Download Core Offer Outline as DOCX
  const downloadCoreOutlineAsDOCX = () => {
    const paragraphs: Paragraph[] = [];
    const lines = coreOutline.split("\n");

    lines.forEach((line) => {
      // Comprehensive text cleaning for PDF export
      let cleanLine = line
        // Remove emojis
        .replace(/\d\uFE0F?\u20E3/gu, "")
        .replace(
          /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uFE00-\uFE0F]|[\u{1F1E6}-\u{1F1FF}]/gu,
          ""
        )
        // Remove markdown formatting
        .replace(/\*\*/g, "")
        // Normalize Unicode (NFD to NFC) to remove combining characters
        .normalize("NFC")
        // Replace smart quotes with regular quotes
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        // Remove zero-width characters and invisible Unicode
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // Remove other problematic Unicode variation selectors
        .replace(/[\uFE00-\uFE0F]/g, "");
      // Clean up extra spaces and normalize whitespace
      cleanLine = cleanLine.replace(/\s+/g, " ").trim();

      // Skip empty lines after emoji removal
      if (!cleanLine) {
        paragraphs.push(new Paragraph({ text: "" }));
        return;
      }

      // Single # heading (h1)
      if (cleanLine.startsWith("# ")) {
        paragraphs.push(
          new Paragraph({
            text: cleanLine.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 320, after: 160 },
          })
        );
      }
      // Double ## heading (h2)
      else if (cleanLine.startsWith("## ")) {
        paragraphs.push(
          new Paragraph({
            text: cleanLine.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
      }
      // Triple ### heading (h3)
      else if (cleanLine.startsWith("### ")) {
        paragraphs.push(
          new Paragraph({
            text: cleanLine.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
      }
      // Horizontal rule
      else if (cleanLine === "---") {
        paragraphs.push(
          new Paragraph({
            text: "",
            border: {
              bottom: {
                color: "CCCCCC",
                space: 1,
                style: "single",
                size: 6,
              },
            },
            spacing: { before: 160, after: 160 },
          })
        );
      }
      // Regular text with bold formatting
      else {
        const runs: TextRun[] = [];
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

        parts.forEach((part) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
          } else if (part) {
            runs.push(new TextRun({ text: part }));
          }
        });

        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 120 },
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch in twips
                right: 1440, // 1 inch in twips
                bottom: 1440, // 1 inch in twips
                left: 1440, // 1 inch in twips
              },
            },
          },
          children: paragraphs,
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "core-offer-outline.docx");
    });
  };

  // Generate core offer outline with AI
  const generateCoreOutline = async () => {
    setIsGeneratingCore(true);
    setCoreEvaluation(null);
    setCoreRecommendations([]);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/core-offer/generate-core-offer-outline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coreResponses,
            userId: Number(userId),
          }),
          credentials: "include",
          
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate core offer outline");
      }

      const result = await response.json();

      setCoreOutline(result.outline);
      setCoreEvaluation(result.evaluation);
      setCoreRecommendations(result.recommendations);
      setIsEditingCoreOutline(false);
      setShowCoreOutline(true);

      // Save generated outline to localStorage
      try {
        localStorage.setItem(`core-offer-outline-${userId}`, result.outline);
        localStorage.setItem(
          `core-offer-evaluation-${userId}`,
          JSON.stringify(result.evaluation)
        );
        localStorage.setItem(
          `core-offer-recommendations-${userId}`,
          JSON.stringify(result.recommendations)
        );
      } catch (error) {
        console.error("Error saving outline to localStorage:", error);
      }

      // Invalidate IGNITE Docs cache to show new document
      queryClient.invalidateQueries({
        queryKey: ["/api/user-offer-outlines/user", Number(userId)],
      });

      toast({
        title: "Success!",
        description: `Core Offer Outline generated with ${result.evaluation.overall_score}% quality score.`,
      });
    } catch (error) {
      console.error("Error generating core offer outline:", error);
      toast({
        title: "Error",
        description: "Failed to generate core offer outline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCore(false);
    }
  };

  // Simplified workflow - no longer need multi-offer management
  const [targetSection, setTargetSection] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<string, any>>({});
  const [dismissedFeedback, setDismissedFeedback] = useState<
    Record<string, boolean>
  >({});

  // Load dismissed feedback from localStorage
  useEffect(() => {
    const savedDismissed = localStorage.getItem(`dismissed-feedback-${userId}`);
    if (savedDismissed) {
      try {
        setDismissedFeedback(JSON.parse(savedDismissed));
      } catch (error) {
        console.log("Could not parse dismissed feedback:", error);
      }
    }
  }, [userId]);

  // Handle feedback dismissal
  const handleDismissFeedback = (promptKey: string) => {
    const newDismissed = { ...dismissedFeedback, [promptKey]: true };
    setDismissedFeedback(newDismissed);
    localStorage.setItem(
      `dismissed-feedback-${userId}`,
      JSON.stringify(newDismissed)
    );

    toast({
      title: "Feedback dismissed",
      description:
        "AI feedback hidden for this question. You can re-enable it by typing a new response.",
    });
  };

  // Check if feedback should be shown
  const shouldShowFeedback = (promptKey: string, feedback: any) => {
    return feedback && !dismissedFeedback[promptKey];
  };
  const [analyzingResponse, setAnalyzingResponse] = useState<string | null>(
    null
  );
  const [expandingResponse, setExpandingResponse] = useState<string | null>(
    null
  );
  const [interviewNotes, setInterviewNotes] = useState<Record<string, string>>(
    {}
  );
  const [offerOutline, setOfferOutline] = useState<string>("");
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    noteKey: string;
  }>({ isOpen: false, noteKey: "" });
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Save interview notes to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(interviewNotes).length > 0) {
      localStorage.setItem(
        `interview-notes-${userId}`,
        JSON.stringify(interviewNotes)
      );
    }
  }, [interviewNotes, userId]);

  // Interview notes database integration
  const { data: dbInterviewNotes } = useQuery({
    queryKey: ["/api/interview-notes", userId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/interview-notes/${userId}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch interview notes");
      return response.json();
    },
    enabled: !!userId,
  });

  // Save interview note to database with version history
  const saveInterviewNoteMutation = useMutation({
    mutationFn: async ({
      noteKey,
      content,
    }: {
      noteKey: string;
      content: string;
    }) => {
      return apiRequest("POST", "/api/interview-notes", {
        userId: parseInt(userId),
        noteKey,
        content,
        source: "manual",
        sessionId,
      });
    },
  });

  // Debounced save function for interview notes
  const debouncedInterviewSave = useCallback(
    (noteKey: string, content: string) => {
      // Clear existing timer for this noteKey
      if (debounceTimers.current[noteKey]) {
        clearTimeout(debounceTimers.current[noteKey]);
      }

      // Set new timer
      debounceTimers.current[noteKey] = setTimeout(() => {
        if (content.trim() || interviewNotes[noteKey]?.trim()) {
          saveInterviewNoteMutation.mutate({ noteKey, content });
        }
        delete debounceTimers.current[noteKey];
      }, 1000); // 1 second debounce
    },
    [saveInterviewNoteMutation, interviewNotes]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // PHASE 2 FIX: Removed duplicate query system - now using unified useWorkbookResponses hook only

  // PHASE 2 FIX: Removed duplicate saveResponseMutation - now using unified saveResponse from useWorkbookResponses hook

  // Load interview notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`interview-notes-${userId}`);
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        setInterviewNotes(parsedNotes);
      } catch (error) {
        console.log("Could not parse interview notes:", error);
      }
    }
  }, [userId]);

  // Listen for interview notes updates from transcript processing
  useEffect(() => {
    const handleInterviewNotesUpdate = (event: CustomEvent) => {
      console.log("Received interview notes update event:", event.detail);

      // Check if this is bulk processing with shouldUpdateTextAreas flag
      const shouldAutoPopulate = event.detail?.shouldUpdateTextAreas;

      // Reload interview notes from localStorage
      const savedNotes = localStorage.getItem(`interview-notes-${userId}`);
      if (savedNotes) {
        try {
          const parsedNotes = JSON.parse(savedNotes);
          setInterviewNotes(parsedNotes);

          // If bulk processing, auto-populate the main customer avatar questions
          if (shouldAutoPopulate) {
            const mappings = {
              frustrations:
                "Customer Avatar Deep Dive-What is your ideal customer's biggest frustration?",
              secret_fears:
                "Customer Avatar Deep Dive-What are their deepest fears and anxieties about their situation?",
              magic_solution:
                "Customer Avatar Deep Dive-If they could wave a magic wand, what would their perfect day look like?",
              demographics:
                "Customer Avatar Deep Dive-What are their demographics (age range, income level, job title, gender)?",
              failed_solutions:
                "Customer Avatar Deep Dive-What solutions have they already tried that didn't work?",
            };

            Object.entries(mappings).forEach(([key, questionKey]) => {
              if (parsedNotes[key]) {
                const sectionTitle = questionKey.split("-")[0];
                saveResponse.mutate({
                  questionKey,
                  responseText: parsedNotes[key],
                  sectionTitle,
                });
              }
            });

            console.log(
              "Auto-populated text areas from bulk processing:",
              Object.keys(mappings)
            );
          }

          console.log("Interview notes refreshed automatically:", parsedNotes);
        } catch (error) {
          console.log("Could not parse updated interview notes:", error);
        }
      }
    };

    window.addEventListener(
      "interviewNotesUpdated",
      handleInterviewNotesUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "interviewNotesUpdated",
        handleInterviewNotesUpdate as EventListener
      );
    };
  }, [userId]);

  const [showInterviewNotes, setShowInterviewNotes] = useState<
    Record<string, boolean>
  >({});
  const [showPreviousAnswers, setShowPreviousAnswers] = useState<
    Record<string, boolean>
  >({});
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [showTranscriptUpload, setShowTranscriptUpload] =
    useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [showMessagingStrategy, setShowMessagingStrategy] =
    useState<boolean>(false);
  const [messagingStrategyContent, setMessagingStrategyContent] =
    useState<string>("");
  const [editingStrategy, setEditingStrategy] = useState<boolean>(false);
  const [originalStrategyContent, setOriginalStrategyContent] =
    useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState<boolean>(false);
  const [prefillLoadingButton, setPrefillLoadingButton] = useState<
    string | null
  >(null);
  const [completedSections, setCompletedSections] = useState<
    Record<string, boolean>
  >({});
  const { toast } = useToast();

  // Load completed sections from localStorage on mount
  useEffect(() => {
    const savedCompletedSections = localStorage.getItem(
      `step-${stepNumber}-completed-sections-${userId}`
    );
    if (savedCompletedSections) {
      try {
        setCompletedSections(JSON.parse(savedCompletedSections));
      } catch (error) {
        console.log("Could not parse completed sections:", error);
      }
    }
  }, [stepNumber, userId]);

  // Ensure messaging strategy content is synchronized with database (but respect edit sessions)
  // CRITICAL: Only watch activeStrategy changes, NOT messagingStrategyContent changes
  // This prevents the useEffect from reverting manual state updates (like after generation)
  useEffect(() => {
    // CRITICAL: NEVER sync when actively editing - this prevents the edit box from disappearing
    // when user clears content. The edit box should remain open until user explicitly saves or cancels.
    if (editingStrategy) {
      console.log("[SYNC] Skipping sync - user is actively editing");
      return; // Don't sync while editing - let user have full control, even if content is empty
    }

    // CRITICAL: Always sync from database when activeStrategy updates, unless actively editing
    if (!hasUnsavedChanges && activeStrategy?.content) {
      // Sync database content to UI whenever activeStrategy updates (including after transfers)
      // Only update if the content actually differs to avoid unnecessary re-renders
      if (messagingStrategyContent !== activeStrategy.content) {
        console.log(
          "[SYNC] Syncing messagingStrategyContent from activeStrategy:",
          {
            current: messagingStrategyContent?.substring(0, 50),
            new: activeStrategy.content?.substring(0, 50),
          }
        );
        setMessagingStrategyContent(activeStrategy.content);
        setOriginalStrategyContent(activeStrategy.content);
      }
    } else if (
      !activeStrategy?.content &&
      !messagingStrategyContent &&
      !editingStrategy
    ) {
      // Emergency fallback: Only use localStorage if database has no content and not editing
      try {
        const localStrategy = localStorage.getItem(
          "generated-messaging-strategy"
        );
        if (localStrategy) {
          const parsed = JSON.parse(localStrategy);
          if (parsed.content && parsed.migratedToDatabase) {
            setMessagingStrategyContent(parsed.content);
            setOriginalStrategyContent(parsed.content);
          }
        }
      } catch (error) {
        console.log("Emergency fallback failed:", error);
      }
    }
  }, [
    // REMOVED messagingStrategyContent from dependencies to prevent reverting manual updates
    activeStrategy?.content,
    activeStrategy?.version,
    editingStrategy,
    hasUnsavedChanges,
    // messagingStrategyContent, // REMOVED: Causes useEffect to revert manual state updates
  ]);

  // Check URL parameters on mount and handle Step 3 auto-migration
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    const section = urlParams.get("section");

    if (tab === "workbook") {
      setActiveTab("workbook");
      if (section !== null) {
        setTargetSection(parseInt(section));
      }
    }

    // Also check for hash-based navigation (e.g., #workbook-section-0)
    const hash = window.location.hash;
    if (hash.startsWith("#workbook-section-")) {
      const sectionNumber = parseInt(hash.replace("#workbook-section-", ""));
      if (!isNaN(sectionNumber)) {
        setActiveTab("workbook");
        setTargetSection(sectionNumber);
      }
    }

    // Migration handled by individual step hooks
  }, [stepNumber]);

  // Additional useEffect for other initialization
  useEffect(() => {
    // Step 3 Build Your Offer auto-migration
    if (stepNumber === 3) {
      const step3Data = parseStep3LocalStorage();
      if (step3Data.length > 0) {
        console.log(
          `Found ${step3Data.length} Step 3 responses in localStorage, initiating auto-migration...`
        );
        autoMigrateBuildOffer()
          .then((result) => {
            if (result.migrated > 0) {
              toast({
                title: "Data Migrated",
                description: `Successfully migrated ${result.migrated} Build Your Offer responses to database.`,
              });
            }
          })
          .catch((error) => {
            console.error("Step 3 auto-migration failed:", error);
          });
      }
    }

    // Database responses are loaded through the useWorkbookResponses hook
    // No need for localStorage-based loading anymore
  }, [
    stepNumber,
    userId,
    parseStep3LocalStorage,
    autoMigrateBuildOffer,
    toast,
  ]);

  // Global debug function for transfer button history and data refresh
  useEffect(() => {
    // Add manual refresh function for testing
    (window as any).refreshResponsesForTesting = () => {
      console.log("[MANUAL SAVE] Manual refresh triggered");
      queryClient.invalidateQueries({
        queryKey: [
          "workbook-responses",
          memoizedUserId,
          stepNumber,
          offerNumber,
        ],
      });
      queryClient.refetchQueries({
        queryKey: [
          "workbook-responses",
          memoizedUserId,
          stepNumber,
          offerNumber,
        ],
      });
    };

    (window as any).debugTransferButtons = () => {
      console.log("=".repeat(50));
      console.log("TRANSFER BUTTON DEBUG HISTORY");
      console.log("=".repeat(50));

      if (transferButtonHistory.length === 0) {
        console.log("No transfer button activity recorded yet.");
        return;
      }

      console.log(`Total events: ${transferButtonHistory.length}`);
      console.log("");

      transferButtonHistory.forEach((event, index) => {
        console.log(
          `${index + 1}. [${event.timestamp}] ${event.action.toUpperCase()}`
        );
        console.log(`   Button Key: ${event.buttonKey}`);
        console.log(`   Prompt Key: ${event.promptKey}`);
        console.log(`   Question: "${event.questionText}"`);
        if (event.content) {
          console.log(`   Content: ${event.content}`);
        }
        if (event.error) {
          console.log(`   Error: ${event.error}`);
        }
        console.log("");
      });

      const lastPressed = transferButtonHistory
        .filter((e) => e.action === "pressed")
        .pop();
      if (lastPressed) {
        console.log("LAST BUTTON PRESSED:");
        console.log(`Button Key: ${lastPressed.buttonKey}`);
        console.log(`Prompt Key: ${lastPressed.promptKey}`);
        console.log(`Question: "${lastPressed.questionText}"`);
        console.log(`Time: ${lastPressed.timestamp}`);
      }

      console.log("=".repeat(50));
    };
  }, [transferButtonHistory]);

  // Auto-migration for Step 2 with enhanced cleanup
  useEffect(() => {
    if (stepNumber === 2 && userId && !isStep2MigrationLoading) {
      const step2LocalStorageKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("workbook-2-")
      );

      const hasLocalStorageData = step2LocalStorageKeys.length > 0;

      if (hasLocalStorageData && Object.keys(responses).length === 0) {
        console.log("Starting Step 2 auto-migration with cleanup...");

        // Collect all Step 2 localStorage data
        const workbookResponses: Record<string, string> = {};

        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("workbook-2-")) {
            const responseKey = key.replace("workbook-2-", "");
            const value = localStorage.getItem(key);
            if (value) {
              workbookResponses[responseKey] = value;
            }
          }
        });

        if (Object.keys(workbookResponses).length > 0) {
          console.log(
            "Step 2 migration data available but migration function removed - using unified system"
          );
        }
      } else if (Object.keys(responses).length > 0 && hasLocalStorageData) {
        // Database has data but localStorage still exists - clean up old localStorage
        console.log("Cleaning up redundant Step 2 localStorage data...");
        step2LocalStorageKeys.forEach((key) => {
          localStorage.removeItem(key);
        });
        console.log("Step 2 localStorage cleanup completed");
      }
    }
  }, [stepNumber, userId]);

  // Merge database interview notes when they load
  useEffect(() => {
    if (dbInterviewNotes && Array.isArray(dbInterviewNotes)) {
      const dbNotesMap: Record<string, string> = {};
      dbInterviewNotes.forEach((note: any) => {
        if (note.note_key) {
          // Include ALL database records, even deleted ones (empty content)
          // This ensures deleted content properly syncs to the UI
          dbNotesMap[note.note_key] = note.content || "";
        }
      });

      // Force immediate refresh - database always takes precedence over localStorage
      setInterviewNotes(dbNotesMap);
      localStorage.setItem(
        `interview-notes-${userId}`,
        JSON.stringify(dbNotesMap)
      );
    }

    // Load existing messaging strategy from database with localStorage fallback
    // Keep strategy hidden by default - user must click to view
    if (activeStrategy?.content) {
      setMessagingStrategyContent(activeStrategy.content);
      // Don't auto-show strategy - let user click to view
    } else {
      // Fallback to localStorage during migration period
      try {
        const stored = localStorage.getItem("generated-messaging-strategy");
        if (stored) {
          const strategy = JSON.parse(stored);
          setMessagingStrategyContent(strategy.content || strategy);
          // Don't auto-show strategy - let user click to view
        }
      } catch (error) {
        console.log("No existing messaging strategy found");
      }
    }

    // Load existing offer outline if available
    try {
      const storedOutline = localStorage.getItem("generated-offer-outline");
      if (storedOutline) {
        const outline = JSON.parse(storedOutline);
        setOfferOutline(outline.content || outline);
      }
    } catch (error) {
      console.log("No existing offer outline found");
    }

    // Migrate completed sections from localStorage to database
    migrateCompletions()
      .then((result) => {
        if (result.migrated > 0) {
          console.log(
            `Migrated ${result.migrated} section completions to database`
          );
        }
      })
      .catch((error) => {
        console.error("Failed to migrate section completions:", error);
      });
  }, [stepNumber, userId, activeStrategy]); // Include activeStrategy dependency

  // Auto-migration for offer outlines in Step 2
  useEffect(() => {
    if (stepNumber === 2 && !hasExistingOfferData && !isLoadingOutline) {
      const localOfferOutline = localStorage.getItem(`offerOutline-${userId}`);

      if (localOfferOutline) {
        try {
          const parsedOutline = JSON.parse(localOfferOutline);
          if (parsedOutline && parsedOutline.content) {
            console.log("Auto-migrating offer outline data to database");
            migrateOfferData.mutate({
              content: parsedOutline.content,
              completeness: parsedOutline.completeness || 0,
              lastUpdated: parsedOutline.lastUpdated,
              workbookResponses: responses || {},
            });
          }
        } catch (error) {
          console.error(
            "Failed to parse localStorage offer outline for migration:",
            error
          );
        }
      }
    }
  }, [
    stepNumber,
    hasExistingOfferData,
    isLoadingOutline,
    migrateOfferData,
    userId,
    responses,
  ]);

  // Phase 2: Data Migration Detection and Process
  useEffect(() => {
    const migrateLocalStorageToDatabase = async () => {
      try {
        const stored = localStorage.getItem("generated-messaging-strategy");
        if (stored && !activeStrategy?.content) {
          const strategy = JSON.parse(stored);

          // Check if already migrated
          if (strategy.migratedToDatabase) {
            return;
          }

          // Migrate to database
          if (strategy.content) {
            console.log(
              "Migrating messaging strategy from localStorage to database"
            );

            createStrategy.mutate({
              title: "Messaging Strategy",
              content: strategy.content,
              completionPercentage: strategy.completeness || 100,
              sourceData: {
                migratedFrom: "localStorage",
                originalTimestamp: strategy.lastUpdated,
                migrationTimestamp: new Date().toISOString(),
              },
            });

            // Mark as migrated in localStorage
            localStorage.setItem(
              "generated-messaging-strategy",
              JSON.stringify({
                ...strategy,
                migratedToDatabase: true,
              })
            );
          }
        }
      } catch (error) {
        console.log("Migration check failed:", error);
      }
    };

    // Only run migration if we have localStorage data but no database strategy
    if (!activeStrategy?.content) {
      migrateLocalStorageToDatabase();
    }
  }, [activeStrategy, createStrategy]);

  // Phase 5: Offline/Online Sync Management
  useEffect(() => {
    const handleOnlineSync = () => {
      const stored = localStorage.getItem("generated-messaging-strategy");
      if (stored) {
        try {
          const strategy = JSON.parse(stored);

          // Check if we have local changes that need syncing
          if (
            strategy.content &&
            strategy.migratedToDatabase &&
            activeStrategy?.content
          ) {
            const localTimestamp = new Date(strategy.lastUpdated);
            const dbTimestamp = new Date(activeStrategy.updatedAt);

            // If local is newer, sync to database
            if (localTimestamp > dbTimestamp) {
              console.log("Syncing newer local changes to database");
              updateStrategy.mutate({
                id: activeStrategy.id,
                updates: {
                  content: strategy.content,
                },
              });
            }
          }
        } catch (error) {
          console.log("Sync check failed:", error);
        }
      }
    };

    // Listen for online events to sync data
    window.addEventListener("online", handleOnlineSync);

    return () => {
      window.removeEventListener("online", handleOnlineSync);
    };
  }, [activeStrategy, updateStrategy]);

  // Removed loadExistingResponses function to prevent infinite loops

  // Removed storage listener to prevent infinite loops

  // Removed loadMessagingStrategy function to prevent infinite loops

  // Unified messaging strategy regeneration system
  const [regeneratingStrategy, setRegeneratingStrategy] = useState(false);

  const regenerateMessagingStrategy = useMutation({
    mutationFn: async ({ trigger }: { trigger: "manual" | "auto" }) => {
      // Prevent regeneration during editing
      if (editingStrategy || hasUnsavedChanges) {
        throw new Error("Cannot regenerate while editing strategy");
      }

      setRegeneratingStrategy(true);

      const workbookResponses = responses;
      const interviewNotesData = interviewNotes;

      if (Object.keys(workbookResponses).length === 0) {
        throw new Error("No workbook responses available");
      }

      const response = await apiRequest(
        "POST",
        "/api/generate-messaging-strategy",
        {
          workbookResponses,
          interviewNotes: interviewNotesData,
          userId,
        },
        {
          timeout: 180000, // 180 seconds (3 minutes) for complex AI processing
          priority: "high",
        }
      );

      const data = await response.json();
      return { ...data, trigger };
    },
    onSuccess: (data: any) => {
      const { trigger } = data;

      if (data.strategy && data.strategy.trim()) {
        const strategyContent = data.strategy;

        console.log("strategyContent", strategyContent);

        // Update component state first (like edit-save pattern)
        setMessagingStrategyContent(strategyContent);
        setOriginalStrategyContent(strategyContent);

        // Update database - check if strategy exists first
        if (activeStrategy?.id) {
          // UPDATE existing strategy
          apiRequest("PUT", `/api/messaging-strategies/${activeStrategy.id}`, {
            content: strategyContent,
            version: (activeStrategy.version || 1) + 1,
            sourceData: {
              workbookResponses: responses,
              interviewNotes: interviewNotes,
              [trigger === "auto" ? "autoUpdatedAt" : "manualUpdatedAt"]:
                new Date().toISOString(),
            },
          })
            .then((response) => response.json())
            .then((updatedStrategy) => {
              // Update query cache with correct query key to match useMessagingStrategy hook
              const correctQueryKey = [
                "/api/messaging-strategies/active",
                userId,
              ];
              queryClient.setQueryData(correctQueryKey, {
                ...updatedStrategy,
                content: strategyContent,
              });

              // CRITICAL: Invalidate and refetch to ensure activeStrategy hook updates
              queryClient.invalidateQueries({
                queryKey: correctQueryKey,
              });

              // Also invalidate alternative query keys that might be used
              queryClient.invalidateQueries({
                queryKey: ["messaging-strategy", "active", userId],
              });
            });
        } else {
          // CREATE new strategy only if none exists
          createStrategy.mutate(
            {
              title: "Messaging Strategy",
              content: strategyContent,
              completionPercentage: Math.round(data.completeness || 100),
              sourceData: {
                workbookResponses: responses,
                interviewNotes: interviewNotes,
                [trigger === "auto" ? "autoGeneratedAt" : "manualGeneratedAt"]:
                  new Date().toISOString(),
              },
            },
            {
              onSuccess: () => {
                // Refetch the active strategy to ensure UI is updated with correct query key
                queryClient.invalidateQueries({
                  queryKey: [
                    "/api/messaging-strategies/active",
                    memoizedUserId,
                  ],
                });
                // Also invalidate alternative query keys
                queryClient.invalidateQueries({
                  queryKey: ["messaging-strategy", "active", memoizedUserId],
                });
              },
            }
          );
        }

        // Emergency fallback: Save to localStorage only after successful state update
        localStorage.setItem(
          "generated-messaging-strategy",
          JSON.stringify({
            content: strategyContent,
            lastUpdated: new Date().toISOString(),
            migratedToDatabase: true,
            [trigger === "auto" ? "autoUpdated" : "manualUpdated"]: true,
          })
        );

        // Preserve source data
        preserveMessagingResponses(responses, interviewNotes);

        // Show appropriate feedback based on trigger
        if (trigger === "manual") {
          toast({
            title: "✓ Strategy generated successfully!",
            description: "Redirecting to view your messaging strategy...",
            className: "border-green-200 bg-green-50",
          });

          // Invalidate strategy queries to ensure fresh data on results page
          queryClient.invalidateQueries({
            queryKey: ["/api/messaging-strategies/active", memoizedUserId],
          });
          queryClient.invalidateQueries({
            queryKey: ["/api/messaging-strategies/user", memoizedUserId],
          });
          // Also invalidate alternative query keys
          queryClient.invalidateQueries({
            queryKey: ["messaging-strategy", "active", memoizedUserId],
          });

          // Do not navigate - strategy will display on the same page
          // Scroll to the generated strategy instead
          setTimeout(() => {
            const strategyElement = document.getElementById(
              "generated-messaging-strategy"
            );
            if (strategyElement) {
              strategyElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 500);
        } else {
          toast({
            title: "Strategy auto-updated",
            description:
              "Your messaging strategy has been refreshed with new interview insights.",
          });
        }
      } else {
        console.error("Unexpected response structure:", data);
        if (trigger === "manual") {
          toast({
            title: "Generation error",
            description:
              "Strategy generation completed but no content was returned. Please try again.",
            variant: "destructive",
          });
        }
      }

      setRegeneratingStrategy(false);
    },
    onError: (error: any) => {
      console.error("Messaging strategy regeneration error:", error);
      setRegeneratingStrategy(false);

      // Show error feedback only for manual triggers or critical errors
      if (error.message.includes("Cannot regenerate while editing")) {
        toast({
          title: "Cannot regenerate while editing",
          description:
            "Please save or cancel your current edits before regenerating.",
          variant: "destructive",
        });
      } else if (error.message.includes("No workbook responses available")) {
        // Skip showing error for missing workbook responses
        return;
      } else {
        const errorMessage =
          error instanceof Error &&
          (error.message.includes("timeout") ||
            error.message.includes("Timeout") ||
            error.message.includes("ECONNABORTED"))
            ? "The request took too long. This may happen if the server is processing a large amount of data. Please try again."
            : error?.message || "Unable to regenerate strategy. Please try again.";
        toast({
          title: "Regeneration failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      // Auto-regeneration failures are logged but don't show user errors
    },
  });

  // Offer outline generation mutation
  const generateOfferOutlineMutation = useMutation({
    mutationFn: async () => {
      const offerResponses = responses;

      const response = await apiRequest("POST", "/api/generate-offer-outline", {
        offerResponses,
        messagingStrategy: messagingStrategyContent
          ? { content: messagingStrategyContent }
          : null,
        userId,
      });

      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("Offer outline generation success:", data);

      if (data.outline && data.outline.trim().length > 50) {
        const outlineContent = data.outline;
        setOfferOutline(outlineContent);

        // Save to localStorage
        localStorage.setItem(
          "generated-offer-outline",
          JSON.stringify({
            content: outlineContent,
            lastUpdated: new Date().toISOString(),
            completeness: data.completeness,
          })
        );

        toast({
          title: "Offer outline generated!",
          description:
            "Your comprehensive offer outline has been created successfully.",
        });
      } else if (data.completeness && data.completeness < 0.6) {
        toast({
          title: "Complete more questions first",
          description: `You need at least 60% completion to generate an outline. Currently at ${Math.round(
            data.completeness * 100
          )}%.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Generation incomplete",
          description:
            "Outline generation completed but no content was returned. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Offer outline generation error:", error);
      toast({
        title: "Generation failed",
        description:
          error?.message || "Unable to generate outline. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI-powered intelligent prefill system
  const intelligentPrefillMutation = useMutation({
    mutationFn: async (params: {
      questionText: string;
      messagingStrategy: string;
      targetPromptKey?: string;
      isRegenerate?: boolean;
    }) => {
      const { questionText, messagingStrategy, targetPromptKey, isRegenerate } =
        params;
      setPrefillLoadingButton(targetPromptKey || null);
      const res = await apiRequest("POST", "/api/intelligent-prefill", {
        questionText,
        messagingStrategy,
        userId,
      });
      return { data: await res.json(), targetPromptKey, isRegenerate };
    },
    onSuccess: ({ data, targetPromptKey, isRegenerate }: any) => {
      setPrefillLoadingButton(null);
      if (data.prefillText && targetPromptKey) {
        const existingContent = responses[targetPromptKey] || "";
        const newContent =
          isRegenerate && existingContent
            ? `${existingContent}\n\n${data.prefillText}`
            : data.prefillText;

        handleResponseChange(targetPromptKey, newContent);
        toast({
          title: isRegenerate ? "Content added!" : "Smart prefill complete!",
          description: isRegenerate
            ? "AI generated additional content based on your messaging strategy."
            : "AI generated a perfect response based on your messaging strategy.",
        });
      } else if (data.prefillText) {
        // Fallback to original logic if targetPromptKey not provided
        const { questionText } = data;
        const foundPromptKey = Object.keys(responses).find((key) => {
          const sectionIndex = parseInt(key.split("-")[0]);
          const promptIndex = parseInt(key.split("-")[1]);
          if (
            Array.isArray(prompts) &&
            prompts[sectionIndex]?.prompts?.[promptIndex]
          ) {
            const prompt = prompts[sectionIndex].prompts[promptIndex];
            const promptQuestion =
              typeof prompt === "object" ? prompt.question : prompt;
            return promptQuestion === questionText;
          }
          return false;
        });

        if (foundPromptKey) {
          const existingContent = responses[foundPromptKey] || "";
          const newContent =
            isRegenerate && existingContent
              ? `${existingContent}\n\n${data.prefillText}`
              : data.prefillText;

          handleResponseChange(foundPromptKey, newContent);
          toast({
            title: isRegenerate ? "Content added!" : "Smart prefill complete!",
            description: isRegenerate
              ? "AI generated additional content based on your messaging strategy."
              : "AI generated a perfect response based on your messaging strategy.",
          });
        }
      }
    },
    onError: () => {
      setPrefillLoadingButton(null);
      toast({
        title: "Prefill failed",
        description:
          "Unable to generate intelligent prefill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMessagingStrategy = () => {
    try {
      if (activeStrategy?.id) {
        // Direct API call to avoid conflicting mutation handlers
        const saveContent = messagingStrategyContent;
        console.log(
          "Saving strategy content directly to strategy ID:",
          activeStrategy.id
        );

        apiRequest("PUT", `/api/messaging-strategies/${activeStrategy.id}`, {
          content: saveContent,
        })
          .then((response) => response.json())
          .then((updatedStrategy) => {
            // Use the content returned from database to ensure consistency
            const dbContent = updatedStrategy.content || saveContent;

            // Update component state with database response
            setMessagingStrategyContent(dbContent);
            setOriginalStrategyContent(dbContent);

            // Update the query cache with the exact database response
            queryClient.setQueryData(
              ["messaging-strategy", "active", userId],
              () => ({
                ...updatedStrategy,
                content: dbContent,
              })
            );

            // Skip cache invalidation during manual saves to prevent interference
            // queryClient.invalidateQueries({ queryKey: ['messaging-strategy', 'active', userId] });

            // Emergency fallback: Save to localStorage only after successful database save
            localStorage.setItem(
              "generated-messaging-strategy",
              JSON.stringify({
                content: dbContent,
                lastUpdated: new Date().toISOString(),
                migratedToDatabase: true,
              })
            );

            toast({
              title: "✓ Strategy saved",
              description:
                "Your messaging strategy has been updated successfully.",
              className: "border-green-200 bg-green-50",
            });

            // Exit edit mode immediately to prevent useEffect interference
            setEditingStrategy(false);
            setHasUnsavedChanges(false);
          })
          .catch((error) => {
            console.error("Database update failed:", error);
            toast({
              title: "⚠ Save failed",
              description:
                "Network issue detected. Please check your connection and try again.",
              className: "border-orange-200 bg-orange-50 text-orange-900",
            });
            // Keep editing mode open on error so user can retry
          });
      } else {
        // Create new strategy if none exists
        createStrategy.mutate(
          {
            title: "Messaging Strategy",
            content: messagingStrategyContent,
            completionPercentage: 100,
            sourceData: {
              workbookResponses: responses,
              interviewNotes: interviewNotes,
              updatedAt: new Date().toISOString(),
            },
          },
          {
            onSuccess: (newStrategy) => {
              // Refresh component state from database after successful creation
              const savedContent =
                newStrategy?.content || messagingStrategyContent;
              setMessagingStrategyContent(savedContent);
              setOriginalStrategyContent(savedContent);

              // Emergency fallback: Save to localStorage only after successful database save
              localStorage.setItem(
                "generated-messaging-strategy",
                JSON.stringify({
                  content: savedContent,
                  lastUpdated: new Date().toISOString(),
                  migratedToDatabase: true,
                })
              );

              toast({
                title: "✓ Strategy created",
                description:
                  "Your messaging strategy has been saved to database.",
                className: "border-green-200 bg-green-50",
              });
              setEditingStrategy(false);
              setHasUnsavedChanges(false);
            },
            onError: (error) => {
              console.error("Database creation failed:", error);
              toast({
                title: "⚠ Creation failed",
                description:
                  "Network issue detected. Strategy saved locally and will sync when connection is restored.",
                className: "border-orange-200 bg-orange-50 text-orange-900",
              });
              // Keep editing mode open on error so user can retry
            },
          }
        );
      }

      // Emergency fallback: Only save to localStorage on successful database save
      // This prevents state corruption while maintaining offline backup
    } catch (error) {
      console.error("Save operation failed:", error);
      toast({
        title: "Save failed",
        description: "Unable to save your strategy. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Legacy auto-regeneration system replaced with unified regenerateMessagingStrategy
  // This prevents the dual mutation system conflicts

  // Function to preserve messaging strategy responses
  const preserveMessagingResponses = (
    currentResponses: Record<string, string>,
    currentInterviewNotes: Record<string, string>
  ) => {
    // Create a comprehensive record of all data that contributed to the strategy
    const preservedData = {
      responses: currentResponses,
      interviewNotes: currentInterviewNotes,
      timestamp: new Date().toISOString(),
      stepNumber: stepNumber,
    };

    // Save this data separately to maintain question answers
    localStorage.setItem(
      `messaging-strategy-source-data-${userId}`,
      JSON.stringify(preservedData)
    );

    // Ensure current responses are also saved to the standard location
    localStorage.setItem(
      `step-${stepNumber}-responses-${userId}`,
      JSON.stringify(currentResponses)
    );
  };

  // Auto-regeneration disabled to prevent infinite loops
  // Users can manually regenerate strategy using the Generate Strategy button

  // Scroll to target section when workbook tab is active and section is specified
  useEffect(() => {
    if (activeTab === "workbook" && targetSection !== null) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => {
        const sectionElement = document.getElementById(
          `workbook-section-${targetSection}`
        );
        if (sectionElement) {
          sectionElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          // Clear the target section after scrolling
          setTargetSection(null);
          // Clean up URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }, 300);
    }
  }, [activeTab, targetSection]);

  // Helper functions for section completions database persistence
  const isSectionCompleted = (sectionTitle: string) => {
    const isCompleted = sectionCompletions.some(
      (completion) =>
        completion.stepNumber === stepNumber &&
        completion.sectionTitle === sectionTitle
    );
    console.log(
      `Checking completion for "${sectionTitle}":`,
      isCompleted,
      "Available completions:",
      sectionCompletions
    );
    return isCompleted;
  };

  // Real-time completion calculation based on current response lengths
  const calculateLiveCompletion = (sectionTitle: string) => {
    const questionKeys = getSectionQuestionKeys(sectionTitle);
    if (!questionKeys || questionKeys.length === 0) {
      return { completed: 0, total: 0, percentage: 0, isComplete: false };
    }

    const completedQuestions = questionKeys.filter((key: string) => {
      const response = responses[key];
      return response && response.trim().length >= MINIMUM_CHARS;
    });

    const completed = completedQuestions.length;
    const total = questionKeys.length;
    const percentage = Math.round((completed / total) * 100);
    const isComplete = completed === total;

    return { completed, total, percentage, isComplete };
  };

  // Check if section should be completed/uncompleted based on live calculation
  const updateSectionCompletionStatus = async (sectionTitle: string) => {
    const liveCompletion = calculateLiveCompletion(sectionTitle);
    const isDatabaseCompleted = isSectionCompleted(sectionTitle);

    // If live calculation shows complete but database doesn't have it marked
    if (liveCompletion.isComplete && !isDatabaseCompleted) {
      try {
        await markSectionComplete.mutateAsync({
          sectionTitle,
          stepNumber,
          userId: parseInt(userId),
        });

        toast({
          title: "Section Auto-Completed!",
          description: `${sectionTitle} section completed automatically (${liveCompletion.completed}/${liveCompletion.total} questions answered)`,
          duration: 4000,
        });
      } catch (error) {
        console.error("Auto-completion failed:", error);
      }
    }
    // If live calculation shows incomplete but database has it marked as complete
    else if (!liveCompletion.isComplete && isDatabaseCompleted) {
      try {
        await apiRequest("DELETE", "/api/section-completions", {
          userId: parseInt(userId),
          stepNumber,
          sectionTitle,
        });

        // Invalidate cache to update UI
        queryClient.invalidateQueries(["section-completions", userId]! as any);

        toast({
          title: "Section Marked Incomplete",
          description: `${sectionTitle} section no longer meets completion requirements (${liveCompletion.completed}/${liveCompletion.total} questions with sufficient content)`,
          duration: 4000,
        });
      } catch (error) {
        console.error("Auto-uncompletion failed:", error);
      }
    }
  };

  const toggleSectionCompletion = async (sectionTitle: string) => {
    const isCompleted = isSectionCompleted(sectionTitle);

    if (isCompleted) {
      // Unmark as complete - currently not implemented in UI
      console.log(`Unmarking ${sectionTitle} as complete`);
    } else {
      // Mark as complete with optimistic update
      console.log(
        `Marking "${sectionTitle}" as complete for step ${stepNumber}, user ${userId}`
      );

      try {
        await markSectionComplete.mutateAsync({
          userId: Number(userId),
          stepNumber,
          sectionTitle,
        });

        toast({
          title: "Section Completed!",
          description: `${sectionTitle} section has been marked as complete.`,
        });
      } catch (error) {
        console.error("Failed to mark section as complete:", error);
        toast({
          title: "Error",
          description: "Failed to save completion status. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Helper functions for step content
  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Nail Your Messaging";
      case 2:
        return "Create Your Offer Outline";
      case 3:
        return "Build Your Offer";
      case 4:
        return "Sell Your Offer";
      default:
        return "Step Content";
    }
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1:
        return "Perfect your messaging strategy to attract your ideal customers with ease";
      case 2:
        return "";
      case 3:
        return "Build sales pages and customer experience";
      case 4:
        return "Launch and sell your offer";
      default:
        return "";
    }
  };

  // Get hardcoded prompts based on step number
  const getHardcodedPrompts = (stepNum: number) => {
    if (stepNum === 1) {
      return {
        sections: [
          {
            title: "Your Unique Positioning",
            prompts: [
              {
                question:
                  "WHY did you start your business? What makes you uniquely qualified to help your customers?",
                guidance:
                  "This is about your unique wisdom, not just credentials. What life experience taught you something most people never learn? What pattern do you see that others miss? What breakthrough did you have that changed everything? Get specific about YOUR unique insight.",
              },
              {
                question:
                  "What are your superpowers? What have you always been really good at?",
                guidance:
                  "Think about natural talents, skills that come easily to you, or things people always compliment you on. Start with: 'People always tell me I'm great at...' or 'Since I was young, I've had a gift for...'",
              },
              {
                question:
                  "What's your personal story that connects to your expertise?",
                guidance:
                  "Share the journey that led you to this work - your struggles, breakthroughs, or transformation that gives you credibility. Start with: 'Five years ago, I was...' or 'I discovered this approach when I personally faced...'",
              },
              {
                question:
                  "What do you do differently than others in your field?",
                guidance:
                  "Describe your unique methodology, approach, or perspective that makes your solution stand out. Consider: What steps do you take that others skip? What do you focus on that others ignore?",
              },
            ],
          },
          {
            title: "Brand Voice Development",
            prompts: [
              {
                question:
                  "What are your company values that you'd want to come through in your messaging?",
                guidance:
                  "Think about your personal values that translate to company values (direct, empowering, authentic, nurturing). What principles guide how you serve customers? What values do you want people to feel when they interact with your brand?",
              },
              {
                question: "What is your company mission?",
                guidance:
                  "Even if you don't have a formal mission statement, write out why your company exists today. What problem are you solving? What change are you trying to create in the world? Example: 'We exist to help overwhelmed entrepreneurs simplify their business so they can focus on what they love most.'",
              },
              {
                question: "What tone do you want your messaging to have?",
                guidance:
                  "Consider whether you want to sound like a trusted advisor, supportive mentor, expert authority, or encouraging friend. Think about it like this: 'When people read my content, I want them to feel like they're talking to...'",
              },
              {
                question:
                  "How do you want people to FEEL when they interact with your brand?",
                guidance:
                  "Think about the emotional experience you want to create. Do you want them to feel empowered, understood, confident, inspired, safe, or excited? Consider both their initial reaction and how you want them to feel after working with you. Example: 'I want them to feel understood and not alone in their struggles, then empowered and confident they can succeed.'",
              },
              {
                question:
                  "Complete this sentence: 'I help [specific type of person] [achieve what result] by [your unique approach]'",
                guidance:
                  "Be specific about who you serve and how you're different. Example: 'I help overwhelmed small business owners double their revenue without working more hours by implementing my 4-step automation system.'",
              },
              {
                question:
                  "What frustrates you about the way others teach the same content and ideas you do?",
                guidance:
                  "Think about what makes you different from your competition. What approaches do you disagree with? What shortcuts do others take that you think are harmful? This helps identify your unique perspective and what sets you apart from everyone else in your space.",
              },
              {
                question:
                  "What are your clients believing that's keeping them stuck — and you know it's BS?",
                guidance:
                  "Identify the limiting beliefs, myths, or misconceptions your ideal customers have that you know are wrong. What stories do they tell themselves that hold them back? What 'conventional wisdom' in your industry do you know is actually harmful? This helps you address and overcome their mental blocks.",
              },
              {
                question:
                  "What are you willing to say out loud that others tiptoe around?",
                guidance:
                  "What hard truths do you share that others avoid? What uncomfortable conversations are you willing to have? What controversial (but true) stance do you take that others won't? This is where your authentic voice and courage create real differentiation.",
              },
              {
                question:
                  "If you could put a bold message on a billboard in your niche, what would it say?",
                guidance:
                  "Think about the one message you most want everyone in your industry to hear. What would shake people up? What would make them stop and think? This should capture your core belief or mission in a powerful, memorable way that represents your brand's essence.",
              },
            ],
          },
          {
            title: "Customer Avatar Deep Dive",
            prompts: [
              {
                question: "What is your ideal customer's biggest frustration?",
                guidance:
                  "List out as many specific frustrations as possible - you should have a list of 10-15 frustrations here. For each frustration, keep asking 'why' until you get to the root emotional pain. Use their exact words and language whenever possible. Think about what keeps them stuck, defeated, and overwhelmed. Example: 'I'm so tired of trying everything and nothing working. I feel like I'm spinning my wheels. Nothing I do seems to move the needle. I'm starting to think I'm just not cut out for this.'",
              },

              {
                question: "What keeps them awake at night?",
                guidance:
                  "List out as many specific frustrations as possible - you should have a list of 10-15 frustrations here. For each frustration, keep asking 'why' until you get to the root emotional pain. Use their exact words and language whenever possible. Think about what keeps them stuck, defeated, and overwhelmed. Example: 'I'm so tired of trying everything and nothing working. I feel like I'm spinning my wheels. Nothing I do seems to move the needle. I'm starting to think I'm just not cut out for this.'",
              },
              {
                question:
                  "What are they secretly afraid of that they won't admit to others?",
                guidance:
                  "What's the deeper fear they're embarrassed to voice? What would mortify them if others knew? Get specific about their fears and anxieties - what scenarios play on repeat in their mind? What are they worried about at 2am? Example: 'I'm afraid I'm not cut out for this' or 'What if I'm just not smart enough?'",
              },

              {
                question:
                  "If you could wave a magic wand for them and solve their problem, what would that look like?",
                guidance:
                  "List their ultimate, specific desires using their own language. What do they really want most in life? What are they secretly hoping for? Write these desires as if your ideal customer is speaking directly to you. Example: 'I want to feel confident in my own skin,' 'I want to stop worrying about money,' 'I want to feel like I'm actually good at what I do,' 'I want my family to be proud of me.'",
              },

              {
                question:
                  "What is their age range, income level, and job title or role?",
                guidance:
                  "Be specific about who your ideal customer is. Example: '35-50 year old women, $75K-150K household income, marketing managers or consultants, married with 1-2 school-age children.'",
              },

              {
                question:
                  "What have they already tried to solve this problem that didn't work?",
                guidance:
                  "List the specific solutions, courses, coaches, or strategies they've already invested in. Why didn't these work? What was missing? This helps you position against failed alternatives.",
              },

              {
                question:
                  "What is currently blocking them from getting the results they want?",
                guidance:
                  "Identify the real obstacles - both external (time, money, resources) and internal (beliefs, fears, knowledge gaps). What's the biggest barrier they need help overcoming?",
              },
              {
                question:
                  "Where do they go for advice and information (websites, podcasts, influencers)?",
                guidance:
                  "List specific influencers, podcasts, websites, authors, coaches, or thought leaders your ideal customers follow and trust. Include social media accounts, YouTube channels, newsletters, and blogs they regularly consume. This information can also be valuable for future ad targeting and partnership opportunities. Example: 'They follow Amy Porterfield, listen to Smart Passive Income podcast, read Entrepreneur magazine, and are active in Facebook groups like Online Business Builders.'",
              },

              {
                question:
                  "How do they typically make purchasing decisions (research-heavy, impulse, ask others)?",
                guidance:
                  "People often want something different than they need. We can't change what people want, but we can meet them where they're at and bridge the gap between what they want (their desires and what they think they need) and what they actually need (our solutions). What do they think they want? What do they actually need? How can you connect these two?",
              },

              {
                question:
                  "What would need to happen for them to invest in a solution like yours?",
                guidance:
                  "What criteria must be met? What evidence do they need? What would push them over the edge to say yes? Example: 'See proof it works for someone like me, know exactly what I'll get, feel confident about the investment.'",
              },

              {
                question:
                  "How will they measure success after working with you?",
                guidance:
                  "What specific outcomes would make them feel like it was worth it? Be concrete. Example: 'Booking 5 clients per month consistently' or 'Working 25 hours per week instead of 50 while making the same income.'",
              },

              {
                question:
                  "What specific outcomes would make them tell others about your solution?",
                guidance:
                  "What specific outcomes would make them feel like it was worth it? Be concrete. Example: 'Booking 5 clients per month consistently' or 'Working 25 hours per week instead of 50 while making the same income.",
              },
              {
                question:
                  "Is there anything else you think I should know?",
                guidance:
                  "What results would be so compelling they'd naturally recommend you? What would they brag about to friends? This helps you understand what creates raving fans.",
              },
            ],
          },
        ],
      };
    } else if (stepNum === 2) {
      return {
        sections: [
          {
            title: "Offer Foundation",
            prompts: [
              {
                question:
                  "What is the main transformation your offer helps somebody achieve?",
                guidance:
                  "Write ONE extremely powerful sentence in your ideal customer's language. What will somebody be able to know, be or do if they implement everything your offer has to offer? Write it so that if your customer read it back saying 'I want...' it would be exactly what they desperately desire.",
              },
              {
                question:
                  "List out every SPECIFIC problem your ideal customer has and how your offer will solve this problem",
                guidance:
                  "Think about all the frustrations, challenges, and pain points you identified in your messaging strategy. For each problem, explain exactly how your offer addresses it. Example: 'Problem: They're overwhelmed by social media → Solution: My program gives them 30 days of done-for-you content templates.'",
              },
              {
                question:
                  "What dream are you making come true for your ideal customer with this offer?",
                guidance:
                  "Connect directly to your magic wand question from messaging strategy. Write ONE extremely powerful sentence in your ideal customer's language about the dream outcome they'll achieve.",
              },
              {
                question:
                  "What makes your approach different and better than what's already out there?",
                guidance:
                  "Describe your specific approach, method, or system that sets you apart. What do you do that others don't? What's your unique methodology or framework that gets better results?",
              },
            ],
          },
          {
            title: "Offer Structure & Delivery",
            prompts: [
              {
                question:
                  "What are the 3-5 core components of your offer? (Your unique method, process, or step-by-step system)",
                guidance:
                  "Break down YOUR specific methodology into clear components. Don't be generic - define your unique process. Example: 'The Authority Accelerator Method: 1) Message Clarity Blueprint, 2) Content Creation System, 3) Audience Building Strategy, 4) Conversion Optimization Process.'",
              },
              {
                question:
                  "What timeline will you promise and what milestones will they hit along the way?",
                guidance:
                  "Map out a clear delivery roadmap with specific 30/60/90-day promises. What will they accomplish by each milestone? Be specific about progress markers they can expect to hit.",
              },
              {
                question:
                  "How will you deliver this transformation (format, frequency, duration)?",
                guidance:
                  "Describe the exact delivery method. Example: '8-week intensive with weekly 90-minute group calls, daily email lessons, private Facebook community, and monthly 1:1 strategy sessions.'",
              },
            ],
          },
          {
            title: "Pricing & Positioning",
            prompts: [
              {
                question:
                  "What is the financial value of the transformation you provide?",
                guidance:
                  "Calculate both the value they gain AND the cost of NOT taking action. What does staying stuck cost them monthly/yearly? What opportunities are they missing? Make inaction feel more expensive than your offer price.",
              },
              {
                question:
                  "What do they currently spend trying to solve this problem?",
                guidance:
                  "Research what they're already investing in failed solutions, other courses, tools, or services. Position your offer as better value than continuing to waste money on things that don't work.",
              },
              {
                question:
                  "What price point feels aligned with the transformation you provide?",
                guidance:
                  "Consider the value delivered, your positioning in the market, and what your ideal customer can invest. Price should feel like a no-brainer compared to the cost of staying stuck.",
              },
            ],
          },
          {
            title: "Offer Presentation",
            prompts: [
              {
                question:
                  "What support will you provide throughout their journey?",
                guidance:
                  "Define exactly how you'll guide them through challenges. Include frequency of contact, response times, and what's included. Make them feel supported and confident they won't be left alone.",
              },
              {
                question: "What guarantees or promises can you make?",
                guidance:
                  "Offer a guarantee that reduces their risk while protecting your business. Focus on process guarantees (if you do X, you'll get Y) rather than outcome guarantees. Make it feel safe to invest.",
              },
            ],
          },
        ],
      };
    } else if (stepNum === 3) {
      return {
        sections: [
          {
            title: "Customer Experience Design",
            prompts: [
              {
                question:
                  "How will you deliver your offer to customers (online course, group coaching, 1:1 sessions, etc.)?",
                guidance:
                  "Define your specific delivery method and format. Consider what works best for your content and your customer's learning style. Example: '8-week online course with weekly group calls and private community access.'",
              },
              {
                question:
                  "What will the customer journey look like from purchase to completion?",
                guidance:
                  "Map out the complete experience from when they buy to when they finish. Include onboarding, weekly touchpoints, milestones, and completion celebration. Think about how to keep them engaged and successful throughout.",
              },
              {
                question:
                  "How will you communicate with customers throughout their experience?",
                guidance:
                  "Define your communication cadence and channels. How often will you check in? What platforms will you use? How will you provide support and encouragement along the way?",
              },
              {
                question:
                  "What systems will you need to support and track customer success?",
                guidance:
                  "Consider what tools, platforms, or processes you'll need to deliver consistently. Think about content hosting, community platforms, scheduling systems, and progress tracking methods.",
              },
              {
                question:
                  "How will you ensure customers get results and stay engaged?",
                guidance:
                  "Design accountability measures, milestone celebrations, and success tracking. What will keep them motivated? How will you identify and help struggling customers? What completion incentives will you offer?",
              },
            ],
          },
          {
            title: "Sales Page Content",
            prompts: [
              {
                question:
                  "What compelling headline will grab your ideal customer's attention?",
                guidance:
                  "Create a headline that speaks directly to their biggest desire or pain point. Use your customer's language from your messaging strategy. Focus on the transformation or outcome they want most.",
              },
              {
                question:
                  "What are the key benefits and outcomes you'll highlight?",
                guidance:
                  "List the specific, tangible results customers will achieve. Focus on outcomes rather than features. Use numbers, timeframes, and concrete examples when possible.",
              },
              {
                question:
                  "What social proof and testimonials will you include?",
                guidance:
                  "Plan what kinds of success stories will resonate most with your ideal customers. If you don't have testimonials yet, consider pilot program participants, case studies, or your own transformation story.",
              },
              {
                question:
                  "How will you address the main objections customers might have?",
                guidance:
                  "Anticipate common concerns like time, money, capability, or past failures. Address each objection with empathy and provide reassuring responses that remove barriers to purchase.",
              },
              {
                question: "What guarantee or risk reversal will you offer?",
                guidance:
                  "Design a guarantee that makes the customer feel safe while protecting your business. Focus on process guarantees or satisfaction guarantees rather than unrealistic outcome promises.",
              },
            ],
          },
          {
            title: "Project Planning",
            prompts: [
              {
                question:
                  "What are the main phases of creating and launching your offer?",
                guidance:
                  "Break down your offer creation into logical phases: content creation, platform setup, testing, marketing materials, and launch. Assign realistic timeframes to each phase.",
              },
              {
                question:
                  "What's your realistic timeline for completing each phase?",
                guidance:
                  "Be honest about the time needed for content creation, revisions, technical setup, and testing. Most entrepreneurs underestimate by 50-100%. Plan for iteration and unexpected challenges.",
              },
              {
                question:
                  "What resources and tools do you need for each phase?",
                guidance:
                  "List specific requirements: content creation tools, hosting platforms, payment processing, community platforms, design resources, and any team members or contractors needed.",
              },
              {
                question:
                  "Who will you involve in the creation and delivery process?",
                guidance:
                  "Identify team members, contractors, advisors, or partners who can help. Consider areas where you need support: content creation, technical setup, design, marketing, or ongoing delivery.",
              },
              {
                question:
                  "What are the key milestones that will indicate you're on track?",
                guidance:
                  "Define specific completion markers for each phase. Examples: 'Content outline complete,' 'First module recorded,' 'Beta testing launched,' 'Sales page live.' Use these to track progress and celebrate wins.",
              },
            ],
          },
        ],
      };
    } else if (stepNum === 4) {
      return {
        sections: [
          {
            title: "Sales Strategy",
            prompts: [
              {
                question:
                  "Where does your ideal customer spend their time online?",
                guidance:
                  "List specific platforms, groups, communities, and websites where your target audience is most active. Examples: 'LinkedIn groups for small business owners,' 'Facebook groups for working moms,' 'Industry-specific forums or Slack communities.'",
              },
              {
                question:
                  "What type of content will you create to provide immediate value?",
                guidance:
                  "Define your content strategy that demonstrates expertise while helping your audience. Consider formats like tips, frameworks, case studies, or behind-the-scenes content that builds trust before making any offers.",
              },
              {
                question:
                  "How will you build relationships before making sales offers?",
                guidance:
                  "Describe your relationship-building approach. Focus on genuine connection, value-first interactions, and trust-building activities that establish you as a helpful resource rather than just another seller.",
              },
              {
                question: "What is your networking and outreach strategy?",
                guidance:
                  "Plan how you'll connect with potential customers and referral partners. Include both online networking (social media engagement, group participation) and offline opportunities (events, partnerships, word-of-mouth).",
              },
            ],
          },
          {
            title: "Customer Locations",
            prompts: [
              {
                question:
                  "What specific Facebook groups or LinkedIn communities does your ideal customer participate in?",
                guidance:
                  "Research and list actual group names, member counts, and activity levels. Focus on communities where your ideal customers are actively seeking help and advice in your area of expertise.",
              },
              {
                question:
                  "Where do they go for professional development and learning?",
                guidance:
                  "Identify conferences, workshops, online courses, podcasts, or educational platforms your ideal customers use to improve their skills or solve problems you can help with.",
              },
              {
                question:
                  "What local or industry events could you attend to meet them?",
                guidance:
                  "List specific networking events, trade shows, meetups, or conferences where you could build relationships with potential customers or referral partners in person.",
              },
            ],
          },
          {
            title: "Daily Planning",
            prompts: [
              {
                question: "How many new connections will you make each day?",
                guidance:
                  "Set realistic daily goals for new relationship building. Consider your available time and energy. Examples: '5 LinkedIn connections per day,' '2 meaningful comments in Facebook groups,' '1 follow-up conversation.'",
              },
              {
                question:
                  "What's your daily content creation and sharing plan?",
                guidance:
                  "Plan how you'll consistently show up with valuable content. Define posting frequency, content types, and platforms you'll focus on to build authority and attract your ideal customers.",
              },
              {
                question:
                  "How will you track and follow up on new connections?",
                guidance:
                  "Describe your system for managing relationships and follow-up conversations. Include how you'll track contact information, conversation history, and next steps to nurture relationships into customers.",
              },
            ],
          },
          {
            title: "Connection Strategy",
            prompts: [
              {
                question:
                  "What will your initial connection message templates include?",
                guidance:
                  "Create authentic, personal message templates for different scenarios (LinkedIn connections, Facebook group interactions, email introductions). Focus on value and genuine interest rather than immediate sales pitches.",
              },
              {
                question:
                  "How will you provide value in your follow-up conversations?",
                guidance:
                  "Plan specific ways to help new connections before asking for anything. Consider sharing resources, making introductions, offering free advice, or providing useful insights related to their challenges.",
              },
              {
                question: "When and how will you introduce your paid offer?",
                guidance:
                  "Define the right timing and approach for presenting your offer. Focus on natural conversation flow where your solution clearly addresses problems they've shared with you.",
              },
            ],
          },
          {
            title: "Sales Conversations",
            prompts: [
              {
                question: "How will you structure your sales conversations?",
                guidance:
                  "Outline your conversation flow from relationship building to needs discovery to solution presentation. Focus on understanding their situation before presenting how you can help.",
              },
              {
                question:
                  "What questions will you ask to understand their needs?",
                guidance:
                  "Prepare specific questions that help you understand their challenges, goals, previous attempts at solving the problem, and what success looks like for them.",
              },
              {
                question: "How will you handle common objections or concerns?",
                guidance:
                  "Anticipate typical responses like 'I need to think about it,' 'It's too expensive,' or 'I don't have time.' Prepare empathetic responses that address concerns while reinforcing value.",
              },
            ],
          },
        ],
      };
    }
    return { sections: [] };
  };

  // Memoize stepContent to prevent infinite re-renders
  const stepContent: StepContent = useMemo(
    () => ({
      title: getStepTitle(stepNumber),
      description: getStepDescription(stepNumber),
      tips: [],
      workbookUrl: "",
      videos:
        stepNumber === 1
          ? {
              vimeoIds: ["1094140391"],
              titles: ["Your Messaging Strategy"],
              descriptions: ["Learn to develop powerful messaging"],
            }
          : stepNumber === 2
          ? {
              vimeoIds: ["1094153008"],
              titles: ["Create Your Offer Outline"],
              descriptions: ["Build compelling offers that convert"],
            }
          : stepNumber === 3
          ? {
              vimeoIds: ["1094424213"],
              titles: ["Build Your Offer"],
              descriptions: ["Learn to build and deliver your offer"],
            }
          : stepNumber === 4
          ? {
              vimeoIds: ["1094441555"],
              titles: ["Sell Your Offer"],
              descriptions: ["Master the art of selling your offer"],
            }
          : {},
      interactivePrompts: getHardcodedPrompts(stepNumber) as any,
    }),
    [stepNumber]
  );

  const { data: userProgress } = useQuery<any>({
    queryKey: [`/api/user-progress/${userId}/${stepNumber}`],
    enabled: false, // We'll implement this endpoint later
  });

  // Mutations for saving progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: {
      responses: Record<string, string>;
      completedVideos: number[];
    }) => {
      // We'll implement this endpoint
      return apiRequest("POST", `/api/user-progress`, {
        userId,
        stepNumber,
        completedPrompts: data.responses,
        // Additional fields based on responses
      });
    },
    onSuccess: () => {
      toast({ title: "Progress saved successfully" });
      // PHASE 2 FIX: Commented out unused progress invalidation to prevent additional query cascades
      // queryClient.invalidateQueries({ queryKey: [`/api/user-progress/${userId}/${stepNumber}`] });
    },
  });

  // Get section question keys from actual database responses
  const getSectionQuestionKeys = (sectionTitle: string): string[] => {
    // Filter responses to get question keys that start with the section title
    return Object.keys(responses).filter((key) =>
      key.startsWith(`${sectionTitle}-`)
    );
  };

  // Auto-completion logic
  const MINIMUM_CHARS = 25; // Minimum characters for a question to be considered "completed"

  const checkSectionAutoCompletion = async (sectionTitle: string) => {
    const questionKeys = getSectionQuestionKeys(sectionTitle);
    if (!questionKeys || questionKeys.length === 0) return;

    const completedQuestions = questionKeys.filter((key) => {
      const response = responses[key];
      return response && response.trim().length >= MINIMUM_CHARS;
    });

    const isCurrentlyCompleted = isSectionCompleted(sectionTitle);
    const shouldBeCompleted = completedQuestions.length === questionKeys.length;

    console.log(
      `Checking completion for "${sectionTitle}":`,
      shouldBeCompleted,
      `Completed: ${completedQuestions.length}/${questionKeys.length}`
    );

    // Auto-mark complete when all questions have meaningful responses
    if (shouldBeCompleted && !isCurrentlyCompleted) {
      try {
        await markSectionComplete.mutateAsync({
          sectionTitle,
          stepNumber,
          userId: parseInt(userId),
        });

        // Show success notification
        toast({
          title: "Section Auto-Completed!",
          description: `${sectionTitle} section completed automatically (${completedQuestions.length}/${questionKeys.length} questions answered)`,
          duration: 4000,
        });
      } catch (error) {
        console.error("Auto-completion failed:", error);
      }
    }
  };

  // Simple completion checking with timeout management (no external debounce library)
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedCompletionCheck = useCallback(
    async (sectionTitle: string) => {
      // Clear existing timeout
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      // Set new timeout
      completionTimeoutRef.current = setTimeout(async () => {
        await updateSectionCompletionStatus(sectionTitle);
      }, 1000);
    },
    [updateSectionCompletionStatus]
  );

  // Simple auto-completion with timeout management
  const autoCompletionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedAutoCompletion = useCallback(
    async (promptKey: string, value: string) => {
      // Clear existing timeout
      if (autoCompletionTimeoutRef.current) {
        clearTimeout(autoCompletionTimeoutRef.current);
      }

      // Set new timeout
      autoCompletionTimeoutRef.current = setTimeout(async () => {
        // Extract section title from promptKey (format: "Section Title-Question Text")
        const [sectionTitle] = promptKey.split("-");

        if (sectionTitle) {
          await checkSectionAutoCompletion(sectionTitle);
        }
      }, 1000);
    },
    [checkSectionAutoCompletion]
  );

  // Enhanced Interactive AI Coaching mutation
  const interactiveCoachingMutation = useMutation({
    mutationFn: async ({
      section,
      questionContext,
      userResponse,
      messagingStrategy,
    }: {
      section: string;
      questionContext: string;
      userResponse: string;
      messagingStrategy?: string;
    }) => {
      // Use passed messaging strategy or get from localStorage
      let strategyContent = messagingStrategy;
      if (!strategyContent) {
        try {
          const savedStrategy = localStorage.getItem(
            `messaging-strategy-${userId}`
          );
          if (savedStrategy) {
            const parsed = JSON.parse(savedStrategy);
            strategyContent = parsed.content || parsed;
          }
        } catch (e) {
          // No messaging strategy available
        }
      }

      const res = await apiRequest("POST", "/api/interactive-coaching", {
        section,
        questionContext,
        userResponse,
        userId,
        messagingStrategy: strategyContent,
      });
      return await res.json();
    },
    onSuccess: (data: any, variables) => {
      const promptKey = `${variables.section}-${variables.questionContext}`;

      console.log("Interactive coaching received:", data);

      // Store the enhanced coaching data
      if (data && typeof data === "object" && data.level) {
        setFeedback((prev) => {
          const newFeedback = { ...prev, [promptKey]: data };
          return newFeedback;
        });
      }
      setAnalyzingResponse(null);
    },
    onError: () => {
      setAnalyzingResponse(null);
      toast({
        title: "Coaching unavailable",
        description:
          "AI coaching is temporarily unavailable. Please continue with your response.",
        variant: "destructive",
      });
    },
  });

  // AI Response Expansion mutation
  const expandResponseWithAI = async (
    section: string,
    question: string,
    currentResponse: string,
    promptKey: string
  ) => {
    if (expandingResponse === promptKey) return;

    setExpandingResponse(promptKey);

    try {
      const response = await apiRequest("POST", "/api/expand-response", {
        initialResponse: currentResponse,
        questionContext: question,
        questionType: section,
      });
      const data = await response.json();

      if (data.expandedResponse) {
        handleResponseChange(promptKey, data.expandedResponse);
        toast({
          title: "Response expanded",
          description:
            "AI has enhanced your response with additional depth and detail.",
        });
      }
    } catch (error) {
      console.error("Response expansion error:", error);
      toast({
        title: "Expansion failed",
        description: "Unable to expand response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExpandingResponse(null);
    }
  };

  // Legacy AI Feedback mutation (keeping for compatibility)
  const analyzeResponseMutation = useMutation({
    mutationFn: async ({
      section,
      prompt,
      response,
    }: {
      section: string;
      prompt: string;
      response: string;
    }) => {
      const res = await apiRequest("POST", "/api/analyze-response", {
        section,
        prompt,
        response,
        userId,
      });
      return await res.json();
    },
    onSuccess: (data: any, variables) => {
      // Use the same key format as used in the component rendering
      const feedbackKey = variables.prompt;

      console.log("Frontend received feedback data:", data);
      console.log("Storing with key:", feedbackKey);

      // Ensure we're storing valid feedback data
      if (data && typeof data === "object" && data.level) {
        setFeedback((prev) => {
          const newFeedback = { ...prev, [feedbackKey]: data };
          console.log("Updated feedback state:", newFeedback);
          return newFeedback;
        });
      }
      setAnalyzingResponse(null);
    },
    onError: () => {
      setAnalyzingResponse(null);
      toast({
        title: "Analysis failed",
        description:
          "Unable to analyze your response right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI Avatar Synthesis mutation
  const synthesizeAvatarMutation = useMutation({
    mutationFn: async (interviewNotes: any) => {
      return apiRequest("POST", "/api/synthesize-avatar", { interviewNotes });
    },
    onSuccess: (avatarData: any) => {
      // Automatically populate customer avatar questions with synthesized data
      const avatarResponses: Record<string, string> = {};

      // Map synthesized data to the corresponding customer avatar prompts using exact database questions
      avatarResponses[
        "Customer Avatar Deep Dive-What is your ideal customer's biggest frustration?"
      ] = avatarData.frustration;
      avatarResponses[
        "Customer Avatar Deep Dive-What are their deepest fears and anxieties about their situation?"
      ] = avatarData.fears;
      avatarResponses[
        "Customer Avatar Deep Dive-If you could wave a magic wand for them and solve their problem, what would that look like?"
      ] = avatarData.perfectDay;
      avatarResponses[
        "Customer Avatar Deep Dive-What is their age range, income level, and job title or role?"
      ] = `Age: ${avatarData.age}, Income: ${avatarData.income}, Role: ${avatarData.jobTitle}`;
      avatarResponses[
        "Customer Avatar Deep Dive-What have they already tried to solve this problem that didn't work?"
      ] = avatarData.previousSolutions;
      avatarResponses[
        "Customer Avatar Deep Dive-What is currently blocking them from getting the results they want?"
      ] = avatarData.blockers;
      avatarResponses[
        "Customer Avatar Deep Dive-Where do they go for advice and information (websites, podcasts, influencers)?"
      ] = avatarData.informationSources;
      avatarResponses[
        "Customer Avatar Deep Dive-How do they typically make purchasing decisions (research-heavy, impulse, ask others)?"
      ] = avatarData.decisionMaking;
      avatarResponses[
        "Customer Avatar Deep Dive-What would need to happen for them to invest in a solution like yours?"
      ] = avatarData.investmentCriteria;
      avatarResponses[
        "Customer Avatar Deep Dive-How will they measure success after working with you?"
      ] = avatarData.successMeasures;
      avatarResponses[
        "Customer Avatar Deep Dive-What specific outcomes would make them tell others about your solution?"
      ] = avatarData.outcomes;

      // Save synthesized responses to database - AUTO-SAVE enabled
      Object.entries(avatarResponses).forEach(([questionKey, responseText]) => {
        console.log(
          `[AUTO-SAVE] Saving avatar synthesis for ${questionKey} (step ${stepNumber})`
        );
        saveResponse.mutate({
          questionKey,
          responseText,
          sectionTitle: "Customer Avatar Deep Dive",
        });
      });

      toast({
        title: "Customer avatar updated!",
        description:
          "Your interview insights have been intelligently synthesized into your customer avatar section.",
      });
    },
    onError: () => {
      toast({
        title: "Synthesis failed",
        description:
          "Unable to synthesize interview notes right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI Response Expansion mutation
  const expandResponseMutation = useMutation({
    mutationFn: async ({
      initialResponse,
      questionContext,
      questionType,
    }: {
      initialResponse: string;
      questionContext: string;
      questionType: string;
    }) => {
      return apiRequest("POST", "/api/expand-response", {
        initialResponse,
        questionContext,
        questionType,
      });
    },
    onSuccess: (data: any, variables) => {
      const promptKey = `${variables.questionType}-${variables.questionContext}`;
      // AUTO-SAVE: Save AI expanded responses automatically
      console.log(
        `[AUTO-SAVE] Saving AI expansion for ${promptKey} (step ${stepNumber})`
      );
      saveResponse.mutate({
        questionKey: promptKey,
        responseText: data.expandedResponse,
        sectionTitle: variables.questionContext,
      });
      toast({
        title: "Response expanded!",
        description:
          "AI has helped develop your response with more depth and emotion.",
      });
    },
    onError: () => {
      toast({
        title: "Expansion failed",
        description:
          "Unable to expand your response right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Smart placement mutation for additional insights
  const smartPlacementMutation = useMutation({
    mutationFn: async ({
      customerAnswer,
      currentResponses,
    }: {
      customerAnswer: string;
      currentResponses: Record<string, string>;
    }) => {
      return apiRequest("POST", "/api/smart-placement", {
        customerAnswer,
        currentResponses,
      });
    },
    onSuccess: (data: any, variables) => {
      // The question key for "Is there anything else you think I should know?"
      const autoPlacementQuestionKey =
        "Customer Avatar Deep Dive-Is there anything else you think I should know?";

      // Update the appropriate workbook sections with the placed content
      if (data.placements && data.placements.length > 0) {
        const updates: Record<string, string> = {};
        data.placements.forEach((placement: any) => {
          const currentContent = responses[placement.workbookKey] || "";
          const separator = currentContent ? "\n\n" : "";
          updates[placement.workbookKey] =
            currentContent + separator + placement.transformedContent;
        });

        // Also save the original customer answer to the "Automatically placed" question
        // This ensures the value shows up in the input field
        if (variables.customerAnswer && variables.customerAnswer.trim()) {
          const currentAutoPlacementValue =
            responses[autoPlacementQuestionKey] || "";
          // If there's existing content, append with separator; otherwise use the customer answer
          if (currentAutoPlacementValue.trim()) {
            updates[autoPlacementQuestionKey] =
              currentAutoPlacementValue + "\n\n" + variables.customerAnswer;
          } else {
            updates[autoPlacementQuestionKey] = variables.customerAnswer;
          }

          // Update local state immediately for responsive UI
          setLocalResponses((prev) => ({
            ...prev,
            [autoPlacementQuestionKey]: updates[autoPlacementQuestionKey],
          }));
        }

        // Save each update to database - AUTO-SAVE enabled
        Object.entries(updates).forEach(([questionKey, responseText]) => {
          console.log(
            `[AUTO-SAVE] Saving smart placement for ${questionKey} (step ${stepNumber})`
          );
          saveResponse.mutate(
            {
              questionKey,
              responseText,
              sectionTitle:
                questionKey === autoPlacementQuestionKey
                  ? "Customer Avatar Deep Dive"
                  : "Smart Placement",
            },
            {
              onSuccess: () => {
                // Invalidate queries after successful save to refresh UI
                queryClient.invalidateQueries({
                  queryKey: [
                    `/api/workbook-responses/user/${memoizedUserId}/step/${stepNumber}`,
                  ],
                });
                console.log(
                  `[AUTO-SAVE] Invalidated queries after saving ${questionKey}`
                );
              },
            }
          );
        });

        toast({
          title: "Insights placed intelligently!",
          description: `Added to ${data.placements.length} messaging strategy section(s) based on content analysis.`,
        });
      } else {
        // Even if no placements were made, save the customer answer to the auto-placement question
        if (variables.customerAnswer && variables.customerAnswer.trim()) {
          const currentAutoPlacementValue =
            responses[autoPlacementQuestionKey] || "";
          const newValue = currentAutoPlacementValue.trim()
            ? currentAutoPlacementValue + "\n\n" + variables.customerAnswer
            : variables.customerAnswer;

          // Update local state immediately for responsive UI
          setLocalResponses((prev) => ({
            ...prev,
            [autoPlacementQuestionKey]: newValue,
          }));

          console.log(
            `[AUTO-SAVE] Saving customer answer to auto-placement question (step ${stepNumber})`
          );
          saveResponse.mutate(
            {
              questionKey: autoPlacementQuestionKey,
              responseText: newValue,
              sectionTitle: "Customer Avatar Deep Dive",
            },
            {
              onSuccess: () => {
                // Invalidate queries after successful save to refresh UI
                queryClient.invalidateQueries({
                  queryKey: [
                    `/api/workbook-responses/user/${memoizedUserId}/step/${stepNumber}`,
                  ],
                });
                console.log(
                  `[AUTO-SAVE] Invalidated queries after saving auto-placement question`
                );
              },
            }
          );
        }
      }
    },
    onError: () => {
      toast({
        title: "Placement failed",
        description:
          "Unable to analyze and place the insights right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Transcript parsing mutation
  const parseTranscriptMutation = useMutation({
    mutationFn: async ({ transcript }: { transcript: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/parse-interview-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      if (
        data.extractedAnswers &&
        Object.keys(data.extractedAnswers).length > 0
      ) {
        // Update interview notes with extracted answers
        const updates: Record<string, string> = {};
        Object.entries(data.extractedAnswers).forEach(([key, answer]) => {
          if (
            answer &&
            typeof answer === "string" &&
            answer.trim() &&
            answer.trim().length > 3
          ) {
            updates[key] = answer as string;
          }
        });
        if (Object.keys(updates).length > 0) {
          const newNotes = { ...interviewNotes, ...updates };
          setInterviewNotes(newNotes);
          localStorage.setItem(
            `interview-notes-${userId}`,
            JSON.stringify(newNotes)
          );

          // Save all extracted answers to database
          fetch("/api/interview-notes/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              userId: parseInt(userId),
              notes: updates,
              source: "transcript",
            }),
          });

          setTranscriptText("");
          setShowTranscriptUpload(false);

          const successMessage = data.fallbackUsed
            ? `Processed transcript using smart analysis (AI temporarily unavailable). Extracted ${
                Object.keys(updates).length
              } responses.`
            : `AI processing complete! Extracted ${
                Object.keys(updates).length
              } detailed answers from your interview transcript.`;

          toast({
            title: "Transcript processed successfully!",
            description: successMessage,
          });
        } else {
          // No useful content extracted
          toast({
            title: "No structured answers found",
            description:
              "The transcript appears to be general conversation. Please paste specific customer responses to the interview questions manually.",
            variant: "destructive",
          });
        }
      } else if (data.error) {
        // API returned an error message (like rate limit)
        toast({
          title: "Processing temporarily unavailable",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No answers extracted",
          description:
            "Unable to find structured interview responses. Please paste individual answers manually.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Transcript parsing error:", error);
      toast({
        title: "Processing failed",
        description:
          "Unable to parse the transcript. Please paste individual customer responses manually.",
        variant: "destructive",
      });
    },
  });

  // Intelligent synthesis mutation for dynamic interview processing
  const synthesizeMutation = useMutation({
    mutationFn: async ({
      interviewResponse,
      workbookSection,
      buttonKey,
    }: {
      interviewResponse: {
        question: string;
        customerAnswer: string;
        workbookSection: string;
      };
      workbookSection: string;
      buttonKey: string;
    }) => {
      // Set individual button loading state
      setTransferringButtons((prev) => ({ ...prev, [buttonKey]: true }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/interview/synthesize-interview-response`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              interviewResponse,
              existingMessagingStrategy: responses,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error:any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error(
            "Request timed out after 20 seconds. Please try again."
          );
        }
        throw error;
      }
    },
    onSuccess: (data: any, variables) => {
      // DEBUG LOGGING: Track successful transfer
      console.log(
        `[TRANSFER DEBUG] SUCCESS - Button: ${
          variables.buttonKey
        }, PromptKey: ${
          variables.interviewResponse.workbookSection
        }, Content Length: ${data.synthesizedContent?.length || 0}`
      );
      setTransferButtonHistory((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          buttonKey: variables.buttonKey,
          promptKey: variables.interviewResponse.workbookSection,
          questionText: variables.interviewResponse.question,
          action: "success",
          content:
            data.synthesizedContent?.substring(0, 200) + "..." || "No content",
        },
      ]);

      // Clear loading state first
      setTransferringButtons((prev) => ({
        ...prev,
        [variables.buttonKey]: false,
      }));

      // Update local state immediately for responsive UI
      setLocalResponses((prev) => ({
        ...prev,
        [variables.interviewResponse.workbookSection]: data.synthesizedContent,
      }));

      // Clear unsaved changes immediately for this question
      unsavedChanges.clearChange(variables.interviewResponse.workbookSection);

      // Simple dedicated transfer endpoint with proper response handling
      fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/interview/transfer-interview-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId: memoizedUserId,
            stepNumber,
            questionKey: variables.interviewResponse.workbookSection,
            responseText: data.synthesizedContent,
            sectionTitle:
              variables.interviewResponse.workbookSection.split("-")[0],
          }),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          console.log("Transfer save successful");
          // Set success state only after successful save
          setTransferErrorButtons((prev) => ({
            ...prev,
            [variables.buttonKey]: false,
          }));
          setTransferSuccessButtons((prev) => ({
            ...prev,
            [variables.buttonKey]: true,
          }));

          // Force immediate cache invalidation and refetch for workbook responses
          queryClient.invalidateQueries({
            queryKey: ["workbook-responses", memoizedUserId, stepNumber],
          });
          queryClient.refetchQueries({
            queryKey: ["workbook-responses", memoizedUserId, stepNumber],
          });

          // CRITICAL: Also refresh messaging strategy to show transfer updates
          queryClient.invalidateQueries({
            queryKey: ["messaging-strategy", "active", memoizedUserId],
          });
          queryClient.refetchQueries({
            queryKey: ["messaging-strategy", "active", memoizedUserId],
          });

          console.log("[TRANSFER SOURCE DEBUG] Transfer completed:", {
            transferredContent:
              data.synthesizedContent.substring(0, 200) + "...",
            transferredLength: data.synthesizedContent.length,
            targetQuestion: variables.interviewResponse.workbookSection,
            userId: memoizedUserId,
          });

          console.log(
            "[TRANSFER] Triggered messaging strategy refresh after successful transfer"
          );
        })
        .catch((error) => {
          console.error("Transfer save failed:", error);
          // Set error state if transfer fails
          setTransferErrorButtons((prev) => ({
            ...prev,
            [variables.buttonKey]: true,
          }));
          setTransferSuccessButtons((prev) => ({
            ...prev,
            [variables.buttonKey]: false,
          }));
        });

      // Enhanced success messaging with specific question reference
      const questionName =
        variables.interviewResponse.question.length > 50
          ? variables.interviewResponse.question.substring(0, 50) + "..."
          : variables.interviewResponse.question;

      toast({
        title: "Insight Successfully Transferred!",
        description: `"${questionName}" has been intelligently woven into your messaging strategy.`,
        duration: 4000,
      });

      // Auto-clear success state with fade animation
      setTimeout(() => {
        setTransferSuccessButtons((prev) => ({
          ...prev,
          [variables.buttonKey]: false,
        }));
      }, 4000);
    },
    onError: (error: any, variables) => {
      console.error("Synthesis error:", error);

      // DEBUG LOGGING: Track failed transfer
      console.log(
        `[TRANSFER DEBUG] ERROR - Button: ${variables.buttonKey}, PromptKey: ${variables.interviewResponse.workbookSection}, Error: ${error.message}`
      );
      setTransferButtonHistory((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          buttonKey: variables.buttonKey,
          promptKey: variables.interviewResponse.workbookSection,
          questionText: variables.interviewResponse.question,
          action: "error",
          error: error.message,
        },
      ]);

      // Clear loading state and set error state
      setTransferringButtons((prev) => ({
        ...prev,
        [variables.buttonKey]: false,
      }));
      setTransferSuccessButtons((prev) => ({
        ...prev,
        [variables.buttonKey]: false,
      }));
      setTransferErrorButtons((prev) => ({
        ...prev,
        [variables.buttonKey]: true,
      }));

      // Determine error type for appropriate handling
      const isTimeout = error.message?.includes("timed out");
      const isRateLimit =
        error.message?.includes("rate limit") || error.message?.includes("429");
      const isNetworkError = error.message?.includes("fetch");

      // Fallback to basic transformation with enhanced error messaging
      const basicTransform = variables.interviewResponse.customerAnswer
        .replace(/\bI\b/g, "They")
        .replace(/\bmy\b/g, "their")
        .replace(/\bme\b/g, "them")
        .replace(/\bmyself\b/g, "themselves")
        .replace(/\bam\b/g, "are")
        .replace(/\bwas\b/g, "were");

      // Simple dedicated transfer endpoint for error fallback with proper response handling
      fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/interview/transfer-interview-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId: memoizedUserId,
            stepNumber,
            questionKey: variables.interviewResponse.workbookSection,
            responseText: basicTransform,
            sectionTitle:
              variables.interviewResponse.workbookSection.split("-")[0],
          }),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          console.log("Transfer save successful (error fallback)");
        })
        .catch((error) => {
          console.error("Transfer save failed:", error);
          // Keep error state if transfer also fails
        });

      // Update local state for immediate UI feedback
      const sectionTitle =
        variables.interviewResponse.workbookSection.split("-")[0];
      saveResponse.mutate({
        questionKey: variables.interviewResponse.workbookSection,
        responseText: basicTransform,
        sectionTitle,
      });

      let errorTitle = "Transfer completed with basic conversion";
      let errorDescription =
        "AI synthesis unavailable - used basic first-person to third-person conversion.";
      let showRetry = false;

      if (isTimeout) {
        errorTitle = "Request timed out";
        errorDescription =
          "AI synthesis took too long. Used basic conversion instead. Click Retry for AI synthesis.";
        showRetry = true;
      } else if (isRateLimit) {
        errorTitle = "AI temporarily busy";
        errorDescription =
          "Too many requests. Used basic conversion instead. Try again in a few minutes.";
        showRetry = true;
      } else if (isNetworkError) {
        errorTitle = "Connection issue";
        errorDescription =
          "Network problem detected. Used basic conversion instead. Check your connection and retry.";
        showRetry = true;
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
        duration: showRetry ? 8000 : 5000,
      });

      // Auto-clear error state after 6 seconds
      setTimeout(() => {
        setTransferErrorButtons((prev) => ({
          ...prev,
          [variables.buttonKey]: false,
        }));
      }, 6000);
    },
  });

  // Handler for bulk transfer of all interview answers
  const handleBulkTransfer = async () => {
    const now = Date.now();
    const buttonKey = "bulk-transfer-all";

    // Debounce clicks - prevent double submissions within 3 seconds
    if (lastClickTime[buttonKey] && now - lastClickTime[buttonKey] < 3000) {
      toast({
        title: "Please wait",
        description:
          "Bulk transfer already in progress. Please wait before trying again.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Update last click time
    setLastClickTime((prev) => ({ ...prev, [buttonKey]: now }));

    // Define the interview questions array (same as in the JSX)
    const interviewQuestions = [
      {
        question: "What is your ideal customer's biggest frustration?",
        key: "frustrations",
        workbookKey:
          "Customer Avatar Deep Dive-What is your ideal customer's biggest frustration?",
        workbookMap: "What is your ideal customer's biggest frustration?",
      },
      {
        question: "What keeps them awake at night?",
        key: "nighttime_worries",
        workbookKey:
          "Customer Avatar Deep Dive-What keeps them awake at night?",
        workbookMap: "What keeps them awake at night?",
      },
      {
        question:
          "What are they secretly afraid of that they won't admit to others?",
        key: "secret_fears",
        workbookKey:
          "Customer Avatar Deep Dive-What are they secretly afraid of that they won't admit to others?",
        workbookMap:
          "What are they secretly afraid of that they won't admit to others?",
      },
      {
        question:
          "If you could wave a magic wand for them and solve their problem, what would that look like?",
        key: "magic_solution",
        workbookKey:
          "Customer Avatar Deep Dive-If you could wave a magic wand for them and solve their problem, what would that look like?",
        workbookMap:
          "If you could wave a magic wand for them and solve their problem, what would that look like?",
      },
      {
        question:
          "What is their age range, income level, and job title or role?",
        key: "demographics",
        workbookKey:
          "Customer Avatar Deep Dive-What is their age range, income level, and job title or role?",
        workbookMap:
          "What is their age range, income level, and job title or role?",
      },
      {
        question:
          "What have they already tried to solve this problem that didn't work?",
        key: "failed_solutions",
        workbookKey:
          "Customer Avatar Deep Dive-What have they already tried to solve this problem that didn't work?",
        workbookMap:
          "What have they already tried to solve this problem that didn't work?",
      },
      {
        question:
          "What is currently blocking them from getting the results they want?",
        key: "blockers",
        workbookKey:
          "Customer Avatar Deep Dive-What is currently blocking them from getting the results they want?",
        workbookMap:
          "What is currently blocking them from getting the results they want?",
      },
      {
        question:
          "Where do they go for advice and information (websites, podcasts, influencers)?",
        key: "info_sources",
        workbookKey:
          "Customer Avatar Deep Dive-Where do they go for advice and information (websites, podcasts, influencers)?",
        workbookMap:
          "Where do they go for advice and information (websites, podcasts, influencers)?",
      },
      {
        question:
          "How do they typically make purchasing decisions (research-heavy, impulse, ask others)?",
        key: "decision_making",
        workbookKey:
          "Customer Avatar Deep Dive-How do they typically make purchasing decisions (research-heavy, impulse, ask others)?",
        workbookMap:
          "How do they typically make purchasing decisions (research-heavy, impulse, ask others)?",
      },
      {
        question:
          "What would need to happen for them to invest in a solution like yours?",
        key: "investment_criteria",
        workbookKey:
          "Customer Avatar Deep Dive-What would need to happen for them to invest in a solution like yours?",
        workbookMap:
          "What would need to happen for them to invest in a solution like yours?",
      },
      {
        question: "How will they measure success after working with you?",
        key: "success_measures",
        workbookKey:
          "Customer Avatar Deep Dive-How will they measure success after working with you?",
        workbookMap: "How will they measure success after working with you?",
      },
      {
        question:
          "What specific outcomes would make them tell others about your solution?",
        key: "referral_outcomes",
        workbookKey:
          "Customer Avatar Deep Dive-What specific outcomes would make them tell others about your solution?",
        workbookMap:
          "What specific outcomes would make them tell others about your solution?",
      },
      {
        question:
          "Is there anything else you think I should know?",
        key: "additional_insights",
        // workbookKey: "smart-placement",
        workbookKey:
          "Customer Avatar Deep Dive-Is there anything else you think I should know?",
        workbookMap:
          "Is there anything else you think I should know?",
      },
    ];

    // Filter questions that have content
    const questionsWithContent = interviewQuestions.filter((item) =>
      interviewNotes[item.key]?.trim()
    );

    if (questionsWithContent.length === 0) {
      toast({
        title: "No content to transfer",
        description:
          "Please add at least one interview answer before transferring.",
        variant: "destructive",
      });
      return;
    }

    // Initialize bulk transfer state
    setBulkTransferInProgress(true);
    setBulkTransferProgress({ current: 0, total: questionsWithContent.length });
    setBulkTransferResults({ succeeded: 0, failed: 0 });

    // Track button press in history
    setTransferButtonHistory((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        buttonKey: buttonKey,
        promptKey: "bulk-transfer",
        questionText: `Bulk transfer of ${questionsWithContent.length} answers`,
        action: "pressed",
      },
    ]);

    // Process each question sequentially - NO AI PROCESSING, just direct copy
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < questionsWithContent.length; i++) {
      const item = questionsWithContent[i];
      const customerAnswer = interviewNotes[item.key];
      const itemButtonKey = `transfer-${item.key}`;

      // Update progress
      setBulkTransferProgress({
        current: i + 1,
        total: questionsWithContent.length,
      });

      try {
        // Log the attempt
        console.log(
          `[BULK TRANSFER] Processing ${i + 1}/${
            questionsWithContent.length
          }: ${item.key} - Direct copy (no AI processing)`
        );

        // DIRECT TRANSFER: Copy interview answer as-is to workbook response
        // No AI synthesis - just save the raw answer directly
        const response = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/interview/transfer-interview-response`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              userId: memoizedUserId,
              stepNumber,
              questionKey: item.workbookKey,
              responseText: customerAnswer, // Use raw answer, not synthesized
              sectionTitle: item.workbookKey.split("-")[0],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Update local state immediately for responsive UI
        setLocalResponses((prev) => ({
          ...prev,
          [item.workbookKey]: customerAnswer,
        }));

        // Clear unsaved changes for this question
        unsavedChanges.clearChange(item.workbookKey);

        // Force immediate cache invalidation and refetch for workbook responses
        queryClient.invalidateQueries({
          queryKey: ["workbook-responses", memoizedUserId, stepNumber],
        });
        queryClient.refetchQueries({
          queryKey: ["workbook-responses", memoizedUserId, stepNumber],
        });

        console.log(
          `[BULK TRANSFER] Successfully transferred ${item.key} directly (no AI processing)`
        );

        succeeded++;

        // Small delay between transfers to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`[BULK TRANSFER] Error processing ${item.key}:`, error);
        failed++;
        // Continue with next item even if this one failed
      }
    }

    // Update final results
    setBulkTransferResults({ succeeded, failed });
    setBulkTransferInProgress(false);

    // Log completion in history
    setTransferButtonHistory((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        buttonKey: buttonKey,
        promptKey: "bulk-transfer",
        questionText: `Bulk transfer completed: ${succeeded} succeeded, ${failed} failed`,
        action: succeeded === questionsWithContent.length ? "success" : "error",
      },
    ]);

    // Show final toast
    if (failed === 0) {
      toast({
        title: "All answers transferred successfully!",
        description: `Successfully copied ${succeeded} interview answer(s) directly to your workbook. Click "Generate Messaging Strategy" to create your strategy.`,
        duration: 5000,
      });
      setTimeout(() => {
        setActiveTab("workbook");
      }, 1500);
    } else if (succeeded > 0) {
      toast({
        title: "Partial transfer completed",
        description: `${succeeded} answer(s) transferred successfully, ${failed} failed. Please retry failed items individually.`,
        variant: "destructive",
        duration: 6000,
      });
    } else {
      toast({
        title: "Transfer failed",
        description: `All ${failed} transfer(s) failed. Please check your connection and try again.`,
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  // Load completed videos from localStorage when stepNumber changes
  useEffect(() => {
    const loadCompletedVideos = () => {
      const completed: number[] = [];
      const videos = stepContent?.videos || {};

      if (videos?.vimeoIds && Array.isArray(videos.vimeoIds)) {
        videos.vimeoIds.forEach((vimeoId: string, index: number) => {
          const completionKey = `video_completed_${vimeoId}`;
          if (localStorage.getItem(completionKey) === "true") {
            completed.push(index);
          }
        });
      }

      setCompletedVideos(completed);
    };

    loadCompletedVideos();
  }, [stepNumber]);

  const videos = stepContent?.videos || {};
  const prompts = stepContent?.interactivePrompts || { sections: [] };

  const handleVideoComplete = (videoIndex: number) => {
    if (!completedVideos.includes(videoIndex)) {
      setCompletedVideos([...completedVideos, videoIndex]);
      toast({
        title: "Video completed!",
        description: "Great job watching the full training video.",
      });
    }
  };

  // Helper functions for demographics fields
  const extractFieldValue = (
    responseText: string,
    fieldLabel: string
  ): string => {
    if (!responseText) return "";

    const lines = responseText.split("\n");
    for (const line of lines) {
      if (line.includes(fieldLabel + ":")) {
        return line.split(fieldLabel + ":")[1]?.trim() || "";
      }
    }
    return "";
  };

  const updateDemographicField = (
    currentResponse: string,
    fieldLabel: string,
    newValue: string
  ): string => {
    const fields = [
      "Age Range",
      "Gender",
      "Income Level",
      "Job Title or Role",
      "Relationship Status",
      "Children",
    ];

    let result = "";
    const existingData: { [key: string]: string } = {};

    // Parse existing response
    if (currentResponse) {
      const lines = currentResponse.split("\n");
      for (const line of lines) {
        for (const field of fields) {
          if (line.includes(field + ":")) {
            existingData[field] = line.split(field + ":")[1]?.trim() || "";
            break;
          }
        }
      }
    }

    // Update the specific field
    existingData[fieldLabel] = newValue;

    // Reconstruct the response
    for (const field of fields) {
      result += `${field}: ${existingData[field] || ""}\n`;
    }

    return result.trim();
  };

  const handleResponseChange = (promptKey: string, value: string) => {
    console.log(`[AUTO-SAVE] HandleResponseChange ${promptKey}:`, {
      value: value.substring(0, 50) + (value.length > 50 ? "..." : ""),
      valueLength: value.length,
      isEmptyString: value === "",
      stepNumber,
      timestamp: new Date().toISOString(),
    });

    // Update local state immediately for responsive UI
    setLocalResponses((prev) => ({ ...prev, [promptKey]: value }));

    // Track unsaved changes for manual save system
    const originalValue = responses[promptKey] || "";
    unsavedChanges.trackChange(promptKey, value, originalValue);

    // Clear dismissed state when user types new response (re-enable feedback)
    if (dismissedFeedback[promptKey]) {
      const newDismissed = { ...dismissedFeedback };
      delete newDismissed[promptKey];
      setDismissedFeedback(newDismissed);
      localStorage.setItem(
        `dismissed-feedback-${userId}`,
        JSON.stringify(newDismissed)
      );
    }

    // Clear existing feedback when response changes
    setFeedback((prev) => ({ ...prev, [promptKey]: null }));

    // AUTO-SAVE: Save all responses automatically as user types
    const sectionTitle = getSectionTitle(promptKey, stepNumber);
    if (sectionTitle) {
      console.log(`[AUTO-SAVE] Saving ${promptKey} (step ${stepNumber})`);
      debouncedCompletionCheck(sectionTitle);
    }
  };

  const handleImprovedVersionAdd = (
    promptKey: string,
    improvedVersion: string
  ) => {
    const existingContent = responses[promptKey] || "";
    const newContent = existingContent.trim()
      ? `${existingContent}\n\n${improvedVersion}`
      : improvedVersion;

    handleResponseChange(promptKey, newContent);

    // Show confirmation toast
    toast({
      title: "Version added!",
      description: "The improved version has been added to your response.",
    });
  };

  const analyzeResponse = async (
    section: string,
    prompt: string,
    response: string
  ) => {
    const promptKey = `${section}-${prompt}`;
    setAnalyzingResponse(promptKey);

    // For offer foundation questions, include messaging strategy context
    const messagingStrategyContext =
      stepNumber === 2 &&
      section === "Offer Foundation" &&
      messagingStrategyContent
        ? messagingStrategyContent
        : undefined;

    // Use enhanced interactive coaching system
    interactiveCoachingMutation.mutate({
      section,
      questionContext: prompt,
      userResponse: response,
      messagingStrategy: messagingStrategyContext,
    });
  };

  const getFeedbackIcon = (feedback: any) => {
    if (!feedback) return null;
    if (feedback.level === "excellent-depth")
      return <ThumbsUp className="w-4 h-4 text-green-500" />;
    if (feedback.level === "good-start")
      return <Brain className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const getFeedbackLabel = (feedback: any) => {
    if (!feedback) return null;
    if (feedback.level === "excellent-depth") return "Excellent Depth";
    if (feedback.level === "good-start") return "Good Start";
    return "Needs More Detail";
  };

  const getFeedbackDisplay = (feedback: any) => {
    if (!feedback) return null;
    return (
      <div className="flex items-center space-x-1 text-xs">
        <span className="text-slate-600">AI Feedback:</span>
        {getFeedbackIcon(feedback)}
        <span
          className={`font-medium ${
            feedback.level === "excellent-depth"
              ? "text-green-600"
              : feedback.level === "good-start"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {getFeedbackLabel(feedback)}
        </span>
      </div>
    );
  };

  const getFeedbackColor = (feedback: any) => {
    if (!feedback) return "";
    if (feedback.level === "excellent-depth")
      return "border-green-200 bg-green-50";
    if (feedback.level === "good-start")
      return "border-yellow-200 bg-yellow-50";
    return "border-red-200 bg-red-50";
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt",
      ".docx",
    ];
    const isValidType = validTypes.some(
      (type) => file.type === type || file.name.endsWith(type)
    );

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt or .docx file.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFileName(file.name);

    try {
      let text = "";

      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        // Handle text files
        text = await file.text();
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        // For .docx files, we'll need to send to backend for processing
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/extract-text-from-file`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to extract text from document");
        }

        const result = await response.json();
        text = result.text;
      }

      setTranscriptText(text);

      toast({
        title: "File uploaded successfully",
        description: `Extracted text from ${file.name}. You can now edit or parse the transcript.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          "Unable to process the file. Please try again or paste the text directly.",
        variant: "destructive",
      });
      setUploadedFileName("");
    }

    // Reset the input
    event.target.value = "";
  };

  const transferNotesToWorkbook = () => {
    // Map interview notes to the exact Customer Avatar Deep Dive workbook responses
    // Need to find the correct section-prompt key format for each question
    const avatarResponses: Record<string, string> = {};

    // Map each interview note to its corresponding workbook section using section index and prompt index
    // Customer Avatar Deep Dive is section 1 (index 1), we need to map to the correct prompt indices
    if (interviewNotes.frustrations) {
      avatarResponses["1-0"] = interviewNotes.frustrations; // First question in Customer Avatar Deep Dive
    }
    if (interviewNotes.nighttime_worries) {
      avatarResponses["1-1"] = interviewNotes.nighttime_worries; // Second question
    }
    if (interviewNotes.secret_fears) {
      avatarResponses["1-2"] = interviewNotes.secret_fears; // Third question
    }
    if (interviewNotes.magic_solution) {
      avatarResponses["1-3"] = interviewNotes.magic_solution; // Fourth question
    }
    if (interviewNotes.demographics) {
      avatarResponses["1-4"] = interviewNotes.demographics; // Fifth question
    }
    if (interviewNotes.failed_solutions) {
      avatarResponses["1-5"] = interviewNotes.failed_solutions; // Sixth question
    }
    if (interviewNotes.blockers) {
      avatarResponses["1-6"] = interviewNotes.blockers; // Seventh question
    }
    if (interviewNotes.info_sources) {
      avatarResponses["1-7"] = interviewNotes.info_sources; // Eighth question
    }
    if (interviewNotes.decision_making) {
      avatarResponses["1-8"] = interviewNotes.decision_making; // Ninth question
    }
    if (interviewNotes.investment_criteria) {
      avatarResponses["1-9"] = interviewNotes.investment_criteria; // Tenth question
    }
    if (interviewNotes.success_measures) {
      avatarResponses["1-10"] = interviewNotes.success_measures; // Eleventh question
    }
    if (interviewNotes.referral_outcomes) {
      avatarResponses["1-11"] = interviewNotes.referral_outcomes; // Twelfth question
    }

    // Save avatar responses to database - AUTO-SAVE enabled
    Object.entries(avatarResponses).forEach(([questionKey, responseText]) => {
      console.log(
        `[AUTO-SAVE] Saving direct avatar transfer for ${questionKey} (step ${stepNumber})`
      );
      saveResponse.mutate({
        questionKey,
        responseText,
        sectionTitle: "Customer Avatar Deep Dive",
      });
    });

    // Switch to workbook tab and navigate to Customer Avatar section
    setActiveTab("workbook");

    // Navigate to the Customer Avatar section (section 1)
    setTimeout(() => {
      const avatarSection = document.getElementById("workbook-section-1");
      if (avatarSection) {
        avatarSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 300);

    toast({
      title: "Interview notes transferred!",
      description:
        "Your customer insights have been mapped to the Customer Avatar Deep Dive section in your workbook.",
    });
  };

  // stepContent is now always available from initialization above

  return (
    <div className="space-y-4">
      {/* Migration Status */}
      {(isMigrating || isMigratingStep4) && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            {stepNumber === 4
              ? "Migrating your sales strategy data to secure storage..."
              : "Synchronizing your data to secure storage..."}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {stepContent?.title || "Step Content"}
        </h1>
        <p className="text-lg text-slate-600 mb-4">
          {stepContent?.description || ""}
        </p>
      </div>

      {/* Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        {stepNumber === 3 ? (
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger
              value="overview"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Training Video
            </TabsTrigger>
            <TabsTrigger
              value="sales-page"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Sales Page
            </TabsTrigger>
            <TabsTrigger
              value="customer-experience"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Offer Delivery
            </TabsTrigger>
          </TabsList>
        ) : stepNumber === 4 ? (
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 gap-1">
            <TabsTrigger
              value="overview"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Training Video
            </TabsTrigger>
            <TabsTrigger
              value="sales-strategy"
              className="text-xs md:text-sm px-2 md:px-4 col-span-2 md:col-span-1"
            >
              Sales Strategy
            </TabsTrigger>
          </TabsList>
        ) : stepNumber === 2 ? (
          <TabsList className="grid w-full grid-cols-3 gap-1">
            <TabsTrigger
              value="overview"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Training Videos
            </TabsTrigger>
            <TabsTrigger
              value="workbook"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Create Your Offer Outline
            </TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger
              value="overview"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              Training Video
            </TabsTrigger>
            <TabsTrigger
              value="workbook"
              className="text-xs md:text-sm px-2 md:px-4"
            >
              {stepNumber === 1 ? "Messaging Strategy" : "Your Offer Outline"}
            </TabsTrigger>
            {stepNumber === 1 ? (
              <TabsTrigger
                value="interviews"
                className="text-xs md:text-sm px-2 md:px-4"
              >
                Customer Research
              </TabsTrigger>
            ) : (
              <TabsTrigger
                value="resources"
                className="text-xs md:text-sm px-2 md:px-4"
              >
                Resources
              </TabsTrigger>
            )}
          </TabsList>
        )}

        {/* Migration Prompt for transitioning localStorage to database */}
        <MigrationPrompt
          userId={parseInt(userId)}
          onMigrationComplete={() => {
            toast({
              title: "Data synced successfully!",
              description:
                "Your responses are now saved to your account and accessible from any device.",
            });
          }}
        />

        <TabsContent value="overview" className="space-y-6">
          {stepNumber === 1 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                      Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm text-slate-700 leading-relaxed">
                      <p>
                        This is the foundation of your business. Your messaging
                        sets the tone for every offer, launch, and piece of
                        content you create. Take your time and go deep with your
                        answers. Really tune into your ideal customer and answer
                        the questions with depth. The clarity you build here
                        will guide everything that comes next.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-500" />
                      Estimated Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        3-7 Days
                      </div>
                      <p className="text-sm text-slate-600">
                        If conducting avatar interviews this process might take
                        a bit longer but you can come back and add based on the
                        interviews
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <CheckSquare className="w-5 h-5 mr-2 text-green-500" />
                      To-Do List
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div className="text-sm text-slate-700">
                          Watch the training video
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div className="text-sm text-slate-700">
                          Answer all the questions under the 'messaging
                          strategy' section
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div className="text-sm text-slate-700">
                          [Optional but recommended] Conduct ideal customer
                          avatar interviews
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <div className="text-sm text-slate-700">
                          Generate your messaging strategy
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          5
                        </div>
                        <div className="text-sm text-slate-700">
                          Book your 1:1 strategy call
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Star className="w-5 h-5 mr-2 text-amber-500" />
                      Success Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Take your time</strong> → This is the
                          foundation; don't rush it.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Go deep</strong> → Avoid generic answers, get
                          specific and real.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Stand out</strong> → Highlight what makes you
                          different.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Use your voice</strong> → Write how you
                          naturally speak.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Know your customer</strong> → Capture their
                          fears, desires, and exact words.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Check the feel</strong> → Messaging should
                          spark an emotional "yes, that's me."
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Keep evolving</strong> → Update as you learn
                          more from real clients.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : stepNumber === 2 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                      Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm text-slate-700 leading-relaxed">
                      <p>
                        This step is where your clarity turns into something
                        people can actually buy. You'll create two offers that
                        work together:
                      </p>
                      <p>
                        <strong>A Tripwire Offer:</strong> a small, low-priced
                        offer on your thank-you page that quickly turns leads
                        into buyers and builds trust.
                      </p>
                      <p>
                        <strong>A Core Offer:</strong> your main program or
                        service—the transformation your business is built
                        around.
                      </p>
                      <p>
                        Together, these offers generate both quick wins and
                        long-term growth.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-500" />
                      Estimated Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        3-5 Days
                      </div>
                      <p className="text-sm text-slate-600">
                        (You may spend longer refining your core offer, but the
                        tripwire outline can be completed quickly.)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <CheckSquare className="w-5 h-5 mr-2 text-green-500" />
                      To-Do List
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div className="text-sm text-slate-700">
                          Watch training videos
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div className="text-sm text-slate-700">
                          Outline your Tripwire Offer (outcome, price, delivery)
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div className="text-sm text-slate-700">
                          Outline your Core Offer (main transformation,
                          structure, pricing)
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <div className="text-sm text-slate-700">
                          Review both outlines and refine with AI coaching
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Star className="w-5 h-5 mr-2 text-amber-500" />
                      Success Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Start small</strong> → Keep the tripwire
                          simple and low-cost.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Lead with results</strong> → Focus on
                          outcomes, not features.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Connect the dots</strong> → Make sure the
                          tripwire naturally leads to your core offer.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Price with purpose</strong> → Base pricing on
                          value, not just time or effort.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Keep it clear</strong> → If you can't explain
                          the offer in one sentence, simplify it.
                        </span>
                      </li>
                      <li className="text-sm text-slate-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>
                          <strong>Iterate</strong> → Refine both offers as you
                          test with real leads and customers.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : stepNumber === 3 ? (
            <></>
          ) : stepNumber === 4 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-500" />
                    Launch Your Marketing & Sales System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3">
                      What You'll Build in This Step
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Sales Strategy Framework
                        </p>
                        <p>
                          Clear sales process from lead to customer with
                          marketing channels
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Relationship Building System
                        </p>
                        <p>
                          Network outreach and conversation strategies that
                          convert
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Lead Generation Plan
                        </p>
                        <p>
                          Attract and nurture prospects before making your offer
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Launch Execution Strategy
                        </p>
                        <p>
                          30-day plan to acquire your first paying customers
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Key Focus:</strong> This step transforms your
                      completed offer into a profitable business by creating
                      effective marketing strategies and building systems that
                      consistently bring in customers.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-purple-500" />
                    Sales & Marketing Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-coral-50 rounded-lg">
                      <h4 className="font-semibold text-coral-900 mb-2">
                        Sales Strategy Development
                      </h4>
                      <ul className="text-sm text-coral-800 space-y-1">
                        <li>
                          • Define your primary sales approach and marketing
                          channels
                        </li>
                        <li>
                          • Develop sales pages that convert visitors into
                          customers
                        </li>
                        <li>
                          • Establish authority and build trust before selling
                        </li>
                        <li>
                          • Set up systems to track leads and optimize
                          performance
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Relationship & Conversation Mastery
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>
                          • Leverage your network for warm introductions and
                          referrals
                        </li>
                        <li>
                          • Build partnerships and collaborations to amplify
                          reach
                        </li>
                        <li>
                          • Master sales conversations that feel natural and
                          helpful
                        </li>
                        <li>
                          • Create systems for ongoing relationship nurturing
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : stepNumber === 3 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-indigo-500" />
                    Create Your Sales Page & Customer Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-900 mb-3">
                      What You'll Build in This Step
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-800">
                      <div>
                        <p className="font-medium mb-1">
                          ✓ AI-Powered Sales Page
                        </p>
                        <p>
                          Complete conversion-focused sales page using your
                          messaging strategy and offer outline
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Offer Delivery Journey
                        </p>
                        <p>
                          Four-part system covering onboarding, delivery,
                          communication, and feedback
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Email Templates & Sequences
                        </p>
                        <p>
                          Professional onboarding emails and communication
                          templates
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Implementation Checklist
                        </p>
                        <p>
                          Custom action items and todos to launch your offer
                          successfully
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Key Focus:</strong> Transform your messaging
                      strategy and offer outline into a high-converting sales
                      page and complete offer delivery system that ensures
                      buyers get results.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-purple-500" />
                    How This Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Create Your Sales Page
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>
                          • Build a complete sales page using what you've
                          already created
                        </li>
                        <li>
                          • Edit and customize every section to match your voice
                        </li>
                        <li>
                          • Save multiple versions and download when ready
                        </li>
                        <li>
                          • Get suggestions to make your copy more compelling
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Design Your Offer Delivery
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>
                          • Plan how customers will experience your offer from
                          start to finish
                        </li>
                        <li>
                          • Create welcome emails and ongoing communication
                        </li>
                        <li>
                          • Set up systems to help customers actually get
                          results
                        </li>
                        <li>
                          • Build your action plan for launching successfully
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>{/* Other steps overview content stays as is */}</>
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          {stepNumber === 2 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2 text-blue-500" />
                  Training Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tripwire-offer" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 gap-1">
                    <TabsTrigger
                      value="tripwire-offer"
                      className="text-xs md:text-sm px-2 md:px-4"
                    >
                      Your Tripwire Offer
                    </TabsTrigger>
                    <TabsTrigger
                      value="core-offer"
                      className="text-xs md:text-sm px-2 md:px-4"
                    >
                      Your Core Offer
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tripwire-offer" className="space-y-4">
                    <VimeoEmbed
                      vimeoId="1122302012/72754f0c5e"
                      title="Your Tripwire Offer Training"
                      userId={Number(userId)}
                      stepNumber={stepNumber}
                    />
                  </TabsContent>

                  <TabsContent value="core-offer" className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                          <Lightbulb className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="space-y-3">
                          <p className="text-base text-blue-900 leading-relaxed font-medium">
                            Whether you have your offer created yet or not,
                            watch this video to see some of my best practices
                            for creating an irresistible offer.
                          </p>
                          <p className="text-base text-blue-800 leading-relaxed">
                            Use the content in this video to help guide you when
                            filling out your offer outline. You may end up
                            refining your existing offer or be creating a new
                            one. Either way, the process is the same.
                          </p>
                        </div>
                      </div>
                    </div>
                    <VimeoEmbed
                      vimeoId="1094153008/0b88c62749"
                      title="Your Core Offer Training"
                      userId={Number(userId)}
                      stepNumber={stepNumber}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2 text-blue-500" />
                  Training Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stepNumber === 1 && (
                  <VimeoEmbed
                    vimeoId="1094140391/9023cbde93"
                    title="Your Messaging Strategy Training"
                    userId={Number(userId)}
                    stepNumber={stepNumber}
                  />
                )}
                {stepNumber === 3 && (
                  <VimeoEmbed
                    vimeoId="1094424213/d500329fc9"
                    title="Build Your Offer Training"
                    userId={Number(userId)}
                    stepNumber={stepNumber}
                  />
                )}
                {stepNumber === 4 && (
                  <VimeoEmbed
                    vimeoId="1094441555/fdbfcc84b7"
                    title="Sell Your Offer Training"
                    userId={Number(userId)}
                    stepNumber={stepNumber}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workbook" className="space-y-6">
          {/* To-Do List for Step 1 - Strategic Messaging */}
          {stepNumber === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  <CardTitle>Strategic Messaging To-Do List</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-slate-700">
                      Complete the messaging workbook questions
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-slate-700">
                      Generate your messaging strategy
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-slate-700">
                      Review and refine your strategy
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <p className="text-slate-700">Complete the intake form</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      5
                    </div>
                    <p className="text-slate-700">
                      Book your 1:1 strategy call
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display Generated Messaging Strategy at the top for Step 1 */}
          {/* Show card if there's content OR if user is actively editing (even if content is empty) */}
          {stepNumber === 1 &&
            (editingStrategy ||
              (messagingStrategyContent &&
                messagingStrategyContent.trim())) && (
              <Card id="generated-messaging-strategy">
                <CardHeader className="border-b border-coral-100 bg-gradient-to-r from-coral-50 to-orange-50 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-coral-600 flex-shrink-0" />
                      <div>
                        <CardTitle
                          className="text-xl sm:text-2xl"
                          data-testid="text-strategy-title"
                        >
                          Your Messaging Strategy
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Your comprehensive messaging strategy
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
                      <Button
                        className="hover:opacity-90 min-h-10 sm:min-h-auto w-full sm:w-auto"
                        onClick={() => {
                          if (editingStrategy) {
                            // Cancel: revert changes and exit edit mode
                            setMessagingStrategyContent(
                              originalStrategyContent
                            );
                            setEditingStrategy(false);
                          } else {
                            // Enter edit mode
                            setEditingStrategy(true);
                          }
                        }}
                        data-testid="button-edit-strategy"
                        style={{ backgroundColor: "#689cf2", color: "white" }}
                      >
                        {editingStrategy ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            data-testid="button-export-document"
                            style={{
                              backgroundColor: "#689cf2",
                              color: "white",
                            }}
                            className="hover:opacity-90 min-h-10 sm:min-h-auto w-full sm:w-auto"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            <span className="sm:inline">Export Document</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={async () => {
                              if (!messagingStrategyContent) return;

                              try {
                                const stripMarkdown = (
                                  text: string
                                ): string => {
                                  return text
                                    .replace(/^#{1,6}\s+/gm, "")
                                    .replace(/\*\*(.+?)\*\*/g, "$1")
                                    .replace(/\*(.+?)\*/g, "$1")
                                    .replace(/^-{3,}$/gm, "")
                                    .trim();
                                };

                                const plainText = stripMarkdown(
                                  messagingStrategyContent
                                );
                                await navigator.clipboard.writeText(plainText);
                                toast({
                                  title: "Copied!",
                                  description:
                                    "Messaging strategy copied to clipboard",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to copy to clipboard",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="menu-copy-clipboard"
                            className="hover:bg-slate-100 focus:bg-slate-100"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy to Clipboard
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              if (!messagingStrategyContent) return;

                              try {
                                const lines =
                                  messagingStrategyContent.split("\n");
                                const children: Paragraph[] = [];

                                for (const line of lines) {
                                  const trimmedLine = line.trim();

                                  if (trimmedLine.match(/^-{3,}$/)) continue;

                                  if (line.startsWith("# ")) {
                                    children.push(
                                      new Paragraph({
                                        text: line.replace("# ", ""),
                                        heading: HeadingLevel.HEADING_1,
                                        spacing: { before: 400, after: 200 },
                                      })
                                    );
                                  } else if (line.startsWith("## ")) {
                                    children.push(
                                      new Paragraph({
                                        text: line.replace("## ", ""),
                                        heading: HeadingLevel.HEADING_2,
                                        spacing: { before: 300, after: 150 },
                                      })
                                    );
                                  } else if (line.startsWith("### ")) {
                                    children.push(
                                      new Paragraph({
                                        text: line.replace("### ", ""),
                                        heading: HeadingLevel.HEADING_3,
                                        spacing: { before: 200, after: 100 },
                                      })
                                    );
                                  } else if (trimmedLine.startsWith("- ")) {
                                    children.push(
                                      new Paragraph({
                                        text: trimmedLine.replace("- ", ""),
                                        bullet: { level: 0 },
                                        spacing: { before: 50, after: 50 },
                                      })
                                    );
                                  } else if (/^\d+\.\s/.test(trimmedLine)) {
                                    children.push(
                                      new Paragraph({
                                        text: trimmedLine.replace(
                                          /^\d+\.\s/,
                                          ""
                                        ),
                                        numbering: {
                                          reference: "default-numbering",
                                          level: 0,
                                        },
                                        spacing: { before: 50, after: 50 },
                                      })
                                    );
                                  } else if (line.includes("**")) {
                                    const parts = line.split("**");
                                    const runs: TextRun[] = [];
                                    parts.forEach((part, index) => {
                                      if (index % 2 === 1) {
                                        runs.push(
                                          new TextRun({
                                            text: part,
                                            bold: true,
                                          })
                                        );
                                      } else if (part) {
                                        runs.push(new TextRun(part));
                                      }
                                    });
                                    children.push(
                                      new Paragraph({
                                        children: runs,
                                        spacing: { before: 100, after: 100 },
                                      })
                                    );
                                  } else if (trimmedLine !== "") {
                                    children.push(
                                      new Paragraph({
                                        text: line,
                                        spacing: { before: 100, after: 100 },
                                      })
                                    );
                                  }
                                }

                                const doc = new Document({
                                  sections: [
                                    {
                                      properties: {},
                                      children: children,
                                    },
                                  ],
                                  numbering: {
                                    config: [
                                      {
                                        reference: "default-numbering",
                                        levels: [
                                          {
                                            level: 0,
                                            format: "decimal",
                                            text: "%1.",
                                            alignment: AlignmentType.START,
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                });

                                const blob = await Packer.toBlob(doc);
                                saveAs(blob, "messaging-strategy.docx");

                                toast({
                                  title: "Downloaded!",
                                  description:
                                    "Messaging strategy downloaded as DOCX",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to generate DOCX file",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="menu-download-docx"
                            className="hover:bg-slate-100 focus:bg-slate-100"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download DOCX
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (!messagingStrategyContent) return;

                              try {
                                const pdf = new jsPDF();
                                const pageWidth =
                                  pdf.internal.pageSize.getWidth();
                                const pageHeight =
                                  pdf.internal.pageSize.getHeight();
                                const margin = 20;
                                const maxWidth = pageWidth - 2 * margin;
                                let y = margin;

                                const lines =
                                  messagingStrategyContent.split("\n");

                                const addText = (
                                  text: string,
                                  fontSize: number,
                                  isBold: boolean = false
                                ) => {
                                  if (y > pageHeight - margin) {
                                    pdf.addPage();
                                    y = margin;
                                  }

                                  pdf.setFontSize(fontSize);
                                  pdf.setFont(
                                    "helvetica",
                                    isBold ? "bold" : "normal"
                                  );

                                  const splitText = pdf.splitTextToSize(
                                    text,
                                    maxWidth
                                  );
                                  pdf.text(splitText, margin, y);
                                  y += splitText.length * (fontSize / 2) + 5;
                                };

                                for (const line of lines) {
                                  const trimmedLine = line.trim();

                                  if (trimmedLine.match(/^-{3,}$/)) {
                                    y += 5;
                                    continue;
                                  }

                                  if (line.startsWith("# ")) {
                                    addText(line.replace("# ", ""), 18, true);
                                  } else if (line.startsWith("## ")) {
                                    addText(line.replace("## ", ""), 14, true);
                                  } else if (line.startsWith("### ")) {
                                    addText(line.replace("### ", ""), 12, true);
                                  } else if (trimmedLine !== "") {
                                    addText(line.replace(/\*\*/g, ""), 10);
                                  } else {
                                    y += 3;
                                  }
                                }

                                pdf.save("messaging-strategy.pdf");

                                toast({
                                  title: "Downloaded!",
                                  description:
                                    "Messaging strategy downloaded as PDF",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to generate PDF file",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="menu-download-pdf"
                            className="hover:bg-slate-100 focus:bg-slate-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6 bg-white p-4 sm:p-6">
                  {editingStrategy ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ✏️ Edit your messaging strategy below. You can modify
                          the content in markdown format.
                        </p>
                      </div>
                      <Textarea
                        value={messagingStrategyContent || ""}
                        onChange={(e) =>
                          setMessagingStrategyContent(e.target.value)
                        }
                        className="w-full min-h-[400px] sm:min-h-[500px] font-mono text-sm p-3 sm:p-4 border-2 border-slate-300 rounded-lg"
                        placeholder="Edit your messaging strategy here..."
                        spellCheck={true}
                      />
                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <Button
                          onClick={() => {
                            setMessagingStrategyContent(
                              originalStrategyContent
                            );
                            setEditingStrategy(false);
                          }}
                          style={{ backgroundColor: "#689cf2", color: "white" }}
                          className="hover:opacity-90 min-h-12 sm:min-h-auto w-full sm:w-auto"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            // Validate that content is not empty before saving
                            const editedContent =
                              messagingStrategyContent?.trim();

                            if (!editedContent || editedContent.length === 0) {
                              toast({
                                title: "Cannot save empty content",
                                description:
                                  "There is no content to save. Please add some content before saving.",
                                variant: "destructive",
                              });
                              return; // Exit early - don't proceed with save
                            }

                            setIsSavingStrategy(true);
                            try {
                              // Update database
                              if (activeStrategy?.id && memoizedUserId) {
                                const response = await apiRequest(
                                  "PUT",
                                  `/api/messaging-strategies/${activeStrategy.id}`,
                                  {
                                    content: editedContent.trim(),
                                    version: (activeStrategy.version || 1) + 1,
                                  }
                                );
                                const updatedStrategy = await response.json();

                                // Update query cache immediately with the new data
                                // Use the correct query keys that match useMessagingStrategy hook
                                const activeQueryKey = [
                                  "messaging-strategy",
                                  "active",
                                  memoizedUserId,
                                ];
                                const allStrategiesQueryKey = [
                                  "messaging-strategies",
                                  memoizedUserId,
                                ];

                                // Update the active strategy cache immediately
                                queryClient.setQueryData(
                                  activeQueryKey,
                                  updatedStrategy
                                );

                                // Update the all strategies cache
                                queryClient.setQueryData(
                                  allStrategiesQueryKey,
                                  (old: any) => {
                                    if (!old || !Array.isArray(old)) return old;
                                    return old.map((strategy: any) =>
                                      strategy.id === updatedStrategy.id
                                        ? updatedStrategy
                                        : strategy
                                    );
                                  }
                                );

                                // Update local state with saved content from database response
                                const savedContent =
                                  updatedStrategy.content ||
                                  editedContent.trim();
                                setMessagingStrategyContent(savedContent);
                                setOriginalStrategyContent(savedContent);

                                // Invalidate and refetch to ensure data is fresh
                                await queryClient.invalidateQueries({
                                  queryKey: activeQueryKey,
                                });
                                await queryClient.invalidateQueries({
                                  queryKey: allStrategiesQueryKey,
                                });

                                // Explicitly refetch to ensure UI updates
                                await queryClient.refetchQueries({
                                  queryKey: activeQueryKey,
                                });
                              }

                              setEditingStrategy(false);
                              setHasUnsavedChanges(false);

                              toast({
                                title: "✓ Changes saved!",
                                description:
                                  "Your messaging strategy has been updated.",
                                className: "border-green-200 bg-green-50",
                              });
                            } catch (error) {
                              console.error(
                                "Failed to save messaging strategy:",
                                error
                              );
                              toast({
                                title: "Error",
                                description: "Failed to save changes",
                                variant: "destructive",
                              });
                            } finally {
                              setIsSavingStrategy(false);
                            }
                          }}
                          disabled={isSavingStrategy}
                          style={{ backgroundColor: "#689cf2", color: "white" }}
                          className="hover:opacity-90 min-h-12 sm:min-h-auto w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingStrategy ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm sm:prose-lg max-w-none overflow-x-auto"
                      data-testid="content-messaging-strategy"
                    >
                      <FormattedMessagingStrategy
                        content={messagingStrategyContent}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Customer Language Reminder for Messaging Strategy */}
          {stepNumber === 1 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex items-start space-x-2 md:space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1 text-sm md:text-base">
                    Important Reminder
                  </h4>
                  <p className="text-blue-800 text-xs md:text-sm leading-relaxed">
                    Write all your responses using the{" "}
                    <strong>
                      exact language your ideal customer would use
                    </strong>
                    . Avoid jargon, technical terms, or industry speak. Use the
                    words, phrases, and emotions your customers actually express
                    when talking about their problems and goals. As you write
                    your answers, read it back as if your ideal customer was
                    saying it to you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Your Messaging Strategy Section for Step 1 */}
          {stepNumber === 1 && (
            <Card className="border-slate-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-slate-800 text-lg sm:text-xl">
                  <Sparkles className="w-5 h-5 mr-2 text-coral-500 flex-shrink-0" />
                  <span>Generate Your Messaging Strategy</span>
                </CardTitle>
                <p className="text-sm sm:text-base text-coral-600 mt-1">
                  Create a comprehensive messaging strategy from your workbook
                  responses and interview insights.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {/* Ready Status Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <strong>Ready:</strong> You have saved{" "}
                    {Object.keys(responses || {}).length} response(s). Click
                    Generate Strategy to create your comprehensive messaging
                    strategy.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display Generated Offer Outline for Step 2 */}
          {stepNumber === 2 && offerOutline && (
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Your Offer Outline
                </CardTitle>
                <p className="text-sm text-green-700">
                  Your comprehensive offer outline has been generated and is
                  ready for use.
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border p-6 max-h-96 overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: offerOutline
                        .replace(/\n/g, "<br/>")
                        .replace(
                          /#{1,6}\s*(.+)/g,
                          '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>'
                        )
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(offerOutline);
                      toast({
                        title: "Copied to clipboard!",
                        description: "Your offer outline has been copied.",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Outline
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOfferOutline("");
                      localStorage.removeItem("generated-offer-outline");
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate New
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special handling for Step 2 - Nested Tabs for Offer Outlines */}
          {stepNumber === 2 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Create Your Offer Outlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue="tripwire-outline"
                    className="space-y-4"
                    value={activeOfferOutlineTab}
                    onValueChange={setActiveOfferOutlineTab}
                  >
                    <TabsList className="grid w-full grid-cols-2 gap-1">
                      <TabsTrigger
                        value="tripwire-outline"
                        className="text-xs md:text-sm px-2 md:px-4"
                      >
                        Tripwire Offer Outline
                      </TabsTrigger>
                      <TabsTrigger
                        value="core-outline"
                        className="text-xs md:text-sm px-2 md:px-4"
                      >
                        Core Offer Outline
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tripwire-outline" className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-blue-100 text-blue-700"
                        >
                          Low-Cost Offer
                        </Badge>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">
                          What is a Tripwire Offer?
                        </h4>
                        <p className="text-sm text-blue-800">
                          A small, low-priced offer that quickly turns leads
                          into buyers and builds trust. This appears on your
                          thank-you page after someone opts in to your lead gen.
                        </p>
                      </div>

                      {/* Conditional rendering: Questions form OR Generated outline */}
                      {showTripwireOutline && tripwireOutline ? (
                        // Show generated outline editor with AI evaluation
                        <div className="space-y-4">
                          <div className="flex items-center justify-end">
                            <Button
                              size="sm"
                              onClick={() => setShowTripwireOutline(false)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              data-testid="button-back-to-questions-tripwire"
                            >
                              Back to Questions
                            </Button>
                          </div>

                          {/* Section-by-Section Editor with AI Coaching */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-slate-900">
                                  Your Tripwire Offer Outline
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">
                                  Edit any section to automatically re-evaluate
                                  and get AI coaching
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      data-testid="button-download-tripwire-outline"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={downloadTripwireOutlineAsPDF}
                                      data-testid="download-tripwire-outline-pdf"
                                      className="hover:bg-slate-100 focus:bg-slate-100"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Download as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={downloadTripwireOutlineAsDOCX}
                                      data-testid="download-tripwire-outline-docx"
                                      className="hover:bg-slate-100 focus:bg-slate-100"
                                    >
                                      <File className="w-4 h-4 mr-2" />
                                      Download as DOCX
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <CoreOfferOutlineSectionEditor
                              outline={tripwireOutline}
                              mainTransformation={
                                tripwireResponses.quickWin || ""
                              }
                              onUpdate={async (newOutline) => {
                                setTripwireOutline(newOutline);

                                // Save to database (primary storage)
                                try {
                                  const response = await apiRequest(
                                    "POST",
                                    "/api/user-offer-outlines",
                                    {
                                      userId: Number(userId),
                                      offerNumber: 2, // Tripwire is offer #2
                                      title: "Tripwire Offer Outline",
                                      content: newOutline,
                                      isActive: true,
                                    }
                                  );

                                  if (response.ok) {
                                    // Invalidate queries to refresh
                                    queryClient.invalidateQueries({
                                      queryKey: [
                                        "/api/user-offer-outlines/user",
                                        userId,
                                        "tripwire",
                                      ],
                                    });
                                    console.log(
                                      "Tripwire outline saved to database"
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error saving to database:",
                                    error
                                  );
                                }

                                // Also save to localStorage for quick access
                                try {
                                  localStorage.setItem(
                                    `tripwire-offer-outline-${userId}`,
                                    newOutline
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error saving outline to localStorage:",
                                    error
                                  );
                                }
                              }}
                              offerType="tripwire"
                            />
                          </div>
                        </div>
                      ) : (
                        // Show questions form
                        <div className="space-y-6">
                          {/* Offer Name */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Offer Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Name Of Offer / Product:
                                </label>
                                <textarea
                                  value={tripwireResponses.offerName}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "offerName",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={1}
                                  placeholder="Enter your offer name..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Purpose & Connection Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Purpose & Connection
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What is the "big promise" or main result of
                                  this offer (in one sentence)?
                                </label>
                                <textarea
                                  value={tripwireResponses.quickWin}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "quickWin",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Enter the big promise or main result..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What is the specific problem, frustration
                                  and/or desire(s) this mini offer solves?
                                </label>
                                <textarea
                                  value={tripwireResponses.problems}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "problems",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Describe the specific problems this offer solves..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What makes this tripwire different from free
                                  resources they could find online?
                                </label>
                                <textarea
                                  value={tripwireResponses.differentFromFree}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "differentFromFree",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Explain what makes this different from free alternatives..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Why is this offer urgent or important for them
                                  right now? Think about outcomes and results.
                                </label>
                                <textarea
                                  value={tripwireResponses.urgency}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "urgency",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe the urgency and immediate importance..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Target Audience & Pain Points Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Target Audience & Pain Points
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What frustrations or struggles does your ideal
                                  customer have right before they see this
                                  offer?
                                </label>
                                <textarea
                                  value={tripwireResponses.frustrations}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "frustrations",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe their key frustrations and struggles..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What's the "I've tried everything, but nothing
                                  works" problem this solves quickly?
                                </label>
                                <textarea
                                  value={tripwireResponses.triedEverything}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "triedEverything",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe the problem they can't seem to solve..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What false beliefs or objections do they have
                                  about solving this problem (and how does your
                                  offer overcome them)?
                                </label>
                                <textarea
                                  value={tripwireResponses.falseBeliefs}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "falseBeliefs",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="List their false beliefs and how you overcome them..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Features & Benefits Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Features & Benefits
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  List the main components of your offer (what
                                  they get).
                                </label>
                                <textarea
                                  value={tripwireResponses.mainComponents}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "mainComponents",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="List what they get with this offer..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  For each component, what is the direct benefit
                                  (why it matters to them)?
                                </label>
                                <textarea
                                  value={tripwireResponses.directBenefits}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "directBenefits",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Explain the direct benefits of each component..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What is the biggest emotional benefit (how
                                  they'll feel after using it)?
                                </label>
                                <textarea
                                  value={tripwireResponses.emotionalBenefits}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "emotionalBenefits",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe how they'll feel after using your offer..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Proof & Authority Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Proof & Authority
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What credibility do you bring to this offer
                                  (your story, expertise, results)?
                                </label>
                                <textarea
                                  value={tripwireResponses.credibility}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "credibility",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Share your credentials, expertise, and relevant results..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Do you have any testimonials, case studies, or
                                  success stories (even if from a different
                                  offer) that reinforce this? Paste below.
                                </label>
                                <textarea
                                  value={tripwireResponses.testimonials}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "testimonials",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={5}
                                  placeholder="Paste testimonials, case studies, or success stories here..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What personal story or struggle connects you
                                  to the pain point your customer feels?
                                </label>
                                <textarea
                                  value={tripwireResponses.personalStory}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "personalStory",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Share your personal connection to this problem..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Structure & Delivery Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Structure & Delivery
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What format will it take? (e.g., PDF,
                                  mini-course, template, workshop, checklist)
                                </label>
                                <textarea
                                  value={tripwireResponses.format}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "format",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={2}
                                  placeholder="Describe the format and delivery method..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  How long will it take the customer to
                                  use/consume it? (keep it short + actionable)
                                </label>
                                <textarea
                                  value={tripwireResponses.timeCommitment}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "timeCommitment",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={2}
                                  placeholder="Specify the time commitment for customers..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What tools or platforms will you need to
                                  deliver it?
                                </label>
                                <textarea
                                  value={tripwireResponses.tools}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "tools",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={2}
                                  placeholder="List the tools and platforms needed..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Pricing & Positioning Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Pricing & Positioning
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What will you charge for this offer? (usually
                                  $7–$47) Reference your strategy created by our
                                  team.
                                </label>
                                <textarea
                                  value={tripwireResponses.pricing}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "pricing",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={2}
                                  placeholder="Enter your pricing strategy..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What would this offer easily be regularly
                                  priced at?
                                </label>
                                <textarea
                                  value={tripwireResponses.regularPrice}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "regularPrice",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={2}
                                  placeholder="Enter the regular price comparison..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  How will you position the value so the price
                                  feels like a no-brainer? Note the quick wins
                                  and outcomes that you'll highlight.
                                </label>
                                <textarea
                                  value={tripwireResponses.valuePositioning}
                                  onChange={(e) =>
                                    handleTripwireResponseChange(
                                      "valuePositioning",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe your value positioning strategy..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Generate Outline Button */}
                          <div className="pt-6 border-t border-slate-200">
                            {allTripwireQuestionsAnswered ? (
                              <Button
                                onClick={generateTripwireOutline}
                                disabled={isGeneratingTripwire}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                {isGeneratingTripwire ? (
                                  <>
                                    <span className="animate-spin mr-2">
                                      ⏳
                                    </span>
                                    Generating Your Outline...
                                  </>
                                ) : (
                                  "Generate Tripwire Offer Outline"
                                )}
                              </Button>
                            ) : (
                              <div className="text-center">
                                <p className="text-sm text-slate-500 mb-3">
                                  Please answer all questions above to generate
                                  your outline
                                </p>
                                <Button disabled className="w-full">
                                  Generate Tripwire Offer Outline
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="core-outline" className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-coral-100 text-coral-700"
                        >
                          Main Transformation
                        </Badge>
                      </div>

                      {/* Conditional rendering: Questions form OR Generated outline */}
                      {showCoreOutline && coreOutline ? (
                        // Show generated outline editor
                        <div className="space-y-4">
                          <div className="flex items-center justify-end">
                            <Button
                              size="sm"
                              onClick={() => setShowCoreOutline(false)}
                              className="bg-coral-500 hover:bg-coral-600 text-white"
                              data-testid="button-back-to-questions"
                            >
                              Back to Questions
                            </Button>
                          </div>

                          {/* Section-by-Section Editor with AI Coaching */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-slate-900">
                                  Your Core Offer Outline
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">
                                  Edit any section to automatically re-evaluate
                                  and get AI coaching
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-coral-500 hover:bg-coral-600 text-white"
                                      data-testid="button-download-core-outline"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={downloadCoreOutlineAsPDF}
                                      data-testid="download-core-outline-pdf"
                                      className="hover:bg-slate-100 focus:bg-slate-100"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Download as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={downloadCoreOutlineAsDOCX}
                                      data-testid="download-core-outline-docx"
                                      className="hover:bg-slate-100 focus:bg-slate-100"
                                    >
                                      <File className="w-4 h-4 mr-2" />
                                      Download as DOCX
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <CoreOfferOutlineSectionEditor
                              outline={coreOutline}
                              mainTransformation={
                                coreResponses.headlineTransformation || ""
                              }
                              onUpdate={(newOutline) => {
                                setCoreOutline(newOutline);
                                // Auto-save to localStorage
                                try {
                                  localStorage.setItem(
                                    `core-offer-outline-${userId}`,
                                    newOutline
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error saving outline to localStorage:",
                                    error
                                  );
                                }
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        // Show questions form
                        <div className="space-y-6">
                          <div className="bg-coral-50 p-4 rounded-lg border border-coral-200">
                            <h4 className="font-medium text-coral-900 mb-2">
                              What is a Core Offer?
                            </h4>
                            <p className="text-sm text-coral-800">
                              Your main program or service—the transformation
                              your business is built around. This is your
                              primary revenue generator and signature offering.
                            </p>
                          </div>

                          {/* Summary Banner - Shows when all questions resolved */}
                          {summaryMutation.data && allQuestionsResolved && (
                            <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <AlertDescription>
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-green-900 text-lg mb-2">
                                      🎉 Excellent Work!
                                    </h4>
                                    <p className="text-green-800 leading-relaxed">
                                      {summaryMutation.data.summary}
                                    </p>
                                  </div>

                                  {summaryMutation.data.strengths &&
                                    summaryMutation.data.strengths.length >
                                      0 && (
                                      <div className="bg-white/60 p-3 rounded-lg">
                                        <h5 className="font-medium text-green-900 mb-1 text-sm">
                                          Key Strengths:
                                        </h5>
                                        <ul className="space-y-1">
                                          {summaryMutation.data.strengths.map(
                                            (strength: string, idx: number) => (
                                              <li
                                                key={idx}
                                                className="text-sm text-green-800"
                                              >
                                                ✓ {strength}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {summaryMutation.data.nextSteps &&
                                    summaryMutation.data.nextSteps.length >
                                      0 && (
                                      <div className="bg-white/60 p-3 rounded-lg">
                                        <h5 className="font-medium text-green-900 mb-1 text-sm">
                                          Next Steps:
                                        </h5>
                                        <ul className="space-y-1">
                                          {summaryMutation.data.nextSteps.map(
                                            (step: string, idx: number) => (
                                              <li
                                                key={idx}
                                                className="text-sm text-green-800"
                                              >
                                                → {step}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  <div className="pt-2">
                                    <Button
                                      onClick={() => setShowCoreOutline(false)}
                                      className="bg-green-600 hover:bg-green-700"
                                      data-testid="button-proceed-to-outline"
                                    >
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      Generate Your Full Offer Outline
                                    </Button>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Offer Name */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Offer Information
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Name Of Offer / Product:
                                </label>
                                <textarea
                                  value={coreResponses.offerName}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "offerName",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={1}
                                  placeholder="Enter your offer name..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Core Transformation & Messaging Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Core Transformation & Messaging
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What is the headline transformation or main
                                  promise of this offer? What will somebody be
                                  able to know, be or do if they implement
                                  everything your offer has to offer? Use their
                                  language!
                                </label>
                                <textarea
                                  value={coreResponses.headlineTransformation}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "headlineTransformation",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Describe the main transformation promise..."
                                  data-testid="input-headlineTransformation"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  In one clear and concise statement, explain
                                  the desire that you offer fulfills for your
                                  audience. What will somebody be able to know,
                                  be or do if they implement everything your
                                  offer has to offer?
                                </label>
                                <textarea
                                  value={coreResponses.clearStatement}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "clearStatement",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="One clear statement of the desire fulfilled..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What makes your core offer different from
                                  competitors (unique method, experience, story,
                                  or system)?
                                </label>
                                <textarea
                                  value={coreResponses.uniqueDifference}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "uniqueDifference",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Explain your unique differentiation..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Ideal Customer & Pain Points Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Ideal Customer & Pain Points
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What specific problems, frustrations and
                                  desires does this offer address? Highlight
                                  each one and the different parts of your offer
                                  that address it.
                                </label>
                                <textarea
                                  value={coreResponses.problemsFrustrations}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "problemsFrustrations",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="List problems and how your offer addresses each..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Who is this offer not for (helps clarify
                                  positioning)?
                                </label>
                                <textarea
                                  value={coreResponses.notFor}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "notFor",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe who this offer is NOT for..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What have they already tried that hasn't
                                  worked?
                                </label>
                                <textarea
                                  value={coreResponses.alreadyTried}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "alreadyTried",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="List what they've tried unsuccessfully..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What happens if they don't solve this problem
                                  now? (stakes)
                                </label>
                                <textarea
                                  value={coreResponses.stakes}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "stakes",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe the consequences of inaction..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What objections might someone have, and how do
                                  you answer them?
                                </label>
                                <textarea
                                  value={coreResponses.objections}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "objections",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="List objections and your responses..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Features & Benefits Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Features & Benefits
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  How does your offer work? Can you break it
                                  down in phases, steps or a roadmap with 3-5
                                  components. This is how you'd explain in their
                                  language HOW you get the result you're
                                  promising.
                                </label>
                                <textarea
                                  value={coreResponses.howItWorks}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "howItWorks",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={5}
                                  placeholder="Break down how your offer works step by step..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  List every component of your offer (modules,
                                  sessions, tools, bonuses).
                                </label>
                                <textarea
                                  value={coreResponses.allComponents}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "allComponents",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={5}
                                  placeholder="List all components included in your offer..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  For each, what's the benefit (what it helps
                                  them do/achieve)?
                                </label>
                                <textarea
                                  value={coreResponses.componentBenefits}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "componentBenefits",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Explain benefits of each component..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What's the ultimate emotional benefit (how
                                  life feels after they've purchased and are
                                  using your offer)?
                                </label>
                                <textarea
                                  value={coreResponses.emotionalBenefit}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "emotionalBenefit",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe the ultimate emotional benefit..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Proof & Authority Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Proof & Authority
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What makes this offer different from others in
                                  your industry? Think: What makes your offer
                                  the best? Why is it different? Why is it
                                  better?
                                </label>
                                <textarea
                                  value={coreResponses.offerDifference}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "offerDifference",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Explain industry differentiation..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What personal story connects you to their
                                  struggle?
                                </label>
                                <textarea
                                  value={coreResponses.personalStoryCore}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "personalStoryCore",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Share your personal connection story..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What qualifications, expertise, or lived
                                  experience make you credible?
                                </label>
                                <textarea
                                  value={coreResponses.qualifications}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "qualifications",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="List your qualifications and expertise..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Do you have testimonials, case studies, or
                                  before-and-after stories? Even if from a
                                  different offer, paste them below.
                                </label>
                                <textarea
                                  value={coreResponses.testimonialsCore}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "testimonialsCore",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={5}
                                  placeholder="Paste testimonials and case studies here..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What evidence shows your method works (client
                                  results, stats, unique process)? Even if it's
                                  a story using somebody's first name. Doesn't
                                  have to be an official testimonial.
                                </label>
                                <textarea
                                  value={coreResponses.evidence}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "evidence",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Share evidence that your method works..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Pricing & Value Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Pricing & Value
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What is the investment for this offer?
                                  Reference your strategy our team created.
                                </label>
                                <textarea
                                  value={coreResponses.investment}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "investment",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="State your investment/pricing..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Is there any additional support or components
                                  that you will add into my offer to help your
                                  ideal customer get to their end result faster
                                  and easier?
                                </label>
                                <p className="text-sm text-slate-600 mb-2">
                                  These are often great "bonuses" to add in to
                                  your offer as an extra push to get people to
                                  buy!
                                </p>
                                <p className="text-sm text-slate-600 mb-2">
                                  List them below AND make sure to include the
                                  benefit / outcome of each. Reference your
                                  strategy from our team.
                                </p>
                                <textarea
                                  value={coreResponses.bonuses}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "bonuses",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="List additional support/components and their benefits..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  How can you frame the price so it feels like a
                                  bargain compared to the transformation? Think
                                  about the cost in NOT investing for people
                                </label>
                                <textarea
                                  value={coreResponses.framePricing}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "framePricing",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={4}
                                  placeholder="Frame your pricing as a bargain..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  Will you include a guarantee, promise, or risk
                                  reversal? If so, what?
                                </label>
                                <textarea
                                  value={coreResponses.guarantee}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "guarantee",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe your guarantee or risk reversal..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Delivery Method & Structure Section */}
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                              Delivery Method & Structure
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  How will you deliver it? (1:1, group program,
                                  course, hybrid, service, product)
                                </label>
                                <textarea
                                  value={coreResponses.deliveryMethod}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "deliveryMethod",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="Describe your delivery method..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  How long does it take for someone to complete
                                  or experience the transformation?
                                </label>
                                <textarea
                                  value={coreResponses.timeframe}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "timeframe",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={2}
                                  placeholder="Specify the timeframe for transformation..."
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                  What support is included (coaching, community,
                                  templates, calls)?
                                </label>
                                <textarea
                                  value={coreResponses.support}
                                  onChange={(e) =>
                                    handleCoreResponseChange(
                                      "support",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                                  rows={3}
                                  placeholder="List all support included..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Generate Outline Button */}
                          <div className="pt-6 border-t border-slate-200">
                            {allCoreQuestionsAnswered ? (
                              <Button
                                onClick={generateCoreOutline}
                                disabled={isGeneratingCore}
                                className="w-full bg-coral-600 hover:bg-coral-700"
                              >
                                {isGeneratingCore ? (
                                  <>
                                    <span className="animate-spin mr-2">
                                      ⏳
                                    </span>
                                    Generating Your Outline...
                                  </>
                                ) : (
                                  "Generate Core Offer Outline"
                                )}
                              </Button>
                            ) : (
                              <div className="text-center">
                                <p className="text-sm text-slate-500 mb-3">
                                  Please answer all questions above to generate
                                  your outline
                                </p>
                                <Button disabled className="w-full">
                                  Generate Core Offer Outline
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : prompts &&
            (prompts as any).sections &&
            Array.isArray((prompts as any).sections) &&
            (prompts as any).sections.length > 0 &&
            (stepNumber !== 1 || activeTab === "workbook") ? (
            <div className="space-y-6 sm:space-y-8">
              {(prompts as any).sections.map(
                (section: any, sectionIndex: number) => (
                  <Card
                    key={sectionIndex}
                    id={`workbook-section-${sectionIndex}`}
                    className="overflow-hidden border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <CardHeader className="p-0">
                      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 border-b-4 border-blue-200">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-lg">
                                  {sectionIndex + 1}
                                </span>
                              </div>
                              <span className="font-bold text-lg sm:text-xl text-slate-900">
                                {section.title}
                              </span>
                            </div>
                            {(() => {
                              const liveCompletion = calculateLiveCompletion(
                                section.title
                              );
                              if (liveCompletion.total > 0) {
                                return (
                                  <Badge
                                    variant={
                                      liveCompletion.isComplete
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={`text-xs font-semibold px-3 py-1 shadow-sm ${
                                      liveCompletion.isComplete
                                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                        : "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 border border-orange-300"
                                    }`}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1 inline" />
                                    {liveCompletion.completed}/
                                    {liveCompletion.total} (
                                    {liveCompletion.percentage}%)
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs font-medium px-3 py-1.5 bg-white/80 backdrop-blur-sm border-2 border-purple-300 text-purple-700 shadow-sm"
                          >
                            <Sparkles className="w-3 h-3 mr-1 inline" />
                            AI Coaching Enabled
                          </Badge>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50">
                      {section.prompts.map(
                        (prompt: string, promptIndex: number) => {
                          const questionText =
                            typeof prompt === "object"
                              ? (prompt as { question?: string }).question ||
                                String(prompt)
                              : prompt;
                          const promptKey = `${section.title}-${questionText}`;
                          const feedbackKey = `${section.title}-${questionText}`;
                          const currentFeedback = feedback[feedbackKey];
                          const isAnalyzing = analyzingResponse === feedbackKey;
                          console.log("promptKey", promptKey);

                          // Debug logging for Customer Avatar Deep Dive
                          if (
                            section.title === "Customer Avatar Deep Dive" &&
                            promptIndex === 0
                          ) {
                            console.log("Debug feedback lookup:", {
                              feedbackKey,
                              hasCurrentFeedback: !!currentFeedback,
                              allFeedbackKeys: Object.keys(feedback),
                            });
                          }

                          return (
                            <div
                              key={promptIndex}
                              className="space-y-3 p-4 rounded-xl border-2 border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
                            >
                              <label className="text-sm font-semibold text-slate-800 flex items-start justify-between gap-3">
                                <span className="flex items-start gap-2">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                                    {promptIndex + 1}
                                  </span>
                                  <span className="leading-relaxed">
                                    {typeof prompt === "object" &&
                                    (prompt as { question?: string }).question
                                      ? (prompt as { question: string })
                                          .question
                                      : prompt}
                                  </span>
                                </span>
                                {currentFeedback &&
                                  getFeedbackDisplay(currentFeedback)}
                              </label>

                              {/* Guidance text below question in italics */}
                              {/* {typeof prompt === "object" &&
                                (prompt as { guidance?: string }).guidance && (
                                  <p className="text-sm text-slate-600 italic mb-2 leading-relaxed">
                                    {(prompt as { guidance: string }).guidance}
                                  </p>
                                )} */}

                              <div className="space-y-3">
                                {/* Auto-prefill button for offer foundation and presentation questions */}
                                {stepNumber === 2 &&
                                  (section.title === "Offer Foundation" ||
                                    section.title === "Offer Presentation") &&
                                  messagingStrategyContent && (
                                    <div className="bg-coral-50 border border-coral-200 p-3 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-coral-900">
                                            AI Smart Prefill
                                          </p>
                                          <p className="text-xs text-coral-700">
                                            {responses[promptKey]
                                              ? "Add more AI-generated content to your existing response"
                                              : "Generate perfect response from your messaging strategy"}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const hasExistingContent = !!(
                                              responses[promptKey] &&
                                              responses[promptKey].trim()
                                            );
                                            intelligentPrefillMutation.mutate({
                                              questionText,
                                              messagingStrategy:
                                                messagingStrategyContent,
                                              targetPromptKey: promptKey,
                                              isRegenerate: hasExistingContent,
                                            });
                                          }}
                                          disabled={
                                            prefillLoadingButton === promptKey
                                          }
                                          className="bg-coral-600 hover:bg-coral-700 text-white disabled:opacity-50"
                                        >
                                          {prefillLoadingButton === promptKey
                                            ? "Generating..."
                                            : responses[promptKey] &&
                                              responses[promptKey].trim()
                                            ? "Add More"
                                            : "Smart Prefill"}
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                {/* Editing tip for responses */}
                                {responses[promptKey] &&
                                  responses[promptKey].trim() && (
                                    <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border">
                                      💡 You can continuously edit and refine
                                      your response in the text area below
                                    </div>
                                  )}

                                <div className="space-y-2">
                                  {/* Special handling for demographics question */}
                                  {questionText.startsWith(
                                    "What is your ideal customer's demographics?jdsds"
                                  ) ? (
                                    <DemographicsFields
                                      promptKey={promptKey}
                                      currentValue={getCurrentValue(promptKey)}
                                      onUpdate={(newValue) =>
                                        handleResponseChange(
                                          promptKey,
                                          newValue
                                        )
                                      }
                                    />
                                  ) : (
                                    <div className="flex items-end gap-2">
                                      <div className="flex-1 relative">
                                        <Textarea
                                          value={getCurrentValue(promptKey)}
                                          onChange={(e) =>
                                            handleResponseChange(
                                              promptKey,
                                              e.target.value
                                            )
                                          }
                                          placeholder={
                                            responses[promptKey]
                                              ? "Continue editing your response..."
                                              : "Write your response here..."
                                          }
                                          rows={4}
                                          spellCheck={true}
                                          className={`resize-none transition-colors text-sm md:text-base min-h-[100px] md:min-h-[120px] ${getFeedbackColor(
                                            currentFeedback
                                          )}`}
                                        />

                                        {isAnalyzing && (
                                          <div className="absolute bottom-2 right-2">
                                            <div className="flex items-center space-x-1 text-xs text-slate-500">
                                              <Brain className="w-3 h-3 animate-pulse" />
                                              <span>Analyzing...</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Voice Input Component - positioned outside textarea */}
                                      <div className="flex-shrink-0 mb-2 flex items-center space-x-2">
                                        <VoiceRecorder
                                          onTranscriptComplete={(
                                            cleanedText
                                          ) => {
                                            handleResponseChange(
                                              promptKey,
                                              cleanedText
                                            );
                                          }}
                                          questionContext={
                                            typeof prompt === "object"
                                              ? (
                                                  prompt as {
                                                    question?: string;
                                                  }
                                                ).question || String(prompt)
                                              : prompt
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Real-Time AI Coaching Panel - Only shows feedback when user clicks button */}
                                  {stepNumber === 1 &&
                                    !questionText.startsWith(
                                      "What is your ideal customer's demographics?"
                                    ) && (
                                      <RealTimeFeedbackPanel
                                        question={questionText}
                                        userResponse={
                                          getCurrentValue(promptKey) || ""
                                        }
                                        sectionContext={section.title}
                                        // debounceMs={2000}

                                        // autoStart={false}
                                        onAddRewording={(rewording) =>
                                          handleResponseChange(
                                            promptKey,
                                            rewording
                                          )
                                        }
                                      />
                                    )}
                                </div>

                                {/* Enhanced AI Coaching with Follow-up Questions */}
                                {shouldShowFeedback(
                                  promptKey,
                                  currentFeedback
                                ) && (
                                  <Alert
                                    className={`${getFeedbackColor(
                                      currentFeedback
                                    )} border-l-4`}
                                  >
                                    <div className="flex items-start space-x-2">
                                      {getFeedbackDisplay(currentFeedback)}
                                      <div className="flex-1">
                                        <AlertDescription className="text-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                              <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                  currentFeedback.level ===
                                                  "excellent-depth"
                                                    ? "bg-green-100 text-green-800"
                                                    : currentFeedback.level ===
                                                      "good-start"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                              >
                                                {currentFeedback.level ===
                                                "excellent-depth"
                                                  ? "Excellent Depth"
                                                  : currentFeedback.level ===
                                                    "good-start"
                                                  ? "Good Start"
                                                  : "Needs More Detail"}
                                              </span>
                                              <span className="text-xs text-slate-500">
                                                {
                                                  currentFeedback.levelDescription
                                                }
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                                                onClick={() =>
                                                  analyzeResponse(
                                                    section.title,
                                                    questionText,
                                                    responses[promptKey] || ""
                                                  )
                                                }
                                                title="Get fresh AI feedback"
                                              >
                                                Resubmit
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                                                onClick={() =>
                                                  handleDismissFeedback(
                                                    promptKey
                                                  )
                                                }
                                                title="Dismiss AI feedback"
                                              >
                                                <X className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          <p className="mb-3">
                                            {currentFeedback.feedback}
                                          </p>

                                          {/* Follow-up Questions */}
                                          {currentFeedback.followUpQuestions &&
                                            currentFeedback.followUpQuestions
                                              .length > 0 && (
                                              <div className="mb-3">
                                                <div className="font-medium text-xs uppercase tracking-wide mb-2 text-blue-700">
                                                  To go deeper, consider:
                                                </div>
                                                <ul className="text-sm space-y-1 ml-2">
                                                  {currentFeedback.followUpQuestions.map(
                                                    (
                                                      question: string,
                                                      idx: number
                                                    ) => (
                                                      <li
                                                        key={idx}
                                                        className="list-disc list-inside text-blue-800"
                                                      >
                                                        {question}
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}

                                          {/* Interactive Prompts - Now Revised Versions */}
                                          {currentFeedback.interactivePrompts &&
                                            currentFeedback.interactivePrompts
                                              .length > 0 && (
                                              <div className="mb-3">
                                                <div className="font-medium text-xs uppercase tracking-wide mb-2 text-coral-700">
                                                  Improved Versions:
                                                </div>
                                                <div className="space-y-2">
                                                  {currentFeedback.interactivePrompts.map(
                                                    (
                                                      suggestion: string,
                                                      idx: number
                                                    ) => (
                                                      <div
                                                        key={idx}
                                                        className="bg-coral-50 border border-coral-200 rounded p-3"
                                                      >
                                                        <p className="text-sm text-coral-900 mb-2 font-medium">
                                                          Improved Version{" "}
                                                          {idx + 1}:
                                                        </p>
                                                        <p className="text-sm text-coral-800 italic">
                                                          "{suggestion}"
                                                        </p>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          className="mt-2 text-xs h-6 px-2"
                                                          onClick={() =>
                                                            handleImprovedVersionAdd(
                                                              promptKey,
                                                              suggestion
                                                            )
                                                          }
                                                        >
                                                          Add This Version
                                                        </Button>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          {/* Examples */}
                                          {currentFeedback.examples &&
                                            currentFeedback.examples.length >
                                              0 && (
                                              <div className="mb-3">
                                                <div className="font-medium text-xs uppercase tracking-wide mb-2 text-green-700">
                                                  Examples:
                                                </div>
                                                <ul className="text-sm space-y-1 ml-2">
                                                  {currentFeedback.examples.map(
                                                    (
                                                      example: string,
                                                      idx: number
                                                    ) => (
                                                      <li
                                                        key={idx}
                                                        className="list-disc list-inside text-green-800"
                                                      >
                                                        {example}
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}

                                          {/* Next Steps */}
                                          {currentFeedback.nextSteps &&
                                            currentFeedback.nextSteps.length >
                                              0 && (
                                              <div className="mb-3">
                                                <div className="font-medium text-xs uppercase tracking-wide mb-2 text-orange-700">
                                                  Next steps:
                                                </div>
                                                <ul className="text-sm space-y-1 ml-2">
                                                  {currentFeedback.nextSteps.map(
                                                    (
                                                      step: string,
                                                      idx: number
                                                    ) => (
                                                      <li
                                                        key={idx}
                                                        className="list-disc list-inside text-orange-800"
                                                      >
                                                        {step}
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}

                                          {currentFeedback.encouragement && (
                                            <p className="text-sm mt-2 font-medium text-green-700 bg-green-50 p-2 rounded">
                                              💡 {currentFeedback.encouragement}
                                            </p>
                                          )}
                                        </AlertDescription>
                                      </div>
                                    </div>
                                  </Alert>
                                )}

                                {/* Simplified Interview Integration */}
                                {false &&
                                  section.title ===
                                    "Customer Avatar Deep Dive" &&
                                  Object.keys(interviewNotes).length > 0 && (
                                    <div className="border-t pt-4 mt-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <Users className="w-4 h-4 text-blue-500" />
                                          <span className="text-sm font-medium text-slate-700">
                                            Merge Interview Insights
                                          </span>
                                        </div>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => {
                                            // Simple approach: look for relevant interview data and merge
                                            const questionText =
                                              typeof prompt === "object"
                                                ? (
                                                    prompt as {
                                                      question?: string;
                                                    }
                                                  ).question || String(prompt)
                                                : prompt;
                                            const questionLower =
                                              questionText.toLowerCase();

                                            let relevantNote = null;
                                            if (
                                              questionLower.includes(
                                                "biggest frustration"
                                              )
                                            ) {
                                              relevantNote =
                                                interviewNotes.frustrations ||
                                                interviewNotes.painPoints;
                                            } else if (
                                              questionLower.includes(
                                                "deepest fears"
                                              )
                                            ) {
                                              relevantNote =
                                                interviewNotes.secretFears ||
                                                interviewNotes.nighttime_worries;
                                            } else if (
                                              questionLower.includes(
                                                "magic wand"
                                              ) ||
                                              questionLower.includes(
                                                "perfect day"
                                              )
                                            ) {
                                              relevantNote =
                                                interviewNotes.perfectDay ||
                                                interviewNotes.ideal_outcome;
                                            } else if (
                                              questionLower.includes(
                                                "already tried"
                                              )
                                            ) {
                                              relevantNote =
                                                interviewNotes.failedSolutions;
                                            } else if (
                                              questionLower.includes(
                                                "blocking them"
                                              )
                                            ) {
                                              relevantNote =
                                                interviewNotes.obstacles;
                                            }

                                            if (relevantNote) {
                                              const currentResponse =
                                                responses[promptKey] || "";
                                              const enhancedResponse =
                                                currentResponse
                                                  ? `${currentResponse}\n\nFrom interview: ${relevantNote}`
                                                  : relevantNote;

                                              handleResponseChange(
                                                promptKey,
                                                enhancedResponse
                                              );
                                              toast({
                                                title:
                                                  "Interview insights merged!",
                                                description:
                                                  "Your interview data has been added to this answer.",
                                              });
                                            } else {
                                              toast({
                                                title:
                                                  "No relevant interview data",
                                                description:
                                                  "No matching interview notes found for this question.",
                                              });
                                            }
                                          }}
                                          className="text-xs"
                                        >
                                          Add Interview Data
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                {/* Legacy interview notes section - keeping for backwards compatibility but simplified */}
                                {false &&
                                  section.title ===
                                    "Customer Avatar Deep Dive" &&
                                  Object.keys(interviewNotes).length > 0 && (
                                    <div className="mt-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <Users className="w-4 h-4 text-slate-400" />
                                          <span className="text-sm font-medium text-slate-500">
                                            Raw Interview Notes
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const key = `${section.title}-${promptKey}`;
                                            setShowInterviewNotes((prev) => ({
                                              ...prev,
                                              [key]: !prev[key],
                                            }));
                                          }}
                                          className="text-xs h-6 px-2"
                                        >
                                          {showInterviewNotes[
                                            `${section.title}-${promptKey}`
                                          ]
                                            ? "Hide"
                                            : "Show"}
                                        </Button>
                                      </div>

                                      {showInterviewNotes[
                                        `${section.title}-${promptKey}`
                                      ] && (
                                        <div className="space-y-2">
                                          <p className="text-xs text-slate-600 italic">
                                            Capture insights from customer
                                            interviews that relate to this
                                            question. These notes will help you
                                            write a more authentic response
                                            based on real conversations.
                                          </p>
                                          <Textarea
                                            value={
                                              interviewNotes[
                                                `interview-${promptKey}`
                                              ] || ""
                                            }
                                            onChange={(e) => {
                                              const noteKey = `interview-${promptKey}`;
                                              const content = e.target.value;
                                              const newNotes = {
                                                ...interviewNotes,
                                                [noteKey]: content,
                                              };
                                              setInterviewNotes(newNotes);
                                              localStorage.setItem(
                                                `interview-notes-${userId}`,
                                                JSON.stringify(newNotes)
                                              );

                                              // Save to database with debouncing
                                              if (content.trim()) {
                                                saveInterviewNoteMutation.mutate(
                                                  { noteKey, content }
                                                );
                                              }
                                            }}
                                            placeholder="Interview insights: What did customers actually say about this? Include direct quotes, emotional reactions, or specific examples..."
                                            rows={3}
                                            spellCheck={true}
                                            className="text-sm bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                                          />

                                          {interviewNotes[
                                            `interview-${promptKey}`
                                          ]?.trim() && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                const interviewData =
                                                  interviewNotes[
                                                    `interview-${promptKey}`
                                                  ];
                                                const currentResponse =
                                                  responses[promptKey] || "";
                                                const combinedResponse =
                                                  currentResponse
                                                    ? `${currentResponse}\n\n[Based on interviews: ${interviewData}]`
                                                    : interviewData;
                                                handleResponseChange(
                                                  promptKey,
                                                  combinedResponse
                                                );
                                              }}
                                              className="text-xs h-7"
                                            >
                                              <ArrowUp className="w-3 h-3 mr-1" />
                                              Add to Response
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        }
                      )}

                      {/* Section Completion Button - Real-time completion status */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        {(() => {
                          const liveCompletion = calculateLiveCompletion(
                            section.title
                          );
                          const isDatabaseCompleted = isSectionCompleted(
                            section.title
                          );

                          // Show completed status if either live calculation OR database shows complete
                          // This handles cases during transition periods
                          return (
                            liveCompletion.isComplete || isDatabaseCompleted
                          );
                        })() ? (
                          <div className="w-full bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="font-semibold text-green-800">
                              ✓ {section.title} Section Completed!
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              {stepNumber === 1
                                ? "Great work! Complete all sections, then generate your messaging strategy in the Resources tab."
                                : stepNumber === 2
                                ? "Excellent! Now go to the Offer Outline tab above to generate your complete offer outline."
                                : "Great work! You can continue editing your responses or move on to the next section."}
                            </p>
                          </div>
                        ) : (
                          (() => {
                            const liveCompletion = calculateLiveCompletion(
                              section.title
                            );
                            const isDatabaseCompleted = isSectionCompleted(
                              section.title
                            );

                            // Only show button if section is NOT complete according to live calculation
                            // but allow manual completion regardless
                            return stepNumber === 2 &&
                              sectionIndex ===
                                (prompts as any).sections.length - 1 ? (
                              // For Step 2's last section, show button to generate offer outline
                              <Button
                                onClick={async () => {
                                  await toggleSectionCompletion(section.title);

                                  // Show success message and direct to offer outline
                                  toast({
                                    title: "Section Completed!",
                                    description:
                                      "Great work! Now scroll up to generate your offer outline.",
                                    duration: 4000,
                                  });

                                  // Scroll to top of page where offer outline panel is
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className="w-full bg-coral-600 hover:bg-coral-700 text-white"
                                size="lg"
                                disabled={markSectionComplete.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {markSectionComplete.isPending
                                  ? "Saving..."
                                  : `Complete ${section.title} & Generate Offer Outline`}
                              </Button>
                            ) : (
                              <Button
                                onClick={() =>
                                  toggleSectionCompletion(section.title)
                                }
                                className="w-full bg-coral-600 hover:bg-coral-700 text-white"
                                size="lg"
                                disabled={markSectionComplete.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {markSectionComplete.isPending
                                  ? "Saving..."
                                  : `Complete ${section.title} Section`}
                              </Button>
                            );
                          })()
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              <div className="text-center space-y-3">
                <p className="text-xs text-slate-500">
                  Your responses are saved automatically as you type. AI
                  feedback helps you create deeper, more effective responses
                  based on best practices.
                </p>
              </div>

              {/* Generate Strategy Button for Step 1 */}
              {stepNumber === 1 && (
                <div className="flex flex-col items-center gap-4 mt-6">
                  {/* Warning message when no responses are available */}
                  {Object.keys(responses || {}).length === 0 &&
                    !unsavedChanges.hasUnsavedChanges && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full max-w-2xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-amber-900 text-sm">
                              No Responses Found
                            </h4>
                            <p className="text-sm text-amber-800 mt-1">
                              We couldn't find any saved responses in your
                              workbook. To generate your messaging strategy:
                            </p>
                            <ol className="text-sm text-amber-800 mt-2 ml-4 list-decimal space-y-1">
                              <li>
                                Scroll down to the workbook sections below
                              </li>
                              <li>Fill in your answers to the questions</li>
                              <li>Your responses will auto-save as you type</li>
                              <li>Return here to generate your strategy</li>
                            </ol>
                            <p className="text-xs text-amber-700 mt-3 italic">
                              Note: If you previously completed sections but
                              they're showing blank, please re-enter your
                              answers. This can happen if you started a new
                              session.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  <Button
                    onClick={async () => {
                      // Check if we have responses before proceeding
                      const hasResponses =
                        Object.keys(responses || {}).length > 0 ||
                        unsavedChanges.hasUnsavedChanges;

                      if (!hasResponses) {
                        toast({
                          title: "No Responses Found",
                          description:
                            "Please fill in your workbook answers below before generating your strategy.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Save any unsaved responses silently in the background (don't await)
                      if (unsavedChanges.hasUnsavedChanges) {
                        console.log(
                          "[SILENT AUTO-SAVE] Saving responses in background...",
                          unsavedChanges.dirtyQuestions
                        );

                        // Save all unsaved responses silently without blocking
                        unsavedChanges.dirtyQuestions.forEach(
                          async (questionKey) => {
                            const change =
                              unsavedChanges.unsavedChanges[questionKey];
                            const sectionTitle = questionKey.split("-")[0];

                            try {
                              await manualSave.saveResponse({
                                userId: memoizedUserId,
                                stepNumber,
                                offerNumber,
                                questionKey,
                                responseText: change.currentValue,
                                sectionTitle,
                              });

                              // Clear the change after saving
                              unsavedChanges.clearChange(questionKey);
                            } catch (error) {
                              console.error(
                                "[SILENT AUTO-SAVE] Save failed for",
                                questionKey,
                                error
                              );
                            }
                          }
                        );
                      }

                      // Start generating immediately without waiting for saves
                      regenerateMessagingStrategy.mutate({ trigger: "manual" });
                    }}
                    disabled={
                      regenerateMessagingStrategy.isPending ||
                      (Object.keys(responses || {}).length === 0 &&
                        !unsavedChanges.hasUnsavedChanges)
                    }
                    className="text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#689cf2", height: "48px" }}
                    data-testid="button-generate-strategy"
                    title={
                      Object.keys(responses || {}).length === 0 &&
                      !unsavedChanges.hasUnsavedChanges
                        ? "Please fill in your workbook answers below before generating your strategy"
                        : "Generate your comprehensive messaging strategy"
                    }
                  >
                    {regenerateMessagingStrategy.isPending ? (
                      <>
                        <Brain className="w-4 h-4 mr-2 animate-pulse" />
                        Generating Strategy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Messaging Strategy
                        {Object.keys(responses || {}).length > 0 && (
                          <span className="ml-2 text-xs opacity-90">
                            ({Object.keys(responses).length} responses)
                          </span>
                        )}
                      </>
                    )}
                  </Button>

                  {/* Book Strategy Call Button - Only clickable after messaging strategy is generated */}
                  <Button
                    onClick={() => {
                      window.open(
                        "https://calendly.com/1lisaolivio/ignite-strategy-call",
                        "_blank"
                      );
                    }}
                    disabled={!activeStrategy?.content}
                    className="text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#689cf2", height: "48px" }}
                    data-testid="button-book-strategy-call"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Book Your Strategy Call Here
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Offer Creation
                </h3>
                <p className="text-slate-600">
                  Workbook exercises will appear here once configured
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>
                Customer interviews are optional but highly recommended.
              </strong>{" "}
              If you're struggling to answer the workbook questions deeply or
              don't know your ideal customer well enough yet, interviewing 3-5
              potential clients will give you the real insights you need. These
              conversations will help you build an authentic customer avatar
              based on actual people, not assumptions.
            </AlertDescription>
          </Alert>

          {stepNumber === 1 && (
            <InterviewTranscriptManager userId={parseInt(userId)} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                Interview Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">
                    Before the Interview:
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Find people who match your rough customer profile</li>
                    <li>
                      • Reach out in communities, social media, or through
                      referrals
                    </li>
                    <li>
                      • Offer a small thank you (coffee card, donation to
                      charity)
                    </li>
                    <li>• Set clear expectations about time and purpose</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">
                    During the Interview:
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Listen more than you talk (80/20 rule)</li>
                    <li>• Ask "tell me more about that" frequently</li>
                    <li>• Don't pitch your solution during the interview</li>
                    <li>• Record (with permission) or take detailed notes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="second-outline" className="space-y-6">
          <SecondOfferWorkbook
            stepNumber={stepNumber}
            userId={userId}
            offerNumber={2}
            stepContent={stepContent}
          />
        </TabsContent>

        {stepNumber === 1 && (
          <TabsContent value="interviews" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-500" />
                    Complete Customer Interview Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 p-3 rounded border border-amber-200">
                    <p className="text-sm text-amber-800 mb-1">
                      <strong>
                        Input your customer's actual answers below.
                      </strong>{" "}
                      Each answer can be transferred directly to the
                      corresponding Customer Avatar question in your Messaging
                      Strategy workbook with automatic first-person to
                      third-person conversion.
                    </p>
                    <p className="text-xs text-amber-700 italic">
                      Upload and organize your interview transcripts in the
                      "Interview Transcripts" section at the top of this page
                      for automatic AI processing.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {[
                      {
                        question:
                          "What is your ideal customer's biggest frustration?",
                        key: "frustrations",
                        workbookKey:
                          "Customer Avatar Deep Dive-What is your ideal customer's biggest frustration?",
                        workbookMap:
                          "What is your ideal customer's biggest frustration?",
                      },
                      {
                        question: "What keeps them awake at night?",
                        key: "nighttime_worries",
                        workbookKey:
                          "Customer Avatar Deep Dive-What keeps them awake at night?",
                        workbookMap: "What keeps them awake at night?",
                      },
                      {
                        question:
                          "What are they secretly afraid of that they won't admit to others?",
                        key: "secret_fears",
                        workbookKey:
                          "Customer Avatar Deep Dive-What are they secretly afraid of that they won't admit to others?",
                        workbookMap:
                          "What are they secretly afraid of that they won't admit to others?",
                      },
                      {
                        question:
                          "If you could wave a magic wand for them and solve their problem, what would that look like?",
                        key: "magic_solution",
                        workbookKey:
                          "Customer Avatar Deep Dive-If you could wave a magic wand for them and solve their problem, what would that look like?",
                        workbookMap:
                          "If you could wave a magic wand for them and solve their problem, what would that look like?",
                      },
                      {
                        question:
                          "What is their age range, income level, and job title or role?",
                        key: "demographics",
                        workbookKey:
                          "Customer Avatar Deep Dive-What is their age range, income level, and job title or role?",
                        workbookMap:
                          "What is their age range, income level, and job title or role?",
                      },
                      {
                        question:
                          "What have they already tried to solve this problem that didn't work?",
                        key: "failed_solutions",
                        workbookKey:
                          "Customer Avatar Deep Dive-What have they already tried to solve this problem that didn't work?",
                        workbookMap:
                          "What have they already tried to solve this problem that didn't work?",
                      },
                      {
                        question:
                          "What is currently blocking them from getting the results they want?",
                        key: "blockers",
                        workbookKey:
                          "Customer Avatar Deep Dive-What is currently blocking them from getting the results they want?",
                        workbookMap:
                          "What is currently blocking them from getting the results they want?",
                      },
                      {
                        question:
                          "Where do they go for advice and information (websites, podcasts, influencers)?",
                        key: "info_sources",
                        workbookKey:
                          "Customer Avatar Deep Dive-Where do they go for advice and information (websites, podcasts, influencers)?",
                        workbookMap:
                          "Where do they go for advice and information (websites, podcasts, influencers)?",
                      },
                      {
                        question:
                          "How do they typically make purchasing decisions (research-heavy, impulse, ask others)?",
                        key: "decision_making",
                        workbookKey:
                          "Customer Avatar Deep Dive-How do they typically make purchasing decisions (research-heavy, impulse, ask others)?",
                        workbookMap:
                          "How do they typically make purchasing decisions (research-heavy, impulse, ask others)?",
                      },
                      {
                        question:
                          "What would need to happen for them to invest in a solution like yours?",
                        key: "investment_criteria",
                        workbookKey:
                          "Customer Avatar Deep Dive-What would need to happen for them to invest in a solution like yours?",
                        workbookMap:
                          "What would need to happen for them to invest in a solution like yours?",
                      },
                      {
                        question:
                          "How will they measure success after working with you?",
                        key: "success_measures",
                        workbookKey:
                          "Customer Avatar Deep Dive-How will they measure success after working with you?",
                        workbookMap:
                          "How will they measure success after working with you?",
                      },
                      {
                        question:
                          "What specific outcomes would make them tell others about your solution?",
                        key: "referral_outcomes",
                        workbookKey:
                          "Customer Avatar Deep Dive-What specific outcomes would make them tell others about your solution?",
                        workbookMap:
                          "What specific outcomes would make them tell others about your solution?",
                      },
                      {
                        question:
                          "Is there anything else you think I should know?",
                        key: "additional_insights",
                        workbookKey:
                          "Customer Avatar Deep Dive-Is there anything else you think I should know?",
                        workbookMap:
                          "Is there anything else you think I should know?",
                      },
                    ].map((item, index) => (
                      <div
                        key={item.key}
                        className="border border-slate-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="bg-slate-50 p-3 rounded border-l-4 border-primary">
                          <p className="text-sm text-slate-700 font-medium mb-1">
                            Question {index + 1}:
                          </p>
                          <p className="text-sm text-slate-900">
                            {item.question}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-600">
                              Customer's Answer:
                            </label>
                            <div className="flex items-center space-x-2">
                              {responses[item.workbookKey] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const key = `previous-${item.key}`;
                                    setShowPreviousAnswers((prev) => ({
                                      ...prev,
                                      [key]: !prev[key],
                                    }));
                                  }}
                                  className="text-xs h-6 px-2 text-blue-600 hover:text-blue-800"
                                >
                                  {showPreviousAnswers[`previous-${item.key}`]
                                    ? "Hide"
                                    : "View Previous"}
                                </Button>
                              )}
                              {/* <span className="text-xs text-slate-500 italic">
                                → Maps to: "{item.workbookMap}"
                              </span> */}
                            </div>
                          </div>

                          {showPreviousAnswers[`previous-${item.key}`] &&
                            responses[item.workbookKey] && (
                              <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium text-amber-800">
                                    Previously Submitted:
                                  </label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Convert third person back to first person for editing
                                      const previousAnswer =
                                        responses[item.workbookKey];
                                      const convertedAnswer = previousAnswer
                                        .replace(/\bThey\b/g, "I")
                                        .replace(/\btheir\b/g, "my")
                                        .replace(/\bthem\b/g, "me")
                                        .replace(/\bthemselves\b/g, "myself")
                                        .replace(/\bare\b/g, "am")
                                        .replace(/\bwere\b/g, "was");

                                      const newNotes = {
                                        ...interviewNotes,
                                        [item.key]: convertedAnswer,
                                      };
                                      setInterviewNotes(newNotes);
                                      localStorage.setItem(
                                        `interview-notes-${userId}`,
                                        JSON.stringify(newNotes)
                                      );

                                      toast({
                                        title: "Previous answer loaded",
                                        description:
                                          "You can now edit this answer and transfer it again.",
                                      });
                                    }}
                                    className="text-xs h-6"
                                  >
                                    Load for Editing
                                  </Button>
                                </div>
                                <div className="text-sm text-amber-900 bg-amber-100 rounded p-2 max-h-20 overflow-y-auto">
                                  {responses[item.workbookKey]}
                                </div>
                              </div>
                            )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">
                                Customer Response:
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setHistoryModal({
                                    isOpen: true,
                                    noteKey: item.key,
                                  })
                                }
                                className="text-xs h-6 px-2"
                              >
                                <History className="w-3 h-3 mr-1" />
                                History
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Paste or type the customer's actual answer here..."
                              className="min-h-[80px] border-slate-300 bg-blue-50"
                              spellCheck={true}
                              value={interviewNotes[item.key] || ""}
                              onChange={(e) => {
                                const content = e.target.value;
                                const newNotes = {
                                  ...interviewNotes,
                                  [item.key]: content,
                                };
                                setInterviewNotes(newNotes);
                                localStorage.setItem(
                                  `interview-notes-${userId}`,
                                  JSON.stringify(newNotes)
                                );

                                // Use debounced save to reduce API calls
                                debouncedInterviewSave(item.key, content);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bulk Transfer All Button */}
                  <div className="mt-6 space-y-4">
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex flex-col items-center gap-4">
                        <Button
                          size="lg"
                          onClick={handleBulkTransfer}
                          disabled={
                            bulkTransferInProgress ||
                            Object.values(interviewNotes).every(
                              (note) => !note?.trim()
                            )
                          }
                          className={`w-full md:w-auto transition-all duration-300 ${
                            bulkTransferInProgress
                              ? "bg-blue-500 hover:bg-blue-600"
                              : bulkTransferResults.succeeded > 0 &&
                                !bulkTransferInProgress
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-[#689cf2] hover:bg-[#5a8ce0]"
                          }`}
                          data-testid="button-transfer-all"
                        >
                          {bulkTransferInProgress ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <span>
                                Transferring {bulkTransferProgress.current} of{" "}
                                {bulkTransferProgress.total}...
                              </span>
                            </>
                          ) : bulkTransferResults.succeeded > 0 &&
                            !bulkTransferInProgress ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span>All Transferred Successfully!</span>
                            </>
                          ) : (
                            <>
                              <ArrowUp className="w-4 h-4 mr-2" />
                              <span>
                                Transfer All to Your Messaging Strategy
                              </span>
                            </>
                          )}
                        </Button>

                        {/* Progress indicator */}
                        {bulkTransferInProgress && (
                          <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-md">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  (bulkTransferProgress.current /
                                    bulkTransferProgress.total) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        )}

                        {/* Results summary */}
                        {!bulkTransferInProgress &&
                          (bulkTransferResults.succeeded > 0 ||
                            bulkTransferResults.failed > 0) && (
                            <div className="text-center space-y-1">
                              <p className="text-sm font-medium text-slate-700">
                                Transfer Complete
                              </p>
                              <div className="flex items-center gap-4 text-xs">
                                {bulkTransferResults.succeeded > 0 && (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {bulkTransferResults.succeeded} succeeded
                                  </span>
                                )}
                                {bulkTransferResults.failed > 0 && (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {bulkTransferResults.failed} failed
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Pro Tip:</strong> The AI synthesis system
                      intelligently weaves customer insights into your messaging
                      strategy, creating a continuous narrative rather than
                      copying responses word-for-word. Each transfer builds upon
                      existing content to create a cohesive customer story.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {stepNumber !== 1 && (
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stepContent?.workbookUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Download className="w-5 h-5 mr-2" />
                      Downloadable Workbook
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">
                      Download the complete workbook to work offline or print
                      for reference.
                    </p>
                    <Button asChild>
                      <a
                        href={stepContent.workbookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Workbook
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-500" />
                    Complete Offer Implementation System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3">
                      What You'll Build in This Step
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Complete Project Plan
                        </p>
                        <p>
                          10-12 week realistic timeline with 4 phases, systems
                          requirements, and technical setup checklist
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Ready-to-Use Sales Page
                        </p>
                        <p>
                          Complete sales copy generated from your Messaging
                          Mastery work, including headlines, benefits, and
                          testimonials
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          ✓ Customer Journey Map
                        </p>
                        <p>
                          4-stage experience design from discovery through
                          advocacy with specific touchpoints
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">✓ Delivery Systems</p>
                        <p>
                          Content structure guidelines, platform requirements,
                          and customer success frameworks
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Key Insight:</strong> This step transforms your
                      offer concept into a complete, implementable business
                      system. You'll have everything needed to launch, from
                      technical setup to customer experience design.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-coral-500" />
                    Implementation Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-coral-50 rounded-lg">
                      <h4 className="font-semibold text-coral-900 mb-2">
                        Systems & Processes
                      </h4>
                      <ul className="text-sm text-coral-800 space-y-1">
                        <li>• Content delivery platform selection and setup</li>
                        <li>• Customer onboarding automation sequences</li>
                        <li>
                          • Progress tracking and milestone celebration systems
                        </li>
                        <li>
                          • Support channels and response time commitments
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Content Structure Best Practices
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>
                          • 15-25 minute lesson modules for optimal completion
                          rates
                        </li>
                        <li>• Clear action steps after every lesson</li>
                        <li>• Progress markers and celebration checkpoints</li>
                        <li>
                          • Supporting worksheets, templates, and implementation
                          tools
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg">
                      <h4 className="font-semibold text-amber-900 mb-2">
                        Technical Requirements
                      </h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• Hosting platform and payment processing setup</li>
                        <li>• Recording equipment and editing workflow</li>
                        <li>• Email automation and community platforms</li>
                        <li>• Customer communication and support systems</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Step 3 specific tabs */}
        {stepNumber === 3 && (
          <>
            <TabsContent value="project-plan" className="space-y-6">
              {/* Project Planning Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                    How to Create Your Offer Project Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">
                      The Reality of Building Your First Offer
                    </h3>
                    <p className="text-blue-800 mb-4">
                      Most entrepreneurs underestimate what goes into creating
                      their first paid offer. This isn't just about recording a
                      few videos or writing some content - you're building a
                      complete system that delivers transformation to your
                      customers.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900">
                          What You're Really Building:
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Core content that drives transformation</li>
                          <li>• Supporting materials and worksheets</li>
                          <li>• Customer onboarding process</li>
                          <li>• Communication and delivery systems</li>
                          <li>• Sales and marketing materials</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900">
                          Common Time Underestimates:
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Content creation: 3-5x longer than expected</li>
                          <li>• Technical setup: Always takes longer</li>
                          <li>
                            • Revision cycles: Plan for multiple iterations
                          </li>
                          <li>• Testing phase: Essential but often skipped</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-green-700">
                          Phase 1: Foundation (Week 1-2)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-green-50 p-4 rounded">
                          <h4 className="font-semibold text-green-900 mb-2">
                            Core Objectives
                          </h4>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• Finalize your transformation promise</li>
                            <li>• Create detailed content outline</li>
                            <li>• Choose your delivery method and tools</li>
                            <li>• Set up basic project structure</li>
                          </ul>
                        </div>
                        <div className="text-sm text-slate-600">
                          <strong>Key Deliverable:</strong> Complete content
                          outline with learning objectives for each module
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-700">
                          Phase 2: Content Creation (Week 3-6)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-blue-50 p-4 rounded">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            Core Objectives
                          </h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Record/write core content modules</li>
                            <li>
                              • Create supporting worksheets and templates
                            </li>
                            <li>• Develop assessment or milestone markers</li>
                            <li>• Build customer communication sequences</li>
                          </ul>
                        </div>
                        <div className="text-sm text-slate-600">
                          <strong>Key Deliverable:</strong> Complete first draft
                          of all core content
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-coral-700">
                          Phase 3: Sales Materials (Week 7-8)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-coral-50 p-4 rounded">
                          <h4 className="font-semibold text-coral-900 mb-2">
                            Core Objectives
                          </h4>
                          <ul className="text-sm text-coral-800 space-y-1">
                            <li>• Write compelling sales page copy</li>
                            <li>• Create supporting sales materials</li>
                            <li>• Develop objection handling scripts</li>
                            <li>• Set up payment and enrollment process</li>
                          </ul>
                        </div>
                        <div className="text-sm text-slate-600">
                          <strong>Key Deliverable:</strong> Complete sales page
                          and enrollment system
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-700">
                          Phase 4: Testing & Launch (Week 9-10)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-orange-50 p-4 rounded">
                          <h4 className="font-semibold text-orange-900 mb-2">
                            Core Objectives
                          </h4>
                          <ul className="text-sm text-orange-800 space-y-1">
                            <li>• Run pilot program with beta customers</li>
                            <li>• Gather feedback and make improvements</li>
                            <li>• Refine delivery process and timing</li>
                            <li>• Prepare for full market launch</li>
                          </ul>
                        </div>
                        <div className="text-sm text-slate-600">
                          <strong>Key Deliverable:</strong> Validated offer
                          ready for full launch
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Pro Tip:</strong> Most successful offer creators
                      plan for 10-12 weeks total, not 6-8 weeks. The extra time
                      allows for proper testing, feedback collection, and
                      iteration. Your first offer doesn't need to be perfect -
                      it needs to deliver results and be improvable.
                    </AlertDescription>
                  </Alert>

                  {/* Systems & Processes Planning */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg text-indigo-700">
                        Systems & Processes You'll Need
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-indigo-900">
                            Content Delivery Systems
                          </h4>
                          <div className="bg-indigo-50 p-4 rounded space-y-2">
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-indigo-900">
                                  Platform Choice
                                </p>
                                <p className="text-xs text-indigo-700">
                                  Course platform, membership site, or simple
                                  email sequence
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-indigo-900">
                                  Content Organization
                                </p>
                                <p className="text-xs text-indigo-700">
                                  Logical progression, module structure,
                                  supporting materials
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-indigo-900">
                                  Access Control
                                </p>
                                <p className="text-xs text-indigo-700">
                                  How customers get access, login process,
                                  support materials
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-indigo-900">
                            Customer Success Systems
                          </h4>
                          <div className="bg-indigo-50 p-4 rounded space-y-2">
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-indigo-900">
                                  Onboarding Sequence
                                </p>
                                <p className="text-xs text-indigo-700">
                                  Welcome emails, first steps, expectation
                                  setting
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-indigo-900">
                                  Progress Tracking
                                </p>
                                <p className="text-xs text-indigo-700">
                                  Milestones, check-ins, completion certificates
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-indigo-900">
                                  Support Structure
                                </p>
                                <p className="text-xs text-indigo-700">
                                  How customers get help, response times,
                                  community access
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">
                          Content Structure Best Practices
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
                          <div>
                            <p className="font-medium mb-1">Module Length:</p>
                            <p>
                              15-25 minutes per lesson maximum. Shorter lessons
                              = higher completion rates.
                            </p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Action Steps:</p>
                            <p>
                              Every lesson should end with clear, specific
                              action items they can complete immediately.
                            </p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">
                              Progress Markers:
                            </p>
                            <p>
                              Build in checkpoints where customers can see and
                              celebrate their progress.
                            </p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">
                              Support Materials:
                            </p>
                            <p>
                              Worksheets, templates, checklists that make
                              implementation easier.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technical Setup Considerations */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-700">
                        Technical Setup Checklist
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-900">
                            Week 1-2 Setup
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Choose and set up hosting platform</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Set up payment processing</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Create basic course structure</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Test all user flows</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-900">
                            Content Production
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Recording setup (audio/video quality)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Editing workflow and tools</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>File organization system</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Upload and hosting process</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-900">
                            Customer Communication
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Email automation setup</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Support ticket system</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Community platform (if applicable)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Circle className="w-3 h-3 text-slate-400" />
                              <span>Progress tracking system</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Project Planning Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-500" />
                    Project Planning Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {prompts &&
                    (prompts as any).sections &&
                    (prompts as any).sections[0] && (
                      <div className="space-y-4">
                        {(prompts as any).sections[0].prompts.map(
                          (prompt: string, promptIndex: number) => {
                            const promptKey = `project-plan-${promptIndex}`;
                            const feedbackKey = `Create Your Offer Project Plan-${prompt}`;
                            const currentFeedback = feedback[feedbackKey];
                            const isAnalyzing =
                              analyzingResponse === feedbackKey;

                            return (
                              <div key={promptIndex} className="space-y-3">
                                <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                                  <span>{prompt}</span>
                                  {currentFeedback &&
                                    getFeedbackDisplay(currentFeedback)}
                                </label>

                                <div className="relative">
                                  <Textarea
                                    value={getCurrentValue(promptKey)}
                                    onChange={(e) =>
                                      handleResponseChange(
                                        promptKey,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Write your response here. Click 'Expand with AI Coach' button when ready for coaching..."
                                    rows={4}
                                    className={`resize-none transition-colors ${getFeedbackColor(
                                      currentFeedback
                                    )}`}
                                    spellCheck={true}
                                  />
                                  {isAnalyzing && (
                                    <div className="absolute bottom-2 right-2">
                                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                                        <Brain className="w-3 h-3 animate-pulse" />
                                        <span>Analyzing...</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* AI Feedback */}
                                {shouldShowFeedback(
                                  promptKey,
                                  currentFeedback
                                ) && (
                                  <Alert
                                    className={`${getFeedbackColor(
                                      currentFeedback
                                    )} border-l-4`}
                                  >
                                    <div className="flex items-start space-x-2">
                                      {getFeedbackDisplay(currentFeedback)}
                                      <div className="flex-1">
                                        <AlertDescription className="text-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium">
                                              Level:{" "}
                                              {currentFeedback.level ===
                                              "excellent-depth"
                                                ? "Excellent Depth"
                                                : currentFeedback.level ===
                                                  "good-start"
                                                ? "Good Start"
                                                : "Needs More Detail"}
                                              {currentFeedback.levelDescription}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                                                onClick={() =>
                                                  analyzeResponse(
                                                    "Create Your Offer Project Plan",
                                                    prompt,
                                                    getCurrentValue(promptKey)
                                                  )
                                                }
                                                title="Get fresh AI feedback"
                                              >
                                                Resubmit
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                                                onClick={() =>
                                                  handleDismissFeedback(
                                                    promptKey
                                                  )
                                                }
                                                title="Dismiss AI feedback"
                                              >
                                                <X className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          <p className="mb-2">
                                            {currentFeedback.feedback}
                                          </p>

                                          {currentFeedback.suggestions &&
                                            currentFeedback.suggestions.length >
                                              0 && (
                                              <div>
                                                <div className="font-medium text-xs uppercase tracking-wide mb-1">
                                                  Suggestions:
                                                </div>
                                                <ul className="text-xs space-y-1">
                                                  {currentFeedback.suggestions.map(
                                                    (
                                                      suggestion: string,
                                                      idx: number
                                                    ) => (
                                                      <li
                                                        key={idx}
                                                        className="flex items-start space-x-1"
                                                      >
                                                        <span className="text-slate-400">
                                                          •
                                                        </span>
                                                        <span>
                                                          {suggestion}
                                                        </span>
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}
                                        </AlertDescription>
                                      </div>
                                    </div>
                                  </Alert>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer-experience" className="space-y-6">
              {/* Customer Experience Design Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-500" />
                    Customer Experience Design
                  </CardTitle>
                  <CardDescription>
                    Design the complete customer journey from purchase to
                    success
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {prompts &&
                    (prompts as any).sections &&
                    (prompts as any).sections[0] && (
                      <div className="space-y-4">
                        {(prompts as any).sections[0].prompts.map(
                          (prompt: any, promptIndex: number) => {
                            const promptKey = `customer-experience-${promptIndex}`;
                            const feedbackKey = `Customer Experience Design-${prompt.question}`;
                            const currentFeedback = feedback[feedbackKey];
                            const isAnalyzing =
                              analyzingResponse === feedbackKey;

                            return (
                              <div key={promptIndex} className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                                    <span>{prompt.question}</span>
                                    {currentFeedback &&
                                      getFeedbackDisplay(currentFeedback)}
                                  </label>
                                  {prompt.guidance && (
                                    <p className="text-xs text-slate-500 italic">
                                      {prompt.guidance}
                                    </p>
                                  )}
                                </div>

                                <div className="relative">
                                  <AutoExpandingTextarea
                                    value={getCurrentValue(promptKey)}
                                    onChange={(e) =>
                                      handleResponseChange(
                                        promptKey,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Write your response here. Click 'Expand with AI Coach' button when ready for coaching..."
                                    minRows={4}
                                    maxRows={20}
                                    className={`transition-colors ${getFeedbackColor(
                                      currentFeedback
                                    )}`}
                                    spellCheck={true}
                                  />
                                  {isAnalyzing && (
                                    <div className="absolute bottom-2 right-2">
                                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                                        <Brain className="w-3 h-3 animate-pulse" />
                                        <span>Analyzing...</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* AI Feedback */}
                                {shouldShowFeedback(
                                  promptKey,
                                  currentFeedback
                                ) && (
                                  <Alert
                                    className={`${getFeedbackColor(
                                      currentFeedback
                                    )} border-l-4`}
                                  >
                                    <div className="flex items-start space-x-2">
                                      {getFeedbackDisplay(currentFeedback)}
                                      <div className="flex-1">
                                        <AlertDescription className="text-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium">
                                              Level:{" "}
                                              {currentFeedback.level ===
                                              "excellent-depth"
                                                ? "Excellent Depth"
                                                : currentFeedback.level ===
                                                  "good-start"
                                                ? "Good Start"
                                                : "Needs More Detail"}
                                              {currentFeedback.levelDescription}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                                                onClick={() =>
                                                  analyzeResponse(
                                                    "Customer Experience Design",
                                                    prompt.question,
                                                    getCurrentValue(promptKey)
                                                  )
                                                }
                                                title="Get fresh AI feedback"
                                              >
                                                Resubmit
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                                                onClick={() =>
                                                  handleDismissFeedback(
                                                    promptKey
                                                  )
                                                }
                                                title="Dismiss AI feedback"
                                              >
                                                <X className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          <p className="mb-2">
                                            {currentFeedback.feedback}
                                          </p>
                                        </AlertDescription>
                                      </div>
                                    </div>
                                  </Alert>
                                )}

                                {/* AI Coaching Expansion */}
                                {getCurrentValue(promptKey) &&
                                  getCurrentValue(promptKey).length > 20 && (
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          expandResponseWithAI(
                                            "Customer Experience Design",
                                            prompt.question,
                                            getCurrentValue(promptKey),
                                            promptKey
                                          )
                                        }
                                        disabled={
                                          expandingResponse === promptKey
                                        }
                                        className="text-xs bg-embodied-coral hover:bg-embodied-orange text-white"
                                      >
                                        {expandingResponse === promptKey ? (
                                          <>
                                            <Brain className="w-3 h-3 mr-1 animate-pulse" />
                                            Expanding...
                                          </>
                                        ) : (
                                          <>
                                            <Lightbulb className="w-3 h-3 mr-1" />
                                            Expand with AI Coach
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales-page" className="space-y-6">
              {/* Sales Page Content Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-coral-500" />
                    Sales Page Content
                  </CardTitle>
                  <CardDescription>
                    Plan the key elements of your sales page copy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {prompts &&
                    (prompts as any).sections &&
                    (prompts as any).sections[1] && (
                      <div className="space-y-4">
                        {(prompts as any).sections[1].prompts.map(
                          (prompt: any, promptIndex: number) => {
                            const promptKey = `sales-page-${promptIndex}`;
                            const feedbackKey = `Sales Page Content-${prompt.question}`;
                            const currentFeedback = feedback[feedbackKey];
                            const isAnalyzing =
                              analyzingResponse === feedbackKey;

                            return (
                              <div key={promptIndex} className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                                    <span>{prompt.question}</span>
                                    {currentFeedback &&
                                      getFeedbackDisplay(currentFeedback)}
                                  </label>
                                  {prompt.guidance && (
                                    <p className="text-xs text-slate-500 italic">
                                      {prompt.guidance}
                                    </p>
                                  )}
                                </div>

                                <div className="relative">
                                  <AutoExpandingTextarea
                                    value={getCurrentValue(promptKey)}
                                    onChange={(e) =>
                                      handleResponseChange(
                                        promptKey,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Write your response here. Click 'Expand with AI Coach' button when ready for coaching..."
                                    minRows={4}
                                    maxRows={20}
                                    className={`transition-colors ${getFeedbackColor(
                                      currentFeedback
                                    )}`}
                                    spellCheck={true}
                                  />
                                  {isAnalyzing && (
                                    <div className="absolute bottom-2 right-2">
                                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                                        <Brain className="w-3 h-3 animate-pulse" />
                                        <span>Analyzing...</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* AI Feedback */}
                                {shouldShowFeedback(
                                  promptKey,
                                  currentFeedback
                                ) && (
                                  <Alert
                                    className={`${getFeedbackColor(
                                      currentFeedback
                                    )} border-l-4`}
                                  >
                                    <div className="flex items-start space-x-2">
                                      {getFeedbackDisplay(currentFeedback)}
                                      <div className="flex-1">
                                        <AlertDescription className="text-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium">
                                              Level:{" "}
                                              {currentFeedback.level ===
                                              "excellent-depth"
                                                ? "Excellent Depth"
                                                : currentFeedback.level ===
                                                  "good-start"
                                                ? "Good Start"
                                                : "Needs More Detail"}
                                              {currentFeedback.levelDescription}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                                                onClick={() =>
                                                  analyzeResponse(
                                                    "Sales Page Content",
                                                    prompt.question,
                                                    getCurrentValue(promptKey)
                                                  )
                                                }
                                                title="Get fresh AI feedback"
                                              >
                                                Resubmit
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                                                onClick={() =>
                                                  handleDismissFeedback(
                                                    promptKey
                                                  )
                                                }
                                                title="Dismiss AI feedback"
                                              >
                                                <X className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          <p className="mb-2">
                                            {currentFeedback.feedback}
                                          </p>
                                        </AlertDescription>
                                      </div>
                                    </div>
                                  </Alert>
                                )}

                                {/* AI Coaching Expansion */}
                                {getCurrentValue(promptKey) &&
                                  getCurrentValue(promptKey).length > 20 && (
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          expandResponseWithAI(
                                            "Sales Page Content",
                                            prompt.question,
                                            getCurrentValue(promptKey),
                                            promptKey
                                          )
                                        }
                                        disabled={
                                          expandingResponse === promptKey
                                        }
                                        className="text-xs bg-embodied-coral hover:bg-embodied-orange text-white"
                                      >
                                        {expandingResponse === promptKey ? (
                                          <>
                                            <Brain className="w-3 h-3 mr-1 animate-pulse" />
                                            Expanding...
                                          </>
                                        ) : (
                                          <>
                                            <Lightbulb className="w-3 h-3 mr-1" />
                                            Expand with AI Coach
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {/* Second Offer Outline Tab for Step 2 - Properly Implemented */}
        {false && stepNumber === 2 && (
          <TabsContent value="second-outline" className="space-y-6">
            <SecondOfferWorkbook
              stepNumber={stepNumber}
              userId={userId}
              offerNumber={2}
              stepContent={stepContent}
            />
          </TabsContent>
        )}

        {stepNumber === 4 && (
          <>
            <TabsContent value="sales-strategy" className="space-y-6">
              {/* AI Customer Location Finder */}
              <CustomerLocationFinder userId={Number(userId)} />
            </TabsContent>

            <TabsContent value="sales-convos" className="space-y-6">
              {/* Sales Conversations Content */}
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Sales Conversations
                  </h3>
                  <p className="text-slate-600">
                    Sales conversation content will appear here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              {/* Resources Content */}
              <Resources />
            </TabsContent>
          </>
        )}

        {/* Workbook sections for all steps - Hide on second offer tab */}
        {/* DISABLED: Duplicate workbook sections - using Location 1 instead */}
        {false &&
          prompts &&
          (prompts as any).sections &&
          Array.isArray((prompts as any).sections) &&
          (prompts as any).sections.length > 0 &&
          activeTab !== "second-outline" &&
          (stepNumber !== 1 || activeTab === "workbook") && (
            <div className="space-y-8">
              {(prompts as any).sections.map(
                (section: any, sectionIndex: number) => (
                  <Card
                    key={sectionIndex}
                    id={`workbook-section-${sectionIndex}`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span>{section.title}</span>
                          {(() => {
                            const liveCompletion = calculateLiveCompletion(
                              section.title
                            );
                            if (liveCompletion.total > 0) {
                              return (
                                <Badge
                                  variant={
                                    liveCompletion.isComplete
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={`text-xs ${
                                    liveCompletion.isComplete
                                      ? "bg-green-600 text-white"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {liveCompletion.completed}/
                                  {liveCompletion.total} questions (
                                  {liveCompletion.percentage}%)
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          AI Coaching Enabled
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {section.prompts.map(
                        (prompt: string, promptIndex: number) => {
                          const questionText =
                            typeof prompt === "object"
                              ? (prompt as { question?: string }).question ||
                                String(prompt)
                              : prompt;
                          const promptKey = `${section.title}-${questionText}`;
                          const feedbackKey = `${section.title}-${questionText}`;
                          const currentFeedback = feedback[feedbackKey];
                          const isAnalyzing = analyzingResponse === feedbackKey;

                          return (
                            <div key={promptIndex} className="space-y-3">
                              <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                                <span>
                                  {typeof prompt === "object" &&
                                  (prompt as { question?: string }).question
                                    ? (prompt as { question: string }).question
                                    : prompt}
                                </span>
                                {currentFeedback &&
                                  getFeedbackDisplay(currentFeedback)}
                              </label>

                              <div className="space-y-2">
                                <AutoExpandingTextarea
                                  value={getCurrentValue(promptKey)}
                                  onChange={(e) =>
                                    handleResponseChange(
                                      promptKey,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Write your response here..."
                                  minRows={4}
                                  maxRows={20}
                                  spellCheck={true}
                                  className="transition-colors text-sm md:text-base"
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

        {stepNumber === 4 && (
          <>
            <TabsContent value="sales-strategy" className="space-y-6">
              <CustomerLocationFinder userId={Number(userId)} />
            </TabsContent>

            <TabsContent value="sales-convos" className="space-y-6">
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Sales Conversations
                  </h3>
                  <p className="text-slate-600">
                    Sales conversation content will appear here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <Resources />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Interview Note History Modal */}
      <InterviewNoteHistory
        userId={userId}
        noteKey={historyModal.noteKey}
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, noteKey: "" })}
        onRestore={(content) => {
          console.log(
            "Restoring content for key:",
            historyModal.noteKey,
            "Content:",
            content
          );

          // Update both local state and localStorage
          const newNotes = {
            ...interviewNotes,
            [historyModal.noteKey]: content,
          };
          setInterviewNotes(newNotes);
          localStorage.setItem(
            `interview-notes-${userId}`,
            JSON.stringify(newNotes)
          );

          // Force re-render with a slight delay to ensure state has updated
          setTimeout(() => {
            const updatedNotes = { ...newNotes };
            setInterviewNotes(updatedNotes);
            console.log("State after restore:", updatedNotes);
          }, 50);
        }}
      />
    </div>
  );
}
