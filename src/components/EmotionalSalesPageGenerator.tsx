import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMutation } from "@tanstack/react-query";
import {
  FileText,
  Wand2,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Trash2,
  Heart,
  Save,
  FolderOpen,
  Plus,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSalesPageData } from "@/hooks/useSalesPageData";
import { validateAndNotify } from "@/utils/prerequisite-validator";

interface EmotionalSalesPageGeneratorProps {
  userId: number;
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
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmotionalSalesPageGenerator({
  userId,
}: EmotionalSalesPageGeneratorProps) {
  const [generatedSalesPage, setGeneratedSalesPage] = useState<string>("");
  const [missingElements, setMissingElements] = useState<MissingElement[]>([]);
  const [completeness, setCompleteness] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SalesPageDraft[]>([]);
  const [currentDraftTitle, setCurrentDraftTitle] = useState<string>("");
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDraftsPanel, setShowDraftsPanel] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Load workbook data from database instead of localStorage
  const {
    messagingStrategy,
    offerOutline,
    isLoading: dataLoading,
    error: dataError,
  } = useSalesPageData(userId.toString());

  // Load existing sales page and drafts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`emotionalSalesPage_${userId}`);
    if (saved) {
      setGeneratedSalesPage(saved);
    }

    // Load saved drafts
    const drafts = localStorage.getItem(`salesPageDrafts_${userId}`);
    if (drafts) {
      setSavedDrafts(JSON.parse(drafts));
    }
  }, [userId]);

  // Draft management functions
  const saveDraft = (title: string) => {
    if (!generatedSalesPage.trim()) {
      toast({
        title: "No Content",
        description: "Please generate a sales page first before saving.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();
    const newDraft: SalesPageDraft = {
      id: Date.now().toString(),
      title: title || `Sales Page Draft ${savedDrafts.length + 1}`,
      content: generatedSalesPage,
      createdAt: now,
      updatedAt: now,
    };

    const updatedDrafts = [...savedDrafts, newDraft];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem(
      `salesPageDrafts_${userId}`,
      JSON.stringify(updatedDrafts)
    );

    toast({
      title: "Draft Saved",
      description: `"${newDraft.title}" has been saved successfully.`,
    });

    setShowSaveDialog(false);
    setCurrentDraftTitle("");
  };

  const loadDraft = (draft: SalesPageDraft) => {
    setGeneratedSalesPage(draft.content);
    setCurrentDraftId(draft.id);
    localStorage.setItem(`emotionalSalesPage_${userId}`, draft.content);
    setShowDraftsPanel(false);

    toast({
      title: "Draft Loaded",
      description: `"${draft.title}" has been loaded for editing.`,
    });
  };

  const deleteDraft = (draftId: string) => {
    const updatedDrafts = savedDrafts.filter((draft) => draft.id !== draftId);
    setSavedDrafts(updatedDrafts);
    localStorage.setItem(
      `salesPageDrafts_${userId}`,
      JSON.stringify(updatedDrafts)
    );

    const deletedDraft = savedDrafts.find((d) => d.id === draftId);
    toast({
      title: "Draft Deleted",
      description: `"${deletedDraft?.title}" has been deleted.`,
    });

    setDraftToDelete(null);
  };

  // Generate sales page mutation
  const generateSalesPageMutation = useMutation({
    mutationFn: async () => {
      // Validate prerequisites before generation
      const isValid = validateAndNotify(
        { messagingStrategy: true, offerOutline: true },
        { messagingStrategy, offerOutline }
      );

      if (!isValid) {
        throw new Error("Missing prerequisites");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/generate-sales-page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            messagingStrategy,
            offerOutline,
            offerType: "program",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate sales page");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedSalesPage(data.salesPageContent);
      setMissingElements(data.missingElements || []);
      setCompleteness(data.completeness || 0);
      localStorage.setItem(
        `emotionalSalesPage_${userId}`,
        data.salesPageContent
      );
      toast({
        title: "Sales Page Generated!",
        description: `Your emotionally compelling sales page is ready for customization.`,
      });
    },
    onError: (error: any) => {
      // Don't show duplicate toast if prerequisites are missing (validator already showed one)
      if (error.message === "Missing prerequisites") {
        return;
      }
      toast({
        title: "Generation Failed",
        description:
          "Please try again or complete more workbook sections first.",
        variant: "destructive",
      });
    },
  });

  // Delete all drafts function
  const deleteAllDrafts = () => {
    try {
      setGeneratedSalesPage("");
      setMissingElements([]);
      setCompleteness(0);

      localStorage.removeItem(`emotionalSalesPage_${userId}`);

      toast({
        title: "Sales Page Reset",
        description: "You can now generate a fresh sales page.",
      });
    } catch (error) {
      toast({
        title: "Reset Complete",
        description: "Sales page generator has been reset successfully.",
      });
    }
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

  const downloadSalesPage = () => {
    const blob = new Blob([generatedSalesPage], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emotional-sales-page.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Component to render formatted sales page
  function EditableFormattedSalesPage({
    content,
    onContentChange,
    onSave,
    onCancel,
  }: {
    content: string;
    onContentChange: (newContent: string) => void;
    onSave: () => void;
    onCancel: () => void;
  }) {
    const formatEditableContent = (text: string) => {
      return text.split("\n").map((line, index) => {
        // Main headers (# Header)
        if (line.startsWith("# ")) {
          return (
            <h1
              key={index}
              className="text-4xl font-bold text-slate-900 mt-12 mb-6 pb-3 border-b-2 border-blue-200 text-center focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-2"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                const newText = e.currentTarget.textContent || "";
                const updatedContent = content.replace(line, `# ${newText}`);
                onContentChange(updatedContent);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSave();
                }
                if (e.key === "Escape") {
                  onCancel();
                }
              }}
              spellCheck={true}
            >
              {line.replace("# ", "")}
            </h1>
          );
        }

        // Subheaders (## Header)
        if (line.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="text-2xl font-semibold text-blue-600 mt-10 mb-4 text-center focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-2"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                const newText = e.currentTarget.textContent || "";
                const updatedContent = content.replace(line, `## ${newText}`);
                onContentChange(updatedContent);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSave();
                }
                if (e.key === "Escape") {
                  onCancel();
                }
              }}
              spellCheck={true}
            >
              {line.replace("## ", "")}
            </h2>
          );
        }

        // Section headers (### Header)
        if (line.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-l-4 border-blue-500 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-2"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                const newText = e.currentTarget.textContent || "";
                const updatedContent = content.replace(line, `### ${newText}`);
                onContentChange(updatedContent);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSave();
                }
                if (e.key === "Escape") {
                  onCancel();
                }
              }}
              spellCheck={true}
            >
              {line.replace("### ", "")}
            </h3>
          );
        }

        // Bold text (**text**)
        if (line.includes("**") && !line.startsWith("#")) {
          const formattedLine = line.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold text-slate-900">$1</strong>'
          );
          return (
            <p
              key={index}
              className="text-lg leading-relaxed mb-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-2"
              contentEditable={true}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: formattedLine }}
              onBlur={(e) => {
                const newText = e.currentTarget.textContent || "";
                const updatedContent = content.replace(line, newText);
                onContentChange(updatedContent);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSave();
                }
                if (e.key === "Escape") {
                  onCancel();
                }
              }}
              spellCheck={true}
            />
          );
        }

        // Empty lines
        if (line.trim() === "") {
          return <div key={index} className="mb-4"></div>;
        }

        // Regular paragraphs
        return (
          <p
            key={index}
            className="text-lg leading-relaxed mb-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-2"
            contentEditable={true}
            suppressContentEditableWarning={true}
            onBlur={(e) => {
              const newText = e.currentTarget.textContent || "";
              const updatedContent = content.replace(line, newText);
              onContentChange(updatedContent);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSave();
              }
              if (e.key === "Escape") {
                onCancel();
              }
            }}
            spellCheck={true}
          >
            {line}
          </p>
        );
      });
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-8 focus-within:ring-2 focus-within:ring-blue-500">
        <div className="prose prose-lg max-w-none">
          {formatEditableContent(content)}
        </div>

        {/* Call to Action Button - Editable */}
        <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            contentEditable={true}
            suppressContentEditableWarning={true}
            spellCheck={true}
          >
            GET INSTANT ACCESS NOW
          </button>
          <p
            className="text-sm text-slate-600 mt-4 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded p-1"
            contentEditable={true}
            suppressContentEditableWarning={true}
            spellCheck={true}
          >
            Your transformation starts today
          </p>
        </div>
      </div>
    );
  }

  function FormattedSalesPage({ content }: { content: string }) {
    const formatContent = (text: string) => {
      return text.split("\n").map((line, index) => {
        // Main headers (# Header)
        if (line.startsWith("# ")) {
          return (
            <h1
              key={index}
              className="text-4xl font-bold text-slate-900 mt-12 mb-6 pb-3 border-b-2 border-blue-200 text-center"
            >
              {line.replace("# ", "")}
            </h1>
          );
        }

        // Subheaders (## Header)
        if (line.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="text-2xl font-semibold text-blue-600 mt-10 mb-4 text-center"
            >
              {line.replace("## ", "")}
            </h2>
          );
        }

        // Section headers (### Header)
        if (line.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-l-4 border-blue-500 pl-4"
            >
              {line.replace("### ", "")}
            </h3>
          );
        }

        // Bold text (**text**)
        if (line.includes("**") && !line.startsWith("#")) {
          const formattedLine = line.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold text-slate-900">$1</strong>'
          );
          return (
            <p
              key={index}
              className="text-lg leading-relaxed mb-4 text-slate-700"
              dangerouslySetInnerHTML={{ __html: formattedLine }}
            />
          );
        }

        // Questions (Q:)
        if (line.startsWith("**Q:")) {
          return (
            <div
              key={index}
              className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg"
            >
              <p className="font-semibold text-blue-900 mb-2">
                {line.replace(/\*\*/g, "")}
              </p>
            </div>
          );
        }

        // Answers (A:)
        if (line.startsWith("A:")) {
          return (
            <div key={index} className="ml-4 mb-6">
              <p className="text-slate-700 leading-relaxed">
                {line.replace("A: ", "")}
              </p>
            </div>
          );
        }

        // Numbered lists
        if (/^\d+\./.test(line.trim())) {
          return (
            <div key={index} className="mb-3">
              <p className="text-lg text-slate-700 leading-relaxed">{line}</p>
            </div>
          );
        }

        // Empty lines
        if (line.trim() === "") {
          return <div key={index} className="mb-4"></div>;
        }

        // Regular paragraphs
        return (
          <p
            key={index}
            className="text-lg leading-relaxed mb-4 text-slate-700"
          >
            {line}
          </p>
        );
      });
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-8">
        <div className="prose prose-lg max-w-none">
          {formatContent(content)}
        </div>

        {/* Call to Action Button */}
        <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200">
            GET INSTANT ACCESS NOW
          </button>
          <p className="text-sm text-slate-600 mt-4">
            Your transformation starts today
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="w-6 h-6 mr-3 text-red-500" />
            Sales Page Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Generate a converting sales page using your messaging strategy and
            offer outline that drives conversions.
          </p>
        </CardContent>
      </Card>

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
            <div className="text-center">
              <Button
                onClick={() => generateSalesPageMutation.mutate()}
                disabled={generateSalesPageMutation.isPending}
                size="lg"
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateSalesPageMutation.isPending
                  ? "Creating Your Sales Page..."
                  : "Generate Sales Page"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Generated Page Section
        <div className="space-y-6">
          {/* Completeness Overview */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Sales Page Generated! ({completeness}% Complete)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 bg-white rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${completeness}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-green-700">
                  {completeness}%
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(generatedSalesPage)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Page
                </Button>
                <Button onClick={downloadSalesPage} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={() => generateSalesPageMutation.mutate()}
                  variant="outline"
                  size="sm"
                  disabled={generateSalesPageMutation.isPending}
                >
                  <Wand2 className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Draft
                </Button>
                {savedDrafts.length > 0 && (
                  <Button
                    onClick={() => setShowDraftsPanel(!showDraftsPanel)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <FolderOpen className="w-4 h-4 mr-1" />
                    Drafts ({savedDrafts.length})
                  </Button>
                )}
                <Button
                  onClick={deleteAllDrafts}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Human Touch Required */}
          <Alert className="border-red-200 bg-red-50">
            <Heart className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Important: Human Heart Required</strong>
              <br />
              This sales page provides a powerful foundation, but your authentic
              voice will make it truly compelling. Review this copy thoroughly
              and add in what AI doesn't have - a heart and emotions!
            </AlertDescription>
          </Alert>

          {/* Intelligent Sales Page Mapping */}
          {missingElements.length > 0 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Strengthen Your Sales Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-700 mb-4">
                  Your sales page is using placeholder content in some areas.
                  Complete these specific sections to make it more compelling:
                </p>
                <div className="space-y-4">
                  {missingElements.map((element, index) => (
                    <div
                      key={index}
                      className="border border-blue-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {element.section}
                            </span>
                            <span className="text-blue-600">→</span>
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Sales Page Section
                            </span>
                          </div>

                          <h4 className="font-medium text-slate-800 mb-1">
                            Complete "{element.field}" to enhance your sales
                            copy
                          </h4>

                          <p className="text-sm text-slate-600 mb-2">
                            {element.description}
                          </p>

                          <div className="bg-slate-50 border-l-4 border-slate-300 p-3 rounded-r">
                            <p className="text-xs text-slate-500 mb-1">
                              Your current content needs:
                            </p>
                            <ul className="text-sm text-slate-700">
                              {element.suggestions
                                .slice(0, 2)
                                .map((suggestion, i) => (
                                  <li key={i} className="mb-1">
                                    • {suggestion}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Quick Action
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Complete these sections in your messaging strategy and
                      offer outline, then regenerate your sales page to see the
                      improvements.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200"
                      >
                        Go to Messaging Strategy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200"
                      >
                        Go to Offer Outline
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Sales Page Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Your Sales Page
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
                  <EditableFormattedSalesPage
                    content={generatedSalesPage}
                    onContentChange={(newContent) => {
                      setGeneratedSalesPage(newContent);
                      localStorage.setItem(
                        `emotionalSalesPage_${userId}`,
                        newContent
                      );
                    }}
                    onSave={() => setIsEditing(false)}
                    onCancel={() => setIsEditing(false)}
                  />

                  <div className="flex gap-2 items-center justify-center">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="default"
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(generatedSalesPage)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <div className="text-sm text-slate-500 flex items-center ml-2">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Press Ctrl+Enter to save, Esc to cancel
                    </div>
                  </div>
                </div>
              ) : (
                <FormattedSalesPage content={generatedSalesPage} />
              )}
            </CardContent>
          </Card>

          {/* Enhanced Draft Management Panel */}
          <Card className="border-2 border-blue-200 mt-6">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center justify-between">
                <span className="flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Draft Management ({savedDrafts.length} saved)
                </span>
                <Button
                  onClick={() => setShowDraftsPanel(!showDraftsPanel)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600"
                >
                  {showDraftsPanel ? "Hide" : "Show"} Drafts
                </Button>
              </CardTitle>
            </CardHeader>

            {showDraftsPanel && (
              <CardContent className="space-y-4">
                {savedDrafts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      No saved drafts yet
                    </p>
                    <p className="text-sm">
                      Generate your first sales page to create a draft
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">
                        Draft Management
                      </h4>
                      <p className="text-sm text-blue-700 mb-3">
                        You have {savedDrafts.length} saved draft
                        {savedDrafts.length !== 1 ? "s" : ""}. Click "Load" to
                        switch to any draft, or "Delete" to remove outdated
                        versions.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const confirmDelete = confirm(
                              "Delete ALL drafts? This cannot be undone."
                            );
                            if (confirmDelete) {
                              setSavedDrafts([]);
                              localStorage.removeItem(
                                `salesPageDrafts_${userId}`
                              );
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-100"
                        >
                          Clear All Drafts
                        </Button>
                        <Button
                          onClick={() => setShowSaveDialog(true)}
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-100"
                        >
                          Save Current as New Draft
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {savedDrafts.map((draft, index) => (
                        <div
                          key={draft.id}
                          className="border border-blue-200 rounded-lg p-4 bg-white hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                  Draft #{index + 1}
                                </span>
                                {draft.id === currentDraftId && (
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                    Currently Active
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-slate-800 mb-1">
                                {draft.title}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Created:{" "}
                                {new Date(draft.createdAt).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(draft.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              {draft.id !== currentDraftId && (
                                <Button
                                  onClick={() => loadDraft(draft)}
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Load
                                </Button>
                              )}
                              <Button
                                onClick={() => setDraftToDelete(draft.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Draft Preview */}
                          <div className="bg-slate-50 border border-slate-200 rounded p-3">
                            <p className="text-xs text-slate-500 mb-1">
                              Preview:
                            </p>
                            <p className="text-sm text-slate-700 line-clamp-3">
                              {draft.content.substring(0, 200)}...
                            </p>
                          </div>

                          {/* Word Count & Stats */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>
                                {draft.content.split(" ").length} words
                              </span>
                              <span>
                                {Math.ceil(draft.content.length / 1000)} KB
                              </span>
                            </div>
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(draft.content);
                                // You could add a toast notification here
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-slate-700"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Save Draft Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Sales Page Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Give your sales page draft a descriptive name so you can easily
              find it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="draft-title">Draft Title</Label>
            <Input
              id="draft-title"
              value={currentDraftTitle}
              onChange={(e) => setCurrentDraftTitle(e.target.value)}
              placeholder={`Sales Page Draft ${savedDrafts.length + 1}`}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentDraftTitle("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => saveDraft(currentDraftTitle)}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Draft Confirmation Dialog */}
      <AlertDialog
        open={!!draftToDelete}
        onOpenChange={() => setDraftToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sales page draft? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => draftToDelete && deleteDraft(draftToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
