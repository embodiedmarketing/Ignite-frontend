import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Video, 
  Target, 
  Eye, 
  Play, 
  FileText, 
  TrendingUp,
  Lightbulb,
  MessageCircle,
  Share2,
  Calendar,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import ContentPillarGenerator from "@/components/ContentPillarGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useMarkSectionComplete, useUnmarkSectionComplete } from "@/hooks/useSectionCompletions";
import { useChecklistItems, useUpsertChecklistItem } from "@/hooks/useChecklistItems";

export default function AudienceGrowth() {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();
  
  const [activeTab, setActiveTab] = useState("overview");
  
  // Load checklist items from database
  const sectionKey = "visibility_ad";
  const { data: checklistItems = [], isLoading: checklistLoading } = useChecklistItems(userId, sectionKey);
  const upsertChecklistItem = useUpsertChecklistItem();
  
  // State for visibility ad sections
  const [completedSections, setCompletedSections] = useState({
    content: false,
    adCopy: false,
    targeting: false,
    launch: false
  });

  // Update local state when checklist items load from database
  useEffect(() => {
    if (checklistItems.length > 0) {
      const dbState = {
        content: checklistItems.find(item => item.itemKey === 'content')?.isCompleted || false,
        adCopy: checklistItems.find(item => item.itemKey === 'adCopy')?.isCompleted || false,
        targeting: checklistItems.find(item => item.itemKey === 'targeting')?.isCompleted || false,
        launch: checklistItems.find(item => item.itemKey === 'launch')?.isCompleted || false,
      };
      setCompletedSections(dbState);
      console.log('[AudienceGrowth] Loaded checklist items from database:', dbState);
    }
  }, [checklistItems]);
  
  // State for targeting input
  const [targetingInput, setTargetingInput] = useState("");
  
  const [expandedSections, setExpandedSections] = useState({
    content: false,
    adCopy: false,
    targeting: false,
    launch: false
  });

  const handleSectionComplete = async (section: keyof typeof completedSections) => {
    const isCurrentlyComplete = completedSections[section];
    
    // Update local state
    setCompletedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Save checkbox state to database
    if (userId) {
      try {
        await upsertChecklistItem.mutateAsync({
          userId,
          sectionKey,
          itemKey: section,
          isCompleted: !isCurrentlyComplete
        });
        console.log('[AudienceGrowth] Checklist item saved:', section, !isCurrentlyComplete);
      } catch (error) {
        console.error('Failed to save checklist item:', error);
      }
    }
    
    // Save to database for "launch" section (final step completion)
    if (section === 'launch' && userId) {
      try {
        if (!isCurrentlyComplete) {
          // Mark as complete in database
          await markSectionComplete.mutateAsync({
            userId,
            stepNumber: 3, // Audience Growth is step 3
            sectionTitle: "Launch Your Visibility Ad"
          });
        } else {
          // Unmark as complete in database
          await unmarkSectionComplete.mutateAsync({
            userId,
            stepNumber: 3,
            sectionTitle: "Launch Your Visibility Ad"
          });
        }
      } catch (error) {
        console.error('Failed to save section completion:', error);
      }
    }
  };

  const handleSectionExpand = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Launch Your Visibility Ad</h2>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Users className="w-4 h-4 mr-1" />
            Growth Strategy
          </Badge>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Training Videos
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Content Strategy
          </TabsTrigger>
          <TabsTrigger value="visibility" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visibility Ad
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overview Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <CardTitle>Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                  <p>
                    Time to build one of your first pillars in your marketing: Your Audience! In this section you'll build a simple, 
                    consistent content plan, choose smart targeting, write visibility ad copy & creative, and officially launch your visibility ad!
                  </p>
                  <p>
                    Remember, attention is currency. Our goal here is to create consistency and make sure your brand is getting attention DAILY. 
                    We will leverage your audience in the future with your lead magnet and live launches.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Time Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <CardTitle>Estimated Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 mb-2">4-7 Days</p>
                  <p className="text-sm text-slate-600">
                    Plan your content and targeting in a day; create your ads with our teams support 2–4 and then launch your ads live!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* To-Do List Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle>To-Do List</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-slate-700">Define Content Pillars (3–4 themes that align to your messaging & offers)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-slate-700">Outline Posting Cadence (channels, frequency, and simple weekly workflow)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-slate-700">Set Targeting (ideal audience, location, interests/keywords, exclusions)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <p className="text-slate-700">Get Visibility Ad Copy (hook, problem/insight, value, soft CTA)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      5
                    </div>
                    <p className="text-slate-700">Record & Finish Ad Creative (2–4 variations: short video, image/graphic, carousel)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      6
                    </div>
                    <p className="text-slate-700">Launch Visibility Ad (follow our tutorial step by step!)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Tips Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <CardTitle>Success Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Start with your messaging</strong>
                      <span className="text-slate-600"> → Everything here flows from the clarity you already built. Use your messaging strategy as the anchor.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Don't chase perfection</strong>
                      <span className="text-slate-600"> → Done and launched beats polished and stuck. You'll refine as you go.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Lean on support</strong>
                      <span className="text-slate-600"> → Our team and tools are here to help—don't do this alone. Show up messy!</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">You can't mess this up</strong>
                      <span className="text-slate-600"> → Every part of this experience will build on top of each other. You truly can't go wrong.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Focus on connection</strong>
                      <span className="text-slate-600"> → Build ads that make your audience feel seen and understood.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Dig deeper</strong>
                      <span className="text-slate-600"> → Go beyond surface-level ideas. Create disruptive content that stops the scroll and challenges assumptions.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Training Videos Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                <CardTitle>Audience Growth Training</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 mb-6">
                Watch these comprehensive training videos to master audience growth strategies and techniques.
              </p>

              {/* Nested Training Video Tabs */}
              <Tabs defaultValue="content-strategy" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 gap-1">
                  <TabsTrigger value="content-strategy" className="text-xs md:text-sm px-2 md:px-4">Your Content Strategy</TabsTrigger>
                  <TabsTrigger value="ad-housekeeping" className="text-xs md:text-sm px-2 md:px-4">Ad Account Housekeeping</TabsTrigger>
                  <TabsTrigger value="ad-targeting" className="text-xs md:text-sm px-2 md:px-4">Visibility Ad Targeting</TabsTrigger>
                  <TabsTrigger value="launch-ad" className="text-xs md:text-sm px-2 md:px-4">Launch Your Visibility Ad</TabsTrigger>
                </TabsList>

                <TabsContent value="content-strategy" className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      <Play className="w-3 h-3 mr-1" />
                      Training Video
                    </Badge>
                  </div>
                  
                  <VimeoEmbed 
                    vimeoId="1122309073/dafd54cf47" 
                    title="Your Content Strategy Training"
                    userId={1}
                    stepNumber={10}
                  />
                </TabsContent>

                <TabsContent value="ad-housekeeping" className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                      <Play className="w-3 h-3 mr-1" />
                      Training Videos
                    </Badge>
                  </div>
                  
                  {/* Creating Your Business Manager Video */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Creating Your Business Manager</h4>
                    <VimeoEmbed 
                      vimeoId="1125173776/ffb4512995" 
                      title="Creating Your Business Manager"
                      userId={1}
                      stepNumber={0}
                    />
                  </div>

                  {/* Setting Up Your Ad Account & Payment Method Video */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Setting Up Your Ad Account & Payment Method</h4>
                    <VimeoEmbed 
                      vimeoId="1125173755/63b9aa8a7c" 
                      title="Setting Up Your Ad Account & Payment Method"
                      userId={1}
                      stepNumber={0}
                    />
                  </div>

                  {/* Setting Up Your Pixel for Visibility Ads Video */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Setting Up Your Pixel for Visibility Ads</h4>
                    <VimeoEmbed 
                      vimeoId="1125173725/fd2b6a7929" 
                      title="Setting Up Your Pixel for Visibility Ads"
                      userId={1}
                      stepNumber={0}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ad-targeting" className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      <Play className="w-3 h-3 mr-1" />
                      Training Video
                    </Badge>
                  </div>
                  
                  <VimeoEmbed 
                    vimeoId="1125173579/5d7eae08e0" 
                    title="Visibility Ad Targeting"
                    userId={1}
                    stepNumber={0}
                  />
                </TabsContent>

                <TabsContent value="launch-ad" className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      <Play className="w-3 h-3 mr-1" />
                      Training Video
                    </Badge>
                  </div>
                  
                  <VimeoEmbed 
                    vimeoId="1125177073/72f9916060" 
                    title="Launch Your Visibility Ad"
                    userId={1}
                    stepNumber={0}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Strategy Tab */}
        <TabsContent value="content" className="space-y-6">
          <ContentPillarGenerator />
        </TabsContent>

        {/* Visibility Ad Tab */}
        <TabsContent value="visibility" className="space-y-6">
          {/* Get Your Visibility Ad Live Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <CardTitle>Get Your Visibility Ad Live</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700">
                Follow these essential steps to launch your visibility ad!
              </p>

              {/* Step-by-step sections */}
              <div className="grid gap-4">
                {/* Create Or Choose Your Content */}
                <Collapsible open={expandedSections.content} onOpenChange={() => handleSectionExpand('content')}>
                  <Card className={`border-2 transition-colors ${completedSections.content ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.content}
                              onCheckedChange={() => handleSectionComplete('content')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-content"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              1
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Create Or Choose Your Content</h3>
                          </div>
                          {expandedSections.content ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-6">
                        <p className="text-slate-600">
                          Use your content strategy and/or your strategy presentation created by our team to choose your first 1-2 pieces of visibility ad content that you will use for your ad. In order to move to the next step you need to at least have the raw video recorded for your visibility ad.
                        </p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <h4 className="font-semibold text-slate-900 mb-4">🎥 Best Practices for Your Visibility Ad Video</h4>
                          
                          <div className="space-y-3 text-sm text-slate-700">
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Keep it short →</span>
                              <span>Aim for 1–2 minutes max.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Use natural light →</span>
                              <span>Face a window or light source so your face is bright and clear.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Simple setup is fine →</span>
                              <span>Your phone camera + built-in microphone works great.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Record vertically →</span>
                              <span>Ads are shown on mobile first, so hold your phone upright.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Quiet space →</span>
                              <span>Eliminate background noise so your voice is easy to hear.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Steady shot →</span>
                              <span>Use a tripod, stand, or lean your phone on something stable.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Look at the lens →</span>
                              <span>Talk as if you're speaking directly to your audience.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Be yourself →</span>
                              <span>Speak naturally, with energy and warmth—connection matters more than polish.</span>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <span className="font-medium text-blue-700">Test once →</span>
                              <span>Do a quick test recording to check sound and lighting before you film your final version. It's ok if you mess up during, you can always trim it!</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Get Your Ad Copy */}
                <Collapsible open={expandedSections.adCopy} onOpenChange={() => handleSectionExpand('adCopy')}>
                  <Card className={`border-2 transition-colors ${completedSections.adCopy ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.adCopy}
                              onCheckedChange={() => handleSectionComplete('adCopy')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-ad-copy"
                            />
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              2
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Get Your Ad Copy</h3>
                          </div>
                          {expandedSections.adCopy ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <div className="space-y-4 text-slate-600">
                          <p>
                            Once you've got your content created, submit it to our team and we'll write your ad copy FOR you!
                          </p>
                          <p>
                            If you created a video we will edit it for you. Please upload it to Google Drive and set the share settings as ANYONE CAN VIEW. Leave any notes for our team on specific edits. If you don't have any notes, we will use our best judgement!
                          </p>
                        </div>
                        
                        <Button 
                          asChild
                          className="bg-blue-600 hover:bg-blue-700 text-white" 
                          data-testid="button-submit-ad-copy"
                        >
                          <a href="https://embodiedmarketing.typeform.com/adsrequest" target="_blank" rel="noopener noreferrer">
                            Submit Here
                          </a>
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Define Your Targeting */}
                <Collapsible open={expandedSections.targeting} onOpenChange={() => handleSectionExpand('targeting')}>
                  <Card className={`border-2 transition-colors ${completedSections.targeting ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.targeting}
                              onCheckedChange={() => handleSectionComplete('targeting')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-targeting"
                            />
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              3
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Define Your Targeting</h3>
                          </div>
                          {expandedSections.targeting ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <div className="space-y-4 text-slate-600">
                          <p>
                            Watch our training video and determine what your targeting choice will be for your visibility ads. Enter what targeting you'll use below.
                          </p>
                          <p>
                            If you need support or want feedback on your targeting or ad set up, attend our next ad support call!
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="targeting-input" className="text-sm font-medium text-slate-700">
                            Your Targeting Options
                          </Label>
                          <Textarea
                            id="targeting-input"
                            value={targetingInput}
                            onChange={(e) => setTargetingInput(e.target.value)}
                            placeholder="Enter your targeting options here (e.g., demographics, interests, locations, etc.)..."
                            className="min-h-[100px]"
                            data-testid="textarea-targeting-input"
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Launch The Ad */}
                <Collapsible open={expandedSections.launch} onOpenChange={() => handleSectionExpand('launch')}>
                  <Card className={`border-2 transition-colors ${completedSections.launch ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.launch}
                              onCheckedChange={() => handleSectionComplete('launch')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-launch"
                            />
                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              4
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Launch The Ad</h3>
                          </div>
                          {expandedSections.launch ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600">
                          You're now ready to launch your ad! Reference our step by step training video to launch your visibility ad. Use our budget recommendation from your strategy created by our team. 
                          <br /><br />
                          Attend our ad support call if you get stuck and make sure to let us know once it officially goes live!
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}
