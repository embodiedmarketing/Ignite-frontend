import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Brain } from "lucide-react";
import { apiRequest } from "@/services/queryClient";

interface TestResult {
  originalQuestion: string;
  interviewData: string;
  existingResponse: string;
  synthesizedResponse: string;
  wasImproved: boolean;
  removedRepetition: boolean;
}

export default function InterviewStrategyTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sample test data that simulates real interview responses
  const testData = {
    interviewInsights: {
      frustrations:
        "I'm so tired of trying different marketing strategies that just don't work. I've spent thousands on Facebook ads, tried LinkedIn outreach, even hired a marketing agency, but nothing seems to bring in quality leads. It's incredibly frustrating to put in all this effort and see minimal results.",
      secretFears:
        "My biggest fear is that I'm not cut out for entrepreneurship. Sometimes I lie awake at 3 AM wondering if I'm just fooling myself and I should go back to a corporate job. I'm scared that my family thinks I'm wasting time and money on this 'pipe dream.'",
      perfectDay:
        "I would wake up to emails from potential clients who found me through word-of-mouth referrals. My calendar would be full of discovery calls with people who are excited to work with me. I'd spend my day doing the work I love instead of constantly trying to figure out marketing.",
      failedSolutions:
        "I've tried everything - Facebook ads (burned through $5K with poor results), cold emailing (got marked as spam), networking events (felt awkward and pushy), content marketing (no one engaged), and even hired a $3K/month marketing consultant who didn't understand my business.",
      obstacles:
        "I don't have a marketing background, so I'm always second-guessing myself. I also don't have a big budget for trial and error. Plus, I feel like I'm speaking a different language than my potential customers - what matters to me doesn't seem to resonate with them.",
    },
    existingResponses: {
      "What is your ideal customer's biggest frustration?":
        "They struggle with marketing and getting clients.",
      "What are their deepest fears and anxieties about their situation?": "",
      "If they could wave a magic wand, what would their perfect day look like?":
        "They would have more clients and less stress about marketing.",
      "What solutions have they already tried that didn't work?":
        "Various marketing tactics",
      "What's blocking them from solving this themselves?":
        "Lack of knowledge and budget constraints",
    },
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestResults([]);

    try {
      // Test the comprehensive interview-to-strategy synthesis
      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/synthesize-interviews-to-strategy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            allInterviewInsights: testData.interviewInsights,
            existingResponses: testData.existingResponses,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { synthesizedStrategy } = await response.json();
      const results: TestResult[] = [];

      // Analyze each result
      Object.entries(testData.existingResponses).forEach(
        ([question, existing]) => {
          const synthesized = synthesizedStrategy[question] || "";
          const interviewKey = getRelevantInterviewKey(question);
          const interviewData =
            testData.interviewInsights[
              interviewKey as keyof typeof testData.interviewInsights
            ] || "";

          results.push({
            originalQuestion: question,
            interviewData,
            existingResponse: existing,
            synthesizedResponse: synthesized,
            wasImproved:
              synthesized.length > existing.length && synthesized !== existing,
            removedRepetition: !hasRepetition(
              synthesized,
              existing,
              interviewData
            ),
          });
        }
      );

      setTestResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setIsRunning(false);
    }
  };

  const getRelevantInterviewKey = (question: string): string => {
    if (question.includes("biggest frustration")) return "frustrations";
    if (question.includes("deepest fears")) return "secretFears";
    if (question.includes("magic wand")) return "perfectDay";
    if (question.includes("already tried")) return "failedSolutions";
    if (question.includes("blocking them")) return "obstacles";
    return "";
  };

  const hasRepetition = (
    synthesized: string,
    existing: string,
    interview: string
  ): boolean => {
    // Simple check for obvious repetition
    const words = [
      ...existing.toLowerCase().split(/\s+/),
      ...interview.toLowerCase().split(/\s+/),
    ];
    const uniqueWords = new Set(words);
    const synthesizedWords = synthesized.toLowerCase().split(/\s+/);

    // Check if synthesized text has redundant phrases
    const redundantPhrases = synthesizedWords.filter(
      (word) => words.filter((w) => w === word).length > 1
    );

    return redundantPhrases.length > words.length * 0.3; // More than 30% redundancy
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-500" />
            Interview-to-Strategy Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-slate-600">
              This test verifies that interview responses intelligently merge
              into messaging strategy questions without repetition and with
              meaningful enhancement.
            </p>

            <Button
              onClick={runComprehensiveTest}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? "Running Test..." : "Test Interview Integration"}
            </Button>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>

          {testResults.map((result, index) => (
            <Card
              key={index}
              className={`border-l-4 ${
                result.wasImproved && result.removedRepetition
                  ? "border-green-500 bg-green-50"
                  : result.wasImproved
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-red-500 bg-red-50"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  {result.wasImproved && result.removedRepetition ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" />
                  )}
                  {result.originalQuestion}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">
                    Original Response:
                  </p>
                  <p className="text-sm bg-slate-100 p-2 rounded">
                    {result.existingResponse || "(Empty)"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">
                    Interview Data:
                  </p>
                  <p className="text-sm bg-blue-50 p-2 rounded">
                    {result.interviewData
                      ? result.interviewData.substring(0, 200) + "..."
                      : "(No relevant data)"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">
                    Synthesized Result:
                  </p>
                  <p className="text-sm bg-white p-2 rounded border">
                    {result.synthesizedResponse}
                  </p>
                </div>

                <div className="flex space-x-4 text-xs">
                  <span
                    className={`px-2 py-1 rounded ${
                      result.wasImproved
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.wasImproved ? "✓ Enhanced" : "✗ Not Improved"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${
                      result.removedRepetition
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.removedRepetition
                      ? "✓ No Repetition"
                      : "✗ Has Repetition"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
