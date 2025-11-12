import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/services/queryClient";
import { useOfferOutlines } from "@/hooks/useDatabasePersistence";

function FormattedOfferOutline({ content }: { content: string }) {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Handle main headers (# Header)
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b-2 border-coral-200">
            {line.replace('# ', '')}
          </h1>
        );
      }

      // Handle subheaders (## Header)
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3 text-coral-800">
            {line.replace('## ', '')}
          </h2>
        );
      }

      // Handle section headers (### Header)
      if (line.startsWith('### ') || line.startsWith('#### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-slate-700 mt-4 mb-2">
            {line.replace(/^#+\s/, '')}
          </h3>
        );
      }

      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/);
        return (
          <p key={index} className="mb-3 leading-relaxed text-slate-700">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIndex} className="font-semibold text-slate-900">
                    {part.replace(/\*\*/g, '')}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      }

      // Handle bullet points (• or -)
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start mb-2 ml-4">
            <span className="text-purple-500 mr-2 mt-1">•</span>
            <span className="text-slate-700 leading-relaxed">{line.replace(/^[•-]\s/, '')}</span>
          </div>
        );
      }

      // Handle horizontal rules (---)
      if (line.trim() === '---') {
        return <hr key={index} className="my-6 border-purple-200" />;
      }

      // Handle italic text (*text*)
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return (
          <p key={index} className="italic text-slate-600 text-center mb-4 text-sm">
            {line.replace(/^\*|\*$/g, '')}
          </p>
        );
      }

      // Handle empty lines
      if (line.trim() === '') {
        return <div key={index} className="mb-2" />;
      }

      // Regular paragraphs
      return (
        <p key={index} className="mb-3 leading-relaxed text-slate-700">
          {line}
        </p>
      );
    });
  };

  return <div className="space-y-1">{formatContent(content)}</div>;
}

interface OfferOutlineResult {
  outline: string;
  missingInformation: string[];
  completeness: number;
  recommendations: string[];
}

interface OfferOutlinePanelProps {
  userId: number;
  stepNumber: number;
  showOnAllTabs?: boolean;
  offerId?: number;
}

export default function OfferOutlinePanel({ userId, stepNumber, showOnAllTabs = false, offerId }: OfferOutlinePanelProps) {
  // Get database persistence hooks
  const { 
    activeOutline, 
    isLoading: isLoadingOutline, 
    createOutline, 
    updateOutline 
  } = useOfferOutlines(userId);

  // Local state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutline, setEditedOutline] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [completeness, setCompleteness] = useState<number>(0);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Use database content as primary source
  const offerOutline = activeOutline?.content || "";

  // Debug logging
  console.log('=== OFFER OUTLINE PANEL DEBUG ===');
  console.log('isLoadingOutline:', isLoadingOutline);
  console.log('activeOutline:', activeOutline);
  console.log('offerOutline:', offerOutline);
  console.log('offerOutline.trim():', offerOutline.trim());
  console.log('!offerOutline.trim():', !offerOutline.trim());
  console.log('showOnAllTabs:', showOnAllTabs);

  // Load database outline data when available
  useEffect(() => {
    if (activeOutline) {
      setCompleteness(activeOutline.completionPercentage || 0);
      setMissingInfo(activeOutline.missingInformation || []);
      setRecommendations(activeOutline.recommendations || []);
      setIsExpanded(true);

      // Also load from sourceData if available
      if (activeOutline.sourceData) {
        const sourceData = activeOutline.sourceData;
        if (sourceData.missingInformation) setMissingInfo(sourceData.missingInformation);
        if (sourceData.recommendations) setRecommendations(sourceData.recommendations);
        if (sourceData.completeness) setCompleteness(sourceData.completeness);
      }
    } else if (offerId) {
      // Fallback for legacy offerId approach (if still needed)
      fetch(`/api/offers/${offerId}/outline`)
        .then(res => res.json())
        .then(data => {
          if (data && data.outline) {
            setCompleteness(data.completeness || 0);
            setMissingInfo(data.missingInformation || []);
            setRecommendations(data.recommendations || []);
            setIsExpanded(true);
          }
        })
        .catch(error => console.error('Error loading offer outline:', error));
    } else {
      // Fallback to localStorage for backward compatibility
      const savedOutline = localStorage.getItem(`offer-outline-${userId}`);
      if (savedOutline) {
        setIsExpanded(true);
      }
    }
  }, [userId, offerId, activeOutline]);

  const generateOfferOutline = async (isRetry: boolean = false) => {
    setIsGenerating(true);
    if (!isRetry) {
      setError(null);
      setRetryCount(0);
    }

    try {
      console.log('=== OFFER OUTLINE GENERATION START ===');
      console.log('Starting generation with userId:', userId);

      // Get offer responses from localStorage
      let offerResponses = JSON.parse(localStorage.getItem(`step-${stepNumber}-responses-${userId}`) || "{}");

      // Debug logging
      console.log('Debug offer outline generation:', {
        offerResponsesCount: Object.keys(offerResponses).length,
        offerResponses: offerResponses,
        storageKey: `step-${stepNumber}-responses-${userId}`
      });

      // If no responses found, show helpful message
      if (Object.keys(offerResponses).length === 0) {
        setError("Please complete the offer creation questions first. You need to answer at least 60% of the questions to generate an offer outline.");
        setIsGenerating(false);
        return;
      }

      // Get messaging strategy for context (try multiple possible keys)
      let messagingStrategy = {};
      const messagingKeys = [`messaging-strategy-${userId}`, 'generated-messaging-strategy'];
      for (const key of messagingKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            messagingStrategy = JSON.parse(stored);
            break;
          } catch (e) {
            console.log('Could not parse messaging strategy from key:', key);
          }
        }
      }

      const response = await apiRequest('POST', '/api/generate-offer-outline', {
        userId,
        offerResponses,
        messagingStrategy
      });

      const result: OfferOutlineResult = await response.json();

      // Comprehensive debug logging
      console.log('=== FRONTEND PARSING DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Parsed result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result || {}));
      console.log('Result outline exists:', !!result.outline);
      console.log('Result outline type:', typeof result.outline);
      console.log('Result outline length:', result.outline?.length || 0);
      console.log('Result completeness:', result.completeness);
      console.log('=== END DEBUG ===');

      // Check if we have valid outline content
      if (result.outline && result.outline.trim().length > 50) {
        setCompleteness(result.completeness || 0);
        setMissingInfo(result.missingInformation || []);
        setRecommendations(result.recommendations || []);

        // Save to database (primary storage)
        if (activeOutline) {
          updateOutline.mutate({
            id: activeOutline.id,
            updates: {
              content: result.outline,
              completionPercentage: result.completeness,
              missingInformation: result.missingInformation,
              recommendations: result.recommendations,
              sourceData: {
                ...activeOutline.sourceData,
                lastGenerated: new Date().toISOString(),
                completeness: result.completeness,
                missingInformation: result.missingInformation,
                recommendations: result.recommendations
              }
            }
          });
        } else {
          createOutline.mutate({
            title: "Offer Outline",
            content: result.outline,
            completionPercentage: result.completeness,
            sourceData: {
              generatedAt: new Date().toISOString(),
              completeness: result.completeness,
              missingInformation: result.missingInformation,
              recommendations: result.recommendations
            }
          });
        }

        // Keep localStorage for backward compatibility during migration
        localStorage.setItem(`offer-outline-${userId}`, result.outline);

        setIsExpanded(true);
        setError(null); // Clear any previous errors
      } else if (result.completeness && result.completeness < 0.6) {
        // Handle insufficient completion case
        setCompleteness(result.completeness);
        setMissingInfo(result.missingInformation || []);
        setRecommendations(result.recommendations || []);
        setError(`You need to complete more questions (${Math.round(result.completeness * 100)}% done, need 60%). Missing: ${result.missingInformation?.join(', ')}`);
        setIsExpanded(true); // Still show feedback panel
      } else {
        // Handle other error cases
        const errorMessage = result.outline || "Unable to generate outline. Please check your responses and try again.";
        console.error('Outline generation failed:', { result, errorMessage });
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('Error generating offer outline:', error);

      if (retryCount < maxRetries) {
        console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => generateOfferOutline(true), 1000 * (retryCount + 1));
        return;
      }

      const errorMessage = error.message?.includes('Rate limit') 
        ? "AI generation is temporarily busy. Please wait a moment and try again."
        : "Failed to generate outline. Please check your internet connection and try again.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditOutline = () => {
    setEditedOutline(offerOutline);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Save to database (primary storage)
      if (activeOutline) {
        updateOutline.mutate({
          id: activeOutline.id,
          updates: {
            content: editedOutline,
            sourceData: {
              ...activeOutline.sourceData,
              lastEdited: new Date().toISOString()
            }
          }
        });
      } else {
        createOutline.mutate({
          title: "Offer Outline",
          content: editedOutline,
          sourceData: {
            createdAt: new Date().toISOString(),
            lastEdited: new Date().toISOString()
          }
        });
      }

      // Keep localStorage for backward compatibility
      localStorage.setItem(`offer-outline-${userId}`, editedOutline);

      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('Error saving edited outline:', error);
      setError("Failed to save changes. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedOutline("");
  };

  // Show loading state while checking database
  if (isLoadingOutline) {
    return (
      <Card className="border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-slate-600">Loading offer outline...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show on other tabs unless explicitly requested
  if (!showOnAllTabs && stepNumber !== 2) {
    return null;
  }

  const hasContent = offerOutline.trim().length > 0;

  return (
    <Card className="border-purple-200">
      <CardHeader 
        className="cursor-pointer hover:bg-purple-50/50 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg text-slate-800">
              Your Offer Outline
              {completeness > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-600">
                  ({Math.round(completeness * 100)}% complete)
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {hasContent && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span className="text-slate-400 text-sm">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-6 px-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!hasContent && !error && !isGenerating && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                No offer outline generated yet. Complete your offer questions to create a comprehensive outline.
              </p>
              <Button 
                onClick={() => generateOfferOutline()} 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isGenerating}
              >
                Generate Offer Outline
              </Button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-600">
                {retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Generating your offer outline...'}
              </p>
              <p className="text-sm text-slate-500 mt-2">This may take up to 30 seconds</p>
            </div>
          )}

          {hasContent && (
            <div className="prose prose-slate max-w-none mb-6">
              <FormattedOfferOutline content={offerOutline} />
            </div>
          )}

          {hasContent && !isEditing && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
              <Button 
                onClick={() => generateOfferOutline()} 
                variant="outline"
                disabled={isGenerating}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Regenerate Outline
              </Button>
              <Button 
                onClick={handleEditOutline}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Edit Outline
              </Button>
            </div>
          )}

          {isEditing && (
            <div className="space-y-4">
              <Textarea
                value={editedOutline}
                onChange={(e) => setEditedOutline(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Edit your offer outline..."
              />
              <div className="flex gap-3">
                <Button 
                  onClick={handleSaveEdit}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Save Changes
                </Button>
                <Button 
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
