import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2
} from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";
import { useMarkSectionComplete, useUnmarkSectionComplete } from "@/hooks/useSectionCompletions";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, Packer } from "docx";
import { saveAs } from "file-saver";

// Helper function to render script content with bold section labels
const formatScriptContent = (content: string) => {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      return (
        <div key={index} className="font-bold text-slate-900 mt-4 first:mt-0">
          {line}
        </div>
      );
    }
    return line.trim() ? (
      <div key={index} className="text-slate-700">
        {line}
      </div>
    ) : (
      <div key={index} className="h-2"></div>
    );
  });
};

export default function LaunchYourAdsLiveLaunch() {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const { toast } = useToast();
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Video Script Generator state
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [generatedScripts, setGeneratedScripts] = useState<{
    script1: { title: string; content: string };
    script2: { title: string; content: string };
    script3: { title: string; content: string };
  } | null>(null);
  
  // Edit mode state for scripts
  const [isEditingScript1, setIsEditingScript1] = useState(false);
  const [isEditingScript2, setIsEditingScript2] = useState(false);
  const [isEditingScript3, setIsEditingScript3] = useState(false);
  const [editedScript1Title, setEditedScript1Title] = useState("");
  const [editedScript1Content, setEditedScript1Content] = useState("");
  const [editedScript2Title, setEditedScript2Title] = useState("");
  const [editedScript2Content, setEditedScript2Content] = useState("");
  const [editedScript3Title, setEditedScript3Title] = useState("");
  const [editedScript3Content, setEditedScript3Content] = useState("");
  
  // Ref for scrolling to generated scripts
  const generatedScriptsRef = useRef<HTMLDivElement>(null);
  
  // State for ad launch sections with database persistence
  const [completedSections, setCompletedSections] = useState({
    leadMagnet: false,
    adCopy: false,
    landingPage: false,
    automation: false,
    launch: false,
    testing: false,
    campaign: false,
    invitation: false
  });
  
  const [isLoadingCheckboxes, setIsLoadingCheckboxes] = useState(true);
  
  // State for input fields
  const [leadInput, setLeadInput] = useState("");
  
  const [expandedSections, setExpandedSections] = useState({
    leadMagnet: false,
    adCopy: false,
    landingPage: false,
    automation: false,
    launch: false,
    testing: false,
    campaign: false,
    invitation: false
  });

  const handleSectionComplete = async (section: keyof typeof completedSections) => {
    const isCurrentlyComplete = completedSections[section];
    
    // Update local state
    setCompletedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Save to database for "invitation" section (Launch Your Ads)
    if (section === 'invitation' && userId) {
      try {
        if (!isCurrentlyComplete) {
          await markSectionComplete.mutateAsync({
            userId,
            stepNumber: 5, // Live Launch is step 5
            sectionTitle: "Launch Your Ads"
          });
        } else {
          await unmarkSectionComplete.mutateAsync({
            userId,
            stepNumber: 5,
            sectionTitle: "Launch Your Ads"
          });
        }
      } catch (error) {
        console.error('Failed to save section completion:', error);
      }
    }
  };

  const handleSectionExpand = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Load video script generator state from database on mount
  useEffect(() => {
    const loadSavedState = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/video-script-generator-state', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const state = await response.json();
          if (state) {
            if (state.landingPageUrl) {
              setLandingPageUrl(state.landingPageUrl);
            }
            if (state.generatedScripts) {
              setGeneratedScripts(state.generatedScripts);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load video script generator state:', error);
      } finally {
        setIsLoadingState(false);
      }
    };

    loadSavedState();
  }, [userId]);

  // Auto-save landing page URL with debounce
  useEffect(() => {
    if (isLoadingState || !userId) return;

    const timeoutId = setTimeout(async () => {
      try {
        await apiRequest("POST", "/api/video-script-generator-state", {
          landingPageUrl: landingPageUrl || "",
          generatedScripts
        });
      } catch (error) {
        console.error('Failed to auto-save landing page URL:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [landingPageUrl, userId, isLoadingState, generatedScripts]);

  // Load implementation checkboxes from database on mount
  useEffect(() => {
    const loadCheckboxState = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/implementation-checkboxes/launch-your-ads-live-launch', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.checkboxStates) {
            console.log('[CHECKBOX] Loading saved state:', data.checkboxStates);
            setCompletedSections(data.checkboxStates);
          } else {
            console.log('[CHECKBOX] No saved state found, using defaults');
          }
        }
      } catch (error) {
        console.error('Failed to load checkbox state:', error);
      } finally {
        setIsLoadingCheckboxes(false);
      }
    };

    loadCheckboxState();
  }, [userId]);

  // Save completedSections to database whenever it changes (but not on initial load)
  useEffect(() => {
    // Skip saving on initial load
    if (isLoadingCheckboxes || !userId) return;

    const saveCheckboxState = async () => {
      try {
        console.log('[CHECKBOX] Saving state:', completedSections);
        await apiRequest("POST", "/api/implementation-checkboxes", {
          userId,
          pageIdentifier: "launch-your-ads-live-launch",
          checkboxStates: completedSections
        });
      } catch (error) {
        console.error('Failed to save checkbox state:', error);
      }
    };

    // Add a small delay to prevent race condition with loading
    const timeoutId = setTimeout(saveCheckboxState, 100);
    return () => clearTimeout(timeoutId);
  }, [completedSections, userId, isLoadingCheckboxes]);

  // Handler for generating video scripts
  const handleGenerateVideoScripts = async () => {
    if (!landingPageUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a landing page URL",
        variant: "destructive"
      });
      return;
    }
    
    try {
      new URL(landingPageUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingScripts(true);
    
    try {
      const response = await apiRequest("POST", "/api/generate-video-scripts", {
        landingPageUrl
      });
      
      const result = await response.json();
      setGeneratedScripts(result);
      
      toast({
        title: "Scripts Generated!",
        description: "3 video scripts created using your Build Your Strategy messaging"
      });
      
      // Scroll to generated scripts after a short delay to ensure rendering
      setTimeout(() => {
        generatedScriptsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error) {
      console.error("Error generating video scripts:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate video scripts. Please try again.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingScripts(false);
    }
  };

  // Edit script handlers
  const handleEditScript = (scriptNumber: 1 | 2 | 3) => {
    if (!generatedScripts) return;
    
    const script = generatedScripts[`script${scriptNumber}`];
    if (scriptNumber === 1) {
      setEditedScript1Title(script.title);
      setEditedScript1Content(script.content);
      setIsEditingScript1(true);
    } else if (scriptNumber === 2) {
      setEditedScript2Title(script.title);
      setEditedScript2Content(script.content);
      setIsEditingScript2(true);
    } else {
      setEditedScript3Title(script.title);
      setEditedScript3Content(script.content);
      setIsEditingScript3(true);
    }
  };

  const handleSaveScript = (scriptNumber: 1 | 2 | 3) => {
    if (!generatedScripts) return;
    
    const updatedScripts = { ...generatedScripts };
    
    if (scriptNumber === 1) {
      updatedScripts.script1 = { title: editedScript1Title, content: editedScript1Content };
      setIsEditingScript1(false);
    } else if (scriptNumber === 2) {
      updatedScripts.script2 = { title: editedScript2Title, content: editedScript2Content };
      setIsEditingScript2(false);
    } else {
      updatedScripts.script3 = { title: editedScript3Title, content: editedScript3Content };
      setIsEditingScript3(false);
    }
    
    setGeneratedScripts(updatedScripts);
    toast({
      title: "Script Saved",
      description: `Script ${scriptNumber} has been updated successfully`
    });
  };

  // Download handlers
  const handleDownloadPDF = () => {
    if (!generatedScripts) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let y = margin;

    pdf.setFontSize(20);
    pdf.text("Video Ad Scripts", margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
    y += 15;

    [1, 2, 3].forEach((num) => {
      const script = generatedScripts[`script${num}` as 'script1' | 'script2' | 'script3'];
      
      pdf.setFontSize(14);
      pdf.text(`Script ${num}: ${script.title}`, margin, y);
      y += 10;

      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(script.content, maxWidth);
      lines.forEach((line: string) => {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 6;
      });
      y += 10;
    });

    pdf.save("video-ad-scripts.pdf");
    toast({
      title: "PDF Downloaded",
      description: "Your video scripts have been saved as PDF"
    });
  };

  const handleDownloadDOCX = async () => {
    if (!generatedScripts) return;
    
    const children: Paragraph[] = [
      new Paragraph({
        text: "Video Ad Scripts",
        heading: "Heading1"
      }),
      new Paragraph({
        text: `Generated: ${new Date().toLocaleDateString()}`,
        spacing: { after: 400 }
      })
    ];

    [1, 2, 3].forEach((num) => {
      const script = generatedScripts[`script${num}` as 'script1' | 'script2' | 'script3'];
      
      children.push(
        new Paragraph({
          text: `Script ${num}: ${script.title}`,
          heading: "Heading2",
          spacing: { before: 400, after: 200 }
        })
      );

      script.content.split('\n').forEach((line) => {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 100 }
          })
        );
      });
    });

    const doc = new Document({
      sections: [{ children }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "video-ad-scripts.docx");
    
    toast({
      title: "DOCX Downloaded",
      description: "Your video scripts have been saved as Word document"
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Launch Your Ads</h1>
            <p className="text-slate-600 mt-2">Create and launch effective advertising campaigns for your live launch funnel</p>
          </div>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
            Active
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training Videos</TabsTrigger>
          <TabsTrigger value="script-generator">Video Script Generator</TabsTrigger>
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
                    Now that your live launch funnel is ready, it's time to bring people in! In this step, you'll duplicate your funnel for ads, choose your ad targeting, create your ad creative and set up your live launch campaigns to start running 10–14 days before your event kicks off.
                  </p>
                  <p>
                    The goal here is to get consistent registrations (both warm & cold traffic) so you have an engaged audience showing up live and primed to buy your core offer when the sales promo starts.
                  </p>
                  <p>
                    By the end of this section, you'll have ads running that fill your live launch with quality leads and you'll be in your promo period for your live launch emailing your list and posting on social media.
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
                  <p className="text-2xl font-bold text-purple-600 mb-2">3–5 Days</p>
                  <p className="text-sm text-slate-600">
                    Allow a few days to duplicate your funnel, create and upload ad assets, and get your campaign approved by the ad platform.
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
                    "Duplicate your live launch funnel for ads.",
                    "Create your raw live launch ad creative (video).",
                    "Submit for your ad copy & creative from our team",
                    "Set up your campaign in Ads Manager (objective, budget, targeting, placements).",
                    "Schedule ads to go live 10–14 days before your event.",
                    "Double-check funnel tracking + pixel to confirm registrations are being tracked.",
                    "Launch your campaign!",
                    "Start sending out your invite emails to your list and posting about your live launch on social media during the same window"
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
                    { title: "Plan for runway", text: "Start ads 10–14 days before your live launch event to give enough time for registrations to come in." },
                    { title: "Target strategically", text: "Use your messaging strategy to guide which interests, lookalikes, or audiences to start with." },
                    { title: "Talk about your event everywhere", text: "While you're running ads you'll also want to be sending out your emails to your list inviting them to the experience, posting on social media and even talking to any leads you've had conversations with in the past. The goal being as many quality registrations as possible!" },
                    { title: "Test Everything", text: "Make sure your pixel is firing and you can clearly see registrations inside Ads Manager and your CRM." },
                    { title: "Remember the goal", text: "It's not about the cheapest clicks — it's about filling your launch with the right leads who are excited for your event. Use our team support calls to feel fully informed around your data!" }
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
              <p className="text-slate-600">Learn how to set up your ads step by step</p>
            </CardHeader>
            <CardContent>
              
              {/* Nested Training Video Tabs */}
              <Tabs defaultValue="funnel" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 gap-1">
                  <TabsTrigger value="funnel" className="text-xs md:text-sm px-2 md:px-4">Duplicate Your Live Launch Funnel</TabsTrigger>
                  <TabsTrigger value="targeting" className="text-xs md:text-sm px-2 md:px-4">Live Launch Targeting</TabsTrigger>
                  <TabsTrigger value="setup" className="text-xs md:text-sm px-2 md:px-4">Setting Up Your Live Launch Ads</TabsTrigger>
                  <TabsTrigger value="promoting" className="text-xs md:text-sm px-2 md:px-4">Promoting Your Live Launch</TabsTrigger>
                </TabsList>

                <TabsContent value="funnel" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">Duplicate Your Live Launch Funnel</h3>
                    
                    <VimeoEmbed 
                      vimeoId="1122891889/a9c827598f" 
                      title="Duplicate Your Live Launch Funnel"
                      userId={1}
                      stepNumber={103}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="targeting" className="space-y-6">
                  <VimeoEmbed 
                    vimeoId="1125299908/16472b1f13" 
                    title="Live Launch Targeting"
                    userId={1}
                    stepNumber={103}
                  />
                </TabsContent>

                <TabsContent value="setup" className="space-y-6">
                  <VimeoEmbed 
                    vimeoId="1125528658/b030661709" 
                    title="Setting Up Your Live Launch Ads"
                    userId={1}
                    stepNumber={103}
                  />
                </TabsContent>

                <TabsContent value="promoting" className="space-y-6">
                  <VimeoEmbed 
                    vimeoId="1125626999/df27eed508" 
                    title="Promoting Your Live Launch"
                    userId={1}
                    stepNumber={103}
                  />
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Script Generator Tab */}
        <TabsContent value="script-generator" className="space-y-6">
          {/* Generated Scripts Section - Shows ABOVE the generator */}
          {generatedScripts && generatedScripts.script1 && generatedScripts.script2 && generatedScripts.script3 && (
            <div ref={generatedScriptsRef} className="space-y-6">
              {/* Export Document Button */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-embodied-coral text-white hover:bg-coral-600">
                      <Download className="w-4 h-4 mr-2" />
                      Export Document
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadPDF} className="hover:bg-slate-100 focus:bg-slate-100">
                      <Download className="w-4 h-4 mr-2" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadDOCX} className="hover:bg-slate-100 focus:bg-slate-100">
                      <Download className="w-4 h-4 mr-2" />
                      Download as DOCX
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
                  {/* Script 1 */}
                  <Card className="border-purple-200">
                    <CardHeader className="bg-purple-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-purple-600">Script 1</Badge>
                            <span className="text-sm text-slate-600">Problem-Focused Hook</span>
                          </div>
                          {isEditingScript1 ? (
                            <Input
                              value={editedScript1Title}
                              onChange={(e) => setEditedScript1Title(e.target.value)}
                              className="font-semibold"
                            />
                          ) : (
                            <CardTitle>{generatedScripts.script1.title}</CardTitle>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditingScript1 ? (
                            <Button size="sm" className="bg-embodied-coral text-white hover:bg-coral-600" onClick={() => handleSaveScript(1)}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-embodied-coral text-white hover:bg-coral-600" onClick={() => handleEditScript(1)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {isEditingScript1 ? (
                        <Textarea
                          value={editedScript1Content}
                          onChange={(e) => setEditedScript1Content(e.target.value)}
                          rows={15}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <div className="prose max-w-none">
                          {formatScriptContent(generatedScripts.script1.content)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Script 2 */}
                  <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-600">Script 2</Badge>
                            <span className="text-sm text-slate-600">Desire/Curiosity Hook</span>
                          </div>
                          {isEditingScript2 ? (
                            <Input
                              value={editedScript2Title}
                              onChange={(e) => setEditedScript2Title(e.target.value)}
                              className="font-semibold"
                            />
                          ) : (
                            <CardTitle>{generatedScripts.script2.title}</CardTitle>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditingScript2 ? (
                            <Button size="sm" className="bg-embodied-coral text-white hover:bg-coral-600" onClick={() => handleSaveScript(2)}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-embodied-coral text-white hover:bg-coral-600" onClick={() => handleEditScript(2)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {isEditingScript2 ? (
                        <Textarea
                          value={editedScript2Content}
                          onChange={(e) => setEditedScript2Content(e.target.value)}
                          rows={15}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <div className="prose max-w-none">
                          {formatScriptContent(generatedScripts.script2.content)}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Script 3 */}
                  <Card className="border-green-200">
                    <CardHeader className="bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-green-600">Script 3</Badge>
                            <span className="text-sm text-slate-600">Social Proof/Authority Hook</span>
                          </div>
                          {isEditingScript3 ? (
                            <Input
                              value={editedScript3Title}
                              onChange={(e) => setEditedScript3Title(e.target.value)}
                              className="font-semibold"
                            />
                          ) : (
                            <CardTitle>{generatedScripts.script3.title}</CardTitle>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditingScript3 ? (
                            <Button size="sm" className="bg-embodied-coral text-white hover:bg-coral-600" onClick={() => handleSaveScript(3)}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-embodied-coral text-white hover:bg-coral-600" onClick={() => handleEditScript(3)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {isEditingScript3 ? (
                        <Textarea
                          value={editedScript3Content}
                          onChange={(e) => setEditedScript3Content(e.target.value)}
                          rows={15}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <div className="prose max-w-none">
                          {formatScriptContent(generatedScripts.script3.content)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
            </div>
          )}

          {/* Video Script Generator Input Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <CardTitle>Video Script Generator</CardTitle>
              </div>
              <CardDescription>Generate professional video scripts for your live launch ads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none text-slate-700 leading-relaxed">
                <p>
                  Our AI-powered script generator will analyze your live launch landing page and create compelling video scripts tailored to your offer and audience. 
                </p>
                <p>
                  Provide your landing page URL and we'll generate multiple script variations for you to choose from.
                </p>
              </div>

              {/* Input & Generate Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="landing-page-url" className="text-sm font-medium text-slate-700 mb-2 block">
                    Landing Page URL
                  </Label>
                  <Input 
                    id="landing-page-url"
                    type="url"
                    placeholder="https://your-landing-page.com"
                    className="w-full"
                    value={landingPageUrl}
                    onChange={(e) => setLandingPageUrl(e.target.value)}
                    disabled={isGeneratingScripts}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Scripts will be generated using messaging from your Build Your Strategy section
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleGenerateVideoScripts}
                  disabled={isGeneratingScripts || !landingPageUrl.trim()}
                >
                  {isGeneratingScripts ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Scripts...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate 3 Video Scripts
                    </>
                  )}
                </Button>
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
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <CardTitle>Implementation Steps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700">
                Walk through these steps one at a time to get your live launch ads officially launched!
              </p>

              {/* Step-by-step sections */}
              <div className="grid gap-4">
                {/* Step 1 */}
                <Collapsible open={expandedSections.leadMagnet} onOpenChange={() => handleSectionExpand('leadMagnet')}>
                  <Card className={`border-2 transition-colors ${completedSections.leadMagnet ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.leadMagnet}
                              onCheckedChange={() => handleSectionComplete('leadMagnet')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-lead-magnet"
                            />
                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              1
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Create Your Raw Ad Creative</h3>
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
                            You can use the script generator to create an ad script for your video. Remember though, an overly scripted video doesn't perform as well. Try to be as natural as possible.
                          </p>
                          
                          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                              🎥 Simple Video Ad Recording Tips
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">Lighting →</strong>
                                <span className="text-slate-700">Face a window or bright light so your face is clear.</span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">Framing →</strong>
                                <span className="text-slate-700">Hold your phone vertically (like Instagram/TikTok).</span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">Audio →</strong>
                                <span className="text-slate-700">Your phone mic is perfect—just record in a quiet space.</span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">Script →</strong>
                                <span className="text-slate-700">Use notes if needed, but speak naturally.</span>
                              </div>
                              <div className="flex items-start gap-3">
                                <strong className="text-slate-900 min-w-[80px]">Energy →</strong>
                                <span className="text-slate-700">Keep energy high and authentic—people buy energy!</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 2 */}
                <Collapsible open={expandedSections.adCopy} onOpenChange={() => handleSectionExpand('adCopy')}>
                  <Card className={`border-2 transition-colors ${completedSections.adCopy ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.adCopy}
                              onCheckedChange={() => handleSectionComplete('adCopy')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-ad-copy"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              2
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Get Your Ad Copy & Creative</h3>
                          </div>
                          {expandedSections.adCopy ? (
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
                            Submit your raw ad creative and get our team to write your ad copy and create your creative. Make sure to note anything specific you'd like us to use in the copy or creative and to include your branding assets.
                          </p>
                          <Button 
                            asChild
                            className="mt-4"
                          >
                            <a href="https://embodiedmarketing.typeform.com/adsrequest" target="_blank" rel="noopener noreferrer">
                              Submit Here
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 3 */}
                <Collapsible open={expandedSections.landingPage} onOpenChange={() => handleSectionExpand('landingPage')}>
                  <Card className={`border-2 transition-colors ${completedSections.landingPage ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.landingPage}
                              onCheckedChange={() => handleSectionComplete('landingPage')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-landing-page"
                            />
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              3
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Double-Check Your Funnel Tracking & Pixel</h3>
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
                        <p className="text-slate-600">
                          Watch our training video to make sure your pixel is properly placed on your live launch funnel.
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 4 */}
                <Collapsible open={expandedSections.automation} onOpenChange={() => handleSectionExpand('automation')}>
                  <Card className={`border-2 transition-colors ${completedSections.automation ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.automation}
                              onCheckedChange={() => handleSectionComplete('automation')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-automation"
                            />
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              4
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Confirm Your Ad Targeting</h3>
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
                        <div className="space-y-4">
                          <p className="text-slate-600">
                            Watch our training video and confirm below the ad targeting you will be using to launch your campaign. Remember, you now have a lot more data to leverage so you'll be utilizing warm traffic and lookalike audiences when you launch this campaign.
                          </p>
                          <div>
                            <Label htmlFor="ad-targeting" className="text-sm font-medium text-slate-700 mb-2 block">
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

                {/* Step 5 */}
                <Collapsible open={expandedSections.launch} onOpenChange={() => handleSectionExpand('launch')}>
                  <Card className={`border-2 transition-colors ${completedSections.launch ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.launch}
                              onCheckedChange={() => handleSectionComplete('launch')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-launch"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              5
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Set Up Your Campaign in Ads Manager</h3>
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
                          Reference our step by step training video to set up your campaign inside ads manager. Take your ad copy, creative, and targeting and launch your first ads!
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 6 */}
                <Collapsible open={expandedSections.testing} onOpenChange={() => handleSectionExpand('testing')}>
                  <Card className={`border-2 transition-colors ${completedSections.testing ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.testing}
                              onCheckedChange={() => handleSectionComplete('testing')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-testing"
                            />
                            <div className="w-8 h-8 rounded-full bg-yellow-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              6
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Double-Check Everything Works</h3>
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
                        <p className="text-slate-600">
                          Run through your funnel to make sure it's working properly. Click on your ad, go through your funnel, and make sure everything is working as expected before you launch.
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 7 */}
                <Collapsible open={expandedSections.campaign} onOpenChange={() => handleSectionExpand('campaign')}>
                  <Card className={`border-2 transition-colors ${completedSections.campaign ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.campaign}
                              onCheckedChange={() => handleSectionComplete('campaign')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-campaign"
                            />
                            <div className="w-8 h-8 rounded-full bg-red-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              7
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Launch Your Campaign!</h3>
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
                            Watch our step by step tutorial and take your completed ad copy & creative and ad targeting into ads manager to launch your campaign! If you get stuck at any point hop on our ads support call.
                          </p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 8 */}
                <Collapsible open={expandedSections.invitation} onOpenChange={() => handleSectionExpand('invitation')}>
                  <Card className={`border-2 transition-colors ${completedSections.invitation ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.invitation}
                              onCheckedChange={() => handleSectionComplete('invitation')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-invitation"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              8
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Invite Your Email List & Social</h3>
                          </div>
                          {expandedSections.invitation ? (
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
                            Start sending our your launch invite emails to your email list and posting on your social media. While your registration ads run you want to be talking about and inviting people everywhere it makes sense to sign up for this experience! Make sure everything is cohesive in your marketing.
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
