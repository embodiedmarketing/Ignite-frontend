import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Lightbulb, 
  Wand2, 
  Users, 
  Target, 
  MessageCircle,
  Calendar,
  TrendingUp,
  Loader2,
  CheckCircle,
  Share2,
  Clock,
  ArrowRight,
  Save,
  Upload,
  Copy,
  FileDown,
  FileType,
  Edit3
} from "lucide-react";
import { apiRequest, queryClient } from "@/services/queryClient";
import { MessagingStrategy } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { validateAndNotify } from "@/utils/prerequisite-validator";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const contentPreferencesSchema = z.object({
  // Platform and format preferences
  postingFrequency: z.string().min(1, "Select your posting frequency"),
  corePlatform: z.string().min(1, "Select your core platform"),
  contentFormat: z.string().min(1, "Select your content format"),
  
  // Strategic content questions
  desiredFeelings: z.string().min(10, "Describe how you want people to feel (at least 10 characters)"),
  avoidFeelings: z.string().min(5, "Describe what you don't want people to feel"),
  brandAdjectives: z.string().min(10, "List 3-5 brand adjectives"),
  coreThemes: z.string().min(20, "Describe 3-4 core themes your audience needs to understand"),
  problemsMyths: z.string().min(20, "Describe common problems, mistakes, or myths to address"),
  valuesBeliefs: z.string().min(15, "Describe values or beliefs to consistently reinforce"),
  contrarianTakes: z.string().min(20, "Describe 3-5 contrarian or disruptive takes"),
  actionableTips: z.string().min(15, "Provide quick tips, tools, or frameworks"),
  commonObjections: z.string().min(15, "Describe common questions or objections"),
  beliefShifts: z.string().min(20, "Describe belief shifts your audience needs to make"),
  authenticTruths: z.string().min(20, "Share a truth you want to shout from the rooftops"),
  keyMessage: z.string().min(15, "What's the one thing you want your audience to remember?"),
  authenticVoice: z.string().min(15, "How can you say this authentically?")
});

type ContentPreferences = z.infer<typeof contentPreferencesSchema>;

interface ContentPillar {
  name: string;
  explanation: string;
  connectionToOffer: string;
}

interface GeneratedContentStrategy {
  corePlatform: string;
  postingFrequency: string;
  contentFormat: string;
  contentGoals: string[];
  emotionalToneSummary: string;
  brandVibe: string;
  contentPillars: ContentPillar[];
  disruptiveAngles: string[];
  voiceAuthenticityGuide: string[];
  recommendations: string[];
  missingInformation: string[];
  completeness: number;
}

interface ContentIdea {
  title: string;
  coreMessage: string;
  format: string;
  emotionalIntention: string;
  callToAction: string;
  category: 'contrarian' | 'emotional' | 'practical' | 'rooftop' | 'objection';
}

const platforms = [
  "LinkedIn", "Instagram", "Twitter/X", "Facebook", "TikTok", "YouTube", "Pinterest", "Blog/Website"
];

const contentTypes = [
  "Text Posts", "Videos", "Images/Graphics", "Stories", "Carousels", "Reels", "Podcasts", "Live Streams", "Infographics", "Blog Articles"
];

const postingFrequencies = [
  "7 times per week", "6 times per week", "5 times per week", "4 times per week", "3 times per week", "2 times per week", "1 time per week"
];

const contentFormats = [
  "Podcast", "YouTube", "Social video series", "Blog/Newsletter", "Live streams", "Instagram Reels/TikTok", "LinkedIn articles", "Twitter threads"
];

export default function ContentPillarGenerator() {
  const [showResults, setShowResults] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedContentStrategy | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [showContentIdeas, setShowContentIdeas] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedStrategy, setEditedStrategy] = useState<GeneratedContentStrategy | null>(null);
  const [editedIdeas, setEditedIdeas] = useState<ContentIdea[]>([]);
  const { toast } = useToast();

  const form = useForm<ContentPreferences>({
    resolver: zodResolver(contentPreferencesSchema),
    defaultValues: {
      postingFrequency: "",
      corePlatform: "",
      contentFormat: "",
      desiredFeelings: "",
      avoidFeelings: "",
      brandAdjectives: "",
      coreThemes: "",
      problemsMyths: "",
      valuesBeliefs: "",
      contrarianTakes: "",
      actionableTips: "",
      commonObjections: "",
      beliefShifts: "",
      authenticTruths: "",
      keyMessage: "",
      authenticVoice: ""
    }
  });

  // Fetch current user
  const { data: user } = useQuery<{ id: number }>({
    queryKey: ['/api/auth/user'],
    staleTime: Infinity
  });

  const userId = user?.id;

  // Fetch user's active messaging strategy for context
  const { data: messagingStrategy, refetch: refetchMessagingStrategy } = useQuery<MessagingStrategy | null>({
    queryKey: ['/api/messaging-strategies/active'],
    enabled: true
  });

  // Fetch saved content strategy responses
  const { data: savedResponses } = useQuery<any>({
    queryKey: ['/api/content-strategy/preferences', userId],
    enabled: !!userId,
    staleTime: 30000
  });

  // Fetch saved generated strategy and ideas
  const { data: savedGeneratedStrategy } = useQuery<any>({
    queryKey: ['/api/content-strategy/active', userId],
    enabled: !!userId,
    staleTime: 30000
  });

  // Load saved responses from localStorage or database
  useEffect(() => {
    if (!userId) return;

    const STORAGE_KEY = `content-strategy-responses-${userId}`;
    const INSIGHTS_KEY = `latest-transcript-insights-${userId}`;
    
    // Helper function to map extracted insights to form fields
    const mapInsightsToForm = (insights: any): Partial<ContentPreferences> => {
      if (!insights || typeof insights !== 'object') return {};
      
      const mapped: Partial<ContentPreferences> = {};
      
      // Map common field names from extracted insights
      // These mappings may need adjustment based on actual API response structure
      if (insights.desiredFeelings) mapped.desiredFeelings = String(insights.desiredFeelings);
      if (insights.avoidFeelings) mapped.avoidFeelings = String(insights.avoidFeelings);
      if (insights.brandAdjectives) mapped.brandAdjectives = String(insights.brandAdjectives);
      if (insights.coreThemes) mapped.coreThemes = String(insights.coreThemes);
      if (insights.problemsMyths) mapped.problemsMyths = String(insights.problemsMyths);
      if (insights.valuesBeliefs) mapped.valuesBeliefs = String(insights.valuesBeliefs);
      if (insights.contrarianTakes) mapped.contrarianTakes = String(insights.contrarianTakes);
      if (insights.actionableTips) mapped.actionableTips = String(insights.actionableTips);
      if (insights.commonObjections) mapped.commonObjections = String(insights.commonObjections);
      if (insights.beliefShifts) mapped.beliefShifts = String(insights.beliefShifts);
      if (insights.authenticTruths) mapped.authenticTruths = String(insights.authenticTruths);
      if (insights.keyMessage) mapped.keyMessage = String(insights.keyMessage);
      if (insights.authenticVoice) mapped.authenticVoice = String(insights.authenticVoice);
      
      return mapped;
    };
    
    // Check for latest transcript insights first (highest priority)
    const insightsData = localStorage.getItem(INSIGHTS_KEY);
    if (insightsData) {
      try {
        const parsed = JSON.parse(insightsData);
        if (parsed.extractedInsights) {
          const insightsMapping = mapInsightsToForm(parsed.extractedInsights);
          
          // Get existing form data
          const STORAGE_KEY = `content-strategy-responses-${userId}`;
          const existingData = localStorage.getItem(STORAGE_KEY);
          let formData: ContentPreferences;
          
          if (existingData) {
            try {
              formData = JSON.parse(existingData);
            } catch {
              formData = form.getValues();
            }
          } else if (savedResponses) {
            formData = {
              postingFrequency: savedResponses.postingFrequency || "",
              corePlatform: savedResponses.corePlatform || "",
              contentFormat: savedResponses.contentFormat || "",
              desiredFeelings: savedResponses.desiredFeelings || "",
              avoidFeelings: savedResponses.avoidFeelings || "",
              brandAdjectives: savedResponses.brandAdjectives || "",
              coreThemes: savedResponses.coreThemes || "",
              problemsMyths: savedResponses.problemsMyths || "",
              valuesBeliefs: savedResponses.valuesBeliefs || "",
              contrarianTakes: savedResponses.contrarianTakes || "",
              actionableTips: savedResponses.actionableTips || "",
              commonObjections: savedResponses.commonObjections || "",
              beliefShifts: savedResponses.beliefShifts || "",
              authenticTruths: savedResponses.authenticTruths || "",
              keyMessage: savedResponses.keyMessage || "",
              authenticVoice: savedResponses.authenticVoice || ""
            };
          } else {
            formData = form.getValues();
          }
          
          // Merge insights into form data (only populate empty fields)
          const mergedData: ContentPreferences = {
            ...formData,
            ...Object.fromEntries(
              Object.entries(insightsMapping).filter(([key, value]) => 
                value && (!formData[key as keyof ContentPreferences] || formData[key as keyof ContentPreferences] === "")
              )
            )
          } as ContentPreferences;
          
          form.reset(mergedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
          console.log("✅ Populated Content Strategy form with latest transcript insights");
          
          toast({
            title: "Form updated",
            description: "Latest interview insights have been loaded into the form fields.",
          });
          
          return;
        }
      } catch (e) {
        console.error('Error parsing transcript insights:', e);
      }
    }
    
    // First try localStorage (most recent)
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        form.reset(parsed);
        return;
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }

    // Fallback to database data
    if (savedResponses) {
      const formData: ContentPreferences = {
        postingFrequency: savedResponses.postingFrequency || "",
        corePlatform: savedResponses.corePlatform || "",
        contentFormat: savedResponses.contentFormat || "",
        desiredFeelings: savedResponses.desiredFeelings || "",
        avoidFeelings: savedResponses.avoidFeelings || "",
        brandAdjectives: savedResponses.brandAdjectives || "",
        coreThemes: savedResponses.coreThemes || "",
        problemsMyths: savedResponses.problemsMyths || "",
        valuesBeliefs: savedResponses.valuesBeliefs || "",
        contrarianTakes: savedResponses.contrarianTakes || "",
        actionableTips: savedResponses.actionableTips || "",
        commonObjections: savedResponses.commonObjections || "",
        beliefShifts: savedResponses.beliefShifts || "",
        authenticTruths: savedResponses.authenticTruths || "",
        keyMessage: savedResponses.keyMessage || "",
        authenticVoice: savedResponses.authenticVoice || ""
      };
      form.reset(formData);
      // Also save to localStorage for faster future loads
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [userId, savedResponses, form, toast]);
  
  // Listen for transcript insights updates
  useEffect(() => {
    if (!userId) return;
    
    const handleTranscriptInsightsUpdate = (event: CustomEvent) => {
      const insightsData = event.detail;
      if (insightsData?.extractedInsights) {
        // Reload form with new insights
        const INSIGHTS_KEY = `latest-transcript-insights-${userId}`;
        localStorage.setItem(INSIGHTS_KEY, JSON.stringify(insightsData));
        
        // Trigger form reload by updating a dependency
        const STORAGE_KEY = `content-strategy-responses-${userId}`;
        const existingData = localStorage.getItem(STORAGE_KEY);
        const currentValues = form.getValues();
        
        // Map insights to form fields
        const insights = insightsData.extractedInsights;
        const updates: Partial<ContentPreferences> = {};
        
        if (insights.desiredFeelings && !currentValues.desiredFeelings) {
          updates.desiredFeelings = String(insights.desiredFeelings);
        }
        if (insights.avoidFeelings && !currentValues.avoidFeelings) {
          updates.avoidFeelings = String(insights.avoidFeelings);
        }
        if (insights.brandAdjectives && !currentValues.brandAdjectives) {
          updates.brandAdjectives = String(insights.brandAdjectives);
        }
        if (insights.coreThemes && !currentValues.coreThemes) {
          updates.coreThemes = String(insights.coreThemes);
        }
        if (insights.problemsMyths && !currentValues.problemsMyths) {
          updates.problemsMyths = String(insights.problemsMyths);
        }
        if (insights.valuesBeliefs && !currentValues.valuesBeliefs) {
          updates.valuesBeliefs = String(insights.valuesBeliefs);
        }
        if (insights.contrarianTakes && !currentValues.contrarianTakes) {
          updates.contrarianTakes = String(insights.contrarianTakes);
        }
        if (insights.actionableTips && !currentValues.actionableTips) {
          updates.actionableTips = String(insights.actionableTips);
        }
        if (insights.commonObjections && !currentValues.commonObjections) {
          updates.commonObjections = String(insights.commonObjections);
        }
        if (insights.beliefShifts && !currentValues.beliefShifts) {
          updates.beliefShifts = String(insights.beliefShifts);
        }
        if (insights.authenticTruths && !currentValues.authenticTruths) {
          updates.authenticTruths = String(insights.authenticTruths);
        }
        if (insights.keyMessage && !currentValues.keyMessage) {
          updates.keyMessage = String(insights.keyMessage);
        }
        if (insights.authenticVoice && !currentValues.authenticVoice) {
          updates.authenticVoice = String(insights.authenticVoice);
        }
        
        if (Object.keys(updates).length > 0) {
          form.reset({ ...currentValues, ...updates });
          toast({
            title: "Form updated",
            description: "Latest interview insights have been loaded into empty form fields.",
          });
        }
      }
    };
    
    window.addEventListener('transcriptInsightsUpdated', handleTranscriptInsightsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('transcriptInsightsUpdated', handleTranscriptInsightsUpdate as EventListener);
    };
  }, [userId, form, toast]);

  // Load saved generated strategy and ideas
  useEffect(() => {
    if (!userId || !savedGeneratedStrategy) return;

    try {
      // Parse the saved strategy
      const strategyData = typeof savedGeneratedStrategy.contentPillars === 'string'
        ? JSON.parse(savedGeneratedStrategy.contentPillars)
        : savedGeneratedStrategy.contentPillars;

      const ideasData = typeof savedGeneratedStrategy.contentIdeas === 'string'
        ? JSON.parse(savedGeneratedStrategy.contentIdeas)
        : savedGeneratedStrategy.contentIdeas;

      // Restore the generated strategy structure
      if (strategyData) {
        setGeneratedStrategy(strategyData);
        setShowResults(true);
      }

      // Restore the content ideas
      if (ideasData && Array.isArray(ideasData) && ideasData.length > 0) {
        setContentIdeas(ideasData);
        setShowContentIdeas(true);
      }

      console.log('[ContentPillarGenerator] Loaded saved strategy and ideas from database');
    } catch (error) {
      console.error('Error loading saved generated strategy:', error);
    }
  }, [userId, savedGeneratedStrategy]);

  // Debounced save to database
  const saveToDatabase = useCallback(
    debounce(async (data: ContentPreferences, userId: number) => {
      try {
        setIsSaving(true);
        await apiRequest('POST', '/api/content-strategy/save-preferences', {
          userId,
          ...data
        });
        setIsSaving(false);
      } catch (error) {
        console.error('Error saving to database:', error);
        setIsSaving(false);
      }
    }, 2000),
    []
  );

  // Save to localStorage immediately and database with debounce
  const handleFormChange = useCallback((data: ContentPreferences) => {
    if (!userId) return;

    const STORAGE_KEY = `content-strategy-responses-${userId}`;
    
    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Save to database with debounce
    saveToDatabase(data, userId);
  }, [userId, saveToDatabase]);

  // Watch all form values and auto-save
  useEffect(() => {
    const subscription = form.watch((value) => {
      handleFormChange(value as ContentPreferences);
    });
    return () => subscription.unsubscribe();
  }, [form, handleFormChange]);

  const generateStrategyMutation = useMutation({
    mutationFn: async (preferences: ContentPreferences): Promise<GeneratedContentStrategy> => {
      // Before validation, refetch the latest data
      const { data: latestMessagingStrategy } = await refetchMessagingStrategy();
      
      // Validate prerequisites before generation
      const isValid = validateAndNotify(
        { messagingStrategy: true },
        { messagingStrategy: latestMessagingStrategy?.content }
      );
      
      if (!isValid) {
        throw new Error("Missing prerequisites");
      }
      
      const response = await apiRequest('POST', '/api/generate-content-strategy', {
        preferences,
        messagingStrategy: latestMessagingStrategy?.content || ""
      });
      return response.json();
    },
    onSuccess: async (data: GeneratedContentStrategy) => {
      setGeneratedStrategy(data);
      setShowResults(true);

      // Don't save here - wait for content ideas, then save both together

      // Automatically generate content ideas after strategy is complete
      await generateContentIdeasAfterStrategy(data);
    }
  });

  const onSubmit = (data: ContentPreferences) => {
    generateStrategyMutation.mutate(data);
  };

  // Generate content ideas automatically after strategy generation
  const generateContentIdeasAfterStrategy = async (strategy: GeneratedContentStrategy) => {
    if (!messagingStrategy) {
      return;
    }

    setIsGeneratingIdeas(true);
    
    try {
      const contentPreferences = form.getValues();
      const response = await apiRequest('POST', '/api/generate-content-ideas', {
        messagingStrategy: messagingStrategy.content,
        contentPreferences
      });
      
      const data = await response.json();
      setContentIdeas(data.ideas);
      setShowContentIdeas(true);
      
      // Auto-save COMBINED Content Strategy & Ideas to IGNITE Docs AND Database
      if (userId && data.ideas && data.ideas.length > 0 && strategy) {
        try {
          // Create combined markdown with both strategy and ideas
          const strategyMarkdown = convertStrategyToMarkdown(strategy);
          const ideasMarkdown = convertContentIdeasToMarkdown(data.ideas);
          const combinedMarkdown = strategyMarkdown + "\n\n" + "=".repeat(50) + "\n\n" + ideasMarkdown;
          
          // Save to IGNITE Docs
          await apiRequest('POST', '/api/ignite-docs', {
            userId,
            docType: 'content_strategy',
            title: `Content Strategy - ${new Date().toLocaleDateString()}`,
            contentMarkdown: combinedMarkdown,
            sourcePayload: { 
              strategy: strategy,
              ideas: data.ideas,
              preferences: contentPreferences, 
              generatedAt: new Date().toISOString() 
            }
          });

          // Save to database for persistence
          await apiRequest('POST', '/api/content-strategy/save-generated', {
            contentPillars: strategy,
            contentIdeas: data.ideas,
            postingCadence: strategy.postingFrequency,
            recommendations: strategy.recommendations,
            sourceData: { preferences: contentPreferences }
          });

          console.log('[ContentPillarGenerator] Saved strategy and ideas to database');
        } catch (error) {
          console.error('Error auto-saving Content Strategy:', error);
          console.error('Error details:', error instanceof Error ? error.message : error);
        }
      } else {
        console.log('[ContentPillarGenerator] Skipping save - conditions not met:', {
          hasUserId: !!userId,
          hasIdeas: !!(data.ideas && data.ideas.length > 0),
          hasStrategy: !!strategy
        });
      }
    } catch (error) {
      console.error('Error generating content ideas:', error);
      toast({
        title: "Error",
        description: "Failed to generate content ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Generate content ideas handler (for manual regeneration)
  const handleGenerateContentIdeas = async () => {
    // Before validation, refetch the latest data
    const { data: latestMessagingStrategy } = await refetchMessagingStrategy();
    
    if (!latestMessagingStrategy) {
      toast({
        title: "Messaging Strategy Required",
        description: "Please complete your messaging strategy first before generating content ideas.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingIdeas(true);
    
    try {
      const contentPreferences = form.getValues();
      const response = await apiRequest('POST', '/api/generate-content-ideas', {
        messagingStrategy: latestMessagingStrategy.content,
        contentPreferences
      });
      
      const data = await response.json();
      setContentIdeas(data.ideas);
      setShowContentIdeas(true);
      
      // Auto-save COMBINED Content Strategy & Ideas to IGNITE Docs AND Database
      if (userId && data.ideas && data.ideas.length > 0 && generatedStrategy) {
        try {
          // Create combined markdown with both strategy and ideas
          const strategyMarkdown = convertStrategyToMarkdown(generatedStrategy);
          const ideasMarkdown = convertContentIdeasToMarkdown(data.ideas);
          const combinedMarkdown = strategyMarkdown + "\n\n" + "=".repeat(50) + "\n\n" + ideasMarkdown;
          
          // Save to IGNITE Docs
          await apiRequest('POST', '/api/ignite-docs', {
            userId,
            docType: 'content_strategy',
            title: `Content Strategy - ${new Date().toLocaleDateString()}`,
            contentMarkdown: combinedMarkdown,
            sourcePayload: { 
              strategy: generatedStrategy,
              ideas: data.ideas,
              preferences: contentPreferences, 
              generatedAt: new Date().toISOString() 
            }
          });

          // Save to database for persistence
          await apiRequest('POST', '/api/content-strategy/save-generated', {
            contentPillars: generatedStrategy,
            contentIdeas: data.ideas,
            postingCadence: generatedStrategy.postingFrequency,
            recommendations: generatedStrategy.recommendations,
            sourceData: { preferences: contentPreferences }
          });

          console.log('[ContentPillarGenerator] Saved strategy and ideas to database');
        } catch (error) {
          console.error('Error auto-saving Content Strategy:', error);
        }
      }
      
      toast({
        title: "Success!",
        description: "10 content ideas generated successfully",
      });
    } catch (error) {
      console.error('Error generating content ideas:', error);
      toast({
        title: "Error",
        description: "Failed to generate content ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Helper function to convert content ideas to markdown format for IGNITE Docs
  const convertContentIdeasToMarkdown = (ideas: ContentIdea[]): string => {
    let markdown = "# 10 CONTENT IDEAS\n\n";
    
    ideas.forEach((idea, index) => {
      markdown += `## ${index + 1}. "${idea.title}"\n\n`;
      markdown += `**Core Message:** ${idea.coreMessage}\n\n`;
      markdown += `**Format:** ${idea.format}\n\n`;
      markdown += `**Emotional Intention:** ${idea.emotionalIntention}\n\n`;
      markdown += `**Call to Action:** "${idea.callToAction}"\n\n`;
      if (index < ideas.length - 1) {
        markdown += "---\n\n";
      }
    });
    
    return markdown;
  };

  // Helper function to convert strategy to markdown format for IGNITE Docs
  const convertStrategyToMarkdown = (strategy: GeneratedContentStrategy): string => {
    let markdown = "# CONTENT STRATEGY PLAN\n\n";
    
    markdown += "## 1. CORE PLATFORM\n";
    markdown += `${strategy.corePlatform}\n\n`;
    
    markdown += "## 2. POSTING FREQUENCY\n";
    markdown += `${strategy.postingFrequency}\n\n`;
    
    markdown += "## 3. CONTENT FORMAT\n";
    markdown += `${strategy.contentFormat}\n\n`;
    
    if (strategy.contentGoals && strategy.contentGoals.length > 0) {
      markdown += "## 4. CONTENT GOALS\n";
      strategy.contentGoals.forEach(goal => {
        markdown += `- ${goal}\n`;
      });
      markdown += "\n";
    }
    
    if (strategy.emotionalToneSummary) {
      markdown += "## 5. EMOTIONAL TONE SUMMARY\n";
      markdown += `${strategy.emotionalToneSummary}\n\n`;
    }
    
    if (strategy.brandVibe) {
      markdown += "## 6. BRAND VIBE\n";
      markdown += `${strategy.brandVibe}\n\n`;
    }
    
    if (strategy.contentPillars && strategy.contentPillars.length > 0) {
      markdown += "## 7. CONTENT PILLARS\n";
      strategy.contentPillars.forEach((pillar, index) => {
        markdown += `### ${index + 1}. ${pillar.name}\n`;
        markdown += `${pillar.explanation}\n`;
        if (pillar.connectionToOffer) {
          markdown += `**Connection to Offer:** ${pillar.connectionToOffer}\n`;
        }
        markdown += "\n";
      });
    }
    
    if (strategy.disruptiveAngles && strategy.disruptiveAngles.length > 0) {
      markdown += "## 8. DISRUPTIVE ANGLES\n";
      strategy.disruptiveAngles.forEach(angle => {
        markdown += `- ${angle}\n`;
      });
      markdown += "\n";
    }
    
    if (strategy.voiceAuthenticityGuide && strategy.voiceAuthenticityGuide.length > 0) {
      markdown += "## 9. VOICE & AUTHENTICITY GUIDE\n";
      strategy.voiceAuthenticityGuide.forEach(bullet => {
        markdown += `- ${bullet}\n`;
      });
    }
    
    return markdown;
  };

  // Helper function to convert strategy to plain text
  const convertStrategyToText = (): string => {
    if (!generatedStrategy) return "";
    
    let text = "CONTENT STRATEGY PLAN\n\n";
    
    text += "1. CORE PLATFORM\n";
    text += `${generatedStrategy.corePlatform}\n\n`;
    
    text += "2. POSTING FREQUENCY\n";
    text += `${generatedStrategy.postingFrequency}\n\n`;
    
    text += "3. CONTENT FORMAT\n";
    text += `${generatedStrategy.contentFormat}\n\n`;
    
    if (generatedStrategy.contentGoals && generatedStrategy.contentGoals.length > 0) {
      text += "4. CONTENT GOALS\n";
      generatedStrategy.contentGoals.forEach(goal => {
        text += `• ${goal}\n`;
      });
      text += "\n";
    }
    
    if (generatedStrategy.emotionalToneSummary) {
      text += "5. EMOTIONAL TONE SUMMARY\n";
      text += `${generatedStrategy.emotionalToneSummary}\n\n`;
    }
    
    if (generatedStrategy.brandVibe) {
      text += "6. BRAND VIBE\n";
      text += `${generatedStrategy.brandVibe}\n\n`;
    }
    
    if (generatedStrategy.contentPillars && generatedStrategy.contentPillars.length > 0) {
      text += "7. CONTENT PILLARS\n";
      generatedStrategy.contentPillars.forEach((pillar, index) => {
        text += `${index + 1}. ${pillar.name}\n`;
        text += `${pillar.explanation}\n`;
        if (pillar.connectionToOffer) {
          text += `Connection to Offer: ${pillar.connectionToOffer}\n`;
        }
        text += "\n";
      });
    }
    
    if (generatedStrategy.disruptiveAngles && generatedStrategy.disruptiveAngles.length > 0) {
      text += "8. DISRUPTIVE ANGLES\n";
      generatedStrategy.disruptiveAngles.forEach(angle => {
        text += `• ${angle}\n`;
      });
      text += "\n";
    }
    
    if (generatedStrategy.voiceAuthenticityGuide && generatedStrategy.voiceAuthenticityGuide.length > 0) {
      text += "9. VOICE & AUTHENTICITY GUIDE\n";
      generatedStrategy.voiceAuthenticityGuide.forEach(bullet => {
        text += `• ${bullet}\n`;
      });
    }
    
    return text;
  };

  // Helper function to convert content ideas to plain text
  const convertContentIdeasToText = (): string => {
    if (!contentIdeas || contentIdeas.length === 0) return "";
    
    let text = "PART 2: 10 SPECIFIC CONTENT IDEAS\n\n";
    
    contentIdeas.forEach((idea, index) => {
      text += `${index + 1}. "${idea.title}"\n\n`;
      text += `Core Message: ${idea.coreMessage}\n`;
      text += `Format: ${idea.format}\n`;
      text += `Emotional Intention: ${idea.emotionalIntention}\n`;
      text += `CTA: "${idea.callToAction}"\n`;
      if (index < contentIdeas.length - 1) {
        text += "\n---\n\n";
      }
    });
    
    return text;
  };

  // Copy to Clipboard handler
  const handleCopyToClipboard = async () => {
    if (!generatedStrategy) return;
    
    try {
      const plainText = convertStrategyToText();
      await navigator.clipboard.writeText(plainText);
      toast({
        title: "Copied!",
        description: "Content strategy copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Copy Content Ideas to Clipboard handler
  const handleCopyContentIdeasToClipboard = async () => {
    if (!contentIdeas || contentIdeas.length === 0) return;
    
    try {
      const plainText = convertContentIdeasToText();
      await navigator.clipboard.writeText(plainText);
      toast({
        title: "Copied!",
        description: "Content ideas copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Download DOCX handler
  const handleDownloadDOCX = async () => {
    if (!generatedStrategy) return;

    try {
      const children: Paragraph[] = [];

      // Title
      children.push(
        new Paragraph({
          text: "CONTENT STRATEGY PLAN",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 0, after: 400 },
        })
      );

      // Section 1: Core Platform
      children.push(
        new Paragraph({
          text: "1. CORE PLATFORM",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      children.push(
        new Paragraph({
          text: generatedStrategy.corePlatform,
          spacing: { before: 100, after: 200 },
        })
      );

      // Section 2: Posting Frequency
      children.push(
        new Paragraph({
          text: "2. POSTING FREQUENCY",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      children.push(
        new Paragraph({
          text: generatedStrategy.postingFrequency,
          spacing: { before: 100, after: 200 },
        })
      );

      // Section 3: Content Format
      children.push(
        new Paragraph({
          text: "3. CONTENT FORMAT",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      children.push(
        new Paragraph({
          text: generatedStrategy.contentFormat,
          spacing: { before: 100, after: 200 },
        })
      );

      // Section 4: Content Goals
      if (generatedStrategy.contentGoals && generatedStrategy.contentGoals.length > 0) {
        children.push(
          new Paragraph({
            text: "4. CONTENT GOALS",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
        generatedStrategy.contentGoals.forEach(goal => {
          children.push(
            new Paragraph({
              text: goal,
              bullet: { level: 0 },
              spacing: { before: 50, after: 50 },
            })
          );
        });
      }

      // Section 5: Emotional Tone Summary
      if (generatedStrategy.emotionalToneSummary) {
        children.push(
          new Paragraph({
            text: "5. EMOTIONAL TONE SUMMARY",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
        children.push(
          new Paragraph({
            text: generatedStrategy.emotionalToneSummary,
            spacing: { before: 100, after: 200 },
          })
        );
      }

      // Section 6: Brand Vibe
      if (generatedStrategy.brandVibe) {
        children.push(
          new Paragraph({
            text: "6. BRAND VIBE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
        children.push(
          new Paragraph({
            text: generatedStrategy.brandVibe,
            spacing: { before: 100, after: 200 },
          })
        );
      }

      // Section 7: Content Pillars
      if (generatedStrategy.contentPillars && generatedStrategy.contentPillars.length > 0) {
        children.push(
          new Paragraph({
            text: "7. CONTENT PILLARS",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
        generatedStrategy.contentPillars.forEach((pillar, index) => {
          children.push(
            new Paragraph({
              text: `${index + 1}. ${pillar.name}`,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            })
          );
          children.push(
            new Paragraph({
              text: pillar.explanation,
              spacing: { before: 50, after: 50 },
            })
          );
          if (pillar.connectionToOffer) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Connection to Offer: ",
                    italics: true,
                  }),
                  new TextRun({
                    text: pillar.connectionToOffer,
                    italics: true,
                  }),
                ],
                spacing: { before: 50, after: 100 },
              })
            );
          }
        });
      }

      // Section 8: Disruptive Angles
      if (generatedStrategy.disruptiveAngles && generatedStrategy.disruptiveAngles.length > 0) {
        children.push(
          new Paragraph({
            text: "8. DISRUPTIVE ANGLES",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
        generatedStrategy.disruptiveAngles.forEach(angle => {
          children.push(
            new Paragraph({
              text: angle,
              bullet: { level: 0 },
              spacing: { before: 50, after: 50 },
            })
          );
        });
      }

      // Section 9: Voice & Authenticity Guide
      if (generatedStrategy.voiceAuthenticityGuide && generatedStrategy.voiceAuthenticityGuide.length > 0) {
        children.push(
          new Paragraph({
            text: "9. VOICE & AUTHENTICITY GUIDE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
        generatedStrategy.voiceAuthenticityGuide.forEach(bullet => {
          children.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
              spacing: { before: 50, after: 50 },
            })
          );
        });
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Content-Strategy-Plan.docx");
      
      toast({
        title: "Success!",
        description: "DOCX file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate DOCX file",
        variant: "destructive",
      });
    }
  };

  // Download PDF handler
  const handleDownloadPDF = async () => {
    if (!generatedStrategy) return;

    try {
      const pdf = new jsPDF();
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', spacing: number = 6) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        const splitText = pdf.splitTextToSize(text, maxWidth);
        pdf.text(splitText, margin, yPosition);
        yPosition += splitText.length * spacing + 3;
      };

      // Title
      addText("CONTENT STRATEGY PLAN", 18, 'bold', 10);
      yPosition += 5;

      // Section 1: Core Platform
      addText("1. CORE PLATFORM", 14, 'bold', 8);
      addText(generatedStrategy.corePlatform, 10, 'normal');
      yPosition += 3;

      // Section 2: Posting Frequency
      addText("2. POSTING FREQUENCY", 14, 'bold', 8);
      addText(generatedStrategy.postingFrequency, 10, 'normal');
      yPosition += 3;

      // Section 3: Content Format
      addText("3. CONTENT FORMAT", 14, 'bold', 8);
      addText(generatedStrategy.contentFormat, 10, 'normal');
      yPosition += 3;

      // Section 4: Content Goals
      if (generatedStrategy.contentGoals && generatedStrategy.contentGoals.length > 0) {
        addText("4. CONTENT GOALS", 14, 'bold', 8);
        generatedStrategy.contentGoals.forEach(goal => {
          addText(`• ${goal}`, 10, 'normal');
        });
        yPosition += 3;
      }

      // Section 5: Emotional Tone Summary
      if (generatedStrategy.emotionalToneSummary) {
        addText("5. EMOTIONAL TONE SUMMARY", 14, 'bold', 8);
        addText(generatedStrategy.emotionalToneSummary, 10, 'normal');
        yPosition += 3;
      }

      // Section 6: Brand Vibe
      if (generatedStrategy.brandVibe) {
        addText("6. BRAND VIBE", 14, 'bold', 8);
        addText(generatedStrategy.brandVibe, 10, 'normal');
        yPosition += 3;
      }

      // Section 7: Content Pillars
      if (generatedStrategy.contentPillars && generatedStrategy.contentPillars.length > 0) {
        addText("7. CONTENT PILLARS", 14, 'bold', 8);
        generatedStrategy.contentPillars.forEach((pillar, index) => {
          addText(`${index + 1}. ${pillar.name}`, 12, 'bold', 7);
          addText(pillar.explanation, 10, 'normal');
          if (pillar.connectionToOffer) {
            addText(`Connection to Offer: ${pillar.connectionToOffer}`, 9, 'normal');
          }
        });
        yPosition += 3;
      }

      // Section 8: Disruptive Angles
      if (generatedStrategy.disruptiveAngles && generatedStrategy.disruptiveAngles.length > 0) {
        addText("8. DISRUPTIVE ANGLES", 14, 'bold', 8);
        generatedStrategy.disruptiveAngles.forEach(angle => {
          addText(`• ${angle}`, 10, 'normal');
        });
        yPosition += 3;
      }

      // Section 9: Voice & Authenticity Guide
      if (generatedStrategy.voiceAuthenticityGuide && generatedStrategy.voiceAuthenticityGuide.length > 0) {
        addText("9. VOICE & AUTHENTICITY GUIDE", 14, 'bold', 8);
        generatedStrategy.voiceAuthenticityGuide.forEach(bullet => {
          addText(`• ${bullet}`, 10, 'normal');
        });
      }

      pdf.save("Content-Strategy-Plan.pdf");
      
      toast({
        title: "Success!",
        description: "PDF file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF file",
        variant: "destructive",
      });
    }
  };

  // Download Content Ideas DOCX handler
  const handleDownloadContentIdeasDOCX = async () => {
    if (!contentIdeas || contentIdeas.length === 0) return;

    try {
      const children: Paragraph[] = [];

      // Title
      children.push(
        new Paragraph({
          text: "PART 2: 10 SPECIFIC CONTENT IDEAS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 0, after: 400 },
        })
      );

      // Content Ideas
      contentIdeas.forEach((idea, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. "${idea.title}"`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Core Message: ", bold: true }),
              new TextRun({ text: idea.coreMessage }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Format: ", bold: true }),
              new TextRun({ text: idea.format }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Emotional Intention: ", bold: true }),
              new TextRun({ text: idea.emotionalIntention }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "CTA: ", bold: true }),
              new TextRun({ text: `"${idea.callToAction}"` }),
            ],
            spacing: { before: 100, after: 200 },
          })
        );
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Content-Ideas.docx");
      
      toast({
        title: "Success!",
        description: "DOCX file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate DOCX file",
        variant: "destructive",
      });
    }
  };

  // Download Content Ideas PDF handler
  const handleDownloadContentIdeasPDF = async () => {
    if (!contentIdeas || contentIdeas.length === 0) return;

    try {
      const pdf = new jsPDF();
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', spacing: number = 6) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        const splitText = pdf.splitTextToSize(text, maxWidth);
        pdf.text(splitText, margin, yPosition);
        yPosition += splitText.length * spacing + 3;
      };

      // Title
      addText("PART 2: 10 SPECIFIC CONTENT IDEAS", 18, 'bold', 10);
      yPosition += 10;

      // Content Ideas
      contentIdeas.forEach((idea, index) => {
        addText(`${index + 1}. "${idea.title}"`, 14, 'bold', 8);
        yPosition += 2;
        
        addText(`Core Message: ${idea.coreMessage}`, 10, 'normal');
        addText(`Format: ${idea.format}`, 10, 'normal');
        addText(`Emotional Intention: ${idea.emotionalIntention}`, 10, 'normal');
        addText(`CTA: "${idea.callToAction}"`, 10, 'normal');
        yPosition += 5;
      });

      pdf.save("Content-Ideas.pdf");
      
      toast({
        title: "Success!",
        description: "PDF file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF file",
        variant: "destructive",
      });
    }
  };

  // COMBINED EXPORT FUNCTIONS
  
  // Copy combined content to clipboard
  const handleCopyCombinedToClipboard = async () => {
    if (!generatedStrategy || !contentIdeas || contentIdeas.length === 0) return;

    try {
      let text = "CONTENT STRATEGY & IDEAS\n\n";
      text += "=" + "=".repeat(50) + "\n\n";
      text += "PART 1: CONTENT STRATEGY PLAN\n\n";
      
      text += "1. Core Platform:\n" + generatedStrategy.corePlatform + "\n\n";
      text += "2. Posting Frequency:\n" + generatedStrategy.postingFrequency + "\n\n";
      text += "3. Content Format:\n" + generatedStrategy.contentFormat + "\n\n";
      
      if (generatedStrategy.contentGoals && generatedStrategy.contentGoals.length > 0) {
        text += "4. Content Goals:\n";
        generatedStrategy.contentGoals.forEach(goal => {
          text += `• ${goal}\n`;
        });
        text += "\n";
      }
      
      if (generatedStrategy.emotionalToneSummary) {
        text += "5. Emotional Tone Summary:\n" + generatedStrategy.emotionalToneSummary + "\n\n";
      }
      
      if (generatedStrategy.brandVibe) {
        text += "6. Brand Vibe:\n" + generatedStrategy.brandVibe + "\n\n";
      }
      
      if (generatedStrategy.contentPillars && generatedStrategy.contentPillars.length > 0) {
        text += "7. Content Pillars:\n";
        generatedStrategy.contentPillars.forEach((pillar, index) => {
          text += `${index + 1}. ${pillar.name}\n`;
          text += `   ${pillar.explanation}\n`;
          if (pillar.connectionToOffer) {
            text += `   Connection to Offer: ${pillar.connectionToOffer}\n`;
          }
          text += "\n";
        });
      }
      
      if (generatedStrategy.disruptiveAngles && generatedStrategy.disruptiveAngles.length > 0) {
        text += "8. Disruptive Angles:\n";
        generatedStrategy.disruptiveAngles.forEach(angle => {
          text += `• ${angle}\n`;
        });
        text += "\n";
      }
      
      if (generatedStrategy.voiceAuthenticityGuide && generatedStrategy.voiceAuthenticityGuide.length > 0) {
        text += "9. Voice & Authenticity Guide:\n";
        generatedStrategy.voiceAuthenticityGuide.forEach(bullet => {
          text += `• ${bullet}\n`;
        });
        text += "\n";
      }

      text += "\n" + "=".repeat(50) + "\n\n";
      text += "PART 2: 10 SPECIFIC CONTENT IDEAS\n\n";
      
      contentIdeas.forEach((idea, index) => {
        text += `${index + 1}. "${idea.title}"\n`;
        text += `Core Message: ${idea.coreMessage}\n`;
        text += `Format: ${idea.format}\n`;
        text += `Emotional Intention: ${idea.emotionalIntention}\n`;
        text += `CTA: "${idea.callToAction}"\n\n`;
      });

      await navigator.clipboard.writeText(text);
      
      toast({
        title: "Success!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Download combined DOCX
  const handleDownloadCombinedDOCX = async () => {
    if (!generatedStrategy || !contentIdeas || contentIdeas.length === 0) return;

    try {
      const children: (Paragraph)[] = [];

      // Main Title
      children.push(
        new Paragraph({
          text: "CONTENT STRATEGY & IDEAS",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 },
        })
      );

      // PART 1 Header
      children.push(
        new Paragraph({
          text: "PART 1: CONTENT STRATEGY PLAN",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );

      // Strategy content (sections 1-9)
      children.push(new Paragraph({ text: "1. CORE PLATFORM", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      children.push(new Paragraph({ text: generatedStrategy.corePlatform, spacing: { before: 50, after: 200 } }));

      children.push(new Paragraph({ text: "2. POSTING FREQUENCY", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      children.push(new Paragraph({ text: generatedStrategy.postingFrequency, spacing: { before: 50, after: 200 } }));

      children.push(new Paragraph({ text: "3. CONTENT FORMAT", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      children.push(new Paragraph({ text: generatedStrategy.contentFormat, spacing: { before: 50, after: 200 } }));

      if (generatedStrategy.contentGoals && generatedStrategy.contentGoals.length > 0) {
        children.push(new Paragraph({ text: "4. CONTENT GOALS", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
        generatedStrategy.contentGoals.forEach(goal => {
          children.push(new Paragraph({ text: goal, bullet: { level: 0 }, spacing: { before: 50, after: 50 } }));
        });
      }

      if (generatedStrategy.emotionalToneSummary) {
        children.push(new Paragraph({ text: "5. EMOTIONAL TONE SUMMARY", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
        children.push(new Paragraph({ text: generatedStrategy.emotionalToneSummary, spacing: { before: 50, after: 200 } }));
      }

      if (generatedStrategy.brandVibe) {
        children.push(new Paragraph({ text: "6. BRAND VIBE", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
        children.push(new Paragraph({ text: generatedStrategy.brandVibe, spacing: { before: 50, after: 200 } }));
      }

      if (generatedStrategy.contentPillars && generatedStrategy.contentPillars.length > 0) {
        children.push(new Paragraph({ text: "7. CONTENT PILLARS", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
        generatedStrategy.contentPillars.forEach((pillar, index) => {
          children.push(new Paragraph({ text: `${index + 1}. ${pillar.name}`, heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 50 } }));
          children.push(new Paragraph({ text: pillar.explanation, spacing: { before: 50, after: 50 } }));
          if (pillar.connectionToOffer) {
            children.push(new Paragraph({ text: `Connection to Offer: ${pillar.connectionToOffer}`, spacing: { before: 50, after: 100 } }));
          }
        });
      }

      if (generatedStrategy.disruptiveAngles && generatedStrategy.disruptiveAngles.length > 0) {
        children.push(new Paragraph({ text: "8. DISRUPTIVE ANGLES", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
        generatedStrategy.disruptiveAngles.forEach(angle => {
          children.push(new Paragraph({ text: angle, bullet: { level: 0 }, spacing: { before: 50, after: 50 } }));
        });
      }

      if (generatedStrategy.voiceAuthenticityGuide && generatedStrategy.voiceAuthenticityGuide.length > 0) {
        children.push(new Paragraph({ text: "9. VOICE & AUTHENTICITY GUIDE", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
        generatedStrategy.voiceAuthenticityGuide.forEach(bullet => {
          children.push(new Paragraph({ text: bullet, bullet: { level: 0 }, spacing: { before: 50, after: 50 } }));
        });
      }

      // PART 2 Header
      children.push(
        new Paragraph({
          text: "PART 2: 10 SPECIFIC CONTENT IDEAS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      // Content Ideas
      contentIdeas.forEach((idea, index) => {
        children.push(new Paragraph({ text: `${index + 1}. "${idea.title}"`, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
        children.push(new Paragraph({ text: `Core Message: ${idea.coreMessage}`, spacing: { before: 50, after: 50 } }));
        children.push(new Paragraph({ text: `Format: ${idea.format}`, spacing: { before: 50, after: 50 } }));
        children.push(new Paragraph({ text: `Emotional Intention: ${idea.emotionalIntention}`, spacing: { before: 50, after: 50 } }));
        children.push(new Paragraph({ text: `CTA: "${idea.callToAction}"`, spacing: { before: 50, after: 200 } }));
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Content-Strategy-and-Ideas.docx");
      
      toast({
        title: "Success!",
        description: "DOCX file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate DOCX file",
        variant: "destructive",
      });
    }
  };

  // Download combined PDF
  const handleDownloadCombinedPDF = async () => {
    if (!generatedStrategy || !contentIdeas || contentIdeas.length === 0) return;

    try {
      const pdf = new jsPDF();
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', spacing: number = 6) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        const splitText = pdf.splitTextToSize(text, maxWidth);
        pdf.text(splitText, margin, yPosition);
        yPosition += splitText.length * spacing + 3;
      };

      // Main Title
      addText("CONTENT STRATEGY & IDEAS", 20, 'bold', 10);
      yPosition += 10;

      // PART 1
      addText("PART 1: CONTENT STRATEGY PLAN", 16, 'bold', 9);
      yPosition += 5;

      addText("1. CORE PLATFORM", 14, 'bold', 8);
      addText(generatedStrategy.corePlatform, 10, 'normal');
      yPosition += 3;

      addText("2. POSTING FREQUENCY", 14, 'bold', 8);
      addText(generatedStrategy.postingFrequency, 10, 'normal');
      yPosition += 3;

      addText("3. CONTENT FORMAT", 14, 'bold', 8);
      addText(generatedStrategy.contentFormat, 10, 'normal');
      yPosition += 3;

      if (generatedStrategy.contentGoals && generatedStrategy.contentGoals.length > 0) {
        addText("4. CONTENT GOALS", 14, 'bold', 8);
        generatedStrategy.contentGoals.forEach(goal => {
          addText(`• ${goal}`, 10, 'normal');
        });
        yPosition += 3;
      }

      if (generatedStrategy.emotionalToneSummary) {
        addText("5. EMOTIONAL TONE SUMMARY", 14, 'bold', 8);
        addText(generatedStrategy.emotionalToneSummary, 10, 'normal');
        yPosition += 3;
      }

      if (generatedStrategy.brandVibe) {
        addText("6. BRAND VIBE", 14, 'bold', 8);
        addText(generatedStrategy.brandVibe, 10, 'normal');
        yPosition += 3;
      }

      if (generatedStrategy.contentPillars && generatedStrategy.contentPillars.length > 0) {
        addText("7. CONTENT PILLARS", 14, 'bold', 8);
        generatedStrategy.contentPillars.forEach((pillar, index) => {
          addText(`${index + 1}. ${pillar.name}`, 12, 'bold', 7);
          addText(pillar.explanation, 10, 'normal');
          if (pillar.connectionToOffer) {
            addText(`Connection to Offer: ${pillar.connectionToOffer}`, 9, 'normal');
          }
        });
        yPosition += 3;
      }

      if (generatedStrategy.disruptiveAngles && generatedStrategy.disruptiveAngles.length > 0) {
        addText("8. DISRUPTIVE ANGLES", 14, 'bold', 8);
        generatedStrategy.disruptiveAngles.forEach(angle => {
          addText(`• ${angle}`, 10, 'normal');
        });
        yPosition += 3;
      }

      if (generatedStrategy.voiceAuthenticityGuide && generatedStrategy.voiceAuthenticityGuide.length > 0) {
        addText("9. VOICE & AUTHENTICITY GUIDE", 14, 'bold', 8);
        generatedStrategy.voiceAuthenticityGuide.forEach(bullet => {
          addText(`• ${bullet}`, 10, 'normal');
        });
        yPosition += 3;
      }

      // PART 2
      yPosition += 10;
      addText("PART 2: 10 SPECIFIC CONTENT IDEAS", 16, 'bold', 9);
      yPosition += 10;

      contentIdeas.forEach((idea, index) => {
        addText(`${index + 1}. "${idea.title}"`, 14, 'bold', 8);
        yPosition += 2;
        
        addText(`Core Message: ${idea.coreMessage}`, 10, 'normal');
        addText(`Format: ${idea.format}`, 10, 'normal');
        addText(`Emotional Intention: ${idea.emotionalIntention}`, 10, 'normal');
        addText(`CTA: "${idea.callToAction}"`, 10, 'normal');
        yPosition += 5;
      });

      pdf.save("Content-Strategy-and-Ideas.pdf");
      
      toast({
        title: "Success!",
        description: "PDF file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF file",
        variant: "destructive",
      });
    }
  };

  // Enter edit mode
  const handleEnterEditMode = () => {
    if (generatedStrategy && contentIdeas) {
      setEditedStrategy(JSON.parse(JSON.stringify(generatedStrategy)));
      setEditedIdeas(JSON.parse(JSON.stringify(contentIdeas)));
      setIsEditMode(true);
    }
  };

  // Save edited content
  const handleSaveEdits = async () => {
    if (!editedStrategy || !editedIdeas || !userId) return;

    setIsSaving(true);
    try {
      // Update the current state with edited content
      setGeneratedStrategy(editedStrategy);
      setContentIdeas(editedIdeas);

      // Update the database with new combined content
      const strategyMarkdown = generateMarkdownForStrategy(editedStrategy);
      const ideasMarkdown = generateMarkdownForIdeas(editedIdeas);
      const combinedMarkdown = strategyMarkdown + "\n\n" + "=".repeat(50) + "\n\n" + ideasMarkdown;

      // Save updated combined content strategy & ideas
      await apiRequest('POST', '/api/ignite-docs', {
        userId,
        docType: 'content_strategy',
        title: `Content Strategy - ${new Date().toLocaleDateString()}`,
        contentMarkdown: combinedMarkdown,
        sourcePayload: { 
          strategy: editedStrategy,
          ideas: editedIdeas,
          generatedAt: new Date().toISOString() 
        }
      });

      setIsEditMode(false);
      toast({
        title: "Success!",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error('Error saving edits:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions to generate markdown
  const generateMarkdownForStrategy = (strategy: GeneratedContentStrategy) => {
    let markdown = '# CONTENT STRATEGY PLAN\n\n';
    markdown += `**Core Platform:** ${strategy.corePlatform}\n\n`;
    markdown += `**Posting Frequency:** ${strategy.postingFrequency}\n\n`;
    markdown += `**Content Format:** ${strategy.contentFormat}\n\n`;
    
    if (strategy.contentGoals && strategy.contentGoals.length > 0) {
      markdown += '## Content Goals:\n';
      strategy.contentGoals.forEach((goal, index) => {
        markdown += `${index + 1}. ${goal}\n`;
      });
      markdown += '\n';
    }

    if (strategy.emotionalToneSummary) {
      markdown += '## Emotional Tone Summary:\n';
      markdown += `${strategy.emotionalToneSummary}\n\n`;
    }

    if (strategy.brandVibe) {
      markdown += '## Brand Vibe:\n';
      markdown += `${strategy.brandVibe}\n\n`;
    }

    if (strategy.contentPillars && strategy.contentPillars.length > 0) {
      markdown += '## Content Pillars:\n';
      strategy.contentPillars.forEach((pillar, index) => {
        markdown += `### ${index + 1}. ${pillar.name}\n`;
        markdown += `${pillar.explanation}\n`;
        markdown += `**Connection to Offer:** ${pillar.connectionToOffer}\n\n`;
      });
    }

    if (strategy.disruptiveAngles && strategy.disruptiveAngles.length > 0) {
      markdown += '## Disruptive Angles:\n';
      strategy.disruptiveAngles.forEach((angle, index) => {
        markdown += `${index + 1}. ${angle}\n`;
      });
      markdown += '\n';
    }

    if (strategy.voiceAuthenticityGuide && strategy.voiceAuthenticityGuide.length > 0) {
      markdown += '## Voice & Authenticity Guide:\n';
      strategy.voiceAuthenticityGuide.forEach((guide, index) => {
        markdown += `${index + 1}. ${guide}\n`;
      });
      markdown += '\n';
    }

    return markdown;
  };

  const generateMarkdownForIdeas = (ideas: ContentIdea[]) => {
    let markdown = '# 10 SPECIFIC CONTENT IDEAS\n\n';
    ideas.forEach((idea, index) => {
      markdown += `## ${index + 1}. "${idea.title}"\n`;
      markdown += `**Core Message:** ${idea.coreMessage}\n`;
      markdown += `**Format:** ${idea.format}\n`;
      markdown += `**Emotional Intention:** ${idea.emotionalIntention}\n`;
      markdown += `**Call to Action:** "${idea.callToAction}"\n\n`;
    });
    return markdown;
  };

  if (showResults && generatedStrategy) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Content Strategy Plan</h3>
            <p className="text-slate-600">Your personalized, AI-generated content strategy</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowResults(false)}
              data-testid="button-edit-preferences"
              className="bg-embodied-coral hover:bg-embodied-orange text-white"
            >
              Back To Questions
            </Button>
          </div>
        </div>


        {/* Combined Content Strategy & Ideas - Document Style */}
        <Card className="border border-slate-200">
          <CardContent className="p-12">
            
            {/* Main Header with Edit and Export Buttons */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-coral-700 mb-6">CONTENT STRATEGY & IDEAS</h2>
              </div>
              {showContentIdeas && contentIdeas.length > 0 && (
                <div className="flex items-center gap-3">
                  {isEditMode ? (
                    <Button 
                      size="sm" 
                      onClick={handleSaveEdits}
                      disabled={isSaving}
                      data-testid="button-save-edits"
                      className="bg-embodied-coral hover:bg-embodied-orange text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={handleEnterEditMode}
                      data-testid="button-edit-content"
                      variant="outline"
                      className="border-embodied-coral text-embodied-coral hover:bg-embodied-coral/10"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        data-testid="button-export-combined"
                        className="bg-embodied-coral hover:bg-embodied-orange text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Export Document
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem 
                        onClick={handleCopyCombinedToClipboard} 
                        data-testid="menu-copy-clipboard-combined"
                        className="hover:bg-slate-100 focus:bg-slate-100"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Clipboard
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDownloadCombinedDOCX} 
                        data-testid="menu-download-docx-combined"
                        className="hover:bg-slate-100 focus:bg-slate-100"
                      >
                        <FileType className="w-4 h-4 mr-2" />
                        Download DOCX
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDownloadCombinedPDF} 
                        data-testid="menu-download-pdf-combined"
                        className="hover:bg-slate-100 focus:bg-slate-100"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* PART 1: CONTENT STRATEGY PLAN */}
            <h2 className="text-2xl font-bold text-coral-700 mb-6 pb-4 border-b-2 border-slate-300">PART 1: CONTENT STRATEGY PLAN</h2>

            {/* Core Platform, Posting Frequency, Content Format */}
            <div className="space-y-6 mb-8">
              <p className="text-lg">
                <span className="font-bold text-slate-900">1. Core Platform:</span> {generatedStrategy.corePlatform}
              </p>
              <p className="text-lg">
                <span className="font-bold text-slate-900">2. Posting Frequency:</span> {generatedStrategy.postingFrequency}
              </p>
              <p className="text-lg">
                <span className="font-bold text-slate-900">3. Content Format:</span> {generatedStrategy.contentFormat}
              </p>
            </div>

            <hr className="my-8 border-t border-slate-300" />

            {/* Content Goals */}
            {(isEditMode ? editedStrategy?.contentGoals : generatedStrategy.contentGoals) && (isEditMode ? editedStrategy?.contentGoals : generatedStrategy.contentGoals)!.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">4. Content Goals:</h3>
                {isEditMode && editedStrategy ? (
                  <div className="space-y-3">
                    {editedStrategy.contentGoals.map((goal, index) => (
                      <Textarea
                        key={index}
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...editedStrategy.contentGoals];
                          newGoals[index] = e.target.value;
                          setEditedStrategy({ ...editedStrategy, contentGoals: newGoals });
                        }}
                        className="text-lg min-h-[60px]"
                        data-testid={`textarea-goal-${index}`}
                      />
                    ))}
                  </div>
                ) : (
                  <ol className="space-y-3 pl-6">
                    {generatedStrategy.contentGoals.map((goal, index) => (
                      <li key={index} className="text-lg text-slate-800 list-decimal" dangerouslySetInnerHTML={{ 
                        __html: goal
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      }} />
                    ))}
                  </ol>
                )}
              </div>
            )}

            <hr className="my-8 border-t border-slate-300" />

            {/* Emotional Tone Summary */}
            {generatedStrategy.emotionalToneSummary && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">5. Emotional Tone Summary:</h3>
                <div className="text-lg text-slate-800 leading-relaxed space-y-2">
                  {generatedStrategy.emotionalToneSummary.split('\n').map((line, index) => (
                    <p key={index} dangerouslySetInnerHTML={{ 
                      __html: line
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    }} />
                  ))}
                </div>
              </div>
            )}

            <hr className="my-8 border-t border-slate-300" />

            {/* Brand Vibe */}
            {generatedStrategy.brandVibe && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">6. Brand Vibe:</h3>
                <div className="text-lg text-slate-800 leading-relaxed space-y-2">
                  {generatedStrategy.brandVibe.split('\n').map((line, index) => (
                    <p key={index} className={line.includes('Tone statement:') || line.includes('helping') ? 'italic' : ''} dangerouslySetInnerHTML={{ 
                      __html: line
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    }} />
                  ))}
                </div>
              </div>
            )}

            <hr className="my-8 border-t border-slate-300" />

            {/* Content Pillars */}
            {generatedStrategy.contentPillars && generatedStrategy.contentPillars.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">7. Content Pillars:</h3>
                <div className="space-y-4">
                  {generatedStrategy.contentPillars.map((pillar, index) => (
                    <div key={index} data-testid={`card-pillar-${index}`}>
                      <p className="text-lg mb-2">
                        <span className="font-bold text-slate-900">{index + 1}. {pillar.name}</span>
                      </p>
                      <p className="text-base text-slate-700 leading-relaxed mb-1" dangerouslySetInnerHTML={{ 
                        __html: pillar.explanation
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      }} />
                      {pillar.connectionToOffer && (
                        <p className="text-sm text-slate-600 italic" dangerouslySetInnerHTML={{ 
                          __html: pillar.connectionToOffer
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-8 border-t border-slate-300" />

            {/* Disruptive Angles */}
            {generatedStrategy.disruptiveAngles && generatedStrategy.disruptiveAngles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">8. Disruptive Angles:</h3>
                <ol className="space-y-3 pl-6">
                  {generatedStrategy.disruptiveAngles.map((angle, index) => (
                    <li key={index} className="text-lg text-slate-800 list-decimal" dangerouslySetInnerHTML={{ 
                      __html: angle
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    }} />
                  ))}
                </ol>
              </div>
            )}

            <hr className="my-8 border-t border-slate-300" />

            {/* Voice & Authenticity Guide */}
            {generatedStrategy.voiceAuthenticityGuide && generatedStrategy.voiceAuthenticityGuide.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">9. Voice & Authenticity Guide:</h3>
                <ul className="space-y-3 pl-6">
                  {generatedStrategy.voiceAuthenticityGuide.map((bullet, index) => (
                    <li key={index} className="text-lg text-slate-800 list-disc" dangerouslySetInnerHTML={{ 
                      __html: bullet
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    }} />
                  ))}
                </ul>
              </div>
            )}

            {/* Loading indicator for content ideas */}
            {isGeneratingIdeas && (
              <div className="mt-12 pt-8 border-t border-slate-300 flex justify-center items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                <span className="text-lg text-slate-700">Generating 10 Content Ideas...</span>
              </div>
            )}

            {/* PART 2: 10 Content Ideas */}
            {showContentIdeas && contentIdeas.length > 0 && (
              <>
                {/* Part 2 Header */}
                <div className="mt-12 mb-8 pb-6 border-t-2 border-slate-300 pt-8">
                  <h2 className="text-2xl font-bold text-coral-700">PART 2: 10 SPECIFIC CONTENT IDEAS</h2>
                </div>

                {/* Content Ideas List */}
                <div className="space-y-6">
                  {(isEditMode ? editedIdeas : contentIdeas).map((idea, index) => (
                    <div key={index} className="pb-6 border-b border-slate-300 last:border-b-0" data-testid={`content-idea-${index}`}>
                      {/* Numbered Title with Quotes */}
                      {isEditMode && editedIdeas ? (
                        <div className="space-y-3">
                          <Label className="text-sm font-bold">Title:</Label>
                          <Textarea
                            value={idea.title}
                            onChange={(e) => {
                              const newIdeas = [...editedIdeas];
                              newIdeas[index] = { ...newIdeas[index], title: e.target.value };
                              setEditedIdeas(newIdeas);
                            }}
                            className="text-lg font-bold"
                            data-testid={`textarea-idea-title-${index}`}
                          />
                          
                          <Label className="text-sm font-bold">Core Message:</Label>
                          <Textarea
                            value={idea.coreMessage}
                            onChange={(e) => {
                              const newIdeas = [...editedIdeas];
                              newIdeas[index] = { ...newIdeas[index], coreMessage: e.target.value };
                              setEditedIdeas(newIdeas);
                            }}
                            className="min-h-[80px]"
                            data-testid={`textarea-idea-message-${index}`}
                          />
                          
                          <Label className="text-sm font-bold">Format:</Label>
                          <Textarea
                            value={idea.format}
                            onChange={(e) => {
                              const newIdeas = [...editedIdeas];
                              newIdeas[index] = { ...newIdeas[index], format: e.target.value };
                              setEditedIdeas(newIdeas);
                            }}
                            data-testid={`textarea-idea-format-${index}`}
                          />
                          
                          <Label className="text-sm font-bold">Emotional Intention:</Label>
                          <Textarea
                            value={idea.emotionalIntention}
                            onChange={(e) => {
                              const newIdeas = [...editedIdeas];
                              newIdeas[index] = { ...newIdeas[index], emotionalIntention: e.target.value };
                              setEditedIdeas(newIdeas);
                            }}
                            data-testid={`textarea-idea-intention-${index}`}
                          />
                          
                          <Label className="text-sm font-bold">Call to Action:</Label>
                          <Textarea
                            value={idea.callToAction}
                            onChange={(e) => {
                              const newIdeas = [...editedIdeas];
                              newIdeas[index] = { ...newIdeas[index], callToAction: e.target.value };
                              setEditedIdeas(newIdeas);
                            }}
                            data-testid={`textarea-idea-cta-${index}`}
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-bold text-slate-900 mb-4">
                            {index + 1}. "{idea.title}"
                          </h3>

                          {/* Core Message */}
                          <p className="text-base text-slate-900 mb-2">
                            <span className="font-bold">Core Message:</span> {idea.coreMessage}
                          </p>

                          {/* Format */}
                          <p className="text-base text-slate-900 mb-2">
                            <span className="font-bold">Format:</span> {idea.format}
                          </p>

                          {/* Emotional Intention */}
                          <p className="text-base text-slate-900 mb-2">
                            <span className="font-bold">Emotional Intention:</span> {idea.emotionalIntention}
                          </p>

                          {/* CTA with quotes */}
                          <p className="text-base text-slate-900">
                            <span className="font-bold">CTA:</span> "{idea.callToAction}"
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Generate More Ideas Button */}
                <div className="mt-12 pt-8 border-t border-slate-300 flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleGenerateContentIdeas}
                    disabled={isGeneratingIdeas}
                    data-testid="button-regenerate-content-ideas"
                    style={{ backgroundColor: '#689cf2', color: 'white' }}
                    className="hover:opacity-90 text-base px-8 py-6"
                  >
                    {isGeneratingIdeas ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Ideas...
                      </>
                    ) : (
                      <>
                        🔁 Generate 10 More Ideas
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Content Strategy Generator</h3>
        <p className="text-slate-600">
          Answer a few questions about your content preferences and we'll generate personalized content pillars and ideas for you.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Strategic Content Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Content Strategy Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Posting Frequency */}
              <FormField
                control={form.control}
                name="postingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How often can you commit to posting content on one core platform every week?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-posting-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {postingFrequencies.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Core Platform */}
              <FormField
                control={form.control}
                name="corePlatform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What will be your one core platform you focus on?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-core-platform">
                          <SelectValue placeholder="Select your core platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Format */}
              <FormField
                control={form.control}
                name="contentFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What will be your consistent form of weekly content creation? (Podcast, Youtube, Social video series)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-content-format">
                          <SelectValue placeholder="Select your content format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contentFormats.map((format) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Emotional Impact */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="desiredFeelings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1. How do you want people to feel when they interact with your content?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., safe, inspired, empowered, energized, challenged..."
                          className="min-h-[80px]"
                          data-testid="textarea-desired-feelings"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avoidFeelings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2. What do you NOT want people to feel?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., confused, pressured, overwhelmed, unseen..."
                          className="min-h-[80px]"
                          data-testid="textarea-avoid-feelings"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Brand Identity */}
              <FormField
                control={form.control}
                name="brandAdjectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3. List 3–5 brand adjectives</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., bold, grounded, warm, innovative, authentic..."
                        className="min-h-[60px]"
                        data-testid="textarea-brand-adjectives"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Core Content Themes */}
              <FormField
                control={form.control}
                name="coreThemes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>4. What are the 3–4 biggest themes or truths your audience needs to understand before they're ready to buy from you?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the key concepts, mindset shifts, or truths that prepare your audience..."
                        className="min-h-[100px]"
                        data-testid="textarea-core-themes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Problems & Myths */}
              <FormField
                control={form.control}
                name="problemsMyths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>5. What common problems, mistakes, or myths do you want to call out and address?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Identify misconceptions, common mistakes, or industry myths you want to debunk..."
                        className="min-h-[100px]"
                        data-testid="textarea-problems-myths"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Values & Beliefs */}
              <FormField
                control={form.control}
                name="valuesBeliefs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6. What values or beliefs do you want to consistently reinforce in your content?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share the core values and beliefs that should thread through all your content..."
                        className="min-h-[100px]"
                        data-testid="textarea-values-beliefs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contrarian Takes */}
              <FormField
                control={form.control}
                name="contrarianTakes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>7. What are 3-5 contrarian or disruptive takes you have in your niche?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your unique perspectives that challenge conventional wisdom..."
                        className="min-h-[100px]"
                        data-testid="textarea-contrarian-takes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actionable Tips */}
              <FormField
                control={form.control}
                name="actionableTips"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>8. What's a quick tip, tool, or framework that would help your audience take action today?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide practical, actionable advice your audience can implement immediately..."
                        className="min-h-[100px]"
                        data-testid="textarea-actionable-tips"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Common Objections */}
              <FormField
                control={form.control}
                name="commonObjections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>9. What's a common question or objection your audience has?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Identify the questions, concerns, or objections you hear repeatedly..."
                        className="min-h-[100px]"
                        data-testid="textarea-common-objections"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Belief Shifts */}
              <FormField
                control={form.control}
                name="beliefShifts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>10. What's a belief shift your audience needs to make to move closer to working with and trusting you?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the mindset or belief change that's crucial for your audience's transformation..."
                        className="min-h-[100px]"
                        data-testid="textarea-belief-shifts"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Authentic Truths */}
              <FormField
                control={form.control}
                name="authenticTruths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>11. What truth or belief do you want to shout from the rooftops that scares you to say, but would set your people free?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share the bold truth you're afraid to say but know would transform your audience..."
                        className="min-h-[100px]"
                        data-testid="textarea-authentic-truths"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Key Message */}
              <FormField
                control={form.control}
                name="keyMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>12. If your audience remembered only one thing from your content, what would it be?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Identify the single most important message or takeaway from all your content..."
                        className="min-h-[100px]"
                        data-testid="textarea-key-message"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Authentic Voice */}
              <FormField
                control={form.control}
                name="authenticVoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>13. How can you say this in a way that feels authentic to your voice (not generic)?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe how you'll communicate these messages in your unique, authentic voice..."
                        className="min-h-[100px]"
                        data-testid="textarea-authentic-voice"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>


          {/* Generate Button */}
          <div className="flex justify-center pt-6">
            <Button 
              type="submit" 
              size="lg" 
              disabled={generateStrategyMutation.isPending || isGeneratingIdeas}
              className="min-w-[200px]"
              data-testid="button-generate-strategy"
            >
              {generateStrategyMutation.isPending || isGeneratingIdeas ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {generateStrategyMutation.isPending ? 'Generating Strategy...' : 'Generating Ideas...'}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Content Strategy
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {generateStrategyMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to generate content strategy. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
