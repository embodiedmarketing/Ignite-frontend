import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  MapPin,
  Users,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  Calendar,
  ArrowRight,
  Edit,
  AlertTriangle,
  X,
  Briefcase,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWorkbookResponses } from "@/hooks/useDatabasePersistence";
import { validateAndNotify } from "@/utils/prerequisite-validator";

interface CustomerLocationFinderProps {
  userId: number;
}

interface LocationSuggestion {
  category: string;
  platform: string;
  specificLocation: string;
  reasoning: string;
  connectionStrategy: string;
  estimatedAudience: string;
}

interface LocationFinderResult {
  suggestions: LocationSuggestion[];
  summary: string;
  nextSteps: string[];
}

export default function CustomerLocationFinder({
  userId,
}: CustomerLocationFinderProps) {
  const [activeTab, setActiveTab] = useState("locations");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<LocationFinderResult | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<
    LocationSuggestion[]
  >([]);
  const [connectionStrategies, setConnectionStrategies] = useState<
    Record<string, string>
  >({});
  const [dailyPlan, setDailyPlan] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [addedSuggestionIds, setAddedSuggestionIds] = useState<string[]>([]);

  // Database persistence for Step 4
  const {
    responses: step4Responses,
    updateResponse: updateStep4Response,
    isLoading: step4Loading,
  } = useWorkbookResponses(userId, 4);

  // Load data from database and localStorage on mount
  useEffect(() => {
    // Load AI suggestions from database first, fallback to localStorage
    if (step4Responses["ai-location-suggestions"]) {
      try {
        const parsed = JSON.parse(step4Responses["ai-location-suggestions"]);
        setResults(parsed);
      } catch (error) {
        console.error("Error parsing AI suggestions from database:", error);
      }
    } else {
      // Fallback to localStorage for existing data
      const savedSuggestions = localStorage.getItem(
        `ai-location-suggestions-${userId}`
      );
      if (savedSuggestions) {
        try {
          const parsed = JSON.parse(savedSuggestions);
          setResults(parsed);
        } catch (error) {
          console.error("Error loading saved suggestions:", error);
        }
      }
    }

    // Load sales strategy responses from database
    const strategyKeys = [
      "customer_locations",
      "networking",
      "approach",
      "content_strategy",
    ];
    const loadedStrategies: Record<string, string> = {};

    strategyKeys.forEach((key) => {
      if (step4Responses[`sales-strategy-${key}`]) {
        loadedStrategies[key] = step4Responses[`sales-strategy-${key}`];
      }
    });

    if (Object.keys(loadedStrategies).length > 0) {
      setConnectionStrategies(loadedStrategies);
    } else {
      // Fallback to localStorage
      const savedStrategies = localStorage.getItem(
        `sales-strategy-responses-${userId}`
      );
      if (savedStrategies) {
        try {
          const parsed = JSON.parse(savedStrategies);
          setConnectionStrategies(parsed);
        } catch (error) {
          console.error("Error loading saved sales strategy responses:", error);
        }
      }
    }

    // Load daily plan from database
    if (step4Responses["daily-connection-plan"]) {
      setDailyPlan(step4Responses["daily-connection-plan"]);
    } else {
      // Fallback to localStorage
      const savedDailyPlan = localStorage.getItem(
        `daily-connection-plan-${userId}`
      );
      if (savedDailyPlan) {
        setDailyPlan(savedDailyPlan);
      }
    }
  }, [userId, step4Responses]);

  // Save AI suggestions to database when they change
  useEffect(() => {
    if (results && updateStep4Response) {
      updateStep4Response.mutate(
        "ai-location-suggestions",
        JSON.stringify(results)
      );
    }
  }, [results, updateStep4Response]);

  // Save connection strategies to database
  const saveConnectionStrategy = (key: string, value: string) => {
    if (updateStep4Response && value.trim()) {
      updateStep4Response.mutate(`sales-strategy-${key}`, value);
    }
  };

  // Save daily plan to database
  const saveDailyPlan = (plan: string) => {
    if (updateStep4Response && plan.trim()) {
      updateStep4Response.mutate("daily-connection-plan", plan);
    }
  };

  // Function to add a suggestion to the brainstorming list with clickable links
  const addToList = (suggestion: LocationSuggestion) => {
    const currentList = connectionStrategies.customer_locations || "";

    // Create unique ID for this suggestion
    const suggestionId = `${suggestion.platform}-${suggestion.specificLocation}`;

    // Check if this suggestion is already in the list
    if (
      currentList
        .toLowerCase()
        .includes(suggestion.specificLocation.toLowerCase()) ||
      addedSuggestionIds.includes(suggestionId)
    ) {
      return; // Don't add duplicates
    }

    // Create entry with clickable link if applicable
    let newEntry = "";
    if (
      suggestion.specificLocation.includes("@") ||
      suggestion.specificLocation.includes("r/") ||
      suggestion.specificLocation.includes("(")
    ) {
      const link = getDirectLink(
        suggestion.specificLocation,
        suggestion.platform
      );
      if (link) {
        newEntry = `${suggestion.specificLocation} (${link}) - ${suggestion.reasoning}`;
      } else {
        newEntry = `${suggestion.specificLocation} - ${suggestion.reasoning}`;
      }
    } else {
      newEntry = `${suggestion.specificLocation} - ${suggestion.reasoning}`;
    }

    const updatedList = currentList
      ? `${currentList}\n\n${newEntry}`
      : newEntry;

    setConnectionStrategies({
      ...connectionStrategies,
      customer_locations: updatedList,
    });

    // Add to tracking list to remove from suggestions
    setAddedSuggestionIds([...addedSuggestionIds, suggestionId]);
  };

  // Remove a specific location from the customer locations list
  const removeLocation = (indexToRemove: number) => {
    const currentLocations = connectionStrategies.customer_locations || "";
    const locationArray = currentLocations
      .split("\n\n")
      .filter((loc) => loc.trim());

    // Remove the location at the specified index
    locationArray.splice(indexToRemove, 1);

    // Update the state with the remaining locations
    setConnectionStrategies({
      ...connectionStrategies,
      customer_locations: locationArray.join("\n\n"),
    });
  };

  // Auto-save connection strategies to database when they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      Object.entries(connectionStrategies).forEach(([key, value]) => {
        if (value.trim()) {
          saveConnectionStrategy(key, value);
        }
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [connectionStrategies]);

  // Auto-save daily plan to database when it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dailyPlan.trim()) {
        saveDailyPlan(dailyPlan);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [dailyPlan]);

  const getMessageTemplate = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return "Hi [Name], I noticed your recent post about [specific challenge/topic]. I've helped several [their role] overcome similar challenges with [brief value statement]. Would love to share a resource that might help - no strings attached. Are you open to a quick connection?";
      case "facebook groups":
        return "Hey [Name], I saw your question about [specific issue]. I actually created a simple [resource/tool] that addresses exactly this problem. Happy to share it with you if it would be helpful!";
      case "local business events":
        return "Hi [Name], great meeting you at [event name]. I really enjoyed our conversation about [topic you discussed]. I'd love to continue our chat over coffee sometime - when works best for you?";
      case "instagram":
        return "Love your recent post about [specific content]! I've been working with [their type of business] on similar challenges. Would you be interested in a free [resource/tool] I created for [their specific situation]?";
      case "industry forums":
        return "Great question about [specific topic]! I've seen this challenge come up a lot. Here's a [resource/approach] that's worked well for others in similar situations: [brief helpful tip]. Hope this helps!";
      case "online conferences":
        return "Hi [Name], really enjoyed your participation in [event name]. Your question about [topic] resonated with me. I've got some insights that might help - would you be open to a brief chat?";
      default:
        return "Hi [Name], I noticed [specific observation about their content/profile]. I've been helping [their type of business/role] with [relevant challenge]. Would love to share [specific value] that might be helpful. Are you open to connecting?";
    }
  };

  const analyzeCustomerLocations = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Get messaging strategy data from localStorage
      const messagingStrategy = JSON.parse(
        localStorage.getItem(`step-1-responses-${userId}`) || "{}"
      );

      // Validate prerequisites before generation
      const isValid = validateAndNotify(
        { messagingStrategy: true },
        { messagingStrategy }
      );

      if (!isValid) {
        throw new Error("Missing prerequisites");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/generate-customer-locations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            messagingStrategy,
            existingLocations: connectionStrategies.customer_locations || "",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Failed to generate customer location suggestions"
        );
      }

      const locations: LocationFinderResult = await response.json();

      setResults(locations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while analyzing customer locations"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const CategoryIcon = ({ category }: { category: string }) => {
    switch (category.toLowerCase()) {
      case "social media":
        return <MessageCircle className="w-4 h-4" />;
      case "communities":
        return <Users className="w-4 h-4" />;
      case "networking":
        return <MapPin className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getDirectLink = (location: string, platform: string): string | null => {
    // Instagram influencers
    if (location.includes("@amyporterfield"))
      return "https://www.instagram.com/amyporterfield/";
    if (location.includes("@garyvee"))
      return "https://www.instagram.com/garyvee/";
    if (location.includes("@marieforleo"))
      return "https://www.instagram.com/marieforleo/";
    if (location.includes("@jenna_kutcher"))
      return "https://www.instagram.com/jenna_kutcher/";
    if (location.includes("@jasminealicia"))
      return "https://www.instagram.com/jasminealicia/";
    if (location.includes("@brendonburchard"))
      return "https://www.instagram.com/brendonburchard/";
    if (location.includes("@tonyrobbins"))
      return "https://www.instagram.com/tonyrobbins/";
    if (location.includes("@melrobbins"))
      return "https://www.instagram.com/melrobbins/";
    if (location.includes("@tailopez"))
      return "https://www.instagram.com/tailopez/";
    if (location.includes("@brennandunn"))
      return "https://www.instagram.com/brennandunn/";
    if (location.includes("@kaleighmoore"))
      return "https://www.instagram.com/kaleighmoore/";
    if (location.includes("@teachable"))
      return "https://www.instagram.com/teachable/";
    if (location.includes("@thinkific"))
      return "https://www.instagram.com/thinkific/";
    if (location.includes("@rachel.pedersen"))
      return "https://www.instagram.com/rachel.pedersen/";
    if (location.includes("@patflynn"))
      return "https://www.instagram.com/patflynn/";
    if (location.includes("@lewishowes"))
      return "https://www.instagram.com/lewishowes/";
    if (location.includes("@rachealkwacz"))
      return "https://www.instagram.com/rachealkwacz/";

    // Facebook Groups (search URLs)
    if (location.includes("Business Coach Institute"))
      return "https://www.facebook.com/search/groups/?q=business%20coach%20institute";
    if (location.includes("Boss Babes Community"))
      return "https://www.facebook.com/search/groups/?q=boss%20babes%20community";
    if (location.includes("Female Entrepreneur Association"))
      return "https://www.facebook.com/search/groups/?q=female%20entrepreneur%20association";
    if (location.includes("Social Media Examiner Society"))
      return "https://www.facebook.com/search/groups/?q=social%20media%20examiner%20society";
    if (location.includes("Blogging Boost"))
      return "https://www.facebook.com/search/groups/?q=blogging%20boost";
    if (location.includes("Six Figure Freelancers"))
      return "https://www.facebook.com/search/groups/?q=six%20figure%20freelancers";
    if (location.includes("Smart Passive Income Community"))
      return "https://www.facebook.com/search/groups/?q=smart%20passive%20income%20community";
    if (location.includes("Young Entrepreneur Council"))
      return "https://www.facebook.com/search/groups/?q=young%20entrepreneur%20council%20YEC";
    if (location.includes("Entrepreneurs' Organization"))
      return "https://www.facebook.com/search/groups/?q=entrepreneurs%20organization%20EO";
    if (location.includes("Content Creator Coalition"))
      return "https://www.facebook.com/search/groups/?q=content%20creator%20coalition";
    if (location.includes("Freelancers Union"))
      return "https://www.facebook.com/search/groups/?q=freelancers%20union%20community";
    if (location.includes("Course Creator Community"))
      return "https://www.facebook.com/search/groups/?q=course%20creator%20community%20amy%20porterfield";
    if (location.includes("Digital Marketer Engage"))
      return "https://www.facebook.com/search/groups/?q=digital%20marketer%20engage";

    // Reddit communities
    if (location.includes("r/entrepreneur"))
      return "https://www.reddit.com/r/entrepreneur/";
    if (location.includes("r/marketing"))
      return "https://www.reddit.com/r/marketing/";
    if (location.includes("r/freelance"))
      return "https://www.reddit.com/r/freelance/";
    if (location.includes("r/careerguidance"))
      return "https://www.reddit.com/r/careerguidance/";

    // LinkedIn Groups (search URLs)
    if (location.includes("Content Marketing Institute"))
      return "https://www.linkedin.com/search/results/groups/?keywords=content%20marketing%20institute";

    // Podcast/Social searches
    if (location.includes("Online Marketing Made Easy"))
      return "https://www.amyporterfield.com/podcast/";
    if (location.includes("School of Greatness"))
      return "https://lewishowes.com/sogpodcast/";

    // Conference/Event sites
    if (location.includes("Social Media Marketing World"))
      return "https://www.socialmediaexaminer.com/smmworld/";

    return null;
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "locations":
        return <MapPin className="w-4 h-4" />;
      case "messages":
        return <MessageCircle className="w-4 h-4" />;
      case "plan":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const renderStepOne = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Strategy Overview: Your Customer Connection Plan
        </h3>
        <p className="text-slate-600">
          Map your existing network and discover new potential customer
          locations
        </p>
      </div>

      {/* Networking Questions Section */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-900">
            <Users className="w-5 h-5 mr-2" />
            Start With Your Network
          </CardTitle>
          <p className="text-sm text-green-700">
            Your existing connections are often your fastest path to first
            customers
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Who are 20 people in your network you can personally reach out to
              that would be a fit for your offer?
            </label>
            <p className="text-sm text-slate-600 italic mb-2">
              Remember, you're building a connection with them not immediately
              reaching out to pitch them
            </p>
            <Textarea
              placeholder="List friends, family, colleagues, former clients, social media connections who might be interested or could refer others..."
              value={connectionStrategies.network_contacts || ""}
              onChange={(e) =>
                setConnectionStrategies({
                  ...connectionStrategies,
                  network_contacts: e.target.value,
                })
              }
              rows={4}
              spellCheck={true}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              What partnerships or collaborations could help amplify your reach?
            </label>
            <Textarea
              placeholder="Think about complementary service providers, industry peers, referral partners, affiliate opportunities..."
              value={connectionStrategies.partnerships || ""}
              onChange={(e) =>
                setConnectionStrategies({
                  ...connectionStrategies,
                  partnerships: e.target.value,
                })
              }
              rows={3}
              spellCheck={true}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Location Brainstorming Section */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-900">
            <Search className="w-5 h-5 mr-2" />
            Where Can You Find Your Ideal Customers?
          </CardTitle>
          <p className="text-sm text-purple-700">
            List all the places where your ideal customers spend time online and
            offline
          </p>
          <p className="text-sm text-purple-600 italic mt-1">
            Note: You can also use the AI tool below to find additional places
            your ideal customer may be hanging out but don't only depend on that
            tool. Use your knowledge as well to add some ideas!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Brainstorm everywhere your ideal customers might gather or hang
              out
            </label>
            <p className="text-sm text-slate-600 italic mb-2">
              Think Facebook groups, LinkedIn communities, industry events,
              forums, local meetups, professional associations, online
              platforms, etc.
            </p>
            {/* Display customer locations with clickable links */}
            {connectionStrategies.customer_locations &&
            connectionStrategies.customer_locations.trim() ? (
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border max-h-40 overflow-y-auto">
                  {connectionStrategies.customer_locations
                    .split("\n\n")
                    .filter((loc) => loc.trim())
                    .map((location, index) => {
                      // Extract URL from parentheses if present
                      const urlMatch = location.match(
                        /\((https?:\/\/[^\)]+)\)/
                      );
                      const url = urlMatch ? urlMatch[1] : null;
                      const cleanText = location
                        .replace(/\([^)]*\)/g, "")
                        .trim();

                      return (
                        <div key={index} className="text-sm mb-2 last:mb-0">
                          {url ? (
                            <div className="flex items-start gap-2">
                              <span className="flex-1">{cleanText}</span>
                              <div className="flex gap-1">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                                >
                                  <Search className="w-3 h-3" />
                                  Visit
                                </a>
                                <button
                                  onClick={() => removeLocation(index)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
                                  title="Remove this location"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <span className="flex-1">{location}</span>
                              <button
                                onClick={() => removeLocation(index)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
                                title="Remove this location"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center">
                <p className="text-sm text-gray-600">
                  No customer locations added yet.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Use the AI tool below or manually type locations to get
                  started.
                </p>
              </div>
            )}

            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={analyzeCustomerLocations}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Get AI Suggestions
                    </>
                  )}
                </Button>

                {connectionStrategies.customer_locations && (
                  <Button
                    onClick={() => {
                      // Only reset the suggestion tracking, keep existing locations
                      setAddedSuggestionIds([]);
                      analyzeCustomerLocations();
                    }}
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    disabled={isAnalyzing}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fresh Ideas
                  </Button>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Add locations manually (optional)
                </label>
                <Textarea
                  placeholder="Type additional locations here..."
                  value={connectionStrategies.manual_locations || ""}
                  onChange={(e) => {
                    const manualText = e.target.value.trim();
                    if (manualText) {
                      const currentLocations =
                        connectionStrategies.customer_locations || "";
                      const combinedLocations = currentLocations
                        ? `${currentLocations}\n\n${manualText}`
                        : manualText;

                      setConnectionStrategies({
                        ...connectionStrategies,
                        customer_locations: combinedLocations,
                        manual_locations: "",
                      });
                    } else {
                      setConnectionStrategies({
                        ...connectionStrategies,
                        manual_locations: e.target.value,
                      });
                    }
                  }}
                  rows={3}
                  spellCheck={true}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Location Finder Section */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <MapPin className="w-5 h-5 mr-2" />
            Finding New Potential Customers
          </CardTitle>
          <p className="text-sm text-blue-700">
            Get AI-powered suggestions for where to find your ideal customers
            based on your customer avatar
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!results && !isAnalyzing && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 mb-4">
                Click below to generate personalized location suggestions based
                on your messaging strategy.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={analyzeCustomerLocations}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Your Customer Avatar...
                    </>
                  ) : (
                    "Generate Location Suggestions"
                  )}
                </Button>
                {results && (
                  <Button
                    onClick={() => {
                      setResults(null);
                      setAddedSuggestionIds([]);
                      analyzeCustomerLocations();
                    }}
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fresh Ideas
                  </Button>
                )}
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">
                Analyzing your customer avatar to find the best places to
                connect...
              </p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-slate-900 mb-2">Summary</h4>
                <p className="text-sm text-slate-600">{results.summary}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">
                  Location Suggestions
                </h4>
                {results.suggestions
                  .filter((suggestion) => {
                    const suggestionId = `${suggestion.platform}-${suggestion.specificLocation}`;
                    return !addedSuggestionIds.includes(suggestionId);
                  })
                  .map((suggestion, index) => (
                    <Card key={index} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CategoryIcon category={suggestion.category} />
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.estimatedAudience}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToList(suggestion)}
                            className="text-xs px-3 py-1 h-auto bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                          >
                            Add to List
                          </Button>
                        </div>

                        <h5 className="font-medium text-slate-900 mb-2">
                          {suggestion.platform}
                        </h5>
                        <div className="mb-3">
                          {suggestion.specificLocation.includes("@") ||
                          suggestion.specificLocation.includes("r/") ||
                          suggestion.specificLocation.includes("(") ? (
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-blue-700">
                                {suggestion.specificLocation}
                              </p>
                              {(() => {
                                const link = getDirectLink(
                                  suggestion.specificLocation,
                                  suggestion.platform
                                );
                                return (
                                  link && (
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                                    >
                                      <Search className="w-3 h-3" />
                                      Visit
                                    </a>
                                  )
                                );
                              })()}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700">
                              {suggestion.specificLocation}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <strong className="text-slate-700">
                              Why this works:
                            </strong>
                            <p className="text-slate-600">
                              {suggestion.reasoning}
                            </p>
                          </div>
                          <div>
                            <strong className="text-slate-700">
                              Connection strategy:
                            </strong>
                            <p className="text-slate-600">
                              {suggestion.connectionStrategy}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Develop Your Connection Messages
        </h3>
        <p className="text-slate-600">
          Create personalized outreach messages for different platforms and
          situations
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-3">
            View sample sales conversations based on authentic connections and
            relationship-building approach
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() =>
              window.open(
                "https://drive.google.com/file/d/1lkvAUk4ITP2Qw83KlsZOZ3-R5i17ZM9B/view?usp=sharing",
                "_blank"
              )
            }
          >
            <Briefcase className="w-4 h-4 mr-2" />
            View Sales Conversation Examples
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Write Your Own Conversation Starters */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">
              Write Your Own Conversation Starters
            </CardTitle>
            <p className="text-sm text-green-700">
              Create customizable message templates for different situations
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Initial Connection Template */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-slate-900">
                  Initial Connection
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setConnectionStrategies({
                      ...connectionStrategies,
                      custom_initial:
                        "Hi [Name], I noticed [specific observation about their content/profile]. I've been helping [their type of business/role] with [relevant challenge]. Would love to share [specific value] that might be helpful. Are you open to connecting?",
                    })
                  }
                  className="text-xs"
                >
                  Use This Template
                </Button>
              </div>
              <div className="bg-white p-3 rounded-lg border mb-3">
                <p className="text-xs text-slate-500 mb-2">
                  Template starting point:
                </p>
                <p className="text-sm text-slate-600 italic">
                  Hi [Name], I noticed [specific observation about their
                  content/profile]. I've been helping [their type of
                  business/role] with [relevant challenge]. Would love to share
                  [specific value] that might be helpful. Are you open to
                  connecting?
                </p>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Customize your initial connection message..."
                  value={connectionStrategies.custom_initial || ""}
                  onChange={(e) =>
                    setConnectionStrategies({
                      ...connectionStrategies,
                      custom_initial: e.target.value,
                    })
                  }
                  rows={4}
                  spellCheck={true}
                  className="text-sm flex-1"
                />
                {connectionStrategies.custom_initial && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        connectionStrategies.custom_initial
                      );
                    }}
                    className="h-fit"
                  >
                    Copy
                  </Button>
                )}
              </div>
            </div>

            {/* Value-First Follow Up Template */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-slate-900">
                  Value-First Follow Up
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setConnectionStrategies({
                      ...connectionStrategies,
                      custom_followup:
                        "Hi [Name], I came across [relevant resource/article] and thought of your [specific challenge/situation]. It covers [brief description of value]. Thought you might find it helpful! No strings attached - just wanted to share something useful.",
                    })
                  }
                  className="text-xs"
                >
                  Use This Template
                </Button>
              </div>
              <div className="bg-white p-3 rounded-lg border mb-3">
                <p className="text-xs text-slate-500 mb-2">
                  Template starting point:
                </p>
                <p className="text-sm text-slate-600 italic">
                  Hi [Name], I came across [relevant resource/article] and
                  thought of your [specific challenge/situation]. It covers
                  [brief description of value]. Thought you might find it
                  helpful! No strings attached - just wanted to share something
                  useful.
                </p>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Customize your follow-up message..."
                  value={connectionStrategies.custom_followup || ""}
                  onChange={(e) =>
                    setConnectionStrategies({
                      ...connectionStrategies,
                      custom_followup: e.target.value,
                    })
                  }
                  rows={3}
                  spellCheck={true}
                  className="text-sm flex-1"
                />
                {connectionStrategies.custom_followup && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        connectionStrategies.custom_followup
                      );
                    }}
                    className="h-fit"
                  >
                    Copy
                  </Button>
                )}
              </div>
            </div>

            {/* Soft Offer Introduction Template */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-slate-900">
                  Soft Offer Introduction
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setConnectionStrategies({
                      ...connectionStrategies,
                      custom_offer:
                        "Hey [Name], based on our conversation about [specific topic], I've been thinking about [their challenge/goal]. I actually help [their type of business] with exactly this. Would you be interested in a quick chat about [specific outcome]? Happy to share some insights either way!",
                    })
                  }
                  className="text-xs"
                >
                  Use This Template
                </Button>
              </div>
              <div className="bg-white p-3 rounded-lg border mb-3">
                <p className="text-xs text-slate-500 mb-2">
                  Template starting point:
                </p>
                <p className="text-sm text-slate-600 italic">
                  Hey [Name], based on our conversation about [specific topic],
                  I've been thinking about [their challenge/goal]. I actually
                  help [their type of business] with exactly this. Would you be
                  interested in a quick chat about [specific outcome]? Happy to
                  share some insights either way!
                </p>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Customize your soft offer message..."
                  value={connectionStrategies.custom_offer || ""}
                  onChange={(e) =>
                    setConnectionStrategies({
                      ...connectionStrategies,
                      custom_offer: e.target.value,
                    })
                  }
                  rows={3}
                  spellCheck={true}
                  className="text-sm flex-1"
                />
                {connectionStrategies.custom_offer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        connectionStrategies.custom_offer
                      );
                    }}
                    className="h-fit"
                  >
                    Copy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Locations Overview (only show if locations are selected) */}
        {selectedLocations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Selected Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedLocations.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={location.category} />
                      <div>
                        <p className="font-medium text-slate-900">
                          {location.platform}
                        </p>
                        <p className="text-sm text-slate-600">
                          {location.specificLocation}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedLocations(
                          selectedLocations.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Create Your Daily Connection Plan
        </h3>
        <p className="text-slate-600">
          Build a strategic plan combining your locations, messages, and time
          commitment
        </p>
      </div>

      {/* Time Commitment Section */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Daily Time Commitment</CardTitle>
          <p className="text-sm text-blue-700">
            How much time will you dedicate to building connections each day?
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["15 minutes", "30 minutes", "45 minutes", "60 minutes"].map(
              (time) => (
                <Button
                  key={time}
                  variant={
                    connectionStrategies.daily_time_commitment === time
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setConnectionStrategies({
                      ...connectionStrategies,
                      daily_time_commitment: time,
                    })
                  }
                  className="text-sm"
                >
                  {time}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integrated Strategy Plan */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">
            Your Integrated Connection Strategy
          </CardTitle>
          <p className="text-sm text-purple-700">
            Combine your locations, messages, and time to create your outreach
            plan
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show customer locations from Strategy Overview */}
          {connectionStrategies.customer_locations && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-slate-900 mb-3">
                Your Customer Locations (from Strategy Overview)
              </h4>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {connectionStrategies.customer_locations}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Daily Connection Plan
              {connectionStrategies.daily_time_commitment && (
                <span className="text-purple-600 ml-1">
                  ({connectionStrategies.daily_time_commitment} daily)
                </span>
              )}
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Create a specific plan that combines your customer locations with
              your message templates. Include which groups you'll engage with,
              when you'll send messages, and how you'll track progress.
            </p>
            <Textarea
              placeholder="Example: Monday/Wednesday/Friday - Engage in Boss Babes Community Facebook group for 10 minutes, respond to 3 posts using my value-first follow-up message. Tuesday/Thursday - Connect with 2 new people on LinkedIn using my initial connection message..."
              value={dailyPlan}
              onChange={(e) => setDailyPlan(e.target.value)}
              rows={8}
              spellCheck={true}
              className="text-sm"
            />
          </div>

          {selectedLocations.length > 0 && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-slate-900 mb-3">
                Quick Reference: Your Selected Locations
              </h4>
              <div className="space-y-2">
                {selectedLocations.map((location, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CategoryIcon category={location.category} />
                    <span className="font-medium">{location.platform}:</span>
                    <span className="text-slate-600">
                      {location.specificLocation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Sales Strategy Progress</span>
          <span>
            {activeTab === "locations"
              ? "1"
              : activeTab === "messages"
              ? "2"
              : "3"}{" "}
            of 3
          </span>
        </div>
        <Progress
          value={
            activeTab === "locations" ? 33 : activeTab === "messages" ? 66 : 100
          }
          className="h-2"
        />
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="locations" className="flex items-center gap-2">
            {getTabIcon("locations")}
            <span className="hidden sm:inline">Strategy Overview</span>
            <span className="sm:hidden">Strategy</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            {getTabIcon("messages")}
            <span className="hidden sm:inline">Create Messages</span>
            <span className="sm:hidden">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            {getTabIcon("plan")}
            <span className="hidden sm:inline">Daily Plan</span>
            <span className="sm:hidden">Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-6">
          {renderStepOne()}
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          {renderStepTwo()}
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          {renderStepThree()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
