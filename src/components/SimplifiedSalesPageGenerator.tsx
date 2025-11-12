import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { 
  FileText, 
  Wand2, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Download,
  Target,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SalesPageInputField from "@/components/SalesPageInputField";
import { useSalesPageData } from "@/hooks/useSalesPageData";
import { validateAndNotify } from "@/utils/prerequisite-validator";
import { queryClient } from "@/services/queryClient";
import { useQuery } from "@tanstack/react-query";

// Markdown parsing function
function parseMarkdownToHTML(markdown: string): string {
  return markdown
    // Headers
    .replace(/^# (.*$)/gm, '<h1 class="sales-h1">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="sales-h2">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="sales-h3">$1</h3>')
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text (for subtitle lines)
    .replace(/^\*(.*?)\*$/gm, '<p class="sales-subtitle">$1</p>')
    // Checkmarks with proper list formatting
    .replace(/^✅ \*\*(.*?)\*\* - (.*$)/gm, '<div class="sales-benefit"><span class="checkmark">✅</span><strong>$1</strong> - $2</div>')
    // Module formatting
    .replace(/^\*\*(Module \d+:.*?)\*\* - (.*$)/gm, '<div class="sales-module"><strong>$1</strong> - $2</div>')
    // Power moves formatting
    .replace(/^\*\*(POWER MOVE #\d+:.*?)\*\*/gm, '<h4 class="sales-power-move">$1</h4>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="sales-paragraph">')
    .replace(/\n/g, '<br>')
    // Wrap in paragraph tags
    .replace(/^([^<].*)/gm, '<p class="sales-paragraph">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p class="sales-paragraph"><\/p>/g, '')
    .replace(/<p class="sales-paragraph"><br><\/p>/g, '');
}

interface SimplifiedSalesPageGeneratorProps {
  userId: number;
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

export default function SimplifiedSalesPageGenerator({ userId }: SimplifiedSalesPageGeneratorProps) {
  const [salesPageInputs, setSalesPageInputs] = useState<SalesPageInputs>({});
  const [generatedSalesPage, setGeneratedSalesPage] = useState<string>("");
  const [missingElements, setMissingElements] = useState<MissingElement[]>([]);
  const [completeness, setCompleteness] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  // Fetch messaging strategy with refetch capability
  const { data: messagingStrategy, refetch: refetchMessagingStrategy } = useQuery({
    queryKey: ['messaging-strategy', 'active', userId],
    queryFn: async () => {
      const response = await fetch(`/api/messaging-strategies/active/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch messaging strategy');
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch offer outline (most recent one, regardless of active status)
  const { data: offerOutline, refetch: refetchOfferOutline } = useQuery({
    queryKey: [`/api/user-offer-outlines/user/${userId}`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/user-offer-outlines/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch offer outline');
      const data = await response.json();
      // Return the most recent outline if any exist
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    },
    enabled: !!userId,
  });

  // NEW: Use database data instead of localStorage
  const { messagingStrategy: dataMessagingStrategy, offerOutline: dataOfferOutline, isLoading: dataLoading, error: dataError } = useSalesPageData(userId.toString());

  // Load existing sales page inputs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`salesPageInputs_${userId}`);
    if (saved) {
      setSalesPageInputs(JSON.parse(saved));
    }
    
    const savedSalesPage = localStorage.getItem(`generatedSalesPage_${userId}`);
    if (savedSalesPage) {
      setGeneratedSalesPage(savedSalesPage);
    }
  }, [userId]);

  // Auto-save inputs to localStorage
  useEffect(() => {
    localStorage.setItem(`salesPageInputs_${userId}`, JSON.stringify(salesPageInputs));
  }, [salesPageInputs, userId]);

  // Generate sales page mutation
  const generateSalesPageMutation = useMutation({
    mutationFn: async () => {
      // Before validation, refetch the latest data
      const { data: latestMessagingStrategy } = await refetchMessagingStrategy();
      const { data: latestOfferOutline } = await refetchOfferOutline();
      
      // Validate prerequisites before generation
      const isValid = validateAndNotify(
        { messagingStrategy: true, offerOutline: true },
        { messagingStrategy: latestMessagingStrategy, offerOutline: latestOfferOutline }
      );
      
      if (!isValid) {
        throw new Error("Missing prerequisites");
      }
      
      // Use the latest refetched data instead of stale cached data
      const response = await fetch('/api/generate-sales-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          messagingStrategy: latestMessagingStrategy, // Now using refetched data
          offerOutline: latestOfferOutline,           // Now using refetched data
          salesPageInputs
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate sales page');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedSalesPage(data.salesPageContent);
      setMissingElements(data.missingElements || []);
      setCompleteness(data.completeness || 0);
      localStorage.setItem(`generatedSalesPage_${userId}`, data.salesPageContent);
      toast({
        title: "Sales Page Generated!",
        description: `Your sales page is ${data.completeness}% complete. Review suggestions to improve it further.`
      });
    },
    onError: (error: any) => {
      // Don't show duplicate toast if prerequisites are missing (validator already showed one)
      if (error.message === "Missing prerequisites") {
        return;
      }
      toast({
        title: "Generation Failed",
        description: "Please try again or complete more workbook sections first.",
        variant: "destructive"
      });
    }
  });

  // Delete all drafts function (client-side only)
  const deleteAllDrafts = () => {
    try {
      // Clear all state
      setGeneratedSalesPage("");
      setSalesPageInputs({});
      setMissingElements([]);
      setCompleteness(0);
      
      // Clear localStorage
      localStorage.removeItem(`generatedSalesPage_${userId}`);
      localStorage.removeItem(`salesPageInputs_${userId}`);
      
      // Clear any other related localStorage items
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('salesPage') || key.includes('draft')) {
          localStorage.removeItem(key);
        }
      });
      
      toast({
        title: "All Drafts Deleted",
        description: "Sales page generator has been reset. You can now generate a fresh sales page."
      });
    } catch (error) {
      toast({
        title: "Reset Complete",
        description: "Sales page generator has been reset successfully.",
      });
    }
  };

  const updateInput = (field: keyof SalesPageInputs, value: string) => {
    setSalesPageInputs(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Sales page content copied to clipboard."
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please select and copy the text manually.",
        variant: "destructive"
      });
    }
  };

  const downloadSalesPage = () => {
    const blob = new Blob([generatedSalesPage], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-page.txt';
    a.click();
    URL.revokeObjectURL(url);
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
          <strong>Unable to load your data.</strong> Please try refreshing the page or complete your workbook sections first.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if user has sufficient data for sales page generation
  const hasMinimumData = messagingStrategy?.content || offerOutline?.content;
  
  if (!hasMinimumData) {
    return (
      <Card className="border-2 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Complete Your Workbook First
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 mb-4">
            To generate your sales page, please complete your messaging strategy and offer creation workbook sections first.
          </p>
          <div className="text-sm text-yellow-600">
            <p><strong>Step 1:</strong> Complete "Your Messaging" section</p>
            <p><strong>Step 2:</strong> Complete "Create Your Offer" section</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              We'll create your sales page using your messaging strategy and offer outline. You can then customize and improve specific sections.
            </p>
            
            {/* Show data source status */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="flex items-center text-blue-700 mb-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="font-medium">Data Sources Ready:</span>
              </div>
              <div className="space-y-1 text-blue-600">
                <p>✓ Messaging Strategy: {messagingStrategy?.content ? 'Loaded' : 'Not available'}</p>
                <p>✓ Offer Outline: {offerOutline?.content ? 'Loaded' : 'Not available'}</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => generateSalesPageMutation.mutate()}
                disabled={generateSalesPageMutation.isPending}
                size="lg"
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateSalesPageMutation.isPending ? "Generating Your Sales Page..." : "Generate Sales Page"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Generated Page with Editing Section
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
                <span className="text-sm font-medium text-green-700">{completeness}%</span>
              </div>
              
              {missingElements.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50 mb-4">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700">
                    <strong>Improve your sales page:</strong> Complete the highlighted sections below for maximum impact.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(generatedSalesPage)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Page
                </Button>
                <Button
                  onClick={downloadSalesPage}
                  variant="outline"
                  size="sm"
                >
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
                  onClick={deleteAllDrafts}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete All & Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Human Review Disclaimer */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <strong>Important: Human Touch Required</strong><br />
              AI has generated this sales page based on your messaging strategy & offer outline, but a truly great sales page needs your human heart and touch. Please thoroughly read through this copy and add any relevant information, refine the language to match your voice, and ensure every detail accurately represents your offer.
            </AlertDescription>
          </Alert>

          {/* Hidden: Missing Elements and Improvement Areas */}
          {false && missingElements.length > 0 && (
            <Card className="border-2 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Improve These Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {missingElements.map((element, index) => (
                  <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-orange-800">{element.section}: {element.field}</h4>
                        <p className="text-sm text-orange-700">{element.description}</p>
                      </div>
                      <Badge variant={element.priority === "high" ? "destructive" : element.priority === "medium" ? "default" : "secondary"}>
                        {element.priority}
                      </Badge>
                    </div>
                    
                    <SalesPageInputField
                      fieldKey={element.field.toLowerCase().replace(/\s+/g, '')}
                      label={element.field}
                      value={salesPageInputs[element.field.toLowerCase().replace(/\s+/g, '') as keyof SalesPageInputs] || ""}
                      onChange={(value) => updateInput(element.field.toLowerCase().replace(/\s+/g, '') as keyof SalesPageInputs, value)}
                      placeholder={element.suggestions[0] || `Add your ${element.field.toLowerCase()}...`}
                      userId={userId}
                      guidance={element.suggestions.join(". ")}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Generated Sales Page Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Your Generated Sales Page
                </span>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                >
                  {isEditing ? "Preview" : "Edit"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={generatedSalesPage}
                    onChange={(e) => {
                      setGeneratedSalesPage(e.target.value);
                      localStorage.setItem(`generatedSalesPage_${userId}`, e.target.value);
                    }}
                    className="min-h-[400px] font-mono text-sm"
                    spellCheck={true}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="default" size="sm">
                      Save Changes
                    </Button>
                    <Button onClick={() => copyToClipboard(generatedSalesPage)} variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-w-none bg-white p-8 rounded-lg border">
                  <div 
                    className="sales-page-content"
                    dangerouslySetInnerHTML={{ 
                      __html: parseMarkdownToHTML(generatedSalesPage) 
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
