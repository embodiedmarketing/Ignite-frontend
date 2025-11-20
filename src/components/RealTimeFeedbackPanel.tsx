import { useState, useEffect, useCallback, useRef } from "react";
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
  timestamp?: string;
}

interface RealTimeFeedbackPanelProps {
  question: string;
  userResponse: string;
  sectionContext?: string;
  onAddRewording?: (rewording: string) => void;
}

export default function RealTimeFeedbackPanel({
  question,
  userResponse,
  sectionContext = "",
  onAddRewording,
}: RealTimeFeedbackPanelProps) {
  const [feedback, setFeedback] = useState<RealTimeFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastFetchedResponseRef = useRef<string>("");

  const fetchFeedback = useCallback(async () => {
    if (userResponse.trim().length < 20) {
      return;
    }

    lastFetchedResponseRef.current = userResponse;
    setIsLoading(true);
    setIsDismissed(false);

    try {
      const result = await apiRequest(
        "POST",
        "/api/ai-coaching/real-time-feedback",
        {
          question,
          userResponse,
          sectionContext,
        }
      );

      const data = result instanceof Response ? await result.json() : result;

      setFeedback({
        ...data,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (error) {
      console.error("[AI COACH FEEDBACK] Error fetching feedback:", error);
      setFeedback({
        status: "good-start",
        encouragement:
          "You're on the right track! Keep developing your thoughts.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [question, userResponse, sectionContext]);

  useEffect(() => {
    setIsDismissed(false);
    setFeedback(null);
  }, [question]);

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

  const canGetFeedback = userResponse && userResponse.trim().length >= 20;
  const hasChanged = userResponse !== lastFetchedResponseRef.current;

  return (
    <div className="mt-3 space-y-3">
      {canGetFeedback && (
        <Button
          onClick={fetchFeedback}
          disabled={isLoading}
          variant="outline"
          className="w-full bg-embodied-blue/5 hover:bg-embodied-blue/10 border-embodied-blue/30 text-embodied-blue hover:text-embodied-blue disabled:opacity-50"
          data-testid="button-get-ai-feedback"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI Coach is thinking...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Get AI Coach Feedback
            </>
          )}
        </Button>
      )}

      {!canGetFeedback && userResponse && userResponse.trim().length > 0 && (
        <p className="text-xs text-slate-500 text-center italic">
          Write at least 20 characters to get AI coaching feedback
        </p>
      )}

      {feedback && !isDismissed && (
        <Alert className={`border-2 ${bgColor} border-opacity-50 relative`}>
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
              {!isLoading && (
                <AlertDescription>
                  {feedback.timestamp && (
                    <p className="text-xs text-slate-500 mb-2">
                      Last refreshed: {feedback.timestamp}
                    </p>
                  )}

                  <p className="text-base font-medium text-slate-900 mb-3">
                    {feedback.encouragement}
                  </p>

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

                  {feedback.reasoning && (
                    <div className="text-sm text-slate-600 mb-3 p-2 bg-white/40 rounded italic">
                      💡 {feedback.reasoning}
                    </div>
                  )}

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
      )}

      {feedback && !isDismissed && hasChanged && (
        <p className="text-xs text-slate-500 text-center italic">
          💡 Your answer has changed. Click "Get AI Coach Feedback" again for
          updated suggestions.
        </p>
      )}
    </div>
  );
}
