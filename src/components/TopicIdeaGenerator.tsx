import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, RefreshCw, Copy, CheckCircle, BookOpen, Target, Save, X, Video, Heart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface TopicIdea {
  title: string;
  description: string;
  emotionalHook: string;
  contentType: string;
  keyPoints: string[];
  reelIdeas: string[];
}

interface TopicIdeaGeneratorProps {
  userId: number;
}

export default function TopicIdeaGenerator({ userId }: TopicIdeaGeneratorProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [topicIdeas, setTopicIdeas] = useState<TopicIdea[]>([]);
  const [savedTopics, setSavedTopics] = useState<TopicIdea[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [messagingStrategy, setMessagingStrategy] = useState<any>(null);

  useEffect(() => {
    // Load messaging strategy from database API
    const loadMessagingStrategy = async () => {
      try {
        // First try to get from database
        const response = await apiRequest('GET', `/api/workbook-responses/user/${userId}/step/1`);
        if (response.ok) {
          const workbookResponses = await response.json();
          if (workbookResponses && workbookResponses.length > 0) {
            // Convert workbook responses to messaging strategy format
            const strategy: any = {};
            workbookResponses.forEach((response: any) => {
              if (response.promptKey && response.responseText) {
                strategy[response.promptKey] = response.responseText;
              } else if (response.questionKey && response.responseText) {
                strategy[response.questionKey] = response.responseText;
              }
            });
            setMessagingStrategy(strategy);
            return;
          }
        }
      } catch (error) {
        console.log('Could not load from database, trying localStorage');
      }

      // Fallback to localStorage
      const messagingKeys = [`messaging-strategy-${userId}`, 'generated-messaging-strategy'];
      for (const key of messagingKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const strategy = JSON.parse(stored);
            setMessagingStrategy(strategy);
            break;
          } catch (e) {
            console.log('Could not parse messaging strategy');
          }
        }
      }
    };

    loadMessagingStrategy();

    // Load saved topics from localStorage
    const savedTopicsKey = `saved-topics-${userId}`;
    const storedSavedTopics = localStorage.getItem(savedTopicsKey);
    if (storedSavedTopics) {
      try {
        setSavedTopics(JSON.parse(storedSavedTopics));
      } catch (e) {
        console.log('Could not parse saved topics');
      }
    }

    // Load current topic ideas from localStorage
    const topicIdeasKey = `topic-ideas-${userId}`;
    const storedTopicIdeas = localStorage.getItem(topicIdeasKey);
    if (storedTopicIdeas) {
      try {
        setTopicIdeas(JSON.parse(storedTopicIdeas));
      } catch (e) {
        console.log('Could not parse topic ideas');
      }
    }
  }, [userId]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/generate-topic-ideas', {
        userId,
        messagingStrategy
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const newTopicIdeas = data.topicIdeas || [];
      setTopicIdeas(newTopicIdeas);
      // Persist topic ideas to localStorage
      localStorage.setItem(`topic-ideas-${userId}`, JSON.stringify(newTopicIdeas));
      
      toast({
        title: "Content ideas generated!",
        description: `Created ${newTopicIdeas.length} strategic content ideas based on your messaging strategy.`
      });
    },
    onError: (error) => {
      console.error('Error generating topic ideas:', error);
      
      try {
        const errorData = JSON.parse(error.message);
        
        if (errorData.type === 'INSUFFICIENT_DATA' || errorData.type === 'MISSING_STRATEGY') {
          toast({
            title: "Complete your foundation first",
            description: errorData.error,
            variant: "destructive",
            action: (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/step/1')}
              >
                Go to Step 1
              </Button>
            )
          });
        } else {
          toast({
            title: "Generation failed",
            description: "Unable to generate content ideas right now. Please try again.",
            variant: "destructive"
          });
        }
      } catch {
        toast({
          title: "Generation failed", 
          description: "Unable to generate content ideas right now. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const handleGenerateIdeas = () => {
    if (!messagingStrategy) {
      toast({
        title: "Complete your messaging strategy first",
        description: "Please finish Step 1 (Your Messaging) to generate personalized content ideas.",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/step/1')}
          >
            Go to Step 1
          </Button>
        )
      });
      return;
    }
    generateMutation.mutate();
  };

  const saveTopic = (topic: TopicIdea) => {
    const updatedSavedTopics = [...savedTopics, topic];
    setSavedTopics(updatedSavedTopics);
    localStorage.setItem(`saved-topics-${userId}`, JSON.stringify(updatedSavedTopics));
    
    // Remove from current ideas and update localStorage
    const updatedTopicIdeas = topicIdeas.filter(t => t.title !== topic.title);
    setTopicIdeas(updatedTopicIdeas);
    localStorage.setItem(`topic-ideas-${userId}`, JSON.stringify(updatedTopicIdeas));
  };

  const discardTopic = (topic: TopicIdea) => {
    const updatedTopicIdeas = topicIdeas.filter(t => t.title !== topic.title);
    setTopicIdeas(updatedTopicIdeas);
    // Update localStorage
    localStorage.setItem(`topic-ideas-${userId}`, JSON.stringify(updatedTopicIdeas));
  };

  const removeSavedTopic = (topic: TopicIdea) => {
    const updatedSavedTopics = savedTopics.filter(t => t.title !== topic.title);
    setSavedTopics(updatedSavedTopics);
    localStorage.setItem(`saved-topics-${userId}`, JSON.stringify(updatedSavedTopics));
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text');
    }
  };

  const formatTopicForCopy = (topic: TopicIdea) => {
    return `${topic.title}

${topic.description}

Emotional Hook: ${topic.emotionalHook}

Key Points:
${topic.keyPoints.map(point => `• ${point}`).join('\n')}

Content Type: ${topic.contentType}

Reel Ideas:
${topic.reelIdeas.map(idea => `• ${idea}`).join('\n')}`;
  };

  if (!messagingStrategy) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Lightbulb className="w-5 h-5" />
            Strategic Content Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <BookOpen className="w-4 h-4" />
            <AlertDescription>
              Complete your messaging strategy first to generate personalized content ideas based on your ideal customer's emotions and pain points.
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-3">
            <Button
              onClick={() => setLocation('/step/1')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Complete Your Messaging Strategy
            </Button>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Want to See How It Works?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Try the generator with example messaging strategy to see what kind of content ideas you'll get.
              </p>
              <Button
                onClick={() => {
                  // Load sample data for testing
                  const sampleData = {
                    "WHY did you start your business? What makes you uniquely qualified to help your customers?": "I started my business after burning out as a corporate executive and realizing that most entrepreneurs are making the same mistakes I made - trying to do everything themselves and losing their passion in the process. I have 15 years of executive experience plus 5 years helping over 200 entrepreneurs build sustainable, profitable businesses without sacrificing their sanity.",
                    "What are your ideal customer's demographics (age range, income level, job title, gender)?": "Women entrepreneurs, ages 35-50, making $50k-$200k annually, often in service-based businesses like coaching, consulting, or online courses. Many are mothers juggling business and family.",
                    "What does your ideal customer's frustration look like day-to-day?": "They're working 60+ hour weeks, constantly switching between business tasks and feeling like they're failing at both business and life. They check emails at dinner, work weekends, and feel guilty when they take breaks.",
                    "What keeps your ideal customer awake at night worrying?": "That they're going to burn out completely and lose everything they've worked for. They worry they're not good enough entrepreneurs, that they're failing their families, and that they'll never achieve the freedom they started their business for.",
                    "What would your ideal customer's perfect day look like after working with you?": "They wake up refreshed, work focused 6-hour days on high-impact activities, have systems running their business, take guilt-free breaks, enjoy dinner with family without checking phones, and feel proud of both their business success and life balance.",
                    "What are your company values that you'd want to come through in your messaging?": "Authenticity, sustainable growth, work-life integration, and empowering entrepreneurs to build businesses that serve their lives rather than consume them.",
                    "How do you want people to FEEL when they interact with your brand?": "Hopeful, understood, and confident that they can build a successful business without burning out. I want them to feel like someone finally 'gets' their struggle and has a real solution."
                  };
                  localStorage.setItem(`messaging-strategy-${userId}`, JSON.stringify(sampleData));
                  window.location.reload();
                }}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Try with Example Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show initial header only if no ideas have been generated and no saved topics */}
      {topicIdeas.length === 0 && savedTopics.length === 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <CardTitle className="text-lg text-blue-900">Strategic Content Ideas</CardTitle>
              </div>
              <Button
                onClick={handleGenerateIdeas}
                disabled={generateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Generate Ideas
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Simplified header when content exists */}
      {(topicIdeas.length > 0 || savedTopics.length > 0) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Strategic Content Ideas</h2>
          </div>
          <Button
            onClick={handleGenerateIdeas}
            disabled={generateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate More Ideas
              </>
            )}
          </Button>
        </div>
      )}

      {/* Saved Topics Section */}
      {savedTopics.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg text-green-900">Saved Topics ({savedTopics.length})</CardTitle>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Your saved content ideas for future reference and implementation.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {savedTopics.map((topic, index) => (
                <Card key={index} className="border-green-200 bg-white">
                  <CardHeader className="pb-2">
                    <h4 className="font-semibold text-gray-800 text-sm leading-relaxed">
                      {topic.title}
                    </h4>
                    <p className="text-xs text-green-600 font-medium">
                      {topic.contentType}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        {topic.description}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => copyToClipboard(formatTopicForCopy(topic), -1)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => removeSavedTopic(topic)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {topicIdeas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {topicIdeas.map((topic, index) => (
            <Card key={index} className="border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 mb-2">{topic.title}</CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {topic.contentType}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {topic.description}
                </p>
                
                <div className="bg-orange-50 border-l-4 border-orange-300 p-3 rounded">
                  <p className="text-sm text-orange-800">
                    <strong>Emotional Hook:</strong> {topic.emotionalHook}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Key Points to Cover:
                  </h4>
                  <ul className="space-y-1">
                    {topic.keyPoints.map((point, pointIndex) => (
                      <li key={pointIndex} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-500" />
                    Reel Ideas:
                  </h4>
                  <ul className="space-y-1">
                    {topic.reelIdeas.map((reelIdea, reelIndex) => (
                      <li key={reelIndex} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                        {reelIdea}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={() => saveTopic(topic)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => discardTopic(topic)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Discard
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(formatTopicForCopy(topic), index)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {topicIdeas.length === 0 && !generateMutation.isPending && (
        <Card className="border-gray-200">
          <CardContent className="text-center py-12">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Content Ideas</h3>
            <p className="text-gray-600 mb-4">
              Click "Generate Ideas" to create personalized content topics based on your messaging strategy and ideal customer insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
