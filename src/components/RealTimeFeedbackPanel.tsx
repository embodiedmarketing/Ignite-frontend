import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Sparkles,
  ThumbsUp,
  Brain,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { apiRequest } from "@/services/queryClient";

interface RealTimeFeedback {
  status: "typing" | "good-start" | "developing" | "strong";
  encouragement: string;
  suggestions?: string[];
  examples?: string[];
  rewording?: string;
  reasoning?: string;
  nextSteps?: string[];
}

interface RealTimeFeedbackPanelProps {
  question: string;
  userResponse: string;
  sectionContext?: string;
  debounceMs?: number;
  onAddRewording?: (rewording: string) => void;
}

export default function RealTimeFeedbackPanel({
  question,
  userResponse,
  sectionContext = "",
  debounceMs = 2000,
  onAddRewording,
}: RealTimeFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<RealTimeFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedResponseRef = useRef<string>("");
  const isInitialMountRef = useRef<boolean>(true);
  const previousResponseRef = useRef<string>("");

  // Debounced fetch feedback function
  const fetchFeedback = useCallback(
    async (response: string) => {
      // Don't fetch if response is too short or hasn't changed
      if (
        response.trim().length < 20 ||
        response === lastFetchedResponseRef.current
      ) {
        return;
      }

      lastFetchedResponseRef.current = response;
      setIsLoading(true);

      try {
        const result = await apiRequest(
          "POST",
          "/api/ai-coaching/real-time-feedback",
          {
            question,
            userResponse: response,
            sectionContext,
          }
        );

        // Parse the response if it's a Response object
        const data = result instanceof Response ? await result.json() : result;

        setFeedback(data);
      } catch (error) {
        console.error("[REAL-TIME FEEDBACK] Error fetching feedback:", error);
        // Set encouraging fallback feedback
        setFeedback({
          status: "good-start",
          encouragement:
            "You're on the right track! Keep developing your thoughts.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [question, sectionContext]
  );

  // Reset dismiss state and initial mount flag when question changes
  useEffect(() => {
    setIsDismissed(false);
    isInitialMountRef.current = true;
    previousResponseRef.current = "";
  }, [question]);

  // Debounce the feedback fetch when user types
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Skip on initial mount with existing content - only show feedback when user actively types
    if (isInitialMountRef.current && userResponse.trim().length > 0) {
      isInitialMountRef.current = false;
      previousResponseRef.current = userResponse;
      return;
    }

    // Mark that we're past the initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
    }

    // Only show feedback if the user has actually changed the text (active typing)
    const hasChanged = userResponse !== previousResponseRef.current;
    if (!hasChanged) {
      return;
    }

    previousResponseRef.current = userResponse;

    // If response is too short, show typing message
    if (userResponse.trim().length < 20) {
      setFeedback({
        status: "typing",
        encouragement: "Keep going! Share your thoughts...",
      });
      setIsLoading(false);
      return;
    }

    // Set new debounce timer - loading state will be set when API call actually starts
    debounceTimerRef.current = setTimeout(() => {
      setIsLoading(true);
      fetchFeedback(userResponse);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userResponse, fetchFeedback, debounceMs]);

  // Don't render anything if no response yet or if dismissed
  if (!userResponse || userResponse.trim().length === 0 || isDismissed) {
    return null;
  }

  // Get status icon and color
  const getStatusConfig = () => {
    if (!feedback)
      return { icon: Brain, color: "text-slate-400", bgColor: "bg-slate-50" };

    switch (feedback.status) {
      case "typing":
        return { icon: Brain, color: "text-blue-500", bgColor: "bg-blue-50" };
      case "good-start":
        return {
          icon: Lightbulb,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50",
        };
      case "developing":
        return {
          icon: Sparkles,
          color: "text-purple-500",
          bgColor: "bg-purple-50",
        };
      case "strong":
        return {
          icon: ThumbsUp,
          color: "text-green-500",
          bgColor: "bg-green-50",
        };
      default:
        return { icon: Brain, color: "text-slate-400", bgColor: "bg-slate-50" };
    }
  };

  const { icon: StatusIcon, color, bgColor } = getStatusConfig();

  return (
    <div className="mt-3 space-y-3">
      {/* Main Feedback Card */}
      <Alert className={`border-2 ${bgColor} border-opacity-50 relative`}>
        {/* Close button in top-right corner */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
          onClick={() => setIsDismissed(true)}
          data-testid="button-dismiss-feedback"
          title="Dismiss AI coaching feedback"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-start gap-3 pr-8">
          <StatusIcon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 space-y-3">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="italic">AI Coach is thinking...</span>
              </div>
            )}

            {/* Encouragement */}
            {feedback && !isLoading && (
              <AlertDescription>
                <p className="text-base font-medium text-slate-900 mb-3">
                  {feedback.encouragement}
                </p>

                {/* Suggestions */}
                {feedback.suggestions && feedback.suggestions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-sm font-semibold text-slate-700">
                      To deepen this further:
                    </p>
                    <ul className="space-y-2">
                      {feedback.suggestions.map((suggestion, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <ArrowRight className="w-4 h-4 text-embodied-coral flex-shrink-0 mt-0.5" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Examples */}
                {feedback.examples && feedback.examples.length > 0 && (
                  <div className="space-y-2 mb-3 p-3 bg-white/60 rounded-lg border border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-embodied-coral" />
                      Example:
                    </p>
                    {feedback.examples.map((example, idx) => (
                      <p
                        key={idx}
                        className="text-sm text-slate-700 italic pl-5"
                      >
                        "{example}"
                      </p>
                    ))}
                  </div>
                )}

                {/* Rewording Suggestion */}
                {feedback.rewording && (
                  <div className="p-3 bg-white/60 rounded-lg border border-embodied-coral/20 mb-3">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Consider this rewording:
                    </p>
                    <p className="text-sm text-slate-700 italic mb-3">
                      "{feedback.rewording}"
                    </p>
                    {onAddRewording && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs bg-embodied-coral/5 hover:bg-embodied-coral/10 border-embodied-coral/30 text-embodied-coral hover:text-embodied-coral"
                        onClick={() => onAddRewording(feedback.rewording!)}
                        data-testid="button-add-rewording"
                      >
                        Add this version
                      </Button>
                    )}
                  </div>
                )}

                {/* Reasoning */}
                {feedback.reasoning && (
                  <div className="text-sm text-slate-600 mb-3 p-2 bg-white/40 rounded italic">
                    💡 {feedback.reasoning}
                  </div>
                )}

                {/* Next Steps */}
                {feedback.nextSteps && feedback.nextSteps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    {feedback.nextSteps.map((step, idx) => (
                      <p
                        key={idx}
                        className="text-sm text-slate-700 font-medium"
                      >
                        {step}
                      </p>
                    ))}
                  </div>
                )}
              </AlertDescription>
            )}
          </div>
        </div>
      </Alert>

      {/* Subtle note about real-time coaching */}
      {feedback && feedback.status !== "typing" && !isLoading && (
        <p className="text-xs text-slate-500 text-center italic">
          🤝 Your AI Coach is here to help refine your thinking - keep editing
          and feedback updates live!
        </p>
      )}
    </div>
  );
}
