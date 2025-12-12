import { useState, useEffect, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Edit,
  Save,
  Download,
} from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";
import {
  useMarkSectionComplete,
  useUnmarkSectionComplete,
} from "@/hooks/useSectionCompletions";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, Packer } from "docx";
import { saveAs } from "file-saver";

// Helper function to render script content with bold section labels
const formatScriptContent = (content: string) => {
  const lines = content.split("\n");
  return lines.map((line, index) => {
    // Check if line contains a section label like [Hook], [Problem & Pain], etc.
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      return (
        <div key={index} className="font-bold text-slate-900 mt-4 first:mt-0">
          {line}
        </div>
      );
    }
    // Regular content line
    return line.trim() ? (
      <div key={index} className="text-slate-700">
        {line}
      </div>
    ) : (
      <div key={index} className="h-2"></div>
    );
  });
};

export default function LaunchYourAds() {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");

  // Video Script Generator state
  const [inputMethod, setInputMethod] = useState<"manual" | "url">("manual");
  const [landingPageContent, setLandingPageContent] = useState("");
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [generatedScripts, setGeneratedScripts] = useState<{
    script1: { title: string; content: string };
    script2: { title: string; content: string };
  } | null>(null);

  // Edit mode state for scripts
  const [isEditingScript1, setIsEditingScript1] = useState(false);
  const [isEditingScript2, setIsEditingScript2] = useState(false);
  const [editedScript1Title, setEditedScript1Title] = useState("");
  const [editedScript1Content, setEditedScript1Content] = useState("");
  const [editedScript2Title, setEditedScript2Title] = useState("");
  const [editedScript2Content, setEditedScript2Content] = useState("");

  // Ref for scrolling to generated scripts
  const generatedScriptsRef = useRef<HTMLDivElement>(null);

  // State for ad launch sections with database persistence
  const [completedSections, setCompletedSections] = useState({
    leadMagnet: false,
    landingPage: false,
    automation: false,
    launch: false,
    testing: false,
    campaign: false,
  });

  const [isLoadingCheckboxes, setIsLoadingCheckboxes] = useState(true);

  // State for input fields
  const [leadInput, setLeadInput] = useState("");

  const [expandedSections, setExpandedSections] = useState({
    leadMagnet: false,
    landingPage: false,
    automation: false,
    launch: false,
    testing: false,
    campaign: false,
    invitation: false,
    execution: false,
  });

  // Load implementation checkboxes from database on mount
  useEffect(() => {
    const loadCheckboxState = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/implementation-checkboxes/launch-your-ads`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.checkboxStates) {
            setCompletedSections(data.checkboxStates);
          }
        }
      } catch (error) {
        console.error("Failed to load checkbox state:", error);
      } finally {
        setIsLoadingCheckboxes(false);
      }
    };

    loadCheckboxState();
  }, [userId]);

  // Save completedSections to database whenever it changes
  useEffect(() => {
    if (isLoadingCheckboxes || !userId) return;

    const saveCheckboxState = async () => {
      try {
        await apiRequest("POST", "/api/implementation-checkboxes", {
          userId,
          pageIdentifier: "launch-your-ads",
          checkboxStates: completedSections,
        });
      } catch (error) {
        console.error("Failed to save checkbox state:", error);
      }
    };

    saveCheckboxState();
  }, [completedSections, userId, isLoadingCheckboxes]);

  // Load saved video script generator state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/video-script-generator-state`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const state = await response.json();
          if (state) {
            // Restore input method
            if (state.inputMethod) {
              setInputMethod(state.inputMethod as "manual" | "url");
            }
            // Restore landing page URL
            if (state.landingPageUrl) {
              setLandingPageUrl(state.landingPageUrl);
            }
            // Restore manual content
            if (state.manualContent) {
              setLandingPageContent(state.manualContent);
            }
            // Restore generated scripts
            if (state.generatedScripts) {
              setGeneratedScripts(state.generatedScripts);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load video script generator state:", error);
      } finally {
        setIsLoadingState(false);
      }
    };

    loadSavedState();
  }, [userId]);

  // Auto-save video script generator state with debounce
  useEffect(() => {
    if (isLoadingState || !userId) return;

    const timeoutId = setTimeout(async () => {
      try {
        await apiRequest("POST", "/api/video-script-generator-state", {
          inputMethod,
          landingPageUrl: landingPageUrl || null,
          manualContent: landingPageContent || null,
          generatedScripts,
        });
      } catch (error) {
        console.error(
          "Failed to auto-save video script generator state:",
          error
        );
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [
    inputMethod,
    landingPageUrl,
    landingPageContent,
    userId,
    isLoadingState,
    generatedScripts,
  ]);

  const handleSectionComplete = async (
    section: keyof typeof completedSections
  ) => {
    const isCurrentlyComplete = completedSections[section];

    // Update local state
    setCompletedSections((prev: typeof completedSections) => ({
      ...prev,
      [section]: !prev[section],
    }));

    // Save to database for "campaign" section (Launch Your Funnel)
    if (section === "campaign" && userId) {
      try {
        if (!isCurrentlyComplete) {
          await markSectionComplete.mutateAsync({
            userId,
            stepNumber: 4, // Lead Generation is step 4
            sectionTitle: "Launch Your Funnel",
          });
        } else {
          await unmarkSectionComplete.mutateAsync({
            userId,
            stepNumber: 4,
            sectionTitle: "Launch Your Funnel",
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

  // Handler for generating video scripts
  const handleGenerateVideoScripts = async () => {
    // Validate input based on method
    if (inputMethod === "manual") {
      if (
        !landingPageContent.trim() ||
        landingPageContent.trim().length < 100
      ) {
        toast({
          title: "Content Required",
          description:
            "Please paste your landing page content (at least 100 characters)",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!landingPageUrl.trim()) {
        toast({
          title: "URL Required",
          description: "Please enter a landing page URL",
          variant: "destructive",
        });
        return;
      }

      // Basic URL validation
      try {
        new URL(landingPageUrl);
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL (e.g., https://example.com)",
          variant: "destructive",
        });
        return;
      }
    }

    setIsGeneratingScripts(true);

    try {
      const response = await apiRequest(
        "POST",
        "/api/generate-video-scripts",
        {
          manualContent:
            inputMethod === "manual" ? landingPageContent : undefined,
          landingPageUrl: inputMethod === "url" ? landingPageUrl : undefined,
        },
        {
          timeout: 120000, // 120 seconds for AI processing
          priority: "high",
        }
      );

      const result = await response.json();
      setGeneratedScripts(result);

      toast({
        title: "Scripts Generated!",
        description: "Your video scripts have been created successfully",
      });

      // Scroll to generated scripts after a short delay to ensure rendering
      setTimeout(() => {
        generatedScriptsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      console.error("Error generating video scripts:", error);
      const errorMessage =
        error instanceof Error
          ? error.message.includes("timeout") ||
            error.message.includes("Timeout") ||
            error.message.includes("ECONNABORTED")
            ? "The request took too long. This may happen if the server is processing a large amount of data. Please try again."
            : error.message
          : "Failed to generate video scripts. Please try again.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScripts(false);
    }
  };

  // Edit script handlers
  const handleEditScript1 = () => {
    if (generatedScripts) {
      setEditedScript1Title(generatedScripts.script1.title);
      setEditedScript1Content(generatedScripts.script1.content);
      setIsEditingScript1(true);
    }
  };

  const handleEditScript2 = () => {
    if (generatedScripts) {
      setEditedScript2Title(generatedScripts.script2.title);
      setEditedScript2Content(generatedScripts.script2.content);
      setIsEditingScript2(true);
    }
  };

  const handleSaveScript1 = async () => {
    if (!generatedScripts) return;

    const updatedScripts = {
      ...generatedScripts,
      script1: {
        title: editedScript1Title,
        content: editedScript1Content,
      },
    };

    setGeneratedScripts(updatedScripts);
    setIsEditingScript1(false);

    toast({
      title: "Script Saved",
      description: "Script 1 has been updated successfully",
    });
  };

  const handleSaveScript2 = async () => {
    if (!generatedScripts) return;

    const updatedScripts = {
      ...generatedScripts,
      script2: {
        title: editedScript2Title,
        content: editedScript2Content,
      },
    };

    setGeneratedScripts(updatedScripts);
    setIsEditingScript2(false);

    toast({
      title: "Script Saved",
      description: "Script 2 has been updated successfully",
    });
  };

  // Export handlers
  const handleExportPDF = () => {
    if (!generatedScripts) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Title
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Video Scripts", margin, yPosition);
    yPosition += 15;

    // Script 1
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("SCRIPT 1 - Problem-Focused Hook", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const script1TitleText = `Title/Angle: "${generatedScripts.script1.title}"`;
    const script1TitleLines = pdf.splitTextToSize(script1TitleText, maxWidth);
    pdf.text(script1TitleLines, margin, yPosition);
    yPosition += script1TitleLines.length * 6 + 5;

    const script1ContentLines = pdf.splitTextToSize(
      generatedScripts.script1.content,
      maxWidth
    );
    script1ContentLines.forEach((line: string) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Script 2
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("SCRIPT 2 - Desire/Curiosity-Focused Hook", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    const script2TitleText = `Title/Angle: "${generatedScripts.script2.title}"`;
    const script2TitleLines = pdf.splitTextToSize(script2TitleText, maxWidth);
    pdf.text(script2TitleLines, margin, yPosition);
    yPosition += script2TitleLines.length * 6 + 5;

    const script2ContentLines = pdf.splitTextToSize(
      generatedScripts.script2.content,
      maxWidth
    );
    script2ContentLines.forEach((line: string) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    pdf.save("video-scripts.pdf");

    toast({
      title: "PDF Downloaded",
      description: "Your video scripts have been downloaded as PDF",
    });
  };

  const handleExportDOCX = async () => {
    if (!generatedScripts) return;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Video Scripts",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "SCRIPT 1 - Problem-Focused Hook",
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Title/Angle: "${generatedScripts.script1.title}"`,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            ...generatedScripts.script1.content.split("\n").map(
              (line) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      bold: line.match(/^\[([^\]]+)\]$/) ? true : false,
                    }),
                  ],
                  spacing: { after: 100 },
                })
            ),
            new Paragraph({
              children: [
                new TextRun({
                  text: "SCRIPT 2 - Desire/Curiosity-Focused Hook",
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Title/Angle: "${generatedScripts.script2.title}"`,
                  italics: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            ...generatedScripts.script2.content.split("\n").map(
              (line) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      bold: line.match(/^\[([^\]]+)\]$/) ? true : false,
                    }),
                  ],
                  spacing: { after: 100 },
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "video-scripts.docx");

    toast({
      title: "DOCX Downloaded",
      description: "Your video scripts have been downloaded as DOCX",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Launch Your Ads
            </h1>
            <p className="text-slate-600 mt-2">
              Create and launch effective advertising campaigns for your lead
              generation funnel
            </p>
          </div>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
            Active
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training Videos</TabsTrigger>
          <TabsTrigger value="script-generator">
            Video Script Generator
          </TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <CardTitle>Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                  <p>
                    Now that your funnel is live, it's time to send traffic to
                    it! In this step, you'll create your ad assets, set up your
                    campaign, and launch. Using our trainings, guidance and even
                    our team to do your ad copy & creative, you'll have
                    everything you need to launch confidently!
                  </p>
                  <p>
                    By the end of this section, you'll have ads running to your
                    lead gen funnel and can begin the optimization process!
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
                  <p className="text-2xl font-bold text-purple-600 mb-2">
                    3–7 Days
                  </p>
                  <p className="text-sm text-slate-600">
                    Depending on your pace and if you hit any roadblocks setting
                    up your ads, which we will help with!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* To-Do List */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle>To-Do List</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Watch the ad training videos",
                    "Create your raw ad creative",
                    "Submit for our team to create your copy and edit your creative",
                    "Set up your campaign inside Ads Manager (objective, budget, targeting, placements)",
                    "Double-check your tracking (pixel, conversion events)",
                    "Launch your campaign!",
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Success Tips */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <CardTitle>Success Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      title: "Keep it simple",
                      text: "One campaign, one audience, one ad set to start. Don't overcomplicate. You can expand on this quickly with our support.",
                    },
                    {
                      title: "Leverage our team",
                      text: "For both support and creating your ad copy & creative! Tech can get overwhelming and we've got you!",
                    },
                    {
                      title: "Test the basics",
                      text: "Confirm your pixel fires, links work, and leads are landing in your CRM.",
                    },
                    {
                      title: "Reference your strategy",
                      text: "We created a budget for you in the initial strategy plan!",
                    },
                    {
                      title: "Don't chase perfection",
                      text: "Get your ads live, then optimize based on data (CTR, CPC, opt-in rate).",
                    },
                    {
                      title: "Remember",
                      text: "Launching is the win. You'll learn more from ads running than from planning.",
                    },
                  ].map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">→</span>
                      <div>
                        <strong className="text-slate-900">{tip.title}</strong>
                        <span className="text-slate-600"> → {tip.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Training Video Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-red-600" />
                <CardTitle>Training Videos</CardTitle>
              </div>
              <p className="text-slate-600">
                Learn how to set up your ads step by step
              </p>
            </CardHeader>
            <CardContent>
              {/* Nested Training Video Tabs */}
              <Tabs defaultValue="funnel" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 gap-1">
                  <TabsTrigger
                    value="funnel"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Duplicate Your Funnel
                  </TabsTrigger>
                  <TabsTrigger
                    value="pixel"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Placing Your Pixel
                  </TabsTrigger>
                  <TabsTrigger
                    value="targeting"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Lead Gen Targeting
                  </TabsTrigger>
                  <TabsTrigger
                    value="setup"
                    className="text-xs md:text-sm px-2 md:px-4"
                  >
                    Setting Up Your Lead Gen Ads
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="funnel" className="space-y-6">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Duplicate Your Funnel
                    </h3>

                    {/* Video 1 */}
                    <div className="space-y-3">
                      <VimeoEmbed
                        vimeoId="1122957717/5f949176ad"
                        title="Duplicate Your Funnel - Video 1"
                        userId={1}
                        stepNumber={102}
                      />
                    </div>

                    {/* Video 2 */}
                    <div className="space-y-3">
                      <VimeoEmbed
                        vimeoId="1122957695/1fe0b00ae8"
                        title="Duplicate Your Funnel - Video 2"
                        userId={1}
                        stepNumber={102}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pixel" className="space-y-6">
                  <VimeoEmbed
                    vimeoId="1125176999/3623348b1f"
                    title="Placing Your Pixel"
                    userId={1}
                    stepNumber={0}
                  />
                </TabsContent>

                <TabsContent value="targeting" className="space-y-6">
                  <VimeoEmbed
                    vimeoId="1125176915/ae05d43eb0"
                    title="Lead Gen Targeting"
                    userId={1}
                    stepNumber={0}
                  />
                </TabsContent>

                <TabsContent value="setup" className="space-y-6">
                  <VimeoEmbed
                    vimeoId="1129977308/56263a956a"
                    title="Setting Up Your Lead Gen Ads"
                    userId={1}
                    stepNumber={0}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Script Generator Tab */}
        <TabsContent value="script-generator" className="space-y-6">
          {/* Generated Scripts Section - Shows ABOVE the generator */}
          {generatedScripts && (
            <div ref={generatedScriptsRef} className="space-y-6">
              {/* Export Document Button */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="lg"
                      className="px-8 py-3 bg-embodied-coral hover:bg-embodied-orange text-white"
                      data-testid="button-export-document"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Document
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={handleExportPDF}
                      data-testid="button-export-pdf"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportDOCX}
                      data-testid="button-export-docx"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download as DOCX
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-6">
                {/* Script 1 - Problem-Focused Hook */}
                <Card
                  className="border-2 border-purple-200"
                  data-testid="script-1"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-lg">
                          SCRIPT 1 — Problem-Focused Hook
                        </CardTitle>
                      </div>
                      {!isEditingScript1 ? (
                        <Button
                          size="sm"
                          onClick={handleEditScript1}
                          className="bg-embodied-coral hover:bg-embodied-orange text-white"
                          data-testid="button-edit-script-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleSaveScript1}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          data-testid="button-save-script-1"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isEditingScript1 ? (
                      <>
                        <div>
                          <span className="font-bold text-slate-900">
                            Title/Angle:{" "}
                          </span>
                          <span className="text-slate-700 italic">
                            "{generatedScripts.script1.title}"
                          </span>
                        </div>
                        <div className="leading-relaxed">
                          {formatScriptContent(
                            generatedScripts.script1.content
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label
                            htmlFor="script1-title"
                            className="text-sm font-medium text-slate-700"
                          >
                            Title/Angle
                          </Label>
                          <Input
                            id="script1-title"
                            value={editedScript1Title}
                            onChange={(e) =>
                              setEditedScript1Title(e.target.value)
                            }
                            className="w-full"
                            data-testid="input-script-1-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="script1-content"
                            className="text-sm font-medium text-slate-700"
                          >
                            Script Content
                          </Label>
                          <Textarea
                            id="script1-content"
                            value={editedScript1Content}
                            onChange={(e) =>
                              setEditedScript1Content(e.target.value)
                            }
                            className="w-full min-h-[300px] font-mono text-sm"
                            data-testid="input-script-1-content"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Script 2 - Desire/Curiosity-Focused Hook */}
                <Card
                  className="border-2 border-blue-200"
                  data-testid="script-2"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">
                          SCRIPT 2 — Desire/Curiosity-Focused Hook
                        </CardTitle>
                      </div>
                      {!isEditingScript2 ? (
                        <Button
                          size="sm"
                          onClick={handleEditScript2}
                          className="bg-embodied-coral hover:bg-embodied-orange text-white"
                          data-testid="button-edit-script-2"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleSaveScript2}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          data-testid="button-save-script-2"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isEditingScript2 ? (
                      <>
                        <div>
                          <span className="font-bold text-slate-900">
                            Title/Angle:{" "}
                          </span>
                          <span className="text-slate-700 italic">
                            "{generatedScripts.script2.title}"
                          </span>
                        </div>
                        <div className="leading-relaxed">
                          {formatScriptContent(
                            generatedScripts.script2.content
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label
                            htmlFor="script2-title"
                            className="text-sm font-medium text-slate-700"
                          >
                            Title/Angle
                          </Label>
                          <Input
                            id="script2-title"
                            value={editedScript2Title}
                            onChange={(e) =>
                              setEditedScript2Title(e.target.value)
                            }
                            className="w-full"
                            data-testid="input-script-2-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="script2-content"
                            className="text-sm font-medium text-slate-700"
                          >
                            Script Content
                          </Label>
                          <Textarea
                            id="script2-content"
                            value={editedScript2Content}
                            onChange={(e) =>
                              setEditedScript2Content(e.target.value)
                            }
                            className="w-full min-h-[300px] font-mono text-sm"
                            data-testid="input-script-2-content"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Video Script Generator Input Card - always shows */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <CardTitle>Video Script Generator</CardTitle>
              </div>
              <CardDescription>
                Generate professional video scripts for your lead generation ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none text-slate-700 leading-relaxed">
                <p>
                  Our AI-powered script generator will analyze your landing page
                  and create compelling video scripts tailored to your offer and
                  audience.
                </p>
                <p>
                  Provide your landing page content via URL or manual entry and
                  we'll generate two script variations for you to choose from.
                </p>
              </div>

              {/* Input Method Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Input Method
                </Label>
                <RadioGroup
                  value={inputMethod}
                  onValueChange={(value: "manual" | "url") =>
                    setInputMethod(value)
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="manual"
                      id="manual"
                      data-testid="radio-manual-input"
                    />
                    <Label
                      htmlFor="manual"
                      className="font-normal cursor-pointer"
                    >
                      Manual Content
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="url"
                      id="url"
                      data-testid="radio-url-input"
                    />
                    <Label htmlFor="url" className="font-normal cursor-pointer">
                      Landing Page URL
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Manual Content Input */}
              {inputMethod === "manual" && (
                <div>
                  <Label
                    htmlFor="landing-page-content"
                    className="text-sm font-medium text-slate-700 mb-2 block"
                  >
                    Landing Page Content
                  </Label>
                  <Textarea
                    id="landing-page-content"
                    placeholder="Paste your landing page content here... Include your headline, benefits, features, and any key messaging from your page."
                    className="w-full min-h-[200px]"
                    value={landingPageContent}
                    onChange={(e) => setLandingPageContent(e.target.value)}
                    data-testid="input-landing-page-content"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Copy and paste the text content from your landing page
                    (headlines, benefits, features, offer details, etc.)
                  </p>
                </div>
              )}

              {/* URL Input */}
              {inputMethod === "url" && (
                <div>
                  <Label
                    htmlFor="landing-page-url"
                    className="text-sm font-medium text-slate-700 mb-2 block"
                  >
                    Landing Page URL
                  </Label>
                  <Input
                    id="landing-page-url"
                    type="url"
                    placeholder="https://example.com/your-landing-page"
                    className="w-full"
                    value={landingPageUrl}
                    onChange={(e) => setLandingPageUrl(e.target.value)}
                    data-testid="input-landing-page-url"
                  />
                  <Alert className="mt-3">
                    <AlertDescription className="text-sm">
                      <strong>Note:</strong> URL extraction works best with
                      traditional server-rendered pages. If your page is built
                      with React, Vue, or similar frameworks, please switch to
                      "Manual Content" and copy-paste your page text instead.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                  size="lg"
                  onClick={handleGenerateVideoScripts}
                  disabled={
                    isGeneratingScripts ||
                    (inputMethod === "manual"
                      ? !landingPageContent.trim()
                      : !landingPageUrl.trim())
                  }
                  data-testid="button-generate-video-scripts"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingScripts
                    ? "Generating Scripts..."
                    : "Generate Video Scripts"}
                </Button>
              </div>

              {/* Features Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">
                          Audience-Targeted
                        </h4>
                        <p className="text-sm text-slate-600">
                          Scripts are tailored to your specific audience and
                          offer based on your landing page content
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">
                          Multiple Variations
                        </h4>
                        <p className="text-sm text-slate-600">
                          Get 3-5 different script approaches to test and find
                          what resonates best
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">
                          Proven Structure
                        </h4>
                        <p className="text-sm text-slate-600">
                          Based on high-converting video ad frameworks that
                          drive engagement and conversions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">
                          Platform Optimized
                        </h4>
                        <p className="text-sm text-slate-600">
                          Scripts optimized for different platforms (Facebook,
                          Instagram, YouTube, etc.)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          {/* Implementation Steps Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <CardTitle>Implementation Steps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700">
                Walk through these steps one at a time to get your lead gen ads
                officially launched!
              </p>

              {/* Step-by-step sections */}
              <div className="grid gap-4">
                {/* Step 1 */}
                <Collapsible
                  open={expandedSections.leadMagnet}
                  onOpenChange={() => handleSectionExpand("leadMagnet")}
                >
                  <Card
                    className={`border-2 transition-colors ${
                      completedSections.leadMagnet
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={completedSections.leadMagnet}
                              onCheckedChange={() =>
                                handleSectionComplete("leadMagnet")
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-lead-magnet"
                            />
                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              1
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">
                              Create Your Raw Ad Creative
                            </h3>
                          </div>
                          {expandedSections.leadMagnet ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <p className="text-slate-600">
                            Create your raw ad video creative for us to edit.
                          </p>
                          <p className="text-slate-600">
                            You can use the script generator to create an ad
                            script for your video. Remember though, an overly
                            scripted video doesn't perform as well. Try to be as
                            natural as possible.
                          </p>

                          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                              🎥 Simple Video Ad Recording Tips
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">
                                  Lighting →
                                </strong>
                                <span className="text-slate-700">
                                  Face a window or bright light so your face is
                                  clear.
                                </span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">
                                  Framing →
                                </strong>
                                <span className="text-slate-700">
                                  Hold your phone vertically (like
                                  Instagram/TikTok).
                                </span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">
                                  Audio →
                                </strong>
                                <span className="text-slate-700">
                                  Your phone mic is perfect—just record in a
                                  quiet space.
                                </span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">
                                  Script →
                                </strong>
                                <span className="text-slate-700">
                                  Use notes if needed, but speak naturally.
                                </span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">
                                  Delivery →
                                </strong>
                                <span className="text-slate-700">
                                  If you mess up, pause and pick up where you
                                  left off (we'll edit).
                                </span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">
                                  Energy →
                                </strong>
                                <span className="text-slate-700">
                                  Smile, be expressive, and talk like you're
                                  speaking to a friend.
                                </span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">
                                  Keep it short →
                                </strong>
                                <span className="text-slate-700">
                                  Aim for 30–60 seconds max.
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 2 */}
                <Collapsible
                  open={expandedSections.landingPage}
                  onOpenChange={() => handleSectionExpand("landingPage")}
                >
                  <Card
                    className={`border-2 transition-colors ${
                      completedSections.landingPage
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={completedSections.landingPage}
                              onCheckedChange={() =>
                                handleSectionComplete("landingPage")
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-landing-page"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              2
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">
                              Get Your Ad Copy & Creative
                            </h3>
                          </div>
                          {expandedSections.landingPage ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <p className="text-slate-600">
                            Submit your raw ad creative and get our team to
                            write your ad copy and create your creative. Make
                            sure to note anything specific you'd like us to use
                            in the copy or creative and to include your branding
                            assets.
                          </p>
                          <Button asChild className="mt-4">
                            <a
                              href="https://embodiedmarketing.typeform.com/adsrequest"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Submit Here
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 3 */}
                <Collapsible
                  open={expandedSections.automation}
                  onOpenChange={() => handleSectionExpand("automation")}
                >
                  <Card
                    className={`border-2 transition-colors ${
                      completedSections.automation
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={completedSections.automation}
                              onCheckedChange={() =>
                                handleSectionComplete("automation")
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-automation"
                            />
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              3
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">
                              Duplicate Your Funnel For Ads
                            </h3>
                          </div>
                          {expandedSections.automation ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600">
                          Watch our training video and make sure you have a
                          duplicated funnel just for paid ads. This allows you
                          to have 100% accurate tracking of your leads!
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 4 */}
                <Collapsible
                  open={expandedSections.launch}
                  onOpenChange={() => handleSectionExpand("launch")}
                >
                  <Card
                    className={`border-2 transition-colors ${
                      completedSections.launch
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={completedSections.launch}
                              onCheckedChange={() =>
                                handleSectionComplete("launch")
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-launch"
                            />
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              4
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">
                              Place Your Pixel
                            </h3>
                          </div>
                          {expandedSections.launch ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600">
                          Watch our training video to make sure your pixel is
                          properly placed on your live launch funnel.
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 5 */}
                <Collapsible
                  open={expandedSections.testing}
                  onOpenChange={() => handleSectionExpand("testing")}
                >
                  <Card
                    className={`border-2 transition-colors ${
                      completedSections.testing
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={completedSections.testing}
                              onCheckedChange={() =>
                                handleSectionComplete("testing")
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-testing"
                            />
                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              5
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">
                              Confirm Your Ad Targeting
                            </h3>
                          </div>
                          {expandedSections.testing ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <p className="text-slate-600">
                            Watch our training video and confirm below the ad
                            targeting you will be using to launch your campaign.
                            Remember, you now have a lot more data to leverage
                            so you'll be utilizing warm traffic and lookalike
                            audiences when you launch this campaign.
                          </p>
                          <div>
                            <Label
                              htmlFor="ad-targeting"
                              className="text-sm font-medium text-slate-700 mb-2 block"
                            >
                              Write it below
                            </Label>
                            <Textarea
                              id="ad-targeting"
                              placeholder="Enter your ad targeting strategy..."
                              rows={4}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 6 */}
                <Collapsible
                  open={expandedSections.campaign}
                  onOpenChange={() => handleSectionExpand("campaign")}
                >
                  <Card
                    className={`border-2 transition-colors ${
                      completedSections.campaign
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={completedSections.campaign}
                              onCheckedChange={() =>
                                handleSectionComplete("campaign")
                              }
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-campaign"
                            />
                            <div className="w-8 h-8 rounded-full bg-red-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              6
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">
                              Launch Your Campaign!
                            </h3>
                          </div>
                          {expandedSections.campaign ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <p className="text-slate-600">
                            Watch our step by step tutorial and take your
                            completed ad copy & creative and ad targeting into
                            ads manager to launch your campaign! If you get
                            stuck at any point hop on our ads support call.
                          </p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
