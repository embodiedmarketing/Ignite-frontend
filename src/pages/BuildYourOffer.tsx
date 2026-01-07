import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Target, MessageSquare, CheckCircle, TrendingUp, PlayCircle, Wand2, Settings } from "lucide-react";
import CustomerExperienceBuilder from "@/components/CustomerExperienceBuilder";
import CustomerExperienceTabs from "@/components/CustomerExperienceTabs";
import SalesPageGenerator from "@/components/SalesPageGenerator";
import SalesPageGeneratorOffer2 from "@/components/SalesPageGeneratorOffer2";
import SecondOfferWorkbook from "@/components/SecondOfferWorkbook";
import SimplifiedSalesPageGenerator from "@/components/SimplifiedSalesPageGenerator";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";

interface BuildYourOfferProps {
  userId?: string;
}

export default function BuildYourOffer({ userId }: BuildYourOfferProps) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id?.toString() || "";
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOffer, setSelectedOffer] = useState(1);

  // Check if user has completed prerequisite steps
  const messagingStrategy = localStorage.getItem(`messagingStrategy_${effectiveUserId}`);
  const offerOutline = localStorage.getItem(`offerOutline_${effectiveUserId}`);
  const hasPrerequisites = messagingStrategy && offerOutline;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Build Your Offer</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Transform your finalized offer outline into a complete sales page and customer experience ready for launch
        </p>
      </div>

      {/* Prerequisites Check */}
      {!hasPrerequisites && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Target className="w-6 h-6 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Complete Prerequisites First</h3>
                <p className="text-orange-800 mb-4">
                  To generate your sales page, you'll need to complete your messaging strategy and offer outline first.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {messagingStrategy ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-orange-400 rounded-full" />
                    )}
                    <span className={messagingStrategy ? "text-green-800" : "text-orange-800"}>
                      Complete Your Messaging Strategy
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {offerOutline ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-orange-400 rounded-full" />
                    )}
                    <span className={offerOutline ? "text-green-800" : "text-orange-800"}>
                      Create Your Offer Outline
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center space-x-2">
            <PlayCircle className="w-4 h-4" />
            <span>Training Video</span>
          </TabsTrigger>
          <TabsTrigger value="sales-page" className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4" />
            <span>Sales Page</span>
          </TabsTrigger>
          <TabsTrigger value="offer-delivery" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Offer Delivery</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Header Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl text-blue-900 flex items-center space-x-2">
                <Wand2 className="w-6 h-6" />
                <span>Create Your Sales Page & Customer Experience</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* What You'll Build Section */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">What You'll Build in This Step</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-slate-900">AI-Powered Sales Page</h4>
                        <p className="text-sm text-slate-600">Complete conversion-focused sales page using your messaging strategy and offer outline</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-slate-900">Email Templates & Sequences</h4>
                        <p className="text-sm text-slate-600">Professional onboarding emails and communication templates</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-slate-900">Offer Delivery Journey</h4>
                        <p className="text-sm text-slate-600">Four-part system covering onboarding, delivery, communication, and feedback</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-slate-900">Implementation Checklist</h4>
                        <p className="text-sm text-slate-600">Custom action items and todos to launch your offer successfully</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Focus Section */}
                <div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Target className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900 mb-2">Key Focus:</h4>
                        <p className="text-sm text-amber-800">
                          Transform your messaging strategy and offer outline into a high-converting sales page and complete offer delivery system that ensures buyers get results.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How This Works Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">How This Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Create Your Sales Page</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Build a complete sales page using what you've already created</li>
                    <li>• Edit and customize every section to match your voice</li>
                    <li>• Save multiple versions and download when ready</li>
                    <li>• Get suggestions to make your copy more compelling</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Design Your Offer Delivery</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Plan how customers will experience your offer from start to finish</li>
                    <li>• Create welcome emails and ongoing communication</li>
                    <li>• Set up systems to help customers actually get results</li>
                    <li>• Build your action plan for launching successfully</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Video Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Build Your Offer Training</CardTitle>
              <p className="text-slate-600">
                Learn how to create compelling sales pages and design customer experiences that convert.
              </p>
            </CardHeader>
            <CardContent>
              <VimeoEmbed
                vimeoId="1094424213/d500329fc9"
                title="Build Your Offer Training"
                userId={parseInt(effectiveUserId)}
                stepNumber={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Page Tab */}
        <TabsContent value="sales-page" className="space-y-6">
            {/* Offer Selection Buttons */}
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => setSelectedOffer(1)}
                variant={selectedOffer === 1 ? "default" : "outline"}
                className="flex-1 max-w-xs"
              >
                Your Offer - Sales Page
              </Button>
              <Button
                onClick={() => setSelectedOffer(2)}
                variant={selectedOffer === 2 ? "default" : "outline"}
                className="flex-1 max-w-xs"
                >
                Your Second Offer - Sales Page
              </Button>
            </div>

            {/* Conditional rendering based on selected offer */}
            {selectedOffer === 1 ? (
              <SimplifiedSalesPageGenerator userId={parseInt(effectiveUserId)} />
            ) : (
              <SalesPageGeneratorOffer2 userId={parseInt(effectiveUserId)} offerNumber={2} />
            )}
          </TabsContent>

        {/* Offer Delivery Tab */}
        <TabsContent value="offer-delivery" className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-blue-600">Design Your Customer Experience</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Design clear next steps and communication that gives customers immediate access 
              and confidence in their purchase
            </p>
          </div>

          <CustomerExperienceTabs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
