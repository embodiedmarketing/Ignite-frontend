import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FileText,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Target,
  Edit,
  ExternalLink,
  HelpCircle,
  Trash,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SalesPageInputField from "@/components/SalesPageInputField";
import { useSalesPageData } from "@/hooks/useSalesPageData";

// Helper function to update specific sections of the sales page
function updateSalesPageSection(
  fullContent: string,
  section: string,
  newContent: string
): string {
  const startMarker = `<!-- ${section.toUpperCase()}_START -->`;
  const endMarker = `<!-- ${section.toUpperCase()}_END -->`;
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
  return fullContent.replace(
    regex,
    `${startMarker}\n${newContent}\n${endMarker}`
  );
}

// Helper function to extract offer number from draft name
function extractOfferNumber(draftName: string): number | null {
  const match = draftName.match(/Offer (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Component for displaying sales page with inline editing and suggestions
function SalesPagePreview({
  content,
  missingElements,
  onSectionEdit,
}: {
  content: string;
  missingElements: MissingElement[];
  onSectionEdit: (section: string, content: string) => void;
}) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");

  const sections = [
    { id: "headline", label: "Headline" },
    { id: "problem", label: "Problem Statement" },
    { id: "solution", label: "Solution" },
    { id: "benefits", label: "Benefits" },
    { id: "testimonials", label: "Testimonials" },
    { id: "pricing", label: "Pricing" },
    { id: "guarantee", label: "Guarantee" },
    { id: "cta", label: "Call to Action" },
  ];

  const extractSectionContent = (sectionId: string): string => {
    const startMarker = `<!-- ${sectionId.toUpperCase()}_START -->`;
    const endMarker = `<!-- ${sectionId.toUpperCase()}_END -->`;
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) return "";

    return content.substring(startIndex + startMarker.length, endIndex).trim();
  };

  return (
    <div
      className="bg-white rounded-lg border p-4"
      style={{ maxWidth: "800px", margin: "0 auto" }}
    >
      {sections.map((section) => {
        const sectionContent = extractSectionContent(section.id);
        const missingSuggestions = missingElements.filter(
          (elem) =>
            elem.section.toLowerCase().includes(section.id) ||
            elem.field.toLowerCase().includes(section.id)
        );

        return (
          <div key={section.id} className="relative group mb-1">
            {/* Compact Section Header with Edit Button */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {section.label}
              </span>
              <Button
                onClick={() => {
                  setEditingSection(section.id);
                  setEditContent(sectionContent);
                }}
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>

            {/* Detailed Improvement Suggestions */}
            {missingSuggestions.length > 0 && (
              <div className="mb-3 p-3 rounded-lg border border-orange-200 bg-orange-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-700">
                    <div className="font-semibold mb-2">
                      Why this section is highlighted:
                    </div>
                    <div className="space-y-2">
                      {missingSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded p-2 border border-orange-100"
                        >
                          <div className="font-medium text-orange-800 mb-1">
                            {suggestion.section}
                          </div>
                          <div className="text-xs mb-2">
                            {suggestion.description}
                          </div>
                          {suggestion.suggestions.length > 0 && (
                            <div className="text-xs">
                              <div className="font-medium mb-1">
                                Specific improvements:
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-orange-600">
                                {suggestion.suggestions
                                  .slice(0, 3)
                                  .map((tip, tipIdx) => (
                                    <li key={tipIdx}>{tip}</li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs text-blue-700 font-medium">
                        💡 Click the edit button above to make these
                        improvements
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* In-Place Editable Content */}
            {editingSection === section.id ? (
              <div className="space-y-2 mb-3">
                <div
                  className="prose prose-sm max-w-none text-sm leading-relaxed border-2 border-blue-300 rounded p-3 bg-blue-50"
                  style={{ marginBottom: "0.5rem" }}
                >
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    onBlur={(e) =>
                      setEditContent(e.currentTarget.textContent || "")
                    }
                    onInput={(e) =>
                      setEditContent(e.currentTarget.textContent || "")
                    }
                    className="outline-none focus:outline-none min-h-[100px] whitespace-pre-wrap"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.6",
                      fontFamily: "inherit",
                    }}
                    dangerouslySetInnerHTML={{ __html: editContent }}
                    spellCheck={true}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onSectionEdit(section.id, editContent);
                      setEditingSection(null);
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setEditingSection(null)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={`prose prose-sm max-w-none text-sm leading-relaxed ${
                  missingSuggestions.length > 0
                    ? "ring-1 ring-orange-200 ring-opacity-50"
                    : ""
                }`}
                style={{ marginBottom: "0.75rem" }}
                dangerouslySetInnerHTML={{
                  __html:
                    sectionContent ||
                    `<div class="text-slate-400 italic text-xs p-3 bg-slate-50 rounded border border-dashed border-slate-200">Click to add ${section.label.toLowerCase()}</div>`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SalesPageGeneratorProps {
  userId: number;
  offerNumber?: number;
}

interface SalesPageInputs {
  headline?: string;
  subheadline?: string;
  problemStatement?: string;
  storyIntro?: string;
  testimonials?: string;
  pricing?: string;
  guarantee?: string;
  urgency?: string;
  bonuses?: string;
  objectionHandling?: string;
  callToAction?: string;
  aboutSection?: string;
  faq?: string;
}

interface MissingElement {
  section: string;
  field: string;
  description: string;
  priority: "high" | "medium" | "low";
  suggestions: string[];
}

interface SalesPageDraft {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  lastModified: string;
}

export default function SalesPageGenerator({
  userId,
  offerNumber = 1,
}: SalesPageGeneratorProps) {
  const [salesPageInputs, setSalesPageInputs] = useState<SalesPageInputs>({});
  const [generatedSalesPage, setGeneratedSalesPage] = useState<string>("");
  const [missingElements, setMissingElements] = useState<MissingElement[]>([]);
  const [completeness, setCompleteness] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState<SalesPageDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);
  const [renameDraftText, setRenameDraftText] = useState<string>("");
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get shared messaging strategy (used by both offers)
  const {
    messagingStrategy,
    isLoading: messagingLoading,
    error: messagingError,
  } = useSalesPageData(userId.toString());

  // Get offer-specific data based on offer number
  const {
    data: offerSpecificOutline,
    isLoading: outlineLoading,
    error: outlineError,
  } = useQuery({
    queryKey: ["/api/user-offer-outlines/user", userId, offerNumber],
    queryFn: async () => {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/user-offer-outlines/user/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch offer outlines");
      const outlines = await response.json();
      return outlines.find(
        (outline: any) => outline.offerNumber === offerNumber
      );
    },
    enabled: !!userId && !!offerNumber,
  });

  // Get offer-specific workbook responses (only for offer 2)
  const {
    data: offerSpecificResponses,
    isLoading: responsesLoading,
    error: responsesError,
  } = useQuery({
    queryKey: ["/api/workbook-responses", userId, offerNumber],
    queryFn: async () => {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/workbook-responses/${userId}?offerNumber=${offerNumber}`
      );
      if (!response.ok) throw new Error("Failed to fetch workbook responses");
      return await response.json();
    },
    enabled: !!userId && !!offerNumber && offerNumber === 2, // Only fetch for offer 2
  });

  // Get original offer outline for offer 1
  const {
    data: originalOfferOutline,
    isLoading: originalOutlineLoading,
    error: originalOutlineError,
  } = useQuery({
    queryKey: ["/api/workbook-responses/user", userId, "step", 2],
    queryFn: async () => {
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/workbook-responses/user/${userId}/step/2`
      );
      if (!response.ok)
        throw new Error("Failed to fetch original offer outline");
      const responses = await response.json();
      return responses.reduce((acc: any, item: any) => {
        acc[item.questionKey] = item.responseText;
        return acc;
      }, {});
    },
    enabled: !!userId && offerNumber === 1, // Only fetch for offer 1
  });

  // Combine loading states
  const dataLoading =
    messagingLoading ||
    outlineLoading ||
    responsesLoading ||
    originalOutlineLoading;
  const dataError =
    messagingError || outlineError || responsesError || originalOutlineError;

  // Load existing sales page inputs and drafts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(
      `salesPageInputs_${userId}_offer${offerNumber}`
    );
    if (saved) {
      setSalesPageInputs(JSON.parse(saved));
    }

    // Load drafts
    const savedDrafts = localStorage.getItem(
      `salesPageDrafts_${userId}_offer${offerNumber}`
    );
    if (savedDrafts) {
      const parsedDrafts = JSON.parse(savedDrafts);
      setDrafts(parsedDrafts);

      // Load the most recent draft if no current draft is selected
      if (parsedDrafts.length > 0) {
        const mostRecent = parsedDrafts.sort(
          (a: SalesPageDraft, b: SalesPageDraft) =>
            new Date(b.lastModified).getTime() -
            new Date(a.lastModified).getTime()
        )[0];
        setCurrentDraftId(mostRecent.id);
        setGeneratedSalesPage(mostRecent.content);
        calculateCompleteness();
      }
    } else {
      // Legacy: load old single sales page format
      const savedSalesPage = localStorage.getItem(
        `generatedSalesPage_${userId}`
      );
      if (savedSalesPage) {
        // Migrate to draft format
        const legacyDraft: SalesPageDraft = {
          id: Date.now().toString(),
          name: "Sales Page Draft 1",
          content: savedSalesPage,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        setDrafts([legacyDraft]);
        setCurrentDraftId(legacyDraft.id);
        setGeneratedSalesPage(savedSalesPage);
        saveDrafts([legacyDraft]);
        localStorage.removeItem(`generatedSalesPage_${userId}`); // Clean up old format
        calculateCompleteness();
      }
    }
  }, [userId]);

  const calculateCompleteness = () => {
    const messagingStrategy = JSON.parse(
      localStorage.getItem(`messagingStrategy_${userId}`) || "{}"
    );
    const offerOutline = JSON.parse(
      localStorage.getItem(`offerOutline_${userId}`) || "{}"
    );

    let calculatedCompleteness = 60; // Base completeness for having a generated page

    if (Object.keys(messagingStrategy).length > 3) calculatedCompleteness += 15;
    if (Object.keys(offerOutline).length > 3) calculatedCompleteness += 15;
    if (messagingStrategy.customerAvatar || messagingStrategy.avatar)
      calculatedCompleteness += 5;
    if (offerOutline.transformation || offerOutline.outcome)
      calculatedCompleteness += 5;

    setCompleteness(Math.min(calculatedCompleteness, 100));
  };

  const saveDrafts = (updatedDrafts: SalesPageDraft[]) => {
    localStorage.setItem(
      `salesPageDrafts_${userId}_offer${offerNumber}`,
      JSON.stringify(updatedDrafts)
    );
    setDrafts(updatedDrafts);
  };

  // Auto-save inputs to localStorage
  useEffect(() => {
    localStorage.setItem(
      `salesPageInputs_${userId}_offer${offerNumber}`,
      JSON.stringify(salesPageInputs)
    );
  }, [salesPageInputs, userId, offerNumber]);

  // Generate sales page mutation - offer-specific
  const generateSalesPageMutation = useMutation({
    mutationKey: [
      `generate-sales-page-offer-${offerNumber}`,
      userId,
      offerNumber,
    ],
    mutationFn: async () => {
      // CRITICAL FIX: Use completely separate data sources for each offer
      let offerData, workbookData;

      if (offerNumber === 1) {
        // For offer 1: use original offer outline from step 2
        offerData = originalOfferOutline || {};
        workbookData = {}; // Offer 1 doesn't use workbook responses
      } else {
        // For offer 2: use offer-specific outline and workbook responses
        offerData = offerSpecificOutline?.content || {};
        workbookData = offerSpecificResponses || {};
      }

      console.log(`🎯 Generating sales page for offer ${offerNumber}:`, {
        offerDataKeys: Object.keys(offerData).length,
        workbookDataKeys: Object.keys(workbookData).length,
        offerNumber,
        hasOfferSpecificOutline: !!offerSpecificOutline,
        hasOfferSpecificResponses: !!offerSpecificResponses,
      });

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/generate-sales-page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            messagingStrategy, // Shared across offers
            offerOutline: offerData, // Offer-specific outline
            workbookResponses: workbookData, // Offer-specific responses
            salesPageInputs,
            offerNumber, // CRITICAL: Pass offer number for backend differentiation
            offerType: offerNumber === 1 ? "course" : "program", // Different types for variety
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate sales page");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Create new draft with offer-specific naming
      const offerDrafts = drafts.filter((draft) =>
        draft.name.includes(`Offer ${offerNumber}`)
      );
      const newDraft: SalesPageDraft = {
        id: Date.now().toString(),
        name: `Offer ${offerNumber} - Draft ${offerDrafts.length + 1}`,
        content: data.salesPageContent,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const updatedDrafts = [...drafts, newDraft];
      saveDrafts(updatedDrafts);

      // COMPLETELY PASSIVE REGENERATION - Never auto-update UI
      console.log(`🔍 Regeneration completed for offer ${offerNumber}:`, {
        newDraftId: newDraft.id,
        newDraftName: newDraft.name,
        totalDrafts: updatedDrafts.length,
        uiWillNotUpdate: true,
      });

      // NO UI UPDATES - User must manually select new draft to view it
      console.log(
        `📝 Draft saved but UI unchanged - user must manually switch to new draft`
      );

      toast({
        title: `New Sales Page Draft Created for Offer ${offerNumber}!`,
        description: `Draft ${
          offerDrafts.length + 1
        } is ready. Switch to it from the drafts panel to view.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description:
          "Please try again or complete more workbook sections first.",
        variant: "destructive",
      });
    },
  });

  const updateInput = (field: keyof SalesPageInputs, value: string) => {
    setSalesPageInputs((prev) => ({ ...prev, [field]: value }));
  };

  const saveDraft = (content: string) => {
    if (!currentDraftId) return;

    const updatedDrafts = drafts.map((draft) =>
      draft.id === currentDraftId
        ? { ...draft, content, lastModified: new Date().toISOString() }
        : draft
    );
    saveDrafts(updatedDrafts);
    setGeneratedSalesPage(content);
  };

  const switchDraft = (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (draft) {
      setCurrentDraftId(draftId);
      setGeneratedSalesPage(draft.content);
      calculateCompleteness();
    }
  };

  const renameDraft = (draftId: string, newName: string) => {
    const updatedDrafts = drafts.map((draft) =>
      draft.id === draftId
        ? {
            ...draft,
            name: newName.trim() || `Draft ${drafts.indexOf(draft) + 1}`,
            lastModified: new Date().toISOString(),
          }
        : draft
    );
    saveDrafts(updatedDrafts);
    setRenamingDraftId(null);
    setRenameDraftText("");

    toast({
      title: "Draft renamed",
      description: `Renamed to "${newName.trim()}"`,
    });
  };

  const startRenaming = (draftId: string, currentName: string) => {
    setRenamingDraftId(draftId);
    setRenameDraftText(currentName);
  };

  const deleteDraft = (draftId: string) => {
    const draftToDelete = drafts.find((d) => d.id === draftId);
    const updatedDrafts = drafts.filter((d) => d.id !== draftId);
    saveDrafts(updatedDrafts);

    if (currentDraftId === draftId) {
      if (updatedDrafts.length > 0) {
        switchDraft(updatedDrafts[0].id);
      } else {
        setCurrentDraftId(null);
        setGeneratedSalesPage("");
        setCompleteness(0);
      }
    }

    setDeletingDraftId(null);

    toast({
      title: "Draft deleted",
      description: `"${
        draftToDelete?.name || "Draft"
      }" has been removed successfully.`,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Sales page content copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const downloadAsDocument = () => {
    // Create a properly formatted Word document with HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sales Page Copy</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            font-size: 2.5rem;
            font-weight: bold;
            color: #1a202c;
            margin-bottom: 1rem;
            line-height: 1.3;
            text-align: center;
        }
        h2 {
            font-size: 1.6rem;
            margin-bottom: 1.5rem;
            font-weight: bold;
        }
        h3 {
            font-size: 1.3rem;
            margin-bottom: 15px;
            font-weight: bold;
        }
        p {
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        .section {
            margin-bottom: 2.5rem;
            padding: 2.5rem;
            border-radius: 12px;
        }
        .problem-section {
            background: #fef5f5;
            border-left: 6px solid #e53e3e;
        }
        .solution-section {
            background: #f0fff4;
            border-left: 6px solid #38a169;
        }
        .benefits-section {
            background: #f7fafc;
            padding: 2rem;
        }
        .benefit-item {
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 5px solid #4299e1;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .pricing-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 3rem 2rem;
        }
        .testimonial {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 8px;
            margin: 1rem 0;
            border-left: 4px solid #28a745;
        }
        .cta-button {
            background: #ffd700;
            color: #333;
            font-size: 1.4rem;
            font-weight: bold;
            padding: 25px 50px;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            margin: 20px 0;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
            line-height: 1.8;
        }
        .highlight {
            background: rgba(229, 62, 62, 0.1);
            padding: 20px;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
        }
    </style>
</head>
<body>
${generatedSalesPage}
</body>
</html>`;

    // Create Word document blob with proper HTML formatting
    const blob = new Blob([htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-page-copy.docx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Word Document Downloaded!",
      description:
        "Sales page formatted for landing page builders like GoHighLevel",
    });
  };

  const createGoogleDoc = () => {
    // Convert HTML to clean, formatted text for Google Docs
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedSalesPage;
    let textContent = tempDiv.textContent || tempDiv.innerText || "";

    // Format the content better for Google Docs with proper spacing and structure
    textContent = textContent
      .replace(/\n\s*\n/g, "\n\n") // Clean up multiple line breaks
      .replace(/^\s+|\s+$/g, "") // Trim whitespace
      .replace(/([.!?])\s*\n/g, "$1\n\n") // Add spacing after sentences
      .replace(/^([A-Z][^.!?]*[.!?])/gm, "\n$1") // Add spacing before new sections
      .trim();

    // Add document title and formatting note
    const formattedContent = `SALES PAGE COPY\n\n${textContent}\n\n---\nGenerated by Launch - Edit and format as needed`;

    // Create Google Docs URL
    const googleDocsUrl = `https://docs.google.com/document/u/0/create?usp=docs_web&title=Sales%20Page%20Copy`;

    // Copy content to clipboard and open Google Docs with enhanced user experience
    navigator.clipboard
      .writeText(formattedContent)
      .then(() => {
        window.open(googleDocsUrl, "_blank");

        // Show helpful toast with instructions
        toast({
          title: "Google Docs Opening!",
          description:
            "Your sales page copy is ready to paste (Ctrl+V or Cmd+V)",
          duration: 6000,
        });

        // Show a follow-up notification after a delay
        setTimeout(() => {
          toast({
            title: "💡 Pro Tip",
            description:
              "Once pasted, use Google Docs formatting tools to style your sales page",
            duration: 4000,
          });
        }, 2000);
      })
      .catch(() => {
        // Fallback for browsers that don't support clipboard API
        window.open(googleDocsUrl, "_blank");

        // Create a temporary textarea for manual copying
        const textarea = document.createElement("textarea");
        textarea.value = formattedContent;
        document.body.appendChild(textarea);
        textarea.select();

        toast({
          title: "Google Docs opened",
          description:
            "Copy the selected text below and paste it into your new document",
          duration: 8000,
        });

        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(textarea);
        }, 10000);
      });
  };

  const generateSampleData = () => {
    // Sample messaging strategy
    const sampleMessagingStrategy = {
      uniquePositioning:
        "I help overwhelmed business owners who are tired of working 60+ hour weeks but making inconsistent income. After 10 years of building and selling 3 successful businesses, I've cracked the code on creating predictable revenue streams while working less than 30 hours per week.",
      brandVoice:
        "Direct, no-nonsense, and empathetic. I speak like a trusted friend who's been through the struggle and found the way out. I use simple language, real examples, and I'm not afraid to call out the BS in the industry.",
      customerAvatar:
        "Sarah is a 38-year-old entrepreneur running a service-based business. She's making $150k annually but working 65 hours a week. She's exhausted, her family time is suffering, and her income fluctuates wildly month to month. She's tried hiring VAs and using productivity apps, but nothing has created the freedom she started her business for.",
      coreMessage:
        "You don't need to work harder to make more money. You need a proven system that creates predictable revenue while giving you your life back.",
    };

    // Sample offer outline
    const sampleOfferOutline = {
      transformation:
        "Transform your chaotic, time-consuming business into a predictable revenue machine that runs without you in 90 days",
      components:
        "Week 1-2: Revenue Audit & Profit Optimization, Week 3-4: Systems & Automation Setup, Week 5-6: Team Building & Delegation, Week 7-8: Marketing Machine Creation, Week 9-12: Scaling & Optimization",
      pricing: "$3,997 one-time payment or 3 payments of $1,497",
      timeline:
        "12-week intensive program with weekly group calls and daily implementation support",
    };

    // Sample sales page content with proper HTML formatting and section markers
    const sampleSalesPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revenue Freedom System - Transform Your Business in 90 Days</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
        .container { background: #fff; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .cta-button { background: #ff6b35; color: white; padding: 20px 40px; font-size: 1.2em; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; margin: 20px 0; transition: all 0.3s ease; }
        .cta-button:hover { background: #e55a2b; transform: translateY(-2px); }
        .guarantee-box { background: #f0f8ff; border: 2px solid #4a90e2; padding: 30px; border-radius: 10px; margin: 30px 0; text-align: center; }
        .testimonial { background: #f9f9f9; border-left: 4px solid #4a90e2; padding: 20px; margin: 20px 0; font-style: italic; border-radius: 5px; }
        .benefit-list { background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 30px 0; }
        .pricing-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 15px; text-align: center; margin: 30px 0; }
        .section { margin: 40px 0; }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADLINE_START -->
        <div class="section" style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 2.5rem; font-weight: bold; color: #1a202c; margin-bottom: 1rem; line-height: 1.3;">
                Stop Working 60+ Hours For Inconsistent Income
            </h1>
            <h2 style="font-size: 1.4rem; color: #4a5568; fontweight: normal; line-height: 1.4;">
                Finally Build The Predictable, Profitable Business You Started For (Without Burning Out)
            </h2>
        </div>
        <!-- HEADLINE_END -->

        <!-- PROBLEM_START -->
        <div class="section" style="background: #fef5f5; padding: 2.5rem; border-radius: 12px; border-left: 6px solid #e53e3e;">
            <h2 style="color: #c53030; font-size: 1.6rem; margin-bottom: 1.5rem;">Here's The Hard Truth Most "Business Gurus" Won't Tell You</h2>
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">You don't have a motivation problem. You don't need another productivity app. You don't need to "hustle harder."</p>
            <p style="font-weight: bold; font-size: 1.3rem; color: #c53030; text-align: center; padding: 20px; background: rgba(229, 62, 62, 0.1); border-radius: 8px;">You have a SYSTEM problem.</p>
            <p style="font-size: 1.1rem; margin-top: 1.5rem;">I learned this the hard way after burning out twice, nearly losing my marriage, and watching my health deteriorate while my business consumed my life.</p>
        </div>
        <!-- PROBLEM_END -->

        <!-- SOLUTION_START -->
        <div class="section" style="background: #f0fff4; padding: 2.5rem; border-radius: 12px; border-left: 6px solid #38a169;">
            <h2 style="color: #2f855a; font-size: 1.6rem; margin-bottom: 1.5rem;">Introducing: The Revenue Freedom System</h2>
            <h3 style="color: #2f855a; font-size: 1.2rem; font-style: italic; margin-bottom: 1.5rem;">The 90-Day Program That Transforms Chaos Into Predictable Profit</h3>
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">This isn't another course you'll never finish. This is a complete business transformation system that takes you from overwhelmed and inconsistent to profitable and free.</p>
            <p style="font-size: 1.1rem; font-weight: bold;">Predictable revenue isn't about working more hours—it's about building the RIGHT systems.</p>
        </div>
        <!-- SOLUTION_END -->

        <!-- BENEFITS_START -->
        <div class="benefit-list">
            <h2 style="color: #2d3748; font-size: 2rem; margin-bottom: 2rem; text-align: center;">Here's Exactly What You Get:</h2>
            <div style="display: grid; gap: 20px;">
                <div style="background: white; padding: 25px; border-radius: 10px; border-left: 5px solid #4299e1; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                    <h3 style="color: #2b6cb0; font-size: 1.3rem; margin-bottom: 15px;">Phase 1: Revenue Audit & Profit Optimization (Weeks 1-2)</h3>
                    <ul style="color: #4a5568; line-height: 1.8;">
                        <li>• Identify your hidden profit leaks (most entrepreneurs lose 40% of potential revenue here)</li>
                        <li>• Optimize your pricing for maximum profit with minimum effort</li>
                        <li>• Create your "Money Map" - know exactly where every dollar comes from</li>
                    </ul>
                </div>
                <div style="background: white; padding: 25px; border-radius: 10px; border-left: 5px solid #48bb78; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                    <h3 style="color: #2f855a; font-size: 1.3rem; margin-bottom: 15px;">Phase 2: Systems & Automation Setup (Weeks 3-4)</h3>
                    <ul style="color: #4a5568; line-height: 1.8;">
                        <li>• Build the 5 core systems every profitable business needs</li>
                        <li>• Automate your sales process so money comes in while you sleep</li>
                        <li>• Create your "Business Operating System" that runs without you</li>
                    </ul>
                </div>
                <div style="background: white; padding: 25px; border-radius: 10px; border-left: 5px solid #ed8936; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                    <h3 style="color: #c05621; font-size: 1.3rem; margin-bottom: 15px;">Phase 3: Team Building & Delegation (Weeks 5-6)</h3>
                    <ul style="color: #4a5568; line-height: 1.8;">
                        <li>• Hire and train the RIGHT people (not just cheap VAs)</li>
                        <li>• Create systems so good your team can run things better than you</li>
                        <li>• Build your "Management Dashboard" for effortless oversight</li>
                    </ul>
                </div>
            </div>
        </div>
        <!-- BENEFITS_END -->

        <!-- TESTIMONIALS_START -->
        <div class="section">
            <h2 style="text-align: center; font-size: 2rem; margin-bottom: 2rem; color: #2d3748;">What Our Clients Are Saying</h2>
            <div class="testimonial">
                <p style="font-size: 1.2rem; margin-bottom: 1rem; line-height: 1.6;">"Sarah came to me working 65 hours a week in her consulting business. Some months she'd make $20k, others barely $8k. She was exhausted, stressed, and ready to quit. 90 days later? She's working 28 hours a week and just had her first $35k month—her most profitable month ever."</p>
                <cite style="font-weight: bold; color: #4a5568; font-size: 1.1rem;">— Real Client Transformation</cite>
            </div>
            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #e6fffa; border-radius: 8px;">
                <p style="font-weight: bold; color: #2f855a; font-size: 1.1rem;">[NEED SPECIFIC CLIENT TESTIMONIALS WITH REAL NAMES AND RESULTS]</p>
            </div>
        </div>
        <!-- TESTIMONIALS_END -->

        <!-- PRICING_START -->
        <div class="pricing-section">
            <h2 style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: bold;">Transform Your Business Today</h2>
            <p style="font-size: 1.3rem; margin-bottom: 2rem; opacity: 0.9;">Everything you need to build predictable revenue in 90 days</p>

            <div style="background: rgba(255,255,255,0.15); padding: 25px; border-radius: 10px; margin: 25px 0;">
                <h3 style="font-size: 1.5rem; margin-bottom: 15px;">Complete Revenue Freedom System</h3>
                <ul style="text-align: left; display: inline-block; font-size: 1.1rem; line-height: 1.8;">
                    <li>✅ 12-Week Intensive Program</li>
                    <li>✅ Weekly Group Coaching Calls ($2,000 value)</li>
                    <li>✅ Daily Implementation Support ($1,500 value)</li>
                    <li>✅ Business Systems Templates ($997 value)</li>
                    <li>✅ Emergency Support Hotline ($497 value)</li>
                </ul>
            </div>

            <div style="font-size: 1.2rem; margin-bottom: 2rem;">
                <p style="text-decoration: line-through; opacity: 0.7;">Total Value: $6,994</p>
                <p style="font-size: 2.5rem; font-weight: bold; color: #ffd700; margin: 15px 0;">Your Investment: $3,997</p>
            </div>

            <a href="#order" class="cta-button" style="background: #ffd700; color: #333; font-size: 1.4rem; font-weight: bold; padding: 25px 50px;">SECURE YOUR SPOT NOW</a>
            <p style="margin-top: 1rem; font-size: 1.1rem;">Or choose payment plan: 3 payments of $1,497</p>
        </div>
        <!-- PRICING_END -->

        <!-- GUARANTEE_START -->
        <div class="guarantee-box">
            <h2 style="color: #4a90e2; font-size: 2rem; margin-bottom: 1.5rem;">Our Iron-Clad 60-Day Guarantee</h2>
            <p style="font-size: 1.2rem; margin-bottom: 1rem; line-height: 1.6;">Use the Revenue Freedom System for 60 days. If you don't see a clear path to working fewer hours while making more predictable money, I'll refund every penny.</p>
            <p style="font-weight: bold; color: #2d3748; font-size: 1.1rem;">No questions. No hassles. No hard feelings.</p>
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                <p style="color: #856404; font-size: 0.95rem; margin: 0;">[CONSIDER STRENGTHENING: Make guarantee more specific or process-based rather than outcome-based]</p>
            </div>
        </div>
        <!-- GUARANTEE_END -->

        <!-- CTA_START -->
        <div class="section" style="text-align: center; background: #f7fafc; padding: 3rem; border-radius: 12px;">
            <h2 style="font-size: 2rem; margin-bottom: 1rem; color: #2d3748;">Ready to Finally Build the Business You Actually Want?</h2>
            <p style="font-size: 1.2rem; margin-bottom: 1rem; color: #4a5568;">This program is limited to 25 entrepreneurs per cohort to ensure everyone gets personal attention.</p>
            <p style="font-weight: bold; margin-bottom: 2rem; color: #e53e3e; font-size: 1.1rem;">The next cohort starts February 1st, and we're already 18/25 full.</p>

            <a href="#order" class="cta-button" style="font-size: 1.5rem; padding: 25px 50px; margin: 20px;">SECURE YOUR SPOT NOW - $3,997</a>

            <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="font-size: 1rem; color: #4a5568; margin-bottom: 10px;">Questions? Email me directly at:</p>
                <p style="font-weight: bold; color: #2d3748;">hello@revenuefreedom.com</p>
            </div>

            <p style="font-size: 0.95rem; color: #718096; margin-top: 20px; font-style: italic;">P.S. - Every day you wait is another day of 60+ hour weeks and unpredictable income. The entrepreneurs who transform their businesses fastest are the ones who take action immediately.</p>
        </div>
        <!-- CTA_END -->

    </div>
</body>
</html>`;

    // Set the sample data
    localStorage.setItem(
      `messagingStrategy_${userId}`,
      JSON.stringify(sampleMessagingStrategy)
    );
    localStorage.setItem(
      `offerOutline_${userId}`,
      JSON.stringify(sampleOfferOutline)
    );
    setGeneratedSalesPage(sampleSalesPage);
    localStorage.setItem(`generatedSalesPage_${userId}`, sampleSalesPage);

    // Set some sample missing elements for demonstration
    setMissingElements([
      {
        section: "Social Proof",
        field: "testimonials",
        description: "Add customer testimonials and success stories",
        priority: "high" as const,
        suggestions: [
          "Include specific results and transformations",
          "Add before/after comparisons",
          "Use real names and photos when possible",
        ],
      },
      {
        section: "Risk Reversal",
        field: "guarantee",
        description: "Strengthen your guarantee to reduce purchase anxiety",
        priority: "medium" as const,
        suggestions: [
          "Make it more specific",
          "Extend the timeframe",
          "Add additional assurances",
        ],
      },
    ]);

    setCompleteness(85);

    toast({
      title: "Sample Data Generated!",
      description:
        "You can now see how the editing interface works with realistic content.",
    });
  };

  // Handle database loading and error states
  if (dataLoading) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
          <span>Loading your workbook data...</span>
        </CardContent>
      </Card>
    );
  }

  if (dataError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <strong>Unable to load your data.</strong> Please try refreshing the
          page or complete your workbook sections first.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if user has sufficient data for sales page generation
  const hasMinimumData = (() => {
    const hasMessaging =
      messagingStrategy && Object.keys(messagingStrategy).length > 0;

    let hasOfferData = false;
    let offerDataInfo = {};

    if (offerNumber === 1) {
      // For offer 1: use original offer outline from step 2
      hasOfferData =
        originalOfferOutline && Object.keys(originalOfferOutline).length > 0;
      offerDataInfo = {
        source: "original_offer_outline",
        keys: originalOfferOutline
          ? Object.keys(originalOfferOutline).length
          : 0,
      };
    } else {
      // For offer 2: use offer-specific outline or workbook responses
      hasOfferData =
        (offerSpecificOutline?.content &&
          Object.keys(offerSpecificOutline.content).length > 0) ||
        (offerSpecificResponses &&
          Object.keys(offerSpecificResponses).length > 0);
      offerDataInfo = {
        source: "offer_specific_data",
        outlineKeys: offerSpecificOutline?.content
          ? Object.keys(offerSpecificOutline.content).length
          : 0,
        responseKeys: offerSpecificResponses
          ? Object.keys(offerSpecificResponses).length
          : 0,
      };
    }

    console.log(`📊 Data validation for offer ${offerNumber}:`, {
      hasMessaging,
      hasOfferData,
      messagingKeys: messagingStrategy
        ? Object.keys(messagingStrategy).length
        : 0,
      offerDataInfo,
    });

    return hasMessaging && hasOfferData;
  })();

  return (
    <div className="space-y-6">
      {!generatedSalesPage ? (
        // Initial Generation Section
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Your Sales Page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              We'll create your sales page using your messaging strategy and
              offer outline. You can then customize and improve specific
              sections.
            </p>

            {/* Show data source status */}
            {hasMinimumData && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="flex items-center text-blue-700 mb-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="font-medium">
                    Data Sources Ready for Offer {offerNumber}:
                  </span>
                </div>
                <div className="space-y-1 text-blue-600">
                  <p>
                    ✓ Messaging Strategy:{" "}
                    {messagingStrategy
                      ? Object.keys(messagingStrategy).length
                      : 0}{" "}
                    responses loaded
                  </p>
                  {offerNumber === 1 ? (
                    <p>
                      ✓ Offer 1 Outline:{" "}
                      {originalOfferOutline
                        ? Object.keys(originalOfferOutline).length
                        : 0}{" "}
                      responses loaded
                    </p>
                  ) : (
                    <>
                      {offerSpecificOutline?.content && (
                        <p>
                          ✓ Offer 2 Outline:{" "}
                          {Object.keys(offerSpecificOutline.content).length}{" "}
                          responses loaded
                        </p>
                      )}
                      {offerSpecificResponses && (
                        <p>
                          ✓ Offer 2 Workbook:{" "}
                          {Object.keys(offerSpecificResponses).length} responses
                          loaded
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {!hasMinimumData && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  <strong>Complete your workbook first.</strong> Please complete
                  your messaging strategy and offer creation sections to
                  generate your sales page.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-3">
              <Button
                onClick={() => generateSalesPageMutation.mutate()}
                disabled={
                  generateSalesPageMutation.isPending || !hasMinimumData
                }
                size="lg"
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateSalesPageMutation.isPending
                  ? "Generating Your Sales Page..."
                  : "Generate Sales Page"}
              </Button>

              <div className="text-slate-500 text-sm">or</div>

              <Button
                onClick={generateSampleData}
                variant="outline"
                size="lg"
                className="w-full max-w-md border-slate-300 hover:bg-slate-50"
              >
                <Target className="w-4 h-4 mr-2" />
                Generate with Sample Data
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Preview the editing interface with realistic example content
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Generated Page with Editing Section
        <div className="space-y-6">
          {/* Compact Draft Management */}
          {drafts.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-slate-600" />
                  <span className="text-sm font-medium text-slate-800">
                    Drafts ({drafts.length})
                  </span>
                </div>
                <Button
                  onClick={() => setShowDraftManager(!showDraftManager)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  {showDraftManager ? "Hide" : "Manage"}
                </Button>
              </div>
              {showDraftManager && (
                <div className="space-y-2">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        currentDraftId === draft.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => switchDraft(draft.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {renamingDraftId === draft.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={renameDraftText}
                                onChange={(e) =>
                                  setRenameDraftText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    renameDraft(draft.id, renameDraftText);
                                  } else if (e.key === "Escape") {
                                    setRenamingDraftId(null);
                                    setRenameDraftText("");
                                  }
                                }}
                                onBlur={() => {
                                  if (renameDraftText.trim() !== draft.name) {
                                    renameDraft(draft.id, renameDraftText);
                                  } else {
                                    setRenamingDraftId(null);
                                    setRenameDraftText("");
                                  }
                                }}
                                className="text-sm font-medium bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                                autoFocus
                                spellCheck={true}
                              />
                            </div>
                          ) : (
                            <div>
                              <h4
                                className="text-sm font-medium text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRenaming(draft.id, draft.name);
                                }}
                                title="Click to rename"
                              >
                                {draft.name}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {new Date(
                                  draft.lastModified
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {currentDraftId === draft.id && (
                            <Badge variant="secondary" className="text-xs h-4">
                              Current
                            </Badge>
                          )}
                          {renamingDraftId !== draft.id && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                startRenaming(draft.id, draft.name);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              title="Rename draft"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          {drafts.length > 1 && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingDraftId(draft.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                              title="Delete draft"
                            >
                              <Trash className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compact Completeness Overview */}
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Sales Page Ready ({completeness}%)
                </span>
              </div>
              <Button
                onClick={() => generateSalesPageMutation.mutate()}
                variant="outline"
                size="sm"
                disabled={generateSalesPageMutation.isPending}
                className="h-8"
              >
                <Wand2 className="w-3 h-3 mr-1" />
                {generateSalesPageMutation.isPending
                  ? "Creating..."
                  : "New Draft"}
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-white rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-green-700">
                {completeness}%
              </span>
            </div>

            {false && missingElements.length > 0 && (
              <div className="mt-3 p-2 rounded border border-orange-200 bg-orange-50">
                <div className="flex items-center text-xs text-orange-700">
                  <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>
                    Complete highlighted sections below for maximum impact
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Generated Sales Page Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Your Sales Page Copy
                </span>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                >
                  {isEditing ? "Save" : "Edit"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="border-2 border-blue-300 rounded-lg p-4 bg-white min-h-[500px] focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all">
                    <div
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      dangerouslySetInnerHTML={{ __html: generatedSalesPage }}
                      onBlur={(e) => {
                        const updatedContent = e.currentTarget.innerHTML;
                        setGeneratedSalesPage(updatedContent);
                        saveDraft(updatedContent);
                      }}
                      className="prose prose-lg max-w-none focus:outline-none"
                      style={{
                        fontFamily:
                          "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
                        lineHeight: "1.6",
                        color: "#333",
                        whiteSpace: "pre-wrap",
                      }}
                      spellCheck={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(generatedSalesPage)}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sticky Action Toolbar */}
                  <div className="sticky top-4 z-10 bg-white border rounded-lg shadow-sm p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-700">
                        Sales Page Actions
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                          className="bg-slate-50 hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Full Page
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(generatedSalesPage)}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy HTML
                        </Button>
                        <Button
                          onClick={downloadAsDocument}
                          variant="outline"
                          size="sm"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Download Copy
                        </Button>
                        <Button
                          onClick={createGoogleDoc}
                          variant="outline"
                          size="sm"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open in Google Docs
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Sales Page Preview */}
                  <SalesPagePreview
                    content={generatedSalesPage}
                    missingElements={missingElements}
                    onSectionEdit={(section, content) => {
                      // Handle inline section editing with draft system
                      const updatedPage = updateSalesPageSection(
                        generatedSalesPage,
                        section,
                        content
                      );
                      setGeneratedSalesPage(updatedPage);
                      saveDraft(updatedPage);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Draft Confirmation Dialog */}
      <AlertDialog
        open={!!deletingDraftId}
        onOpenChange={() => setDeletingDraftId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {drafts.find((d) => d.id === deletingDraftId)?.name ||
                "this draft"}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDraftId && deleteDraft(deletingDraftId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
