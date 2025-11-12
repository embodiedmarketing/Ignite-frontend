import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { 
  Lightbulb, 
  TrendingUp, 
  Heart, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Wand2,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface SalesPageInputFieldProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  userId: number;
  guidance?: string;
  examples?: string[];
}

interface CoachingResult {
  level: "needs-more-depth" | "good-foundation" | "high-converting";
  levelDescription: string;
  feedback: string;
  suggestions: string[];
  emotionalDepthScore: number;
  clarityScore: number;
  persuasionScore: number;
  improvements: string[];
  examples: string[];
}

export default function SalesPageInputField({
  fieldKey,
  label,
  value,
  onChange,
  placeholder,
  userId,
  guidance,
  examples = []
}: SalesPageInputFieldProps) {
  const [showCoaching, setShowCoaching] = useState(false);
  const [coaching, setCoaching] = useState<CoachingResult | null>(null);
  const [showImprovements, setShowImprovements] = useState(false);
  const { toast } = useToast();

  // Show coaching button when user has written substantial content
  const shouldShowCoaching = value.length > 20;

  // Get coaching from AI
  const coachingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/coach-sales-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionType: fieldKey,
          userInput: value,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get coaching');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCoaching(data);
      setShowCoaching(true);
    },
    onError: () => {
      toast({
        title: "Coaching Unavailable",
        description: "Unable to provide AI coaching right now. Try again later.",
        variant: "destructive"
      });
    }
  });

  // Get improved versions from AI
  const improvementMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/improve-sales-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionType: fieldKey,
          currentContent: value,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get improvements');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCoaching(prev => prev ? { ...prev, improvements: data.improvements } : null);
      setShowImprovements(true);
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "high-converting": return "border-green-500 bg-green-50";
      case "good-foundation": return "border-yellow-500 bg-yellow-50";
      default: return "border-red-500 bg-red-50";
    }
  };

  const useImprovement = (improvement: string) => {
    onChange(improvement);
    setShowImprovements(false);
    toast({
      title: "Content Updated",
      description: "Your content has been updated with the improved version."
    });
  };

  const copyImprovement = async (improvement: string) => {
    try {
      await navigator.clipboard.writeText(improvement);
      toast({
        title: "Copied!",
        description: "Improvement copied to clipboard."
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please select and copy manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
        
        {guidance && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 italic">{guidance}</p>
          </div>
        )}

        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] resize-y"
          spellCheck={true}
        />

        {examples.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-2">Examples:</p>
            <div className="space-y-1">
              {examples.map((example, idx) => (
                <p key={idx} className="text-xs text-slate-600 italic">
                  "{example}"
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Coaching Controls */}
      {shouldShowCoaching && (
        <div className="flex gap-2">
          <Button
            onClick={() => coachingMutation.mutate()}
            disabled={coachingMutation.isPending}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            {coachingMutation.isPending ? "Getting Coaching..." : "Get AI Coaching"}
          </Button>

          {coaching && (
            <Button
              onClick={() => improvementMutation.mutate()}
              disabled={improvementMutation.isPending}
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Wand2 className="w-4 h-4 mr-1" />
              {improvementMutation.isPending ? "Improving..." : "Get Better Versions"}
            </Button>
          )}
        </div>
      )}

      {/* AI Coaching Display */}
      {showCoaching && coaching && (
        <Card className={`border-2 ${getLevelColor(coaching.level)}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center">
                {coaching.level === "high-converting" && <CheckCircle className="w-4 h-4 mr-2 text-green-600" />}
                {coaching.level === "good-foundation" && <TrendingUp className="w-4 h-4 mr-2 text-yellow-600" />}
                {coaching.level === "needs-more-depth" && <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />}
                AI Coaching: {coaching.levelDescription}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCoaching(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Performance Scores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-lg font-bold ${getScoreColor(coaching.emotionalDepthScore)}`}>
                  {coaching.emotionalDepthScore}/5
                </div>
                <div className="text-xs text-slate-500">Emotional Depth</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getScoreColor(coaching.clarityScore)}`}>
                  {coaching.clarityScore}/5
                </div>
                <div className="text-xs text-slate-500">Clarity</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getScoreColor(coaching.persuasionScore)}`}>
                  {coaching.persuasionScore}/5
                </div>
                <div className="text-xs text-slate-500">Persuasion</div>
              </div>
            </div>

            {/* Feedback */}
            <Alert>
              <AlertDescription className="text-sm">
                {coaching.feedback}
              </AlertDescription>
            </Alert>

            {/* Suggestions */}
            {coaching.suggestions && Array.isArray(coaching.suggestions) && coaching.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">💡 Improvement Suggestions:</h4>
                <ul className="space-y-1">
                  {coaching.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Improvements Display */}
      {showImprovements && coaching?.improvements && Array.isArray(coaching.improvements) && coaching.improvements.length > 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center">
                <Wand2 className="w-4 h-4 mr-2 text-purple-600" />
                AI-Improved Versions
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImprovements(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(coaching.improvements && Array.isArray(coaching.improvements) ? coaching.improvements : []).map((improvement, idx) => (
              <div key={idx} className="p-3 bg-white border border-purple-200 rounded-lg">
                <p className="text-sm text-slate-700 mb-3">{improvement}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => useImprovement(improvement)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Use This Version
                  </Button>
                  <Button
                    onClick={() => copyImprovement(improvement)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
