import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, CheckCircle, Brain, Sparkles, Loader2, ThumbsUp, AlertTriangle, Target, Copy, RefreshCw } from "lucide-react";
import { useWorkbookResponses } from "@/hooks/useDatabasePersistence";
import { useSectionCompletions, useMarkSectionComplete, useUnmarkSectionComplete } from "@/hooks/useSectionCompletions";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useManualSave } from "@/hooks/useManualSave";
import { SaveButton } from "@/components/SaveButton";

interface SecondOfferWorkbookProps {
  stepNumber: number;
  userId: string;
  offerNumber: number;
  stepContent: any;
}

interface FeedbackState {
  [key: string]: 'excellent-depth' | 'good-start' | 'needs-more-detail' | null;
}

interface ExpandingPromptsState {
  [key: string]: boolean;
}

interface AnalyzingPromptsState {
  [key: string]: boolean;
}

export default function SecondOfferWorkbook({ 
  stepNumber, 
  userId, 
  offerNumber, 
  stepContent 
}: SecondOfferWorkbookProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});
  const [expandingPrompts, setExpandingPrompts] = useState<ExpandingPromptsState>({});
  const [analyzingPrompts, setAnalyzingPrompts] = useState<AnalyzingPromptsState>({});
  const [localResponses, setLocalResponses] = useState<{[key: string]: string}>({});

  // Database persistence hooks
  const {
    responses,
    isLoading: isLoadingResponses,
    saveResponse
  } = useWorkbookResponses(parseInt(userId), stepNumber, offerNumber);

  // CRITICAL FIX: Initialize localResponses with database data on component mount
  useEffect(() => {
    if (responses && !isLoadingResponses && Object.keys(responses).length > 0) {
      console.log('[MANUAL SAVE] SecondOffer - Loading database responses into local state:', responses);
      setLocalResponses(responses);
    }
  }, [responses, isLoadingResponses]);

  // Manual save system hooks
  const unsavedChanges = useUnsavedChanges(parseInt(userId), stepNumber, offerNumber);
  const manualSave = useManualSave();

  // Section completion helpers
  const isSectionCompleted = (sectionTitle: string): boolean => {
    const isCompleted = completions.some(c => 
      c.sectionTitle === sectionTitle && 
      c.stepNumber === 2 &&
      c.userId === parseInt(userId) &&
      c.offerNumber === 2 // Explicitly check for offerNumber 2 for second offer
    );
    console.log(`[COMPLETION CHECK] Section "${sectionTitle}": ${isCompleted}`, {
      stepNumber: 2,
      userId: parseInt(userId),
      offerNumber: 2,
      availableCompletions: completions.filter(c => c.stepNumber === 2 && c.offerNumber === 2)
    });
    return isCompleted;
  };

  const getSectionQuestionKeys = (sectionTitle: string): string[] => {
    // Get all question keys for this section from stepContent
    const section = stepContent?.interactivePrompts?.sections?.find(
      (s: any) => s.title === sectionTitle
    );

    if (!section || !section.prompts) return [];

    return section.prompts.map((prompt: any) => {
      const questionText = typeof prompt === 'object' ? prompt.question || String(prompt) : prompt;
      return `${sectionTitle}-${questionText}`;
    });
  };

  const MINIMUM_CHARS = 25;

  const checkSectionAutoCompletion = async (sectionTitle: string) => {
    console.log(`[AUTO-COMPLETION] Checking section: ${sectionTitle}`);

    const questionKeys = getSectionQuestionKeys(sectionTitle);
    console.log(`[AUTO-COMPLETION] Question keys found:`, questionKeys);

    if (!questionKeys || questionKeys.length === 0) {
      console.log(`[AUTO-COMPLETION] No questions found for section: ${sectionTitle}`);
      return;
    }

    const completedQuestions = questionKeys.filter(key => {
      const response = getCurrentValue(key) || responses[key] || '';
      const isComplete = response.trim().length >= MINIMUM_CHARS;
      console.log(`[AUTO-COMPLETION] ${key}: ${response.length} chars, complete: ${isComplete}`);
      return isComplete;
    });

    const isCurrentlyCompleted = isSectionCompleted(sectionTitle);
    const shouldBeCompleted = completedQuestions.length === questionKeys.length;

    console.log(`[AUTO-COMPLETION] Section ${sectionTitle}: ${completedQuestions.length}/${questionKeys.length} complete, currently marked: ${isCurrentlyCompleted}, should be: ${shouldBeCompleted}`);

    if (shouldBeCompleted && !isCurrentlyCompleted) {
      try {
        console.log(`[AUTO-COMPLETION] Auto-completing section: ${sectionTitle}`);
        await markSectionComplete.mutateAsync({ 
          sectionTitle, 
          stepNumber: 2, 
          userId: parseInt(userId),
          offerNumber: 2
        });

        toast({
          title: "Section Auto-Completed!",
          description: `${sectionTitle} section completed automatically`,
          duration: 4000,
        });
      } catch (error) {
        console.error('[AUTO-COMPLETION] Auto-completion failed:', error);
      }
    }
  };

  const { data: completions = [], isLoading: isLoadingCompletions } = useSectionCompletions(parseInt(userId));
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();

  // AI Smart Prefill state
  const [prefillLoadingButton, setPrefillLoadingButton] = useState<string | null>(null);

  // Get messaging strategy for AI prefill
  const { data: messagingStrategy } = useQuery({
    queryKey: ['/api/messaging-strategies/active', parseInt(userId)],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/messaging-strategies/active/${userId}`);
      return await response.json();
    },
    enabled: !!userId,
  });

  const messagingStrategyContent = messagingStrategy?.content || "";

  // Query for second offer outlines
  const { data: secondOfferOutlines = [], isLoading: isLoadingOutlines } = useQuery({
    queryKey: ['/api/user-offer-outlines/user', parseInt(userId)],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-offer-outlines/user/${userId}`);
      return await response.json();
    },
    enabled: !!userId,
  });

  // Get the second offer outline (offerNumber = 2)
  const secondOfferOutline = secondOfferOutlines.find((outline: any) => outline.offerNumber === 2);

  // Second Offer Outline Generation
  const generateSecondOfferOutlineMutation = useMutation({
    mutationFn: async () => {
      const secondOfferResponses = responses;

      const response = await apiRequest("POST", "/api/generate-offer-outline", {
        offerResponses: secondOfferResponses,
        messagingStrategy: messagingStrategyContent ? { content: messagingStrategyContent } : null,
        userId,
        offerNumber: 2 // Specify this is for the second offer
      });

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Second Offer Outline Generated!",
        description: "Your comprehensive second offer outline has been created successfully.",
        duration: 4000,
      });
      // Refresh the outline data
      queryClient.invalidateQueries({ queryKey: ['/api/user-offer-outlines/user', parseInt(userId)] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate second offer outline. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  // AI Feedback Guide Component for Second Offer
  const FeedbackLegend = () => (
    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg" data-testid="feedback-legend">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700 mb-2">🎯 AI Feedback Guide</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <ThumbsUp className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Excellent Depth</span>
          <span className="text-slate-600">- Complete, detailed response</span>
        </div>
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-600 font-medium">Good Start</span>
          <span className="text-slate-600">- Solid foundation, can expand</span>
        </div>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-red-600 font-medium">Needs More Detail</span>
          <span className="text-slate-600">- Add more specifics</span>
        </div>
      </div>
    </div>
  );

  // AI-powered intelligent prefill system
  const intelligentPrefillMutation = useMutation({
    mutationFn: async (params: { questionText: string; messagingStrategy: string; targetPromptKey?: string; isRegenerate?: boolean }) => {
      const { questionText, messagingStrategy, targetPromptKey, isRegenerate } = params;
      setPrefillLoadingButton(targetPromptKey || null);
      const res = await apiRequest("POST", "/api/intelligent-prefill", {
        questionText,
        messagingStrategy,
        userId
      });
      return { data: await res.json(), targetPromptKey, isRegenerate };
    },
    onSuccess: ({ data, targetPromptKey, isRegenerate }: any) => {
      setPrefillLoadingButton(null);
      if (data.prefillText && targetPromptKey) {
        const existingContent = getCurrentValue(targetPromptKey) || "";
        const newContent = isRegenerate && existingContent 
          ? `${existingContent}\n\n${data.prefillText}`
          : data.prefillText;

        handleResponseChange(targetPromptKey, newContent, "AI Smart Prefill");
        toast({
          title: isRegenerate ? "Content added!" : "Smart prefill complete!",
          description: isRegenerate 
            ? "AI generated additional content based on your messaging strategy."
            : "AI generated a perfect response based on your messaging strategy."
        });
      }
    },
    onError: () => {
      setPrefillLoadingButton(null);
      toast({
        title: "Prefill failed",
        description: "Unable to generate intelligent prefill. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Get current value for a question (hybrid approach - prioritize unsaved changes)
  const getCurrentValue = (promptKey: string): string => {
    // Priority 1: Use unsaved changes current value if available
    if (unsavedChanges.isDirty(promptKey)) {
      const unsavedValue = unsavedChanges.getCurrentValue(promptKey);
      if (unsavedValue !== undefined) {
        return unsavedValue;
      }
    }

    // Priority 2: Use local responses for immediate UI updates
    if (localResponses[promptKey] !== undefined) {
      return localResponses[promptKey];
    }

    // Priority 3: Fallback to database value
    const dbValue = responses[promptKey] ?? '';
    return dbValue;
  };

  // Handle response changes with hybrid approach (manual save + auto-completion)
  const handleResponseChange = (promptKey: string, value: string, sectionTitle: string) => {
    console.log(`[HYBRID SAVE] SecondOffer HandleResponseChange ${promptKey}:`, {
      value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
      valueLength: value.length,
      isEmptyString: value === "",
      sectionTitle
    });

    // Update local state immediately for responsive UI
    setLocalResponses(prev => ({
      ...prev,
      [promptKey]: value
    }));

    // Track unsaved changes for manual save system
    const originalValue = responses[promptKey] || '';
    unsavedChanges.trackChange(promptKey, value, originalValue);

    // HYBRID APPROACH: Keep auto-completion for progress tracking
    // This maintains UX for section completion while using manual saves for content
    if (sectionTitle) {
      // Use a timeout to avoid blocking the UI
      setTimeout(() => {
        checkSectionAutoCompletion(sectionTitle);
      }, 100);
    }
  };

  // Get section response count
  const getSectionResponseCount = (sectionTitle: string): number => {
    const sectionQuestions = stepContent?.interactivePrompts?.sections?.find(
      (s: any) => s.title === sectionTitle
    )?.prompts || [];

    return sectionQuestions.filter((prompt: any) => {
      const questionText = typeof prompt === 'object' ? prompt.question || String(prompt) : prompt;
      const promptKey = `${sectionTitle}-${questionText}`;
      const value = getCurrentValue(promptKey) || '';
      const hasResponse = value.trim().length >= MINIMUM_CHARS;
      console.log(`[RESPONSE COUNT] ${promptKey}: ${value.length} chars, counted: ${hasResponse}`);
      return hasResponse;
    }).length;
  };

  // Duplicate function removed - using the one defined earlier

  // AI Feedback functions
  const analyzeFeedback = async (sectionTitle: string, questionText: string, responseText: string) => {
    const feedbackKey = `${sectionTitle}-${questionText}-offer${offerNumber}`;

    if (responseText.length < 20) return;

    setAnalyzingPrompts(prev => ({ ...prev, [feedbackKey]: true }));

    try {
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionTitle,
          questionText,
          responseText,
          stepNumber,
          userId: parseInt(userId)
        })
      });

      const data = await response.json();

      if (data.success && data.feedback) {
        setFeedbackState(prev => ({
          ...prev,
          [feedbackKey]: data.feedback.level
        }));
      }
    } catch (error) {
      console.error('Feedback analysis failed:', error);
    } finally {
      setAnalyzingPrompts(prev => ({ ...prev, [feedbackKey]: false }));
    }
  };



  // AI coaching state to store and display coaching responses
  const [coachingResponses, setCoachingResponses] = useState<{[key: string]: any}>({});

  // AI Expansion functionality
  const expandWithAI = async (sectionTitle: string, questionText: string, currentResponse: string) => {
    const expandKey = `${sectionTitle}-${questionText}-offer${offerNumber}`;

    setExpandingPrompts(prev => ({ ...prev, [expandKey]: true }));

    try {
      const response = await fetch('/api/interactive-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: sectionTitle,
          questionContext: questionText,
          userResponse: currentResponse,
          userId: parseInt(userId)
        })
      });

      if (!response.ok) {
        throw new Error(`AI coaching failed: ${response.status}`);
      }

      const data = await response.json();

      // Store the coaching response to display it
      setCoachingResponses(prev => ({
        ...prev,
        [expandKey]: data
      }));

      if (data && data.interactivePrompts?.length > 0) {
        toast({
          title: "AI Coaching Ready!",
          description: "Review the suggestions below and click to add any that enhance your response."
        });
      } else {
        toast({
          title: "Coaching Available",
          description: data.feedback || "AI coach provided feedback on your response.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('AI expansion failed:', error);
      toast({
        title: "Enhancement failed",
        description: "Couldn't enhance your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExpandingPrompts(prev => ({ ...prev, [expandKey]: false }));
    }
  };

  // Get feedback display
  const getFeedbackDisplay = (feedback: string) => {
    const feedbackColors = {
      'excellent-depth': 'text-green-600',
      'good-start': 'text-yellow-600', 
      'needs-more-detail': 'text-red-600'
    };

    const feedbackLabels = {
      'excellent-depth': 'Excellent Depth',
      'good-start': 'Good Start',
      'needs-more-detail': 'Needs More Detail'
    };

    return (
      <span className={`text-xs font-medium ${feedbackColors[feedback as keyof typeof feedbackColors]}`}>
        AI Feedback: {feedbackLabels[feedback as keyof typeof feedbackLabels]}
      </span>
    );
  };

  if (!stepContent?.interactivePrompts?.sections) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Second Offer Content...</h3>
          <p className="text-slate-600">Please wait while we load the workbook structure.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Offer Outline Card for Second Offer */}
      <Card className="border-coral-200 bg-gradient-to-r from-coral-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-coral-600" />
            Generate Your Offer Outline
          </CardTitle>
          <p className="text-sm text-coral-700 mb-2">
            Create a comprehensive offer outline from your second offer creation responses and messaging strategy.
          </p>
          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border">
            <strong>Note:</strong> You need at least 60% completion to generate your second offer outline. Complete more questions in the sections below, focusing on Offer Foundation, Structure & Delivery, and Pricing & Positioning.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => generateSecondOfferOutlineMutation.mutate()}
            disabled={generateSecondOfferOutlineMutation.isPending}
            className="bg-coral-600 hover:bg-coral-700 text-white"
          >
            {generateSecondOfferOutlineMutation.isPending ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Generating Outline...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Generate Offer Outline
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Feedback Guide */}
      <FeedbackLegend />

      {/* Display Generated Second Offer Outline */}
      {secondOfferOutline && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Your Second Offer Outline
            </CardTitle>
            <p className="text-sm text-green-700">
              Your comprehensive second offer outline has been generated and is ready for use.
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg border p-6 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                __html: secondOfferOutline.content?.replace(/\n/g, '<br/>').replace(/#{1,6}\s*(.+)/g, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') || ''
              }} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(secondOfferOutline.content || '');
                  toast({ title: "Copied to clipboard!", description: "Your second offer outline has been copied." });
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Outline
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  generateSecondOfferOutlineMutation.mutate();
                }}
                disabled={generateSecondOfferOutlineMutation.isPending}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Completion Check for Second Offer */}
      {(() => {
        // Check if ALL sections are completed for second offer
        const allSections = stepContent.interactivePrompts.sections || [];
        const completedSections = allSections.filter((section: any) => 
          isSectionCompleted(section.title)
        );
        const isAllCompleted = completedSections.length === allSections.length && allSections.length > 0;

        // Check if the final completion is already marked - use the same title as the button
        const isFinallyCompleted = isSectionCompleted("Offer Presentation - Second Offer");

        console.log('[FINAL COMPLETION DEBUG]', {
          isAllCompleted,
          isFinallyCompleted,
          allSectionsCount: allSections.length,
          completedSectionsCount: completedSections.length,
          completedSectionTitles: completedSections.map((s: any) => s.title),
          allCompletions: completions.filter(c => c.stepNumber === 2 && c.offerNumber === 2)
        });

        if (isAllCompleted && !isFinallyCompleted) {
          return (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Second Offer Presentation Complete!</h3>
                <p className="text-green-700 mb-4">
                  Congratulations! You've completed all sections of your second offer creation.
                </p>
                <Button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    try {
                      // Use a standardized section title that matches the pattern
                      const finalSectionTitle = "Offer Presentation - Second Offer";  // ← Match other sections
                      console.log(`[FINAL COMPLETE] Marking final completion:`, {
                        sectionTitle: finalSectionTitle,
                        stepNumber: 2,
                        userId: parseInt(userId),
                        offerNumber: 2
                      });
                      await markSectionComplete.mutateAsync({
                        stepNumber: 2,
                        userId: parseInt(userId),
                        sectionTitle: finalSectionTitle,
                        offerNumber: 2
                      });

                      // Force refresh of completions data
                      await queryClient.invalidateQueries({ queryKey: [`/api/section-completions/user/${parseInt(userId)}`] });

                      toast({
                        title: "Second Offer Complete!",
                        description: "Your second offer presentation is now complete!",
                        duration: 3000,
                      });
                    } catch (error) {
                      console.error('[FINAL COMPLETE] Failed to mark final completion:', error);
                      toast({
                        title: "Completion Failed",
                        description: "Failed to mark offer as complete. Please try again.",
                        variant: "destructive",
                        duration: 4000,
                      });
                    }
                  }}
                  disabled={markSectionComplete.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {markSectionComplete.isPending ? 'Completing...' : 'Complete Offer Presentation - Second Offer'}
                </Button>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Second Offer Workbook Questions */}
      {stepContent.interactivePrompts.sections.map((section: any, sectionIndex: number) => {
        const sectionTitle = section.title;
        const isCompleted = isSectionCompleted(sectionTitle);
        const responseCount = getSectionResponseCount(sectionTitle);
        const totalQuestions = section.prompts.length;

        return (
          <div key={sectionIndex} className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {section.title} - Second Offer
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-slate-600">
                        {getSectionResponseCount(section.title)} of {section.prompts.length} completed
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {section.prompts.map((prompt: any, promptIndex: number) => {
              const questionText = typeof prompt === 'object' ? prompt.question || String(prompt) : prompt;
              const promptKey = `${section.title}-${questionText}`;
              const feedbackKey = `${section.title}-${questionText}-offer${offerNumber}`;
              const currentFeedback = feedbackState[feedbackKey];
              const isAnalyzing = analyzingPrompts[feedbackKey];
              const isExpanding = expandingPrompts[feedbackKey];

              return (
                <div key={promptIndex} className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>{questionText}</span>
                    {currentFeedback && getFeedbackDisplay(currentFeedback)}
                  </label>

                  {/* Guidance text below question in italics */}
                  {typeof prompt === 'object' && prompt.guidance && (
                    <p className="text-sm text-slate-600 italic mb-2 leading-relaxed">
                      {prompt.guidance}
                    </p>
                  )}

                  {/* AI Smart Prefill Component for Second Offer */}
                  {messagingStrategyContent && (
                    <div className="bg-coral-50 border border-coral-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-coral-900">AI Smart Prefill</p>
                          <p className="text-xs text-coral-700">
                            {getCurrentValue(promptKey) ? "Add more AI-generated content to your existing response" : "Generate perfect response from your messaging strategy"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const hasExistingContent = !!(getCurrentValue(promptKey) && getCurrentValue(promptKey)!.trim());
                            intelligentPrefillMutation.mutate({
                              questionText,
                              messagingStrategy: messagingStrategyContent,
                              targetPromptKey: promptKey,
                              isRegenerate: hasExistingContent
                            });
                          }}
                          disabled={prefillLoadingButton === promptKey}
                          className="bg-coral-600 hover:bg-coral-700 text-white text-xs"
                        >
                          {prefillLoadingButton === promptKey ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" />
                              {getCurrentValue(promptKey) ? "Add More" : "Smart Prefill"}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-coral-600">
                        💡 You can continuously edit and refine your response in the text area below
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      value={getCurrentValue(promptKey) || ''}
                      onChange={(e) => handleResponseChange(promptKey, e.target.value, section.title)}
                      placeholder={`Write your response for your second offer here...`}
                      rows={4}
                      spellCheck={true}
                      className="resize-none transition-colors text-sm md:text-base min-h-[100px]"
                    />

                    {/* Manual Save Button, Voice Recording, and AI Coaching buttons horizontally aligned */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCurrentValue(promptKey) && getCurrentValue(promptKey)!.length > 20 && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => expandWithAI(section.title, questionText, getCurrentValue(promptKey)!)}
                              disabled={isExpanding}
                              className="text-xs"
                            >
                              {isExpanding ? (
                                <>
                                  <Brain className="w-3 h-3 mr-1 animate-pulse" />
                                  Expanding...
                                </>
                              ) : (
                                <>
                                  <Brain className="w-3 h-3 mr-1" />
                                  Expand with AI Coach
                                </>
                              )}
                            </Button>


                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <SaveButton
                          onSave={async () => {
                            const sectionTitle = promptKey.split('-')[0];
                            const currentValue = getCurrentValue(promptKey) || '';

                            console.log('[SECOND OFFER] Save button triggered:', {
                              promptKey,
                              currentValue: currentValue.substring(0, 50) + '...',
                              sectionTitle: section.title,
                              isDirty: unsavedChanges.isDirty(promptKey)
                            });

                            try {
                              await manualSave.saveResponse({
                                userId: parseInt(userId),
                                stepNumber,
                                offerNumber: 2,
                                questionKey: promptKey,
                                responseText: currentValue,
                                sectionTitle: section.title || sectionTitle || 'Offer Foundation'
                              });
                            } catch (error) {
                              console.error('[SECOND OFFER] Save failed:', error);
                              throw error;
                            }
                          }}
                          disabled={manualSave.isSaving}
                          isDirty={unsavedChanges.isDirty(promptKey)}
                        />

                        <VoiceRecorder
                          onTranscriptComplete={(text: string) => {
                            const currentValue = getCurrentValue(promptKey) || '';
                            const newValue = currentValue ? `${currentValue}\n\n${text}` : text;
                            handleResponseChange(promptKey, newValue, section.title);
                          }}
                          questionContext={questionText}
                        />
                      </div>
                    </div>

                    {/* AI Coaching Response Display */}
                    {(() => {
                      const expandKey = `${section.title}-${questionText}-offer${offerNumber}`;
                      const coachingData = coachingResponses[expandKey];

                      if (!coachingData) return null;

                      return (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <Brain className="w-4 h-4 text-yellow-600 mr-2" />
                            <h4 className="font-medium text-yellow-800">AI Coach Suggestions</h4>
                          </div>

                          {coachingData.feedback && (
                            <p className="text-sm text-yellow-700 mb-3">{coachingData.feedback}</p>
                          )}

                          {coachingData.interactivePrompts && coachingData.interactivePrompts.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-yellow-800">Improved Versions:</h5>
                              {coachingData.interactivePrompts.map((prompt: string, index: number) => (
                                <div key={index} className="bg-white border border-yellow-200 rounded p-3">
                                  <p className="text-sm text-gray-700 mb-2">{prompt}</p>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const currentValue = getCurrentValue(promptKey) || '';
                                      const newValue = currentValue ? `${currentValue}\n\n${prompt}` : prompt;
                                      handleResponseChange(promptKey, newValue, section.title);
                                      toast({
                                        title: "Added to response!",
                                        description: "AI suggestion has been added to your response."
                                      });
                                    }}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                                  >
                                    Add This Version
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {coachingData.examples && coachingData.examples.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-yellow-800 mb-2">Examples:</h5>
                              <ul className="text-sm text-yellow-700 space-y-1">
                                {coachingData.examples.map((example: string, index: number) => (
                                  <li key={index} className="list-disc list-inside">{example}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCoachingResponses(prev => {
                                const updated = { ...prev };
                                delete updated[expandKey];
                                return updated;
                              });
                            }}
                            className="mt-3 text-xs"
                          >
                            Hide Suggestions
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Section Completion Card - positioned directly after each section */}
        {(() => {
          // Check for exact second offer completion match
          const isSecondOfferCompleted = completions.some(c => 
            c.sectionTitle === sectionTitle && 
            c.stepNumber === 2 &&
            c.userId === parseInt(userId) &&
            c.offerNumber === 2 // Explicitly check for offerNumber 2
          );

          console.log(`[COMPLETION RENDER] Section "${sectionTitle}": isCompleted=${isSecondOfferCompleted}, offerNumber=2, stepNumber=2`);

          return !isSecondOfferCompleted ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Complete {sectionTitle} Section</h3>
                <p className="text-green-700 mb-4">
                  {responseCount === totalQuestions 
                    ? "You've answered all questions in this section for your second offer. Mark it as complete to track your progress!"
                    : `You've answered ${responseCount} of ${totalQuestions} questions. You can mark this section as complete when you're ready to move on.`
                  }
                </p>
                <Button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    try {
                      console.log(`[MANUAL COMPLETE] Marking section complete:`, {
                        sectionTitle,
                        stepNumber: 2,
                        userId: parseInt(userId),
                        offerNumber: 2
                      });
                      await markSectionComplete.mutateAsync({
                        stepNumber: 2,
                        userId: parseInt(userId),
                        sectionTitle,
                        offerNumber: 2
                      });

                      // Force refresh of completions data
                      await queryClient.invalidateQueries({ queryKey: [`/api/section-completions/user/${parseInt(userId)}`] });

                      toast({
                        title: "Section Completed!",
                        description: `${sectionTitle} section marked as complete`,
                        duration: 3000,
                      });
                    } catch (error) {
                      console.error('[MANUAL COMPLETE] Failed to mark section complete:', error);
                      toast({
                        title: "Completion Failed",
                        description: "Failed to mark section as complete. Please try again.",
                        variant: "destructive",
                        duration: 4000,
                      });
                    }
                  }}
                  disabled={markSectionComplete.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {markSectionComplete.isPending ? 'Completing...' : `Complete ${sectionTitle} Section - Second Offer`}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="text-center py-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">{sectionTitle} Section Completed - Second Offer!</span>
                </div>
                <p className="text-green-600 text-sm mt-1">Great work! You can continue editing your responses if needed.</p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      try {
                        console.log(`[UNMARK COMPLETE] Unmarking section:`, {
                          sectionTitle,
                          stepNumber: 2,
                          userId: parseInt(userId),
                          offerNumber: 2
                        });
                        await unmarkSectionComplete.mutateAsync({
                          userId: parseInt(userId),
                          stepNumber: 2,
                          sectionTitle,
                          offerNumber: 2
                        });

                        // Force refresh of completions data
                        await queryClient.invalidateQueries({ queryKey: [`/api/section-completions/user/${parseInt(userId)}`] });

                        toast({
                          title: "Section Unmarked",
                          description: `${sectionTitle} section unmarked as complete`,
                          duration: 3000,
                        });
                      } catch (error) {
                        console.error('[UNMARK COMPLETE] Failed to unmark section:', error);
                        toast({
                          title: "Unmark Failed",
                          description: "Failed to unmark section. Please try again.",
                          variant: "destructive",
                          duration: 4000,
                        });
                      }
                    }}
                    disabled={unmarkSectionComplete.isPending}
                    className="text-sm"
                  >
                    {unmarkSectionComplete.isPending ? 'Unmarking...' : 'Unmark as Complete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    );
  })}


    </div>
  );
}
