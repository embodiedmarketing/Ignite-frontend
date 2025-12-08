import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Edit,
  Check,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Section {
  title: string;
  content: string;
  level: number; // 1 for #, 2 for ##, 3 for ###
}

interface SectionEvaluation {
  qualityScore: number;
  categoryScores: {
    clarity: { score: number; reasoning: string };
    specificity: { score: number; reasoning: string };
    emotionalResonance: { score: number; reasoning: string };
    alignment: { score: number; reasoning: string };
  };
  totalScore: number;
  strongPoints: string[];
  needsWork: string[];
  coachingFeedback: string;
  needsRewrite: boolean;
  alignmentIssues: string[];
}

interface SectionRewrite {
  rewrittenContent: string;
  rationale: string;
  improvements: string[];
}

interface CoreOfferOutlineSectionEditorProps {
  outline: string;
  mainTransformation: string;
  onUpdate: (newOutline: string) => void;
  offerType?: "core" | "tripwire";
}

export default function CoreOfferOutlineSectionEditor({
  outline,
  mainTransformation,
  onUpdate,
  offerType = "core",
}: CoreOfferOutlineSectionEditorProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [sectionEvaluations, setSectionEvaluations] = useState<
    Record<number, SectionEvaluation>
  >({});
  const [sectionRewrites, setSectionRewrites] = useState<
    Record<number, SectionRewrite>
  >({});
  const [evaluatingSection, setEvaluatingSection] = useState<number | null>(
    null
  );
  const [rewritingSection, setRewritingSection] = useState<number | null>(null);
  const [showingRewriteFor, setShowingRewriteFor] = useState<number | null>(
    null
  );

  // Helper function to check if a section should show AI evaluation and suggestions
  const shouldShowAIFeatures = (sectionTitle: string): boolean => {
    const aiEnabledSections = [
      "PURPOSE & POSITIONING",
      "TARGET AUDIENCE",
      "STRUCTURE & COMPONENTS",
      "PROOF & AUTHORITY",
    ];

    // Normalize section title for comparison (remove emojis and extra spaces)
    const normalizedTitle = sectionTitle
      .replace(/\d\uFE0F?\u20E3/gu, "") // Remove keycap emojis
      .replace(
        /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\uFE00-\uFE0F]|[\u{1F1E6}-\u{1F1FF}]/gu,
        ""
      ) // Remove other emojis
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

    return aiEnabledSections.some((title) => normalizedTitle.includes(title));
  };

  // Parse outline into sections on mount or when outline changes
  useEffect(() => {
    const parsedSections = parseOutlineIntoSections(outline);
    setSections(parsedSections);

    // Clear stale evaluations and rewrites when outline changes
    setSectionEvaluations({});
    setSectionRewrites({});
  }, [outline]);

  // Parse markdown outline into sections
  const parseOutlineIntoSections = (text: string): Section[] => {
    const lines = text.split("\n");
    const parsedSections: Section[] = [];
    let currentSection: Section | null = null;

    lines.forEach((line) => {
      const h1Match = line.match(/^#\s+(.+)/);
      const h2Match = line.match(/^##\s+(.+)/);
      const h3Match = line.match(/^###\s+(.+)/);

      if (h1Match || h2Match || h3Match) {
        // Save previous section if exists
        if (currentSection) {
          parsedSections.push(currentSection);
        }

        // Start new section
        const title = (h1Match || h2Match || h3Match)![1];
        const level = h1Match ? 1 : h2Match ? 2 : 3;
        currentSection = { title, content: "", level };
      } else if (currentSection) {
        // Add line to current section content
        currentSection.content += line + "\n";
      }
    });

    // Add final section
    if (currentSection) {
      parsedSections.push(currentSection);
    }

    return parsedSections;
  };

  // Reconstruct outline from sections
  const reconstructOutline = (updatedSections: Section[]): string => {
    return updatedSections
      .map((section) => {
        const hashes = "#".repeat(section.level);
        return `${hashes} ${section.title}\n${section.content}`;
      })
      .join("\n");
  };

  // Evaluate section mutation
  const evaluateSectionMutation = useMutation({
    mutationFn: async ({
      sectionIndex,
      sectionTitle,
      sectionContent,
    }: {
      sectionIndex: number;
      sectionTitle: string;
      sectionContent: string;
    }) => {
      const endpoint =
        offerType === "tripwire"
          ? "/api/tripwire-outline/evaluate-section"
          : "/api/core-offer-outline/evaluate-section";

      const bodyKey =
        offerType === "tripwire" ? "mainOffer" : "mainTransformation";

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sectionTitle,
            sectionContent: sectionContent.trim(),
            [bodyKey]: mainTransformation,
            fullOutline: outline,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to evaluate section");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setSectionEvaluations((prev) => ({
        ...prev,
        [variables.sectionIndex]: data,
      }));
      setEvaluatingSection(null);
    },
    onError: (error) => {
      console.error("Evaluation error:", error);
      setEvaluatingSection(null);
      toast({
        title: "Evaluation failed",
        description: "Could not evaluate section. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Rewrite section mutation
  const rewriteSectionMutation = useMutation({
    mutationFn: async ({
      sectionIndex,
      sectionTitle,
      sectionContent,
      specificIssues,
    }: {
      sectionIndex: number;
      sectionTitle: string;
      sectionContent: string;
      specificIssues: string[];
    }) => {
      const endpoint =
        offerType === "tripwire"
          ? "/api/tripwire-outline/rewrite-section"
          : "/api/core-offer-outline/rewrite-section";

      const bodyKey =
        offerType === "tripwire" ? "mainOffer" : "mainTransformation";

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sectionTitle,
            sectionContent: sectionContent.trim(),
            [bodyKey]: mainTransformation,
            specificIssues,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to rewrite section");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Clean up rewritten content - remove section heading if AI included it despite instructions
      const section = sections[variables.sectionIndex];
      let cleanedContent = data.rewrittenContent;

      if (cleanedContent && section) {
        // Extract just the section title text without emoji/number
        const titleText = section.title.replace(/^\d+[️⃣]?\s*/, "").trim();

        // Remove various section heading patterns
        const headingPatterns = [
          // With markdown heading and full title
          new RegExp(
            `^##?\\s*${section.title.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*[\\r\\n]+`,
            "im"
          ),
          // With markdown heading and title without emoji
          new RegExp(
            `^##?\\s*${titleText.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*[\\r\\n]+`,
            "im"
          ),
          // Full title without markdown
          new RegExp(
            `^${section.title.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*[\\r\\n]+`,
            "im"
          ),
          // Title without emoji/number
          new RegExp(
            `^${titleText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[\\r\\n]+`,
            "im"
          ),
          // "Section Title:" prefix variations
          new RegExp(
            `^Section Title:\\s*${section.title.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*[\\r\\n]+`,
            "im"
          ),
          new RegExp(
            `^Section Title:\\s*${titleText.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*[\\r\\n]+`,
            "im"
          ),
          // Just the emoji and number at the start
          new RegExp(
            `^\\d+[️⃣]?\\s*${titleText.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*[\\r\\n]+`,
            "im"
          ),
          // Markdown bold variations
          new RegExp(
            `^\\*\\*${section.title.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\*\\*\\s*[\\r\\n]+`,
            "im"
          ),
          new RegExp(
            `^\\*\\*${titleText.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\*\\*\\s*[\\r\\n]+`,
            "im"
          ),
        ];

        // Apply all patterns
        for (const pattern of headingPatterns) {
          cleanedContent = cleanedContent.replace(pattern, "");
        }

        // Clean up any leading/trailing whitespace while preserving internal formatting
        cleanedContent = cleanedContent.trim();
      }

      setSectionRewrites((prev) => ({
        ...prev,
        [variables.sectionIndex]: {
          ...data,
          rewrittenContent: cleanedContent,
        },
      }));
      setRewritingSection(null);
    },
    onError: (error) => {
      console.error("Rewrite error:", error);
      setRewritingSection(null);
      toast({
        title: "Rewrite failed",
        description: "Could not rewrite section. Please try again.",
        variant: "destructive",
      });
    },
  });

  const evaluateSection = (
    sectionIndex: number,
    sectionsToEvaluate: Section[] = sections
  ) => {
    const section = sectionsToEvaluate[sectionIndex];
    if (!section || !section.content.trim()) return;

    setEvaluatingSection(sectionIndex);
    evaluateSectionMutation.mutate({
      sectionIndex,
      sectionTitle: section.title,
      sectionContent: section.content,
    });
  };

  const requestRewrite = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    const evaluation = sectionEvaluations[sectionIndex];
    if (!section || !evaluation) return;

    const specificIssues = [
      ...evaluation.needsWork,
      ...evaluation.alignmentIssues,
    ];

    setRewritingSection(sectionIndex);
    rewriteSectionMutation.mutate({
      sectionIndex,
      sectionTitle: section.title,
      sectionContent: section.content,
      specificIssues,
    });
  };

  const handleStartEdit = (sectionIndex: number) => {
    setEditingSection(sectionIndex);
    setEditedContent(sections[sectionIndex].content);
    // Clear previous rewrite when starting to edit
    setSectionRewrites((prev) => {
      const next = { ...prev };
      delete next[sectionIndex];
      return next;
    });
    // Clear the showing rewrite state
    setShowingRewriteFor(null);
  };

  const handleSaveEdit = (sectionIndex: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      content: editedContent,
    };
    setSections(updatedSections);

    const newOutline = reconstructOutline(updatedSections);
    onUpdate(newOutline);

    setEditingSection(null);
    setEditedContent("");

    toast({
      title: "Section updated",
      description: "Your changes have been saved.",
    });
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditedContent("");
  };

  const handleAcceptRewrite = (sectionIndex: number) => {
    const rewrite = sectionRewrites[sectionIndex];
    if (!rewrite) return;

    const updatedSections = [...sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      content: rewrite.rewrittenContent,
    };
    setSections(updatedSections);

    const newOutline = reconstructOutline(updatedSections);
    onUpdate(newOutline);

    // Clear the rewrite and re-evaluate
    setSectionRewrites((prev) => {
      const next = { ...prev };
      delete next[sectionIndex];
      return next;
    });

    // Clear the showing rewrite state
    setShowingRewriteFor(null);

    evaluateSection(sectionIndex, updatedSections);

    toast({
      title: "Rewrite accepted",
      description: "Section updated and re-evaluating...",
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 4) return "bg-green-50 border-green-200";
    if (score >= 3) return "bg-yellow-50 border-yellow-200";
    return "bg-orange-50 border-orange-200";
  };

  // Helper function to render text with formatting (bold, bullets, etc.)
  const renderTextWithBold = (text: string) => {
    if (!text) return null;

    return text.split("\n").map((line, lineIdx) => {
      // Skip separator lines
      if (line.trim().match(/^[-_]{3,}$/)) {
        return null;
      }

      // Handle bold lines (full line bold)
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={lineIdx} className="font-bold my-0.5">
            {line.slice(2, -2)}
          </p>
        );
      }

      // Handle lines with inline bold text
      if (line.includes("**")) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={lineIdx} className="my-0.5">
            {parts.map((part, partIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      }

      // Handle bullet points
      if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        return (
          <p key={lineIdx} className="ml-4 my-0.5">
            {line}
          </p>
        );
      }

      // Handle empty lines
      if (!line.trim()) {
        return (
          <p key={lineIdx} className="my-0.5">
            \u00A0
          </p>
        );
      }

      // Regular text
      return (
        <p key={lineIdx} className="my-0.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-3">
      {sections.map((section, index) => {
        // Skip the main heading section - it's just a title
        if (
          section.title === "CORE OFFER OUTLINE" ||
          (section.level === 1 && section.content.trim().length < 10)
        ) {
          return null;
        }

        const evaluation = sectionEvaluations[index];
        const rewrite = sectionRewrites[index];
        const isEditing = editingSection === index;
        const isEvaluating = evaluatingSection === index;
        const isRewriting = rewritingSection === index;

        return (
          <Card key={index} className="p-4 border">
            {/* Section Header - Hidden when showing rewrite */}
            {showingRewriteFor !== index && (
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3
                    className={`font-bold ${
                      section.level === 1
                        ? "text-xl"
                        : section.level === 2
                        ? "text-lg"
                        : "text-base"
                    } text-slate-900 mb-1`}
                  >
                    {section.title}
                  </h3>

                  {/* Quality Score Badge - Only show for AI-enabled sections */}
                  {evaluation &&
                    !isEditing &&
                    shouldShowAIFeatures(section.title) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs ${getScoreBgColor(
                            evaluation.totalScore / 4
                          )}`}
                        >
                          <span className="font-semibold">
                            Quality: {evaluation.totalScore}/20
                          </span>
                        </div>
                        {evaluation.needsRewrite && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300">
                            <AlertCircle className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-700">
                              Needs Improvement
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* Action Buttons */}
                {!isEditing && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartEdit(index)}
                      disabled={isEvaluating || isRewriting}
                      className="bg-[#f5a89f] hover:bg-[#f39084] text-white"
                      data-testid={`button-edit-section-${index}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Section Content or Editor */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  data-testid={`textarea-edit-section-${index}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(index)}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid={`button-save-section-${index}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Save & Re-evaluate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    data-testid={`button-cancel-edit-${index}`}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : showingRewriteFor !== index ? (
              <div className="prose max-w-none text-slate-700 mb-2">
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {section.content.split("\n").map((line, lineIdx) => {
                    // Skip separator lines (---, ___, etc.)
                    if (line.trim().match(/^[-_]{3,}$/)) {
                      return null;
                    }

                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <p key={lineIdx} className="font-bold my-0.5">
                          {line.slice(2, -2)}
                        </p>
                      );
                    } else if (line.includes("**")) {
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={lineIdx} className="my-0.5">
                          {parts.map((part, partIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return (
                                <strong key={partIdx}>
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    } else if (line.trim().startsWith("-")) {
                      return (
                        <p key={lineIdx} className="ml-4 my-0.5">
                          {line}
                        </p>
                      );
                    }
                    return (
                      <p key={lineIdx} className="my-0.5">
                        {line || "\u00A0"}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Evaluation Results - Only show for AI-enabled sections and when not showing rewrite */}
            {evaluation &&
              !isEditing &&
              shouldShowAIFeatures(section.title) &&
              showingRewriteFor !== index && (
                <div className="space-y-2.5 mt-2 pt-2 border-t">
                  {isEvaluating && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Re-evaluating...</span>
                    </div>
                  )}

                  {/* Category Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(evaluation.categoryScores).map(
                      ([category, data]) => (
                        <div
                          key={category}
                          className={`p-2 rounded border ${getScoreBgColor(
                            data.score
                          )}`}
                        >
                          <div className="text-xs font-medium text-slate-600 capitalize">
                            {category}
                          </div>
                          <div
                            className={`text-base font-bold ${getScoreColor(
                              data.score
                            )}`}
                          >
                            {data.score}/5
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Strong Points */}
                  {evaluation.strongPoints.length > 0 && (
                    <div className="bg-green-50 p-2.5 rounded border border-green-200">
                      <h4 className="font-medium text-green-900 mb-1.5 flex items-center text-xs">
                        <span className="mr-1.5">✅</span> Strong
                      </h4>
                      <ul className="space-y-0.5">
                        {evaluation.strongPoints.map((point, idx) => (
                          <li key={idx} className="text-xs text-green-800">
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Needs Work */}
                  {evaluation.needsWork.length > 0 && (
                    <div className="bg-orange-50 p-2.5 rounded border border-orange-200">
                      <h4 className="font-medium text-orange-900 mb-1.5 flex items-center text-xs">
                        <span className="mr-1.5">⚡</span> Needs Work
                      </h4>
                      <ul className="space-y-0.5">
                        {evaluation.needsWork.map((point, idx) => (
                          <li key={idx} className="text-xs text-orange-800">
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Alignment Issues */}
                  {evaluation.alignmentIssues &&
                    evaluation.alignmentIssues.length > 0 && (
                      <div className="bg-red-50 p-2.5 rounded border border-red-200">
                        <h4 className="font-medium text-red-900 mb-1.5 flex items-center text-xs">
                          <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                          Alignment Issues
                        </h4>
                        <ul className="space-y-0.5">
                          {evaluation.alignmentIssues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-red-800">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Coaching Feedback */}
                  {evaluation.coachingFeedback && (
                    <div className="bg-blue-50 p-2.5 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-1.5 flex items-center text-xs">
                        <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                        AI Coach Feedback
                      </h4>
                      <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">
                        {evaluation.coachingFeedback}
                      </p>
                    </div>
                  )}

                  {/* Rewrite Section - Always show for AI-enabled sections */}
                  {shouldShowAIFeatures(section.title) &&
                    !rewrite &&
                    section.title !== "CORE OFFER OUTLINE" &&
                    section.level !== 1 && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          const scrollY = window.scrollY;
                          requestRewrite(index);
                          setShowingRewriteFor(index);
                          // Maintain scroll position
                          requestAnimationFrame(() => {
                            window.scrollTo(0, scrollY);
                          });
                        }}
                        disabled={isRewriting}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        data-testid={`button-rewrite-section-${index}`}
                      >
                        {isRewriting ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Generating Rewrite...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-2" />
                            Get AI Rewrite Suggestion
                          </>
                        )}
                      </Button>
                    )}

                  {/* Rewrite Suggestion - Skip for heading sections */}
                  {rewrite &&
                    section.title !== "CORE OFFER OUTLINE" &&
                    section.level !== 1 && (
                      <div className="space-y-2">
                        {/* AI Rewrite Suggestion */}
                        <div className="bg-purple-50 p-2.5 rounded border border-purple-300 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-purple-900 flex items-center text-xs">
                              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                              AI Rewrite Suggestion
                            </h4>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRewrite(index)}
                              className="bg-purple-600 hover:bg-purple-700 h-7 text-xs"
                              data-testid={`button-accept-rewrite-${index}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accept
                            </Button>
                          </div>

                          <div className="bg-white p-2 rounded border border-purple-200">
                            <div className="text-xs text-slate-800 whitespace-pre-wrap">
                              {renderTextWithBold(rewrite.rewrittenContent)}
                            </div>
                          </div>

                          <div className="text-xs text-purple-800">
                            <p className="font-medium mb-0.5">
                              Why this works better:
                            </p>
                            <p className="italic text-xs">
                              {rewrite.rationale}
                            </p>
                          </div>

                          {rewrite.improvements?.length > 0 && (
                            <div className="text-xs">
                              <p className="font-medium text-purple-900 mb-0.5">
                                Key Improvements:
                              </p>
                              <ul className="space-y-0.5">
                                {rewrite.improvements.map((imp, idx) => (
                                  <li
                                    key={idx}
                                    className="text-purple-800 text-xs"
                                  >
                                    ✓ {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
          </Card>
        );
      })}
    </div>
  );
}
