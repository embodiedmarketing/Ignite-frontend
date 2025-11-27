import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/services/api.config";
import { useAutoMigration } from "@/hooks/useAutoMigration";
import {
  useSectionCompletionsDb,
  checkSectionComplete,
} from "@/hooks/useSectionCompletionsDb";
import PaywallCard from "@/components/PaywallCard";
import { AccountabilityBanner } from "@/components/AccountabilityBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Gift,
  Settings,
  Target,
  FileText,
  Lightbulb,
  CheckSquare,
  Calendar,
  Video,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Megaphone,
  Bell,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import type { IgniteDocument } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id || 0;

  // Run auto-migration on component mount
  useAutoMigration(userId);

  // Fetch section completions from database
  const { data: dbCompletions } = useSectionCompletionsDb(userId);

  console.log("dbCompletions", dbCompletions);

  // Fetch ignite documents to check for content strategy
  const { data: igniteDocuments } = useQuery<IgniteDocument[]>({
    queryKey: ["/api/ignite-docs/user", userId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/ignite-docs/user/${userId}`);
      return data;
    },
    enabled: !!userId,
  });

  // Check if user has active subscription
  const hasActiveSubscription = user?.subscriptionStatus === "active";

  if (!hasActiveSubscription) {
    return (
      <PaywallCard
        title="Welcome to Launch!"
        description="Get instant access to the complete business-building system that helps you create, develop, and sell your paid offers."
      />
    );
  }

  // Date range state for funnel tracking
  const [selectedDateRange, setSelectedDateRange] = useState("7");

  // Live launch selection state
  const [selectedLiveLaunchId, setSelectedLiveLaunchId] = useState<
    number | null
  >(null);

  // Fetch all live launches for the user
  const { data: liveLaunches = [], isLoading: launchesLoading } = useQuery({
    queryKey: ["/api/live-launches/user", userId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/live-launches/user/${userId}`);
      return data;
    },
    enabled: !!userId,
  });

  // Set selected launch to the most recent one on initial load
  useEffect(() => {
    if (
      !launchesLoading &&
      liveLaunches.length > 0 &&
      selectedLiveLaunchId === null
    ) {
      setSelectedLiveLaunchId(liveLaunches[0].id);
    }
  }, [liveLaunches, selectedLiveLaunchId, launchesLoading]);

  // Sync selected launch when list changes (e.g., deletion from another page)
  useEffect(() => {
    if (!launchesLoading && selectedLiveLaunchId !== null) {
      const isStillValid = liveLaunches.some(
        (l: any) => l.id === selectedLiveLaunchId
      );
      if (!isStillValid && liveLaunches.length > 0) {
        // Selected launch was deleted, switch to next available launch
        setSelectedLiveLaunchId(liveLaunches[0].id);
      } else if (!isStillValid && liveLaunches.length === 0) {
        // Only set to null when query has settled and there are truly no launches
        setSelectedLiveLaunchId(null);
      }
    }
  }, [liveLaunches, selectedLiveLaunchId, launchesLoading]);

  // Check localStorage for completion status
  const [progressData, setProgressData] = useState({
    foundation: { completed: false, hasStrategy: false, hasOutline: false },
    audienceGrowth: { completed: false, hasContent: false },
    leadGeneration: { completed: false, hasStrategy: false },
    liveLaunch: { completed: false, hasStrategy: false },
  });

  // Function to get funnel tracking summaries with actual metrics data
  const getFunnelTrackingSummary = () => {
    // Check for completed tasks and setup indicators
    const leadGenFunnelBuilt = localStorage.getItem("funnel-built") === "true";
    const leadGenFunnelLaunched =
      localStorage.getItem("funnel-launched") === "true";
    const leadGenOptimized =
      localStorage.getItem("funnel-optimized") === "true";

    const liveLaunchStrategyBuilt =
      localStorage.getItem("live-launch-strategy-built") === "true";
    const liveLaunchAdsLaunched =
      localStorage.getItem("live-launch-ads-launched") === "true";
    const liveLaunchOptimized =
      localStorage.getItem("live-launch-optimized") === "true";

    // Helper functions for date calculations
    const getLastNDays = (fromDate: string, numDays: number): string[] => {
      const dates = [];
      const date = new Date(fromDate);
      for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(date);
        currentDate.setDate(date.getDate() - i);
        dates.push(currentDate.toISOString().split("T")[0]);
      }
      return dates;
    };

    const getTotalForDays = (
      values: Record<string, number>,
      days: string[]
    ): number => {
      return days.reduce((total, day) => total + (values[day] || 0), 0);
    };

    // Get Lead Gen tracking data from localStorage (from actual tracking page)
    const getLeadGenMetrics = () => {
      try {
        const funnelData = localStorage.getItem(`leadGenFunnelData_${userId}`);
        if (funnelData) {
          const parsed = JSON.parse(funnelData);

          // Get dynamic date range totals for each metric
          const today = new Date().toISOString().split("T")[0];
          const days = getLastNDays(today, parseInt(selectedDateRange));

          const adSpendTotal = getTotalForDays(
            parsed.find((m: any) => m.step === "Ad Spend")?.values || {},
            days
          );
          const leadsTotal = getTotalForDays(
            parsed.find((m: any) => m.step === "Leads")?.values || {},
            days
          );
          const salesTotal = getTotalForDays(
            parsed.find((m: any) => m.step === "Tripwire Sales")?.values || {},
            days
          );
          const revenueTotal = getTotalForDays(
            parsed.find((m: any) => m.step === "Total Revenue")?.values || {},
            days
          );
          const roas = adSpendTotal > 0 ? revenueTotal / adSpendTotal : 0;

          return {
            adSpend: adSpendTotal,
            leads: leadsTotal,
            sales: salesTotal,
            roas,
          };
        }
      } catch (error) {
        console.error("Error parsing lead gen tracking data:", error);
      }
      return { adSpend: 0, leads: 0, sales: 0, roas: 0 };
    };

    // Get Live Launch tracking data from database for selected launch
    const getLiveLaunchMetrics = () => {
      if (!selectedLiveLaunchId) {
        return {
          adSpend: 0,
          leads: 0,
          sales: 0,
          roas: 0,
          organicRegistrations: 0,
          adsRegistrations: 0,
        };
      }

      try {
        const today = new Date().toISOString().split("T")[0];
        const days = getLastNDays(today, parseInt(selectedDateRange));

        let organicRegistrations = 0,
          adsRegistrations = 0,
          salesTotal = 0,
          revenueTotal = 0,
          roasValue = 0,
          adSpendTotal = 0;

        // Try to get data from localStorage (will be replaced by database queries)
        const organicData = localStorage.getItem(
          `liveLaunchOrganicFunnelData_${userId}_${selectedLiveLaunchId}`
        );
        const adsData = localStorage.getItem(
          `liveLaunchAdsFunnelData_${userId}_${selectedLiveLaunchId}`
        );

        // Get organic registrations
        if (organicData) {
          const parsedOrganic = JSON.parse(organicData);
          organicRegistrations = getTotalForDays(
            parsedOrganic.find((m: any) => m.step === "Registrations - Organic")
              ?.values || {},
            days
          );
          salesTotal = getTotalForDays(
            parsedOrganic.find((m: any) => m.step === "Total Sales")?.values ||
              {},
            days
          );
          revenueTotal = getTotalForDays(
            parsedOrganic.find((m: any) => m.step === "Total Revenue")
              ?.values || {},
            days
          );
          roasValue =
            parsedOrganic.find((m: any) => m.step === "Total ROAS from Launch")
              ?.sevenDayAvg || 0;
        }

        // Get ads registrations and ad spend
        if (adsData) {
          const parsedAds = JSON.parse(adsData);
          adsRegistrations = getTotalForDays(
            parsedAds.find((m: any) => m.step === "Registration - Ads")
              ?.values || {},
            days
          );
          adSpendTotal = getTotalForDays(
            parsedAds.find((m: any) => m.step === "Ad Spend")?.values || {},
            days
          );
        }

        const result = {
          adSpend: adSpendTotal,
          leads: organicRegistrations + adsRegistrations,
          sales: salesTotal,
          roas: roasValue,
          organicRegistrations,
          adsRegistrations,
        };

        return result;
      } catch (error) {
        console.error("Error parsing live launch tracking data:", error);
      }
      return {
        adSpend: 0,
        leads: 0,
        sales: 0,
        roas: 0,
        organicRegistrations: 0,
        adsRegistrations: 0,
      };
    };

    const leadGenMetrics = getLeadGenMetrics();
    const liveLaunchMetrics = getLiveLaunchMetrics();

    // Check if we have actual tracking data
    const hasLeadGenData =
      leadGenFunnelBuilt ||
      leadGenFunnelLaunched ||
      leadGenOptimized ||
      leadGenMetrics.adSpend > 0 ||
      leadGenMetrics.leads > 0;
    const hasLiveLaunchData =
      liveLaunchStrategyBuilt ||
      liveLaunchAdsLaunched ||
      liveLaunchOptimized ||
      liveLaunchMetrics.adSpend > 0 ||
      liveLaunchMetrics.leads > 0;

    const leadGenSummary = {
      setupComplete: leadGenFunnelBuilt && leadGenFunnelLaunched,
      isOptimizing: leadGenOptimized,
      tasksCompleted: [
        leadGenFunnelBuilt,
        leadGenFunnelLaunched,
        leadGenOptimized,
      ].filter(Boolean).length,
      hasData: hasLeadGenData,
      metrics: leadGenMetrics,
    };

    const liveLaunchSummary = {
      setupComplete: liveLaunchStrategyBuilt && liveLaunchAdsLaunched,
      isOptimizing: liveLaunchOptimized,
      tasksCompleted: [
        liveLaunchStrategyBuilt,
        liveLaunchAdsLaunched,
        liveLaunchOptimized,
      ].filter(Boolean).length,
      hasData: hasLiveLaunchData,
      metrics: liveLaunchMetrics,
    };

    return { leadGenSummary, liveLaunchSummary };
  };

  const trackingData = getFunnelTrackingSummary();

  useEffect(() => {
    // Check both database and localStorage for actual completion data
    const checkCompletion = () => {
      // Check Foundation completion (messaging + offer) - DATABASE FIRST, localStorage as fallback
      const hasMessagingStrategyDb = checkSectionComplete(
        dbCompletions,
        "Messaging Strategy"
      );
      const hasTripwireOutlineDb = checkSectionComplete(
        dbCompletions,
        "Tripwire Offer Outline"
      );
      const hasCoreOfferOutlineDb = checkSectionComplete(
        dbCompletions,
        "Core Offer Outline"
      );

      const messagingStrategy =
        hasMessagingStrategyDb ||
        localStorage.getItem("generated-messaging-strategy");
      const tripwireOutline =
        hasTripwireOutlineDb ||
        localStorage.getItem("generated-tripwire-outline");
      const offerOutline =
        hasCoreOfferOutlineDb ||
        localStorage.getItem("generated-offer-outline");

      const messagingResponses = Object.keys(localStorage).filter((key) => {
        const value = localStorage.getItem(key);
        return key.startsWith("workbook_1_") && value && value.length > 20;
      });
      const offerResponses = Object.keys(localStorage).filter((key) => {
        const value = localStorage.getItem(key);
        return key.startsWith("workbook_2_") && value && value.length > 20;
      });

      // Check Audience Growth completion
      const audienceGrowthData = localStorage.getItem(
        "audience-growth-completed"
      );

      // Check Lead Generation completion
      const leadGenStrategy = localStorage.getItem("lead-gen-strategy");
      const leadGenData = localStorage.getItem("lead-generation-completed");

      // Check Live Launch completion
      const liveLaunchStrategy = localStorage.getItem("live-launch-strategy");
      const liveLaunchData = localStorage.getItem("live-launch-completed");

      setProgressData({
        foundation: {
          completed:
            messagingResponses.length >= 5 && offerResponses.length >= 5,
          hasStrategy: !!messagingStrategy,
          hasOutline: !!offerOutline || !!tripwireOutline,
        },
        audienceGrowth: {
          completed: !!audienceGrowthData,
          hasContent: !!audienceGrowthData,
        },
        leadGeneration: {
          completed: !!leadGenData,
          hasStrategy: !!leadGenStrategy,
        },
        liveLaunch: {
          completed: !!liveLaunchData,
          hasStrategy: !!liveLaunchStrategy,
        },
      });
    };

    checkCompletion();
  }, [dbCompletions]);

  const getStepStatus = (stepData: any) => {
    if (stepData.hasStrategy || stepData.hasOutline || stepData.hasContent) {
      return "Generated";
    } else if (stepData.completed) {
      return "Completed";
    } else {
      return "Not Started";
    }
  };

  const getStepColor = (stepData: any) => {
    if (stepData.hasStrategy || stepData.hasOutline || stepData.hasContent) {
      return "bg-embodied-coral";
    } else if (stepData.completed) {
      return "bg-embodied-blue";
    } else {
      return "bg-slate-300";
    }
  };

  const getNextStep = () => {
    // Check Foundation sub-sections - use database first, localStorage as fallback
    const hasMessagingStrategy =
      checkSectionComplete(dbCompletions, "Messaging Strategy") ||
      !!localStorage.getItem("generated-messaging-strategy");
    const hasTripwireOutline =
      checkSectionComplete(dbCompletions, "Tripwire Offer Outline") ||
      !!localStorage.getItem("generated-tripwire-outline");
    const hasCoreOfferOutline =
      checkSectionComplete(dbCompletions, "Core Offer Outline") ||
      !!localStorage.getItem("generated-offer-outline");

    // Navigate to first incomplete Foundation section
    if (!hasMessagingStrategy) {
      return {
        step: 1,
        name: "Your Foundation",
        action: "Master your messaging strategy to create compelling offers!",
        href: "/messaging",
      };
    }
    if (!hasTripwireOutline) {
      return {
        step: 1,
        name: "Your Foundation",
        action:
          "Create your Tripwire Offer Outline to attract and convert leads!",
        href: "/create-offer",
      };
    }
    if (!hasCoreOfferOutline) {
      return {
        step: 1,
        name: "Your Foundation",
        action: "Build your Core Offer Outline to maximize value and impact!",
        href: "/create-offer",
      };
    }

    // Check Audience Growth - Content Strategy first, then visibility ad
    const hasContentStrategy = igniteDocuments?.some(
      (doc) => doc.docType === "content_strategy"
    );
    const hasVisibilityAd =
      checkSectionComplete(dbCompletions, "Launch Your Visibility Ad") ||
      !!localStorage.getItem("visibility-ad-launched");

    if (!hasContentStrategy) {
      return {
        step: 3,
        name: "Audience Growth",
        action: "Create your Content Strategy to plan your audience growth!",
        href: "/resources/monthly-planning",
      };
    }
    if (!hasVisibilityAd) {
      return {
        step: 3,
        name: "Audience Growth",
        action:
          "Launch your visibility ad and start growing your audience quickly with quality leads!",
        href: "/audience-growth",
      };
    }

    // Check Lead Generation sub-sections - use database first, localStorage as fallback
    const hasFunnelBuilt =
      checkSectionComplete(dbCompletions, "Build Your Funnel") ||
      !!localStorage.getItem("funnel-built");
    const hasFunnelLaunched =
      checkSectionComplete(dbCompletions, "Launch Your Funnel") ||
      !!localStorage.getItem("funnel-launched");
    const hasFunnelOptimized =
      checkSectionComplete(dbCompletions, "Track & Optimize") ||
      !!localStorage.getItem("funnel-optimized");

    if (!hasFunnelBuilt) {
      return {
        step: 4,
        name: "Lead Generation - Build Your Funnel",
        action:
          "Build your lead gen funnel to start growing your email list and offsetting ad costs",
        href: "/lead-generation/building-your-strategy",
      };
    }
    if (!hasFunnelLaunched) {
      return {
        step: 4,
        name: "Lead Generation - Launch Your Funnel",
        action:
          "Launch your lead gen funnel and start capturing leads with your tripwire offer",
        href: "/lead-generation/launch-your-ads",
      };
    }
    if (!hasFunnelOptimized) {
      return {
        step: 4,
        name: "Lead Generation - Track & Optimize",
        action:
          "Track your funnel performance and optimize for better conversions",
        href: "/lead-generation/track-and-optimize",
      };
    }

    // Check Live Launch sub-sections - use database first, localStorage as fallback
    const hasLiveLaunchStrategy =
      checkSectionComplete(dbCompletions, "Build Your Strategy") ||
      !!localStorage.getItem("live-launch-strategy-built");
    const hasLiveLaunchAds =
      checkSectionComplete(dbCompletions, "Launch Your Ads") ||
      !!localStorage.getItem("live-launch-ads-launched");
    const hasLiveLaunchOptimized =
      checkSectionComplete(dbCompletions, "Optimize & Execute") ||
      !!localStorage.getItem("live-launch-optimized");

    if (!hasLiveLaunchStrategy) {
      return {
        step: 5,
        name: "Live Launch - Build Your Strategy",
        action:
          "Build your live launch strategy to maximize conversions and sales",
        href: "/launch-sales/strategy",
      };
    }
    if (!hasLiveLaunchAds) {
      return {
        step: 5,
        name: "Live Launch - Launch Your Ads",
        action:
          "Launch your ads and start driving registrations for your live launch",
        href: "/launch-sales/launch-your-ads",
      };
    }
    if (!hasLiveLaunchOptimized) {
      return {
        step: 5,
        name: "Live Launch - Optimize & Execute",
        action:
          "Track your live launch performance and optimize for maximum results",
        href: "/launch-sales/track-and-optimize",
      };
    }

    return {
      step: 0,
      name: "Ongoing Optimization",
      action:
        "Continue to grow your list, host your next live launch and scale your business!",
      href: "/resources",
    };
  };

  const nextStep = getNextStep();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="editorial-header text-3xl text-embodied-navy">
          Welcome back, {(user as any)?.name || "there"}!
        </h1>
        <p className="editorial-body mt-2">
          You're crushing it and you've got this! Let's build your impact
          together! 🔥
        </p>
      </div>

      {/* Weekly Accountability Thread Banner */}
      <AccountabilityBanner />

      {/* Enhanced Progress Details */}
      <Card className="border-embodied-blue/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <Activity className="w-5 h-5 mr-2 text-embodied-blue" />
            Your Ignite Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Foundation Details */}
            <div className="space-y-3">
              <h4 className="editorial-subheader text-embodied-navy flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Foundation
              </h4>
              <div className="space-y-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Messaging Strategy
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Messaging Strategy"
                      ) || localStorage.getItem("generated-messaging-strategy")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(
                      dbCompletions,
                      "Messaging Strategy"
                    ) || localStorage.getItem("generated-messaging-strategy")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Tripwire Offer Outline
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Tripwire Offer Outline"
                      ) || localStorage.getItem("generated-tripwire-outline")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(
                      dbCompletions,
                      "Tripwire Offer Outline"
                    ) || localStorage.getItem("generated-tripwire-outline")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Core Offer Outline
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Core Offer Outline"
                      ) || localStorage.getItem("generated-offer-outline")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(
                      dbCompletions,
                      "Core Offer Outline"
                    ) || localStorage.getItem("generated-offer-outline")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Audience Growth Details */}
            <div className="space-y-3">
              <h4 className="editorial-subheader text-embodied-navy flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Audience Growth
              </h4>
              <div className="space-y-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Content Strategy
                  </span>
                  <Badge
                    variant={
                      igniteDocuments?.some(
                        (doc) => doc.docType === "content_strategy"
                      )
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {igniteDocuments?.some(
                      (doc) => doc.docType === "content_strategy"
                    )
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Launch Your Visibility Ad
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Launch Your Visibility Ad"
                      ) || localStorage.getItem("visibility-ad-launched")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(
                      dbCompletions,
                      "Launch Your Visibility Ad"
                    ) || localStorage.getItem("visibility-ad-launched")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Lead Generation Details */}
            <div className="space-y-3">
              <h4 className="editorial-subheader text-embodied-navy flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Lead Generation
              </h4>
              <div className="space-y-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Build Your Funnel
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Build Your Funnel"
                      ) || localStorage.getItem("funnel-built")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(dbCompletions, "Build Your Funnel") ||
                    localStorage.getItem("funnel-built")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Launch Your Funnel
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Launch Your Funnel"
                      ) || localStorage.getItem("funnel-launched")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(
                      dbCompletions,
                      "Launch Your Funnel"
                    ) || localStorage.getItem("funnel-launched")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Track & Optimize
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(dbCompletions, "Track & Optimize") ||
                      localStorage.getItem("funnel-optimized")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(dbCompletions, "Track & Optimize") ||
                    localStorage.getItem("funnel-optimized")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Live Launch Details */}
            <div className="space-y-3">
              <h4 className="editorial-subheader text-embodied-navy flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Live Launch
              </h4>
              <div className="space-y-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Build Your Strategy
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Build Your Strategy"
                      ) || localStorage.getItem("live-launch-strategy-built")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(
                      dbCompletions,
                      "Build Your Strategy"
                    ) || localStorage.getItem("live-launch-strategy-built")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Launch Your Ads
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(dbCompletions, "Launch Your Ads") ||
                      localStorage.getItem("live-launch-ads-launched")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(dbCompletions, "Launch Your Ads") ||
                    localStorage.getItem("live-launch-ads-launched")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="editorial-body text-sm">
                    Optimize & Execute
                  </span>
                  <Badge
                    variant={
                      checkSectionComplete(
                        dbCompletions,
                        "Optimize & Execute"
                      ) || localStorage.getItem("live-launch-optimized")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {checkSectionComplete(
                      dbCompletions,
                      "Optimize & Execute"
                    ) || localStorage.getItem("live-launch-optimized")
                      ? "✓"
                      : "○"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Where You Left Off Button */}
          <div className="mt-6 pt-6 border-t border-embodied-blue/10">
            <Link href={nextStep.href}>
              <Button
                className="w-full bg-embodied-blue hover:bg-embodied-blue/90 text-white"
                data-testid="continue-where-left-off"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue Where You Left Off
              </Button>
            </Link>
            <div className="mt-2 text-center">
              <span className="text-sm font-medium text-embodied-navy">
                Next: {nextStep.name}
              </span>
              <p className="text-xs text-embodied-navy/70 mt-1">
                {nextStep.action}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card className="border-embodied-coral/20 bg-gradient-to-r from-embodied-cream/30 to-white">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <Bell className="w-5 h-5 mr-2 text-embodied-coral" />
            Latest Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-embodied-coral/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-embodied-coral rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="editorial-subheader text-embodied-navy">
                    🎉 Community Forum
                  </h4>
                  <p className="editorial-body text-sm text-embodied-navy/80 mt-1">
                    Use the Community Forum for questions, wins, and any support
                    you may need. Connect with fellow IGNITE members in
                    dedicated categories for celebrations, tech support, and
                    more!
                  </p>
                  <p className="text-xs text-embodied-coral mt-2">2 days ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-embodied-blue/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-embodied-blue rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="editorial-subheader text-embodied-navy">
                    🎊 Embodied Marketing Live!
                  </h4>
                  <p className="editorial-body text-sm text-embodied-navy/80 mt-1">
                    We have a BOGO offer for clients only to join our intimate
                    3-day in-person experience in Austin, this January! Use code
                    FREEGUEST{" "}
                    <a
                      href="https://get.embodiedmarketing.com/live"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-embodied-coral hover:underline font-semibold"
                    >
                      here
                    </a>{" "}
                    to purchase your ticket and bring a friend!
                  </p>
                  <p className="text-xs text-embodied-blue mt-2">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Week's Coaching Calls */}
      <Card className="border-embodied-orange/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <Calendar className="w-5 h-5 mr-2 text-embodied-orange" />
            This Week's Coaching Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              // Generate this week's calls with current dates
              const today = new Date();
              const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

              // Calculate the start of this week (Monday)
              const startOfWeek = new Date(today);
              startOfWeek.setDate(
                today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)
              );

              // Generate call dates for this week
              const mondayDate = new Date(startOfWeek);
              const tuesdayDate = new Date(startOfWeek);
              tuesdayDate.setDate(startOfWeek.getDate() + 1);
              const wednesdayDate = new Date(startOfWeek);
              wednesdayDate.setDate(startOfWeek.getDate() + 2);
              const thursdayDate = new Date(startOfWeek);
              thursdayDate.setDate(startOfWeek.getDate() + 3);
              const fridayDate = new Date(startOfWeek);
              fridayDate.setDate(startOfWeek.getDate() + 4);

              const formatDateForBadge = (date: Date) => {
                return date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "numeric",
                  day: "numeric",
                });
              };

              return (
                <>
                  {/* Monday - Accountability Call */}
                  <div className="p-4 bg-embodied-orange/5 rounded-lg border border-embodied-orange/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-embodied-orange" />
                      <Badge
                        variant="outline"
                        className="text-xs border-embodied-orange text-embodied-orange"
                      >
                        {formatDateForBadge(mondayDate)}
                      </Badge>
                    </div>
                    <h4 className="editorial-subheader text-embodied-navy">
                      Accountability Call
                    </h4>
                    <p className="editorial-body text-xs text-embodied-navy/70 mt-1">
                      1:00 PM EST
                    </p>
                    <p className="editorial-body text-sm mt-2 mb-3">
                      Share progress and get clarity on your next steps.
                    </p>
                    <a
                      href="https://us02web.zoom.us/j/4086742007"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-embodied-orange hover:bg-embodied-coral text-white text-xs"
                      >
                        <Video className="w-3 h-3 mr-2" />
                        Join Call
                      </Button>
                    </a>
                  </div>

                  {/* Tuesday - Strategy and Conversion Call */}
                  <div className="p-4 bg-embodied-blue/5 rounded-lg border border-embodied-blue/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-embodied-blue" />
                      <Badge
                        variant="outline"
                        className="text-xs border-embodied-blue text-embodied-blue"
                      >
                        {formatDateForBadge(tuesdayDate)}
                      </Badge>
                    </div>
                    <h4 className="editorial-subheader text-embodied-navy">
                      Strategy and Conversion Call
                    </h4>
                    <p className="editorial-body text-xs text-embodied-navy/70 mt-1">
                      1:00 PM EST
                    </p>
                    <p className="editorial-body text-sm mt-2 mb-3">
                      Get feedback on your funnel strategy and overall business
                      approach.
                    </p>
                    <a
                      href="https://us02web.zoom.us/j/4086742007"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-embodied-blue hover:bg-embodied-navy text-white text-xs"
                      >
                        <Video className="w-3 h-3 mr-2" />
                        Join Call
                      </Button>
                    </a>
                  </div>

                  {/* Wednesday AM - Ads Strategy Call */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <Badge
                        variant="outline"
                        className="text-xs border-purple-600 text-purple-600"
                      >
                        {formatDateForBadge(wednesdayDate)}
                      </Badge>
                    </div>
                    <h4 className="editorial-subheader text-embodied-navy">
                      Ads Strategy Call
                    </h4>
                    <p className="editorial-body text-xs text-embodied-navy/70 mt-1">
                      10:30 AM EST
                    </p>
                    <p className="editorial-body text-sm mt-2 mb-3">
                      Get expert feedback on your ad setup and performance.
                    </p>
                    <a
                      href="https://us02web.zoom.us/j/7442098096"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                      >
                        <Video className="w-3 h-3 mr-2" />
                        Join Call
                      </Button>
                    </a>
                  </div>

                  {/* Wednesday PM - Tech Support Call */}
                  <div className="p-4 bg-embodied-coral/5 rounded-lg border border-embodied-coral/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-embodied-coral" />
                      <Badge
                        variant="outline"
                        className="text-xs border-embodied-coral text-embodied-coral"
                      >
                        {formatDateForBadge(wednesdayDate)}
                      </Badge>
                    </div>
                    <h4 className="editorial-subheader text-embodied-navy">
                      Tech Support Call
                    </h4>
                    <p className="editorial-body text-xs text-embodied-navy/70 mt-1">
                      3:00 PM EST
                    </p>
                    <p className="editorial-body text-sm mt-2 mb-3">
                      Live tech support for funnel setup and automation
                      challenges.
                    </p>
                    <a
                      href="https://us02web.zoom.us/j/7442098096"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-embodied-coral hover:bg-embodied-orange text-white text-xs"
                      >
                        <Video className="w-3 h-3 mr-2" />
                        Join Call
                      </Button>
                    </a>
                  </div>

                  {/* Thursday - Messaging Support */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <Badge
                        variant="outline"
                        className="text-xs border-green-600 text-green-600"
                      >
                        {formatDateForBadge(thursdayDate)}
                      </Badge>
                    </div>
                    <h4 className="editorial-subheader text-embodied-navy">
                      Messaging Support
                    </h4>
                    <p className="editorial-body text-xs text-embodied-navy/70 mt-1">
                      12:00 PM EST
                    </p>
                    <p className="editorial-body text-sm mt-2 mb-3">
                      Get feedback on your copy, offers, and messaging.
                    </p>
                    <a
                      href="https://us02web.zoom.us/j/4086742007"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        <Video className="w-3 h-3 mr-2" />
                        Join Call
                      </Button>
                    </a>
                  </div>

                  {/* Friday - Strategy and Conversion Call */}
                  <div className="p-4 bg-embodied-blue/5 rounded-lg border border-embodied-blue/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-embodied-blue" />
                      <Badge
                        variant="outline"
                        className="text-xs border-embodied-blue text-embodied-blue"
                      >
                        {formatDateForBadge(fridayDate)}
                      </Badge>
                    </div>
                    <h4 className="editorial-subheader text-embodied-navy">
                      Strategy and Conversion Call
                    </h4>
                    <p className="editorial-body text-xs text-embodied-navy/70 mt-1">
                      10:00 AM EST
                    </p>
                    <p className="editorial-body text-sm mt-2 mb-3">
                      Get feedback on your funnel strategy and overall business
                      approach.
                    </p>
                    <a
                      href="https://us02web.zoom.us/j/4086742007"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-embodied-blue hover:bg-embodied-navy text-white text-xs"
                      >
                        <Video className="w-3 h-3 mr-2" />
                        Join Call
                      </Button>
                    </a>
                  </div>

                  {/* Friday - Ads Strategy Call */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <Badge
                        variant="outline"
                        className="text-xs border-purple-600 text-purple-600"
                      >
                        {formatDateForBadge(fridayDate)}
                      </Badge>
                    </div>
                    <h4 className="editorial-subheader text-embodied-navy">
                      Ads Strategy Call
                    </h4>
                    <p className="editorial-body text-xs text-embodied-navy/70 mt-1">
                      3:00 PM EST
                    </p>
                    <p className="editorial-body text-sm mt-2 mb-3">
                      Get expert feedback on your ad setup and performance.
                    </p>
                    <a
                      href="https://us02web.zoom.us/j/7442098096"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                      >
                        <Video className="w-3 h-3 mr-2" />
                        Join Call
                      </Button>
                    </a>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="mt-4 pt-4 border-t border-embodied-orange/20">
            <Link href="/support/live-coaching-calls">
              <Button
                variant="outline"
                className="border-embodied-orange text-embodied-orange hover:bg-embodied-orange hover:text-white"
              >
                <Video className="w-4 h-4 mr-2" />
                View Full Schedule & Watch Replays
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Your Funnel Tracking */}
      <Card className="border-embodied-navy/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center justify-between text-embodied-navy">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-embodied-navy" />
              Your Funnel Tracking
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-embodied-navy/70">Date Range:</span>
              <Select
                value={selectedDateRange}
                onValueChange={setSelectedDateRange}
                data-testid="select-date-range"
              >
                <SelectTrigger className="w-24 h-8 text-xs border-embodied-blue/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Lead Gen Funnel Tracking */}
            <div className="p-4 bg-embodied-blue/5 rounded-lg border border-embodied-blue/20">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-5 h-5 text-embodied-blue" />
                <Badge
                  variant="outline"
                  className="border-embodied-blue text-embodied-blue text-xs"
                >
                  Active
                </Badge>
              </div>
              <h4 className="editorial-subheader text-embodied-navy">
                Lead Gen Funnel Tracking
              </h4>
              <p className="editorial-body text-sm text-embodied-navy/70 mt-1 mb-3">
                Monitor ad spend, conversions, and lead generation metrics
              </p>

              {trackingData.leadGenSummary.hasData &&
              (trackingData.leadGenSummary.metrics.adSpend > 0 ||
                trackingData.leadGenSummary.metrics.leads > 0) ? (
                <div className="space-y-2 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border">
                      <div className="text-embodied-navy/60">Ad Spend</div>
                      <div className="font-semibold text-embodied-navy">
                        $
                        {trackingData.leadGenSummary.metrics.adSpend.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-embodied-navy/60">Leads</div>
                      <div className="font-semibold text-embodied-navy">
                        {trackingData.leadGenSummary.metrics.leads.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-embodied-navy/60">Sales</div>
                      <div className="font-semibold text-embodied-navy">
                        {trackingData.leadGenSummary.metrics.sales.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-embodied-navy/60">ROAs</div>
                      <div className="font-semibold text-embodied-navy">
                        {trackingData.leadGenSummary.metrics.roas > 0
                          ? `${trackingData.leadGenSummary.metrics.roas.toFixed(
                              1
                            )}x`
                          : "—"}
                      </div>
                    </div>
                  </div>
                  {trackingData.leadGenSummary.isOptimizing && (
                    <div className="flex justify-between text-xs">
                      <span>Mode:</span>
                      <span className="font-medium text-blue-600">
                        Optimizing
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Setup Progress:</span>
                    <span className="font-medium">
                      {trackingData.leadGenSummary.tasksCompleted}/3
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Status:</span>
                    <span
                      className={`font-medium ${
                        trackingData.leadGenSummary.hasData
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {trackingData.leadGenSummary.hasData ? "Ready" : "Setup"}
                    </span>
                  </div>
                  <div className="text-xs text-embodied-navy/60 mt-2 p-2 bg-embodied-blue/5 rounded">
                    Start tracking to see Ad Spend, Leads, Sales & ROAs
                  </div>
                </div>
              )}
              <Link href="/lead-generation/track-and-optimize">
                <Button
                  variant="outline"
                  className="w-full border-embodied-blue text-embodied-blue hover:bg-embodied-blue hover:text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Tracking
                </Button>
              </Link>
            </div>

            {/* Live Launch Tracking */}
            <div className="p-4 bg-embodied-coral/5 rounded-lg border border-embodied-coral/20">
              <div className="flex items-center justify-between mb-3">
                <Target className="w-5 h-5 text-embodied-coral" />
                <Badge
                  variant="outline"
                  className="border-embodied-coral text-embodied-coral text-xs"
                >
                  Active
                </Badge>
              </div>
              <h4 className="editorial-subheader text-embodied-navy">
                Live Launch Tracking
              </h4>
              <p className="editorial-body text-sm text-embodied-navy/70 mt-1 mb-3">
                Track organic traffic, registrations, and email performance
              </p>

              {/* Launch Selector or Empty State */}
              {liveLaunches.length > 0 ? (
                <div className="mb-3">
                  <Select
                    value={selectedLiveLaunchId?.toString() || ""}
                    onValueChange={(value) =>
                      setSelectedLiveLaunchId(parseInt(value))
                    }
                    disabled={launchesLoading}
                  >
                    <SelectTrigger
                      className="w-full text-xs bg-white"
                      data-testid="dashboard-select-launch"
                    >
                      <SelectValue placeholder="Select a launch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {liveLaunches.map((launch: any) => (
                        <SelectItem
                          key={launch.id}
                          value={launch.id.toString()}
                        >
                          {launch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-xs text-embodied-navy/60 mb-3 p-2 bg-white rounded border border-dashed">
                  No launches yet. Create one from the tracking page to start
                  monitoring metrics.
                </div>
              )}

              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-embodied-navy/60">Ad Spend</div>
                    <div className="font-semibold text-embodied-navy">
                      $
                      {trackingData.liveLaunchSummary.metrics.adSpend.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-embodied-navy/60">Sales</div>
                    <div className="font-semibold text-embodied-navy">
                      {trackingData.liveLaunchSummary.metrics.sales.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-embodied-navy/60">
                      Registrations - Ads
                    </div>
                    <div className="font-semibold text-embodied-navy">
                      {trackingData.liveLaunchSummary.metrics.adsRegistrations?.toLocaleString() ||
                        "0"}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <div className="text-embodied-navy/60">
                      Registrations - Organic
                    </div>
                    <div className="font-semibold text-embodied-navy">
                      {trackingData.liveLaunchSummary.metrics.organicRegistrations?.toLocaleString() ||
                        "0"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <div className="text-embodied-navy/60">ROAs</div>
                    <div className="font-semibold text-embodied-navy">
                      {trackingData.liveLaunchSummary.metrics.roas > 0
                        ? `${trackingData.liveLaunchSummary.metrics.roas.toFixed(
                            1
                          )}x`
                        : "0x"}
                    </div>
                  </div>
                </div>
                {trackingData.liveLaunchSummary.isOptimizing && (
                  <div className="flex justify-between text-xs">
                    <span>Mode:</span>
                    <span className="font-medium text-blue-600">
                      Optimizing
                    </span>
                  </div>
                )}
              </div>
              <Link href="/launch-sales/track-and-optimize">
                <Button
                  variant="outline"
                  className="w-full border-embodied-coral text-embodied-coral hover:bg-embodied-coral hover:text-white"
                >
                  <Target className="w-4 h-4 mr-2" />
                  View Tracking
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
