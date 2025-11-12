import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronUp,
  Magnet,
  BarChart3,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  History,
  Edit3,
  Calculator,
  AlertTriangle,
  XCircle,
  Download
} from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";
import { useMarkSectionComplete, useUnmarkSectionComplete } from "@/hooks/useSectionCompletions";
import { useChecklistItems, useUpsertChecklistItem } from "@/hooks/useChecklistItems";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/services/queryClient";
import debounce from "lodash.debounce";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// State for tracking funnel metrics - using date-based storage  
type MetricData = {
  step: string;
  goal: string;
  values: Record<string, number>;
  sevenDayAvg: number;
  thirtyDayAvg: number;
  isManual: boolean; // Whether this metric requires manual input
};

// Type for funnel tracker data from API
type FunnelTrackerData = {
  tripwireProductCost: string | null;
  funnelData: MetricData[];
  organicFunnelData: MetricData[];
};

// Type for optimization suggestions
type OptimizationSuggestion = {
  type: string;
  title: string;
  issue: string;
  actions: string[];
};

type OptimizationSuggestionsData = {
  suggestions: OptimizationSuggestion[];
};

export default function TrackAndOptimize() {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const { toast } = useToast();
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();
  
  // Load checklist items from database
  const sectionKey = "track_optimize_implementation";
  const { data: checklistItems = [], isLoading: checklistLoading } = useChecklistItems(userId, sectionKey);
  const upsertChecklistItem = useUpsertChecklistItem();
  
  const [activeTab, setActiveTab] = useState("script-generator");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Today's date in YYYY-MM-DD format
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [lastSavedToIgniteDocs, setLastSavedToIgniteDocs] = useState<string | null>(null); // Track last saved content hash
  const [isEditingSuggestions, setIsEditingSuggestions] = useState(false);
  const [editedSuggestions, setEditedSuggestions] = useState<OptimizationSuggestion[]>([]);
  
  // Load funnel tracker data from database
  const { data: funnelTrackerData, isLoading: isLoadingTrackerData } = useQuery<FunnelTrackerData>({
    queryKey: ['/api/funnel-tracker-data', userId],
    enabled: !!userId,
  });
  
  // Load optimization suggestions from database
  const { data: savedSuggestions, isLoading: isLoadingSuggestions } = useQuery<OptimizationSuggestionsData>({
    queryKey: ['/api/optimization-suggestions', userId],
    enabled: !!userId,
  });
  
  const [tripwireProductCost, setTripwireProductCost] = useState(""); // Cost per tripwire product
  const [setupInstructionsExpanded, setSetupInstructionsExpanded] = useState(true); // Show instructions by default
  
  // Bulk entry state
  const [bulkEntryMode, setBulkEntryMode] = useState(false); // Toggle between week view and bulk entry
  const [bulkStartDate, setBulkStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkDaysCount, setBulkDaysCount] = useState(5);
  const [bulkOverwriteExisting, setBulkOverwriteExisting] = useState(false);
  const [bulkData, setBulkData] = useState<Record<string, Record<string, string>>>({});
  
  // State for tracking sections
  const [completedSections, setCompletedSections] = useState({
    leadMagnet: false,
    landingPage: false,
    automation: false,
    launch: false
  });
  
  // State for input fields
  const [leadInput, setLeadInput] = useState("");
  
  // Get default funnel data
  const getDefaultFunnelData = (): MetricData[] => {
    return [
    {
      step: "Ad Spend",
      goal: "",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: true
    },
    {
      step: "Click Through Rate",
      goal: "1-3%",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: true
    },
    {
      step: "Landing Page Views",
      goal: "",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: true
    },
    {
      step: "Cost Per Landing Page View",
      goal: "$0.50-$2.00",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: false
    },
    {
      step: "Leads",
      goal: "",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: true
    },
    {
      step: "Cost Per Lead",
      goal: "$2-$6",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: false
    },
    {
      step: "Landing Page Conversion Rate",
      goal: "30%",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: false
    },
    {
      step: "Tripwire Sales",
      goal: "",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: true
    },
    {
      step: "Tripwire Conversion Rate",
      goal: "2%",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: false
    },
    {
      step: "Total Revenue",
      goal: "",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: false
    },
    {
      step: "ROAs",
      goal: "",
      values: {} as Record<string, number>,
      sevenDayAvg: 0,
      thirtyDayAvg: 0,
      isManual: false
    }
    ];
  };

  const [funnelData, setFunnelData] = useState<MetricData[]>(getDefaultFunnelData());

  // Track whether data has been initialized from database
  const isInitialized = useRef(false);

  // Initialize data from database when loaded
  useEffect(() => {
    if (funnelTrackerData) {
      if (funnelTrackerData.tripwireProductCost) {
        setTripwireProductCost(funnelTrackerData.tripwireProductCost);
      }
      if (funnelTrackerData.funnelData && funnelTrackerData.funnelData.length > 0) {
        setFunnelData(funnelTrackerData.funnelData);
      }
      // Mark as initialized after loading data
      isInitialized.current = true;
    } else if (!isLoadingTrackerData) {
      // If no data exists and loading is complete, mark as initialized
      isInitialized.current = true;
    }
  }, [funnelTrackerData, isLoadingTrackerData]);

  // Memoized debounced save to database
  const saveFunnelTrackerData = useMemo(() => {
    return debounce(async (data: {
      tripwireProductCost: string;
      funnelData: MetricData[];
    }) => {
      if (!userId) return;
      
      try {
        await apiRequest('POST', '/api/funnel-tracker-data', {
          ...data,
          organicFunnelData: [] // Empty for now, will be added later if needed
        });
        queryClient.invalidateQueries({ queryKey: ['/api/funnel-tracker-data', userId] });
      } catch (error) {
        console.error('Error saving funnel tracker data:', error);
      }
    }, 1000);
  }, [userId]);

  // Cancel debounced function on unmount
  useEffect(() => {
    return () => {
      saveFunnelTrackerData.cancel();
    };
  }, [saveFunnelTrackerData]);

  // Save data to database whenever it changes (only after initialization)
  useEffect(() => {
    if (isInitialized.current && !isLoadingTrackerData && userId) {
      saveFunnelTrackerData({
        tripwireProductCost,
        funnelData
      });
    }
  }, [tripwireProductCost, funnelData, userId, isLoadingTrackerData, saveFunnelTrackerData]);

  // Save optimization suggestions to database AND IGNITE Docs when funnel data changes
  useEffect(() => {
    // Only save if initialized, user is logged in, and saved suggestions have finished loading
    if (!isInitialized.current || !userId || isLoadingTrackerData || isLoadingSuggestions) return;
    
    // Generate suggestions based on current funnel data
    const suggestions = generateSuggestions();
    
    // Only save if we have suggestions and they're different from what's saved
    if (suggestions.length > 0) {
      const suggestionsChanged = JSON.stringify(suggestions) !== JSON.stringify(savedSuggestions?.suggestions || []);
      
      if (suggestionsChanged) {
        // Save to database
        apiRequest('POST', '/api/optimization-suggestions', { suggestions })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['/api/optimization-suggestions', userId] });
            
            // Also automatically save to IGNITE Docs (silently, no toast notifications)
            saveToIgniteDocs(true);
          })
          .catch((error) => {
            console.error('Error saving optimization suggestions:', error);
          });
      }
    }
  }, [funnelData, userId, isLoadingTrackerData, isLoadingSuggestions, savedSuggestions]);

  // Recalculate totals/averages on mount to ensure they use the correct formula
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const updatedData = [...funnelData];
    
    updatedData.forEach((metric, index) => {
      if (shouldUseTotals(metric.step)) {
        updatedData[index].sevenDayAvg = calculateTotal(metric.values, today, 7);
        updatedData[index].thirtyDayAvg = calculateTotal(metric.values, today, 30);
      } else {
        updatedData[index].sevenDayAvg = calculateAverage(metric.values, today, 7);
        updatedData[index].thirtyDayAvg = calculateAverage(metric.values, today, 30);
      }
    });
    
    setFunnelData(updatedData);
  }, []); // Only run on mount

  // Auto-fill Landing Page Views goal when Ad Spend changes
  useEffect(() => {
    const adSpendGoal = parseFloat(funnelData[0]?.goal.replace(/[^0-9.]/g, '') || '0');
    const landingPageViewsGoal = funnelData.find(m => m.step === "Landing Page Views")?.goal || '';
    
    if (adSpendGoal > 0 && !landingPageViewsGoal) {
      const defaultCostPerLPV = 1.25;
      const calculatedLPV = Math.round(adSpendGoal / defaultCostPerLPV);
      
      const updatedData = [...funnelData];
      const lpvIndex = updatedData.findIndex(m => m.step === "Landing Page Views");
      if (lpvIndex >= 0) {
        updatedData[lpvIndex].goal = calculatedLPV.toString();
        setFunnelData(updatedData);
      }
    }
  }, [funnelData]);

  // Auto-populate Leads goal when dependencies are available
  useEffect(() => {
    const landingPageViewsGoal = parseFloat(funnelData.find(m => m.step === "Landing Page Views")?.goal.replace(/[^0-9.]/g, '') || '0');
    const conversionRateGoalRaw = funnelData.find(m => m.step === "Landing Page Conversion Rate")?.goal || '0';
    const leadsGoal = funnelData.find(m => m.step === "Leads")?.goal || '';
    
    const numMatch = conversionRateGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const conversionRatePercent = numMatch ? parseFloat(numMatch[1]) : 0;
    
    if (landingPageViewsGoal > 0 && conversionRatePercent > 0 && !leadsGoal) {
      const suggested = Math.round(landingPageViewsGoal * (conversionRatePercent / 100));
      const updatedData = [...funnelData];
      const leadsIndex = updatedData.findIndex(m => m.step === "Leads");
      if (leadsIndex >= 0) {
        updatedData[leadsIndex].goal = suggested.toString();
        setFunnelData(updatedData);
      }
    }
  }, [funnelData]);

  // Auto-populate Tripwire Sales goal when dependencies are available
  useEffect(() => {
    const leadsGoalRaw = funnelData.find(m => m.step === "Leads")?.goal || '0';
    const leadsMatch = leadsGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const leadsGoal = leadsMatch ? parseFloat(leadsMatch[1]) : 0;
    
    const tripwireConversionRateGoalRaw = funnelData.find(m => m.step === "Tripwire Conversion Rate")?.goal || '0';
    const rangeMatch = tripwireConversionRateGoalRaw.match(/(\d+(?:\.\d+)?)-/);
    const numMatch = tripwireConversionRateGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const tripwireConversionPercent = rangeMatch ? parseFloat(rangeMatch[1]) : (numMatch ? parseFloat(numMatch[1]) : 0);
    
    const tripwireSalesGoal = funnelData.find(m => m.step === "Tripwire Sales")?.goal || '';
    
    if (leadsGoal > 0 && tripwireConversionPercent > 0 && !tripwireSalesGoal) {
      const suggested = Math.round(leadsGoal * (tripwireConversionPercent / 100));
      const updatedData = [...funnelData];
      const salesIndex = updatedData.findIndex(m => m.step === "Tripwire Sales");
      if (salesIndex >= 0) {
        updatedData[salesIndex].goal = suggested.toString();
        setFunnelData(updatedData);
      }
    }
  }, [funnelData]);

  // Auto-populate Total Revenue goal when dependencies are available
  useEffect(() => {
    const tripwireSalesGoalRaw = funnelData.find(m => m.step === "Tripwire Sales")?.goal || '0';
    const salesMatch = tripwireSalesGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const tripwireSalesGoal = salesMatch ? parseFloat(salesMatch[1]) : 0;
    
    const productCost = parseFloat(tripwireProductCost || '0');
    const totalRevenueGoal = funnelData.find(m => m.step === "Total Revenue")?.goal || '';
    
    if (tripwireSalesGoal > 0 && productCost > 0 && !totalRevenueGoal) {
      const suggested = tripwireSalesGoal * productCost;
      const updatedData = [...funnelData];
      const revenueIndex = updatedData.findIndex(m => m.step === "Total Revenue");
      if (revenueIndex >= 0) {
        updatedData[revenueIndex].goal = `$${suggested.toFixed(2)}`;
        setFunnelData(updatedData);
      }
    }
  }, [funnelData, tripwireProductCost]);

  // Auto-populate ROAs goal when dependencies are available
  useEffect(() => {
    const totalRevenueGoalRaw = funnelData.find(m => m.step === "Total Revenue")?.goal || '0';
    const revenueMatch = totalRevenueGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const totalRevenueGoal = revenueMatch ? parseFloat(revenueMatch[1]) : 0;
    
    const adSpendGoalRaw = funnelData[0]?.goal || '0';
    const adSpendMatch = adSpendGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const adSpendGoal = adSpendMatch ? parseFloat(adSpendMatch[1]) : 0;
    
    const roasGoal = funnelData.find(m => m.step === "ROAs")?.goal || '';
    
    if (totalRevenueGoal > 0 && adSpendGoal > 0 && !roasGoal) {
      const suggested = totalRevenueGoal / adSpendGoal;
      const updatedData = [...funnelData];
      const roasIndex = updatedData.findIndex(m => m.step === "ROAs");
      if (roasIndex >= 0) {
        updatedData[roasIndex].goal = `${suggested.toFixed(2)}x`;
        setFunnelData(updatedData);
      }
    }
  }, [funnelData]);

  // Utility functions for date calculations
  const getDatesBefore = (fromDate: string, days: number): string[] => {
    const dates = [];
    const date = new Date(fromDate);
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() - i);
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    return dates;
  };

  const calculateAverage = (values: Record<string, number>, fromDate: string, days: number): number => {
    const dates = getDatesBefore(fromDate, days);
    const validValues = dates.map(date => values[date]).filter(val => val !== undefined && !isNaN(val));
    if (validValues.length === 0) return 0;
    return Math.round((validValues.reduce((a, b) => a + b, 0) / validValues.length) * 100) / 100;
  };

  const calculateTotal = (values: Record<string, number>, fromDate: string, days: number): number => {
    const dates = getDatesBefore(fromDate, days);
    const validValues = dates.map(date => values[date]).filter(val => val !== undefined && !isNaN(val));
    if (validValues.length === 0) return 0;
    return Math.round(validValues.reduce((a, b) => a + b, 0) * 100) / 100;
  };

  const shouldUseTotals = (stepName: string): boolean => {
    return [
      "Ad Spend",
      "Landing Page Views",
      "Leads",
      "Tripwire Sales",
      "Total Revenue"
    ].includes(stepName);
  };

  // Calculate monthly total for a metric
  const calculateMonthlyTotal = (values: Record<string, number>, month: string): number => {
    let total = 0;
    Object.keys(values).forEach(date => {
      if (date.startsWith(month)) {
        total += values[date] || 0;
      }
    });
    return total;
  };

  // Calculate monthly average for a metric
  const calculateMonthlyAverage = (values: Record<string, number>, month: string): number => {
    const monthValues: number[] = [];
    Object.keys(values).forEach(date => {
      if (date.startsWith(month) && values[date]) {
        monthValues.push(values[date]);
      }
    });
    
    if (monthValues.length === 0) return 0;
    const sum = monthValues.reduce((acc, val) => acc + val, 0);
    return sum / monthValues.length;
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next' | 'current') => {
    if (direction === 'current') {
      setSelectedMonth(new Date().toISOString().slice(0, 7));
    } else {
      const [year, month] = selectedMonth.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      if (direction === 'prev') {
        date.setMonth(date.getMonth() - 1);
      } else {
        date.setMonth(date.getMonth() + 1);
      }
      setSelectedMonth(date.toISOString().slice(0, 7));
    }
  };

  const formatCurrency = (value: number | string): string => {
    if (value === "" || value === undefined || value === null || isNaN(Number(value))) return "—";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  };

  const formatPercentage = (value: number | string): string => {
    if (value === "" || value === undefined || value === null || isNaN(Number(value))) return "—";
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) / 100);
  };

  const isCurrencyMetric = (stepName: string): boolean => {
    return [
      "Ad Spend",
      "Cost Per Landing Page View", 
      "Cost Per Lead",
      "Total Revenue"
    ].includes(stepName);
  };

  const isPercentageMetric = (stepName: string): boolean => {
    return [
      "Click Through Rate",
      "Landing Page Conversion Rate",
      "Tripwire Conversion Rate"
    ].includes(stepName);
  };

  // Helper function to check if metric has industry standard goal
  const hasIndustryStandardGoal = (stepName: string): boolean => {
    return [
      "Click Through Rate",
      "Cost Per Landing Page View",
      "Cost Per Lead",
      "Landing Page Conversion Rate",
      "Tripwire Conversion Rate"
    ].includes(stepName);
  };

  // Analysis functions for suggestions
  const getMetricValue = (metricName: string, useAverage: boolean = true): number => {
    const metric = funnelData.find(m => m.step === metricName);
    if (!metric) return 0;
    if (useAverage) {
      return metric.thirtyDayAvg || 0;
    }
    return metric.values[selectedDate] || 0;
  };

  // Function to get performance status color based on goal comparison
  const getPerformanceStatus = (metricName: string, currentValue: number, goalString: string): 'excellent' | 'good' | 'warning' | 'danger' | 'neutral' => {
    if (!goalString || currentValue === 0) return 'neutral';
    
    // Parse goal ranges and single targets
    const parseGoal = (goal: string) => {
      // Handle percentage ranges (e.g., "1-3%", "30-40%")
      const percentageRange = goal.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%/);
      if (percentageRange) {
        return { min: parseFloat(percentageRange[1]), max: parseFloat(percentageRange[2]), type: 'range' };
      }
      
      // Handle currency ranges (e.g., "$2-$6", "$0.50-$2.00")
      const currencyRange = goal.match(/\$(\d+(?:\.\d+)?)-\$(\d+(?:\.\d+)?)/);
      if (currencyRange) {
        return { min: parseFloat(currencyRange[1]), max: parseFloat(currencyRange[2]), type: 'range' };
      }
      
      // Handle single target values (e.g., "1.02x", "5", "$100", "30%")
      const singleValue = goal.match(/(\d+(?:\.\d+)?)/);
      if (singleValue) {
        const target = parseFloat(singleValue[1]);
        return { target, type: 'single' };
      }
      
      return null;
    };
    
    const goalData = parseGoal(goalString);
    if (!goalData) return 'neutral';
    
    // For "lower is better" metrics (costs)
    const isLowerBetter = metricName.toLowerCase().includes('cost');
    
    // Handle single target values
    if (goalData.type === 'single' && 'target' in goalData) {
      const target = goalData.target as number;
      const tolerance = target * 0.1; // 10% tolerance for single targets
      
      if (isLowerBetter) {
        if (currentValue <= target) {
          return currentValue <= target * 0.8 ? 'excellent' : 'good';
        } else if (currentValue <= target + tolerance) {
          return 'warning';
        } else {
          return 'danger';
        }
      } else {
        // For "higher is better" metrics (ROAs, rates, conversions)
        if (currentValue >= target) {
          return currentValue >= target * 1.2 ? 'excellent' : 'good';
        } else if (currentValue >= target - tolerance) {
          return 'warning';
        } else {
          return 'danger';
        }
      }
    }
    
    // Handle range values
    const { min, max } = goalData as { min: number; max: number };
    const range = max - min;
    const tolerance = range * 0.2; // 20% tolerance for warning zone
    
    if (isLowerBetter) {
      if (currentValue <= max) {
        return currentValue <= min ? 'excellent' : 'good';
      } else if (currentValue <= max + tolerance) {
        return 'warning';
      } else {
        return 'danger';
      }
    } else {
      // For "higher is better" metrics (rates, conversions)
      if (currentValue > max) {
        // Above the goal range is excellent for conversion rates
        return 'excellent';
      } else if (currentValue >= min && currentValue <= max) {
        return currentValue >= (min + max) / 2 ? 'excellent' : 'good';
      } else if (currentValue >= min - tolerance) {
        return 'warning';
      } else {
        return 'danger';
      }
    }
  };

  // Function to get CSS classes for performance status
  const getStatusClasses = (status: 'excellent' | 'good' | 'warning' | 'danger' | 'neutral') => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'good':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'danger':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  // Function to get status indicator icon
  const getStatusIcon = (status: 'excellent' | 'good' | 'warning' | 'danger' | 'neutral') => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const generateSuggestions = () => {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Get current metric values
    const clickThroughRate = getMetricValue("Click Through Rate");
    const costPerLead = getMetricValue("Cost Per Lead");
    const landingPageConversion = getMetricValue("Landing Page Conversion Rate");
    const tripwireConversion = getMetricValue("Tripwire Conversion Rate");
    const roasValue = getMetricValue("ROAs");
    
    // CTR Analysis (1-3% is healthy)
    if (clickThroughRate > 0 && clickThroughRate < 1) {
      suggestions.push({
        type: "warning",
        title: "CTR Below Industry Average",
        issue: "CTR is below industry average — test new ad copy or creative",
        actions: [
          "Test new ad creatives with stronger hooks",
          "Refine your audience targeting",
          "Try different ad formats (video, carousel, single image)",
          "Update ad copy to better match your audience's pain points"
        ]
      });
    } else if (clickThroughRate >= 1 && clickThroughRate <= 3) {
      suggestions.push({
        type: "success",
        title: "CTR Above Average",
        issue: "Nice! Your CTR is above average — keep optimizing your top-performing ad",
        actions: [
          "Scale your winning ad creative",
          "Document what's working for future campaigns"
        ]
      });
    }
    
    // Cost Per Lead Analysis ($2-$6 is healthy)
    if (costPerLead > 6) {
      suggestions.push({
        type: "warning",
        title: "High Cost Per Lead",
        issue: "Your CPL is high — refine targeting or test new offers",
        actions: [
          "Improve your landing page conversion rate",
          "Optimize your ad targeting to reach more qualified prospects",
          "Test different ad creatives to improve click-through rate",
          "A/B test your landing page copy and design"
        ]
      });
    } else if (costPerLead >= 2 && costPerLead <= 6) {
      suggestions.push({
        type: "success",
        title: "Great Cost Per Lead!",
        issue: `Your cost per lead ($${costPerLead.toFixed(2)}) is within the ideal range`,
        actions: [
          "Scale up your ad spend to capitalize on this efficiency",
          "Document what's working so you can replicate it"
        ]
      });
    }
    
    // Landing Page Conversion Analysis (30-40% is healthy)
    if (landingPageConversion > 0 && landingPageConversion < 30) {
      suggestions.push({
        type: "warning",
        title: "Landing Page Underperforming",
        issue: "Landing page underperforming — simplify layout or CTA",
        actions: [
          "Test different headlines that match your ad messaging",
          "Simplify your opt-in form (reduce required fields)",
          "Add social proof like testimonials or logos",
          "Improve your lead magnet offer to be more compelling",
          "Test different page layouts and call-to-action buttons"
        ]
      });
    } else if (landingPageConversion >= 30) {
      suggestions.push({
        type: "success",
        title: "Excellent Landing Page Conversion!",
        issue: `Your landing page conversion rate (${landingPageConversion.toFixed(1)}%) is meeting or exceeding industry standards`,
        actions: [
          "Scale your traffic to this high-converting page",
          "Use this page as a template for future campaigns"
        ]
      });
    }
    
    // Tripwire Conversion Analysis (2-5% is healthy)
    if (tripwireConversion > 0 && tripwireConversion < 2) {
      suggestions.push({
        type: "warning",
        title: "Low Tripwire Conversion",
        issue: "Few leads converting — try adjusting tripwire pricing or urgency",
        actions: [
          "Review your tripwire offer - is it compelling enough?",
          "Test different price points for your tripwire",
          "Improve the sales copy on your tripwire page",
          "Add urgency or scarcity to your tripwire offer"
        ]
      });
    } else if (tripwireConversion >= 2 && tripwireConversion <= 5) {
      suggestions.push({
        type: "success",
        title: "Strong Tripwire Conversion!",
        issue: `Your tripwire conversion rate (${tripwireConversion.toFixed(1)}%) is within the healthy 2-5% range`,
        actions: [
          "Scale your lead generation to capitalize on this conversion rate",
          "Consider testing a higher-priced tripwire offer"
        ]
      });
    }
    
    // ROAS Analysis (> 1.0 is healthy)
    if (roasValue > 0 && roasValue < 1.0) {
      suggestions.push({
        type: "warning",
        title: "ROAS Below 1",
        issue: "ROAS below 1 — optimize ad spend or increase tripwire value",
        actions: [
          "Focus on improving tripwire conversion rate first",
          "Consider increasing your tripwire price if conversion allows",
          "Optimize your entire funnel to reduce cost per lead",
          "Review your core offer pricing and positioning"
        ]
      });
    } else if (roasValue >= 1.0) {
      suggestions.push({
        type: "success",
        title: "Positive Return on Ad Spend!",
        issue: `Your ROAS (${roasValue.toFixed(2)}x) is above 1.0, meaning you're making more than you're spending`,
        actions: [
          "Scale up your ad spend to capitalize on this positive ROAS",
          "Document what's working in your funnel for future campaigns"
        ]
      });
    }
    
    return suggestions;
  };

  // Convert optimization suggestions to markdown format
  const convertSuggestionsToMarkdown = (suggestions: OptimizationSuggestion[]): string => {
    if (suggestions.length === 0) {
      return "# Funnel Optimization Suggestions\n\nNo suggestions available yet. Add your funnel metrics to get personalized optimization recommendations.";
    }

    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let markdown = `# Funnel Optimization Suggestions\n\n`;
    markdown += `**Generated:** ${date}\n\n`;
    markdown += `Based on your current funnel metrics, here are personalized recommendations to improve your performance:\n\n`;
    markdown += `---\n\n`;

    suggestions.forEach((suggestion, index) => {
      const emoji = suggestion.type === 'success' ? '✅' : '⚠️';
      markdown += `## ${emoji} ${suggestion.title}\n\n`;
      markdown += `**${suggestion.issue}**\n\n`;
      
      if (suggestion.actions && suggestion.actions.length > 0) {
        markdown += suggestion.type === 'success' ? `### Keep Doing This:\n\n` : `### Action Steps:\n\n`;
        suggestion.actions.forEach(action => {
          markdown += `- ${action}\n`;
        });
        markdown += `\n`;
      }

      if (index < suggestions.length - 1) {
        markdown += `---\n\n`;
      }
    });

    markdown += `\n---\n\n`;
    markdown += `*These suggestions are based on industry benchmarks and your current funnel performance. Update your metrics regularly to get the most accurate recommendations.*`;

    return markdown;
  };

  // Save optimization suggestions to IGNITE Docs (silent = no toast notifications)
  const saveToIgniteDocs = async (silent: boolean = false) => {
    if (!userId) {
      if (!silent) {
        toast({
          title: "Error",
          description: "You must be logged in to save to IGNITE Docs",
          variant: "destructive"
        });
      }
      return;
    }

    const suggestions = savedSuggestions?.suggestions && savedSuggestions.suggestions.length > 0 
      ? savedSuggestions.suggestions 
      : generateSuggestions();

    if (suggestions.length === 0) {
      if (!silent) {
        toast({
          title: "No Suggestions to Save",
          description: "Add your funnel metrics first to generate optimization suggestions",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      const markdownContent = convertSuggestionsToMarkdown(suggestions);
      
      // Create a simple hash of the content to prevent duplicate saves
      const contentHash = JSON.stringify(suggestions);
      
      // Only save if content has actually changed
      if (silent && contentHash === lastSavedToIgniteDocs) {
        return; // Skip saving duplicate content
      }
      
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      await apiRequest('POST', '/api/ignite-docs', {
        userId,
        docType: 'funnel_optimization',
        title: `Funnel Optimization Suggestions - ${date}`,
        contentMarkdown: markdownContent,
        sourcePayload: {
          generatedDate: new Date().toISOString(),
          suggestionsCount: suggestions.length,
          funnelMetrics: funnelData.map(m => ({
            step: m.step,
            thirtyDayAvg: m.thirtyDayAvg
          }))
        }
      });

      // Update the last saved content hash
      setLastSavedToIgniteDocs(contentHash);

      queryClient.invalidateQueries({ queryKey: ['/api/ignite-docs', 'user', userId] });

      if (!silent) {
        toast({
          title: "Saved to IGNITE Docs",
          description: "Your funnel optimization suggestions have been saved to Resources. Check the Funnel Optimization tab to view them."
        });
      }
    } catch (error) {
      console.error('Error saving to IGNITE Docs:', error);
      if (!silent) {
        toast({
          title: "Error Saving",
          description: "Failed to save suggestions to IGNITE Docs. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Export Optimization Suggestions as PDF
  const exportOptimizationSuggestionsPDF = () => {
    const suggestions = savedSuggestions?.suggestions && savedSuggestions.suggestions.length > 0 
      ? savedSuggestions.suggestions 
      : generateSuggestions();

    if (suggestions.length === 0) {
      toast({
        title: "No Suggestions to Export",
        description: "Add your funnel metrics first to generate optimization suggestions",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper function to add text with wrapping
      const addText = (text: string, fontSize: number, isBold: boolean = false, indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, maxWidth - indent);
        
        for (const line of lines) {
          if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(line, margin + indent, yPos);
          yPos += fontSize * 0.5;
        }
        yPos += 3;
      };

      // Title
      addText('Funnel Optimization Suggestions', 18, true);
      yPos += 5;

      // Date
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      addText(`Generated: ${date}`, 10);
      yPos += 5;

      // Add each suggestion
      suggestions.forEach((suggestion, index) => {
        // Suggestion title with number
        addText(`${index + 1}. ${suggestion.title}`, 14, true);
        
        // Issue description
        addText(`Issue: ${suggestion.issue}`, 11);
        yPos += 2;
        
        // Actions
        addText('Recommended Actions:', 11, true);
        suggestion.actions.forEach((action) => {
          addText(`• ${action}`, 10, false, 5);
        });
        
        yPos += 8;
      });

      // Footer
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('These suggestions are based on industry benchmarks and your current funnel performance.', margin, pageHeight - 20, { maxWidth });

      // Save the PDF
      doc.save('Funnel_Optimization_Suggestions.pdf');

      toast({
        title: "PDF Downloaded",
        description: "Your optimization suggestions have been exported as PDF"
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Export Optimization Suggestions as DOCX
  const exportOptimizationSuggestionsDOCX = async () => {
    const suggestions = savedSuggestions?.suggestions && savedSuggestions.suggestions.length > 0 
      ? savedSuggestions.suggestions 
      : generateSuggestions();

    if (suggestions.length === 0) {
      toast({
        title: "No Suggestions to Export",
        description: "Add your funnel metrics first to generate optimization suggestions",
        variant: "destructive"
      });
      return;
    }

    try {
      const paragraphs: any[] = [];

      // Title
      paragraphs.push(
        new Paragraph({
          text: "Funnel Optimization Suggestions",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );

      // Date
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      paragraphs.push(
        new Paragraph({
          text: `Generated: ${date}`,
          spacing: { after: 400 }
        })
      );

      // Add each suggestion
      suggestions.forEach((suggestion, index) => {
        // Suggestion title
        paragraphs.push(
          new Paragraph({
            text: `${index + 1}. ${suggestion.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );

        // Issue description
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Issue: ", bold: true }),
              new TextRun({ text: suggestion.issue })
            ],
            spacing: { after: 100 }
          })
        );

        // Actions header
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Recommended Actions:", bold: true })
            ],
            spacing: { after: 100 }
          })
        );

        // Action items
        suggestion.actions.forEach((action) => {
          paragraphs.push(
            new Paragraph({
              text: `• ${action}`,
              spacing: { after: 50 },
              indent: { left: 360 }
            })
          );
        });
      });

      // Footer note
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: "These suggestions are based on industry benchmarks and your current funnel performance. Update your metrics regularly to get the most accurate recommendations.",
              italics: true
            })
          ],
          spacing: { before: 400 }
        })
      );

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      // Generate and save
      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'Funnel_Optimization_Suggestions.docx');

      toast({
        title: "DOCX Downloaded",
        description: "Your optimization suggestions have been exported as DOCX"
      });
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export DOCX. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle enabling edit mode for suggestions
  const handleEditSuggestions = () => {
    const suggestions = savedSuggestions?.suggestions && savedSuggestions.suggestions.length > 0 
      ? savedSuggestions.suggestions 
      : generateSuggestions();
    
    if (suggestions.length === 0) {
      toast({
        title: "No Suggestions Available",
        description: "Add your funnel metrics first to generate optimization suggestions",
        variant: "destructive"
      });
      return;
    }
    
    setEditedSuggestions(JSON.parse(JSON.stringify(suggestions))); // Deep copy
    setIsEditingSuggestions(true);
  };

  // Handle saving edited suggestions
  const handleSaveEditedSuggestions = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to save suggestions",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest('POST', '/api/optimization-suggestions', { suggestions: editedSuggestions });
      queryClient.invalidateQueries({ queryKey: ['/api/optimization-suggestions', userId] });
      
      setIsEditingSuggestions(false);
      
      toast({
        title: "Suggestions Updated",
        description: "Your optimization suggestions have been saved successfully"
      });
    } catch (error) {
      console.error('Error saving edited suggestions:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditingSuggestions(false);
    setEditedSuggestions([]);
  };

  // Update a suggestion field
  const updateSuggestion = (index: number, field: keyof OptimizationSuggestion, value: any) => {
    const updated = [...editedSuggestions];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSuggestions(updated);
  };

  // Update a specific action within a suggestion
  const updateSuggestionAction = (suggestionIndex: number, actionIndex: number, value: string) => {
    const updated = [...editedSuggestions];
    updated[suggestionIndex].actions[actionIndex] = value;
    setEditedSuggestions(updated);
  };

  // Add a new action to a suggestion
  const addSuggestionAction = (suggestionIndex: number) => {
    const updated = [...editedSuggestions];
    updated[suggestionIndex].actions.push('');
    setEditedSuggestions(updated);
  };

  // Remove an action from a suggestion
  const removeSuggestionAction = (suggestionIndex: number, actionIndex: number) => {
    const updated = [...editedSuggestions];
    updated[suggestionIndex].actions.splice(actionIndex, 1);
    setEditedSuggestions(updated);
  };

  // Bulk entry helper functions
  const generateBulkDates = (startDate: string, days: number): string[] => {
    const dates = [];
    const date = new Date(startDate);
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() + i);
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Function to calculate suggested Landing Page Views goal based on Ad Spend Goal and Cost Per LPV
  const getSuggestedLandingPageViews = (date: string = selectedDate): string => {
    const adSpendGoal = parseFloat(funnelData[0]?.goal.replace(/[^0-9.]/g, '') || '0'); // Ad Spend Goal
    const actualCostPerLPV = funnelData[3]?.values[date] || 0; // Actual Cost Per Landing Page View
    const defaultCostPerLPV = 1.25; // Industry average cost per landing page view
    
    if (adSpendGoal > 0) {
      // Use actual cost if available, otherwise use default $1.25
      const costPerLPV = actualCostPerLPV > 0 ? actualCostPerLPV : defaultCostPerLPV;
      const suggested = Math.round(adSpendGoal / costPerLPV);
      const source = actualCostPerLPV > 0 ? 'actual cost per view' : 'avg $1.25 per view';
      return `~${suggested} (based on ${source})`;
    }
    return "Set goal";
  };

  const getSuggestedLeads = (): string => {
    const landingPageViewsGoal = parseFloat(funnelData.find(m => m.step === "Landing Page Views")?.goal.replace(/[^0-9.]/g, '') || '0');
    const conversionRateGoalRaw = funnelData.find(m => m.step === "Landing Page Conversion Rate")?.goal || '0';
    
    // Parse the conversion rate - handle both "30%" and "30.40%" formats
    let conversionRatePercent = 0;
    
    // First, try to extract just the number (keeping decimals)
    const numMatch = conversionRateGoalRaw.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      conversionRatePercent = parseFloat(numMatch[1]);
    }
    
    if (landingPageViewsGoal > 0 && conversionRatePercent > 0) {
      const suggested = Math.round(landingPageViewsGoal * (conversionRatePercent / 100));
      return `${suggested} (${landingPageViewsGoal} × ${conversionRatePercent}%)`;
    }
    return "Set goal";
  };

  const getSuggestedTripwireSales = (): string => {
    const leadsGoalRaw = funnelData.find(m => m.step === "Leads")?.goal || '0';
    // Extract just the first number from the goal (handles "240" or "240 (800 × 30%)")
    const leadsMatch = leadsGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const leadsGoal = leadsMatch ? parseFloat(leadsMatch[1]) : 0;
    
    const tripwireConversionRateGoalRaw = funnelData.find(m => m.step === "Tripwire Conversion Rate")?.goal || '0';
    
    // Parse the conversion rate - handle "2%", "2.5%", and ranges like "2-5%"
    let tripwireConversionPercent = 0;
    
    // First try to match a range and use the first number (e.g., "2-5%" -> use 2)
    const rangeMatch = tripwireConversionRateGoalRaw.match(/(\d+(?:\.\d+)?)-/);
    if (rangeMatch) {
      tripwireConversionPercent = parseFloat(rangeMatch[1]);
    } else {
      // Otherwise just extract the first number
      const numMatch = tripwireConversionRateGoalRaw.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        tripwireConversionPercent = parseFloat(numMatch[1]);
      }
    }
    
    if (leadsGoal > 0 && tripwireConversionPercent > 0) {
      const suggested = Math.round(leadsGoal * (tripwireConversionPercent / 100));
      return `${suggested} (${leadsGoal} × ${tripwireConversionPercent}%)`;
    }
    return "Set goal";
  };

  const getSuggestedTotalRevenue = (): string => {
    const tripwireSalesGoalRaw = funnelData.find(m => m.step === "Tripwire Sales")?.goal || '0';
    // Extract just the first number from the goal (handles "5" or "5 (240 × 2%)")
    const salesMatch = tripwireSalesGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const tripwireSalesGoal = salesMatch ? parseFloat(salesMatch[1]) : 0;
    
    const productCost = parseFloat(tripwireProductCost || '0');
    
    if (tripwireSalesGoal > 0 && productCost > 0) {
      const suggested = tripwireSalesGoal * productCost;
      return `$${suggested.toFixed(2)} (${tripwireSalesGoal} × $${productCost})`;
    }
    return "Set goal";
  };

  const getSuggestedROAs = (): string => {
    const totalRevenueGoalRaw = funnelData.find(m => m.step === "Total Revenue")?.goal || '0';
    // Extract just the first number from the goal (handles "$123.45" or "$123.45 (5 × $24.69)")
    const revenueMatch = totalRevenueGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const totalRevenueGoal = revenueMatch ? parseFloat(revenueMatch[1]) : 0;
    
    const adSpendGoalRaw = funnelData[0]?.goal || '0';
    const adSpendMatch = adSpendGoalRaw.match(/(\d+(?:\.\d+)?)/);
    const adSpendGoal = adSpendMatch ? parseFloat(adSpendMatch[1]) : 0;
    
    if (totalRevenueGoal > 0 && adSpendGoal > 0) {
      const suggested = totalRevenueGoal / adSpendGoal;
      return `${suggested.toFixed(2)}x ($${totalRevenueGoal} ÷ $${adSpendGoal})`;
    }
    return "Set goal";
  };

  const initializeBulkData = () => {
    const data: Record<string, Record<string, string>> = {};
    const manualMetrics = funnelData.filter(metric => metric.isManual);
    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);
    
    manualMetrics.forEach(metric => {
      data[metric.step] = {};
      dates.forEach(date => {
        data[metric.step][date] = metric.values[date]?.toString() || "";
      });
    });
    
    setBulkData(data);
  };

  const updateBulkValue = (metricName: string, date: string, value: string) => {
    setBulkData(prev => ({
      ...prev,
      [metricName]: {
        ...prev[metricName],
        [date]: value
      }
    }));
  };

  const fillRowWithSameValue = (metricName: string, value: string) => {
    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);
    setBulkData(prev => ({
      ...prev,
      [metricName]: dates.reduce((acc, date) => {
        acc[date] = value;
        return acc;
      }, {} as Record<string, string>)
    }));
  };

  const applyBulkEntries = () => {
    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);
    const updatedData = [...funnelData];
    
    // Apply bulk data to funnel data
    Object.entries(bulkData).forEach(([metricName, dateValues]) => {
      const metricIndex = updatedData.findIndex(m => m.step === metricName);
      if (metricIndex >= 0) {
        Object.entries(dateValues).forEach(([date, value]) => {
          const numericValue = parseFloat(value);
          if (!isNaN(numericValue) && value.trim() !== "") {
            if (bulkOverwriteExisting || !updatedData[metricIndex].values[date]) {
              updatedData[metricIndex].values[date] = numericValue;
            }
          }
        });
      }
    });
    
    // Recalculate auto metrics for all affected dates
    dates.forEach(date => {
      const autoCalculatedData = calculateAutoMetrics(updatedData, date);
      autoCalculatedData.forEach((metric, index) => {
        updatedData[index] = metric;
      });
    });
    
    // Get today's date for calculating averages
    const today = new Date().toISOString().split('T')[0];
    
    // Recalculate averages/totals for all metrics from today's date
    updatedData.forEach((metric, index) => {
      if (shouldUseTotals(metric.step)) {
        updatedData[index].sevenDayAvg = calculateTotal(metric.values, today, 7);
        updatedData[index].thirtyDayAvg = calculateTotal(metric.values, today, 30);
      } else {
        updatedData[index].sevenDayAvg = calculateAverage(metric.values, today, 7);
        updatedData[index].thirtyDayAvg = calculateAverage(metric.values, today, 30);
      }
    });
    
    setFunnelData(updatedData);
    setShowHistoryModal(false);
    
    // Show success message
    const daysUpdated = dates.filter(date => 
      Object.values(bulkData).some(dateValues => 
        dateValues[date] && dateValues[date].trim() !== ""
      )
    ).length;
    
    if (daysUpdated > 0) {
      // You could add a toast here if available
      console.log(`Successfully updated ${daysUpdated} days of data`);
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
      setSelectedDate(currentDate.toISOString().split('T')[0]);
    } else if (direction === 'next') {
      currentDate.setDate(currentDate.getDate() + 1);
      setSelectedDate(currentDate.toISOString().split('T')[0]);
    } else if (direction === 'today') {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  };

  const calculateAutoMetrics = (data: MetricData[], date: string) => {
    const newData = [...data];
    
    // Get values for the specific date
    const adSpend = newData[0].values[date] || 0; // Ad Spend
    const landingPageViews = newData[2].values[date] || 0; // Landing Page Views
    const leads = newData[4].values[date] || 0; // Leads
    const tripwireSales = newData[7].values[date] || 0; // Tripwire Sales
    const productCost = parseFloat(tripwireProductCost) || 0; // Tripwire product cost
    
    // Calculate Total Revenue (Tripwire Sales × Product Cost)
    const calculatedRevenue = tripwireSales * productCost;
    if (calculatedRevenue > 0) {
      newData[9].values[date] = calculatedRevenue;
    } else {
      delete newData[9].values[date];
    }
    
    const totalRevenue = newData[9].values[date] || 0; // Total Revenue
    
    // Calculate Cost Per Landing Page View (Ad Spend / Landing Page Views)
    if (landingPageViews > 0) {
      newData[3].values[date] = adSpend / landingPageViews;
    } else {
      delete newData[3].values[date];
    }
    
    // Calculate Cost Per Lead (Ad Spend / Leads)
    if (leads > 0) {
      newData[5].values[date] = adSpend / leads;
    } else {
      delete newData[5].values[date];
    }
    
    // Calculate Landing Page Conversion Rate (Leads / Landing Page Views) * 100 for percentage
    if (landingPageViews > 0) {
      newData[6].values[date] = (leads / landingPageViews) * 100;
    } else {
      delete newData[6].values[date];
    }
    
    // Calculate Tripwire Conversion Rate (Tripwire Sales / Leads) * 100 for percentage
    if (leads > 0) {
      newData[8].values[date] = (tripwireSales / leads) * 100;
    } else {
      delete newData[8].values[date];
    }
    
    // Calculate Return on Ad Spend (Total Revenue / Ad Spend) as decimal
    if (adSpend > 0) {
      newData[10].values[date] = totalRevenue / adSpend;
    } else {
      delete newData[10].values[date];
    }
    
    return newData;
  };

  const updateMetricValue = (metricIndex: number, date: string, value: string) => {
    const newData = [...funnelData];
    if (value === "") {
      delete newData[metricIndex].values[date];
    } else {
      newData[metricIndex].values[date] = parseFloat(value) || 0;
    }
    
    // Calculate auto-metrics for this date
    const updatedData = calculateAutoMetrics(newData, date);
    
    // Get the most recent date (either today or the latest date with data)
    const today = new Date().toISOString().split('T')[0];
    
    // Recalculate averages/totals for all metrics from today's date
    updatedData.forEach((metric, index) => {
      if (shouldUseTotals(metric.step)) {
        updatedData[index].sevenDayAvg = calculateTotal(metric.values, today, 7);
        updatedData[index].thirtyDayAvg = calculateTotal(metric.values, today, 30);
      } else {
        updatedData[index].sevenDayAvg = calculateAverage(metric.values, today, 7);
        updatedData[index].thirtyDayAvg = calculateAverage(metric.values, today, 30);
      }
    });
    
    setFunnelData(updatedData);
  };
  
  const [expandedSections, setExpandedSections] = useState({
    leadMagnet: false,
    landingPage: false,
    automation: false,
    launch: false
  });

  // Update local state when checklist items load from database
  useEffect(() => {
    if (checklistItems.length > 0) {
      const updatedState = { ...completedSections };
      checklistItems.forEach(item => {
        const key = item.itemKey as keyof typeof completedSections;
        if (key in updatedState) {
          updatedState[key] = item.isCompleted;
        }
      });
      setCompletedSections(updatedState);
      console.log('[TrackAndOptimize] Loaded checklist items from database:', updatedState);
    }
  }, [checklistItems]);

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
        console.log('[TrackAndOptimize] Checklist item saved:', section, !isCurrentlyComplete);
      } catch (error) {
        console.error('Failed to save checklist item:', error);
      }
    }
    
    // Also save to database for "launch" section (Track & Optimize) - legacy support
    if (section === 'launch' && userId) {
      try {
        if (!isCurrentlyComplete) {
          await markSectionComplete.mutateAsync({
            userId,
            stepNumber: 4, // Lead Generation is step 4
            sectionTitle: "Track & Optimize"
          });
        } else {
          await unmarkSectionComplete.mutateAsync({
            userId,
            stepNumber: 4,
            sectionTitle: "Track & Optimize"
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
            <h1 className="text-3xl font-bold text-slate-900">Track & Optimize</h1>
            <p className="text-slate-600 mt-2">Monitor and optimize your ad campaigns for maximum performance</p>
          </div>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
            Active
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training Videos</TabsTrigger>
          <TabsTrigger value="script-generator">Funnel Tracker</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overview Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <CardTitle>Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                  <p>
                    Now that your ads are live, it's time to optimize. When we launch a new funnel it's rare that everything converts perfectly out the gate, especially if this is your first time launching it or you have a small warm audience.
                  </p>
                  <p>
                    Our goal in this phase is to track your data from the ad all the way through the funnel and then make optimization moves driven by data.
                  </p>
                  <p>
                    We also recommend you reach out to your leads and try to start conversations with as many as possible. This is key in the beginning and can lead to future sales as well as a deeper understanding of your ideal customer.
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
                  <p className="text-2xl font-bold text-purple-600 mb-2">Ongoing</p>
                  <p className="text-sm text-slate-600">
                    Optimization is a continuous process. Your lead gen ads are live though and you will continue to optimize this funnel, start bringing in leads to your email list and prepping for your live launch based on the date we decided in your strategy presentation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* To-Do List */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle>To-Do List</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Set up tracking using our system and begin inputting data.",
                    "Perform strategic outreach to all the leads you're bringing in.", 
                    "Identify which ads, audiences, or creatives are performing best.",
                    "Adjust your ads and funnel based on performance data.",
                    "Leverage our support and continue to repeat this process until your funnel is fully converting!"
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Success Tips */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <CardTitle>Success Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: "Start with the data", text: "Don't guess — use the tracking system to understand your funnel and guide decisions." },
                    { title: "Focus on what's working", text: "Double down on ads and audiences that bring in quality leads." },
                    { title: "Small tweaks > big overhauls", text: "Simple adjustments (like copy, images, or targeting) often have the biggest impact. Most of the time what we need to tweak is the messaging." },
                    { title: "Be Patient", text: "Depending on your budget you may not make a lot of tweaks one week. You need to give things time to get traffic and leads through your funnel to gather data." },
                    { title: "Leverage Our Support", text: "Bring your data to our support calls (both ads and funnel strategy!) and make sure you're fully clear on actions each week." }
                  ].map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-yellow-500 mt-1">→</span>
                      <div>
                        <strong className="text-slate-900">{tip.title}</strong>
                        <span className="text-slate-600"> → {tip.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Training Video Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                <CardTitle>Training Videos</CardTitle>
              </div>
              <p className="text-slate-600">Learn how to track and optimize your funnel from beginning to end and use that data to drive decisions!</p>
            </CardHeader>
            <CardContent>
              
              {/* Nested Training Video Tabs */}
              <Tabs defaultValue="tracking-funnel" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 gap-1">
                  <TabsTrigger value="tracking-funnel" className="text-xs px-1 md:px-2">Tracking Your Lead Gen Ads & Funnel</TabsTrigger>
                  <TabsTrigger value="interpreting-data" className="text-xs px-1 md:px-2">Having Conversations With Your Leads</TabsTrigger>
                  <TabsTrigger value="optimizing-ads" className="text-xs px-1 md:px-2">Optimizing Your Lead Gen Ads</TabsTrigger>
                  <TabsTrigger value="optimizing-funnel" className="text-xs px-1 md:px-2">Optimizing Your Lead Gen Funnel</TabsTrigger>
                </TabsList>

                <TabsContent value="tracking-funnel" className="space-y-6">
                  <VimeoEmbed 
                    vimeoId="1125299961/e2e6cc5246" 
                    title="Tracking Your Lead Gen Ads & Funnel"
                    userId={userId}
                    stepNumber={0}
                  />
                </TabsContent>

                <TabsContent value="interpreting-data" className="space-y-6">
                  <VimeoEmbed 
                    vimeoId="1125206409/bf503f9ac6" 
                    title="Having Conversations With Your Leads"
                    userId={userId}
                    stepNumber={0}
                  />
                </TabsContent>

                <TabsContent value="optimizing-ads" className="space-y-6">
                  <VimeoEmbed 
                    vimeoId="1129975441/795c314470" 
                    title="Optimizing Your Lead Gen Ads"
                    userId={userId}
                    stepNumber={0}
                  />
                </TabsContent>

                <TabsContent value="optimizing-funnel" className="space-y-6">
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Optimizing Your Lead Gen Funnel</p>
                      <p className="text-slate-400 text-sm mt-2">Training video placeholder</p>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none text-slate-700 leading-relaxed">
                    <p>
                      Discover how to optimize your lead generation funnel to increase conversion rates and improve lead quality.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tracker Tab */}
        <TabsContent value="script-generator" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <CardTitle>Lead Gen Funnel Tracker</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Collapsible open={setupInstructionsExpanded} onOpenChange={setSetupInstructionsExpanded}>
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                  <CollapsibleTrigger asChild>
                    <div className="w-full p-6 cursor-pointer hover:bg-opacity-80 transition-colors">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          How to Set Up Your Funnel Tracker
                        </h3>
                        <ChevronDown 
                          className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${setupInstructionsExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-6 pb-6">
                      <p className="text-slate-700 mb-4">
                        Use this tracker to monitor each step of your lead generation funnel. Here are some <span className="font-semibold text-purple-700">essential tips</span> to get started:
                      </p>
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <span className="font-medium text-green-800">Industry Standards Included:</span>
                            <span className="text-slate-600 ml-1">Some metrics have pre-set industry average goals. Fill out goals for other metrics based on <span className="font-medium text-slate-800">your strategy our team created</span>. If you'd like to adjust the goals in green that are based on industry averages you can do that as well.</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Calculator className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium text-blue-800">Set Tripwire Cost:</span>
                            <span className="text-slate-600 ml-1">Enter your <span className="font-medium text-slate-800">tripwire product cost</span> in the blue box above so ROAs calculates correctly.</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Edit3 className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-medium text-purple-800">Smart Input System:</span>
                            <span className="text-slate-600 ml-1">Only fill in metrics with <span className="font-medium text-purple-700">blue input boxes</span> - the rest calculate automatically!</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Calendar className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <span className="font-medium text-orange-800">Daily Tracking:</span>
                            <span className="text-slate-600 ml-1">Best to track daily, but you can always <span className="font-medium text-slate-800">backfill missed days</span> using the "Add Bulk Data" button - includes bulk entry for multiple days at once!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Tripwire Product Cost Configuration */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-900">Tripwire Product Cost:</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <Input
                        type="number"
                        placeholder="47.00"
                        value={tripwireProductCost}
                        onChange={(e) => {
                          setTripwireProductCost(e.target.value);
                          
                          // Recalculate metrics for ALL dates when product cost changes
                          let updatedData = [...funnelData];
                          
                          // Get all unique dates from all metrics
                          const allDates = new Set<string>();
                          funnelData.forEach(metric => {
                            Object.keys(metric.values).forEach(date => allDates.add(date));
                          });
                          
                          // Recalculate auto-metrics for each date
                          allDates.forEach(date => {
                            updatedData = calculateAutoMetrics(updatedData, date);
                          });
                          
                          // Get today's date for calculating averages
                          const today = new Date().toISOString().split('T')[0];
                          
                          // Recalculate averages/totals for all metrics from today's date
                          updatedData.forEach((metric, index) => {
                            if (shouldUseTotals(metric.step)) {
                              updatedData[index].sevenDayAvg = calculateTotal(metric.values, today, 7);
                              updatedData[index].thirtyDayAvg = calculateTotal(metric.values, today, 30);
                            } else {
                              updatedData[index].sevenDayAvg = calculateAverage(metric.values, today, 7);
                              updatedData[index].thirtyDayAvg = calculateAverage(metric.values, today, 30);
                            }
                          });
                          
                          setFunnelData(updatedData);
                        }}
                        className="pl-8 w-32 text-sm"
                        data-testid="input-tripwire-cost"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    This will be used to calculate Total Revenue (Tripwire Sales × Product Cost)
                  </div>
                </div>
              </div>

              {/* Tracking Table */}
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant={viewMode === 'daily' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('daily')}
                      data-testid="button-daily-view"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Daily View
                    </Button>
                    <Button
                      variant={viewMode === 'monthly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('monthly')}
                      data-testid="button-monthly-view"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Monthly View
                    </Button>
                  </div>

                  {/* Date/Month Navigation */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                    <div className="flex items-center gap-2">
                      {viewMode === 'daily' ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigateDate('prev')}
                            data-testid="button-prev-day"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-auto"
                            data-testid="input-selected-date"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigateDate('next')}
                            data-testid="button-next-day"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigateDate('today')}
                            data-testid="button-today"
                          >
                            Today
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigateMonth('prev')}
                            data-testid="button-prev-month"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-auto"
                            data-testid="input-selected-month"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigateMonth('next')}
                            data-testid="button-next-month"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          {selectedMonth !== new Date().toISOString().slice(0, 7) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigateMonth('current')}
                              data-testid="button-current-month"
                            >
                              Current Month
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowHistoryModal(true)}
                      data-testid="button-edit-history"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Add Bulk Data
                    </Button>
                  </div>
                  
                  {/* Table Header */}
                  {viewMode === 'daily' ? (
                    <div className="grid grid-cols-5 gap-4 p-4 bg-slate-50 rounded-t-lg border border-slate-200 font-semibold text-slate-700">
                      <div>Funnel Step</div>
                      <div>Monthly Goal</div>
                      <div>Value ({new Date(selectedDate).toLocaleDateString()})</div>
                      <div>7 Day Data</div>
                      <div>30 Day Data</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-t-lg border border-slate-200 font-semibold text-slate-700">
                      <div>Funnel Step</div>
                      <div>Monthly Goal</div>
                      <div>Monthly Value ({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</div>
                    </div>
                  )}
                  
                  {/* Table Rows */}
                  <div className="border border-t-0 border-slate-200 rounded-b-lg">
                    {funnelData.map((step, index) => {
                      const currentValue = viewMode === 'daily' 
                        ? (step.values[selectedDate] || 0)
                        : shouldUseTotals(step.step)
                          ? calculateMonthlyTotal(step.values, selectedMonth)
                          : calculateMonthlyAverage(step.values, selectedMonth);
                      
                      const performanceStatus = getPerformanceStatus(step.step, currentValue, step.goal);
                      const statusClasses = getStatusClasses(performanceStatus);
                      const statusIcon = getStatusIcon(performanceStatus);
                      
                      return viewMode === 'daily' ? (
                        <div key={index} className={`grid grid-cols-5 gap-4 p-4 border-b border-slate-100 last:border-b-0 transition-colors ${statusClasses}`}>
                          {/* Funnel Step Name */}
                          <div className="font-medium flex items-center gap-2">
                            {step.isManual ? (
                              <Edit3 className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Calculator className="w-4 h-4 text-slate-500" />
                            )}
                            <span className={step.isManual ? 'text-blue-900 font-medium' : 'text-slate-700'}>
                              {step.step}
                            </span>
                            <div className="ml-auto">
                              {statusIcon}
                            </div>
                          </div>
                        
                        {/* Goal Input */}
                        <div>
                          <Input
                            type="text"
                            placeholder={
                              step.step === "Landing Page Views" 
                                ? getSuggestedLandingPageViews(selectedDate)
                                : step.step === "Ad Spend"
                                ? "$0 (e.g. $500)"
                                : step.step === "Leads"
                                ? getSuggestedLeads()
                                : step.step === "Tripwire Sales"
                                ? getSuggestedTripwireSales()
                                : step.step === "Total Revenue"
                                ? getSuggestedTotalRevenue()
                                : step.step === "ROAs"
                                ? getSuggestedROAs()
                                : "Set goal"
                            }
                            value={step.goal}
                            onChange={(e) => {
                              const newData = [...funnelData];
                              newData[index].goal = e.target.value;
                              setFunnelData(newData);
                            }}
                            className={`w-full text-sm ${
                              hasIndustryStandardGoal(step.step) 
                                ? 'bg-green-50 border-green-200 text-green-700 focus:border-green-500 font-medium' 
                                : step.step === "Landing Page Views" && !step.goal && getSuggestedLandingPageViews(selectedDate) !== "Set goal"
                                ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                : step.step === "Leads" && !step.goal && getSuggestedLeads() !== "Set goal"
                                ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                : step.step === "Tripwire Sales" && !step.goal && getSuggestedTripwireSales() !== "Set goal"
                                ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                : step.step === "Total Revenue" && !step.goal && getSuggestedTotalRevenue() !== "Set goal"
                                ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                : step.step === "ROAs" && !step.goal && getSuggestedROAs() !== "Set goal"
                                ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                : 'border-slate-200 focus:border-blue-500'
                            }`}
                            data-testid={`input-goal-${index}`}
                          />
                          {step.step === "Landing Page Views" && !step.goal && getSuggestedLandingPageViews(selectedDate) !== "Set goal" && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              Auto-calculated from ad spend ÷ cost per view
                            </div>
                          )}
                          {step.step === "Leads" && !step.goal && getSuggestedLeads() !== "Set goal" && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              Auto-calculated: landing page views × conversion rate
                            </div>
                          )}
                          {step.step === "Tripwire Sales" && !step.goal && getSuggestedTripwireSales() !== "Set goal" && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              Auto-calculated: leads × tripwire conversion rate
                            </div>
                          )}
                          {step.step === "Total Revenue" && !step.goal && getSuggestedTotalRevenue() !== "Set goal" && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              Auto-calculated: tripwire sales × product cost
                            </div>
                          )}
                          {step.step === "ROAs" && !step.goal && getSuggestedROAs() !== "Set goal" && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              Auto-calculated: total revenue ÷ ad spend
                            </div>
                          )}
                        </div>
                        
                        {/* Selected Date Value */}
                        <div>
                          {step.isManual ? (
                            <Input
                              type="number"
                              placeholder={
                                isCurrencyMetric(step.step) ? "$0.00" : 
                                isPercentageMetric(step.step) ? "0.00%" : 
                                "0"
                              }
                              value={step.values[selectedDate] || ""}
                              onChange={(e) => updateMetricValue(index, selectedDate, e.target.value)}
                              className="w-full text-sm border-blue-200 focus:border-blue-500"
                              data-testid={`input-value-${index}`}
                            />
                          ) : (
                            <div className="w-full text-sm p-2 bg-slate-100 rounded border text-slate-600 flex items-center justify-center">
                              <Calculator className="w-4 h-4 mr-1" />
                              <span data-testid={`calculated-value-${index}`}>
                                {isCurrencyMetric(step.step) 
                                  ? formatCurrency(step.values[selectedDate] || 0)
                                  : isPercentageMetric(step.step)
                                  ? formatPercentage(step.values[selectedDate] || 0)
                                  : (step.values[selectedDate] ? step.values[selectedDate].toFixed(2) : "—")
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* 7 Day Data */}
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-slate-600" data-testid={`seven-day-data-${index}`}>
                            {isCurrencyMetric(step.step) 
                              ? formatCurrency(step.sevenDayAvg || 0)
                              : isPercentageMetric(step.step)
                              ? formatPercentage(step.sevenDayAvg || 0)
                              : (step.sevenDayAvg || "—")
                            }
                          </span>
                        </div>
                        
                        {/* 30 Day Data */}
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-slate-600" data-testid={`thirty-day-data-${index}`}>
                            {isCurrencyMetric(step.step) 
                              ? formatCurrency(step.thirtyDayAvg || 0)
                              : isPercentageMetric(step.step)
                              ? formatPercentage(step.thirtyDayAvg || 0)
                              : (step.thirtyDayAvg || "—")
                            }
                          </span>
                        </div>
                      </div>
                      ) : (
                        <div key={index} className={`grid grid-cols-3 gap-4 p-4 border-b border-slate-100 last:border-b-0 transition-colors ${statusClasses}`}>
                          {/* Funnel Step Name */}
                          <div className="font-medium flex items-center gap-2">
                            {step.isManual ? (
                              <Edit3 className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Calculator className="w-4 h-4 text-slate-500" />
                            )}
                            <span className={step.isManual ? 'text-blue-900 font-medium' : 'text-slate-700'}>
                              {step.step}
                            </span>
                            <div className="ml-auto">
                              {statusIcon}
                            </div>
                          </div>
                          
                          {/* Goal Input */}
                          <div>
                            <Input
                              type="text"
                              placeholder={
                                step.step === "Landing Page Views" 
                                  ? getSuggestedLandingPageViews(selectedDate)
                                  : step.step === "Ad Spend"
                                  ? "$0 (e.g. $500)"
                                  : step.step === "Leads"
                                  ? getSuggestedLeads()
                                  : step.step === "Tripwire Sales"
                                  ? getSuggestedTripwireSales()
                                  : step.step === "Total Revenue"
                                  ? getSuggestedTotalRevenue()
                                  : step.step === "ROAs"
                                  ? getSuggestedROAs()
                                  : "Set goal"
                              }
                              value={step.goal}
                              onChange={(e) => {
                                const newData = [...funnelData];
                                newData[index].goal = e.target.value;
                                setFunnelData(newData);
                              }}
                              className={`w-full text-sm ${
                                hasIndustryStandardGoal(step.step) 
                                  ? 'bg-green-50 border-green-200 text-green-700 focus:border-green-500 font-medium' 
                                  : step.step === "Landing Page Views" && !step.goal && getSuggestedLandingPageViews(selectedDate) !== "Set goal"
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                  : step.step === "Leads" && !step.goal && getSuggestedLeads() !== "Set goal"
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                  : step.step === "Tripwire Sales" && !step.goal && getSuggestedTripwireSales() !== "Set goal"
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                  : step.step === "Total Revenue" && !step.goal && getSuggestedTotalRevenue() !== "Set goal"
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                  : step.step === "ROAs" && !step.goal && getSuggestedROAs() !== "Set goal"
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-500'
                                  : 'border-slate-200 focus:border-blue-500'
                              }`}
                              data-testid={`input-goal-monthly-${index}`}
                            />
                            {step.step === "Landing Page Views" && !step.goal && getSuggestedLandingPageViews(selectedDate) !== "Set goal" && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Auto-calculated from ad spend ÷ cost per view
                              </div>
                            )}
                            {step.step === "Leads" && !step.goal && getSuggestedLeads() !== "Set goal" && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Auto-calculated: landing page views × conversion rate
                              </div>
                            )}
                            {step.step === "Tripwire Sales" && !step.goal && getSuggestedTripwireSales() !== "Set goal" && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Auto-calculated: leads × tripwire conversion rate
                              </div>
                            )}
                            {step.step === "Total Revenue" && !step.goal && getSuggestedTotalRevenue() !== "Set goal" && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Auto-calculated: tripwire sales × product cost
                              </div>
                            )}
                            {step.step === "ROAs" && !step.goal && getSuggestedROAs() !== "Set goal" && (
                              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Auto-calculated: total revenue ÷ ad spend
                              </div>
                            )}
                          </div>
                          
                          {/* Monthly Value (read-only calculated) */}
                          <div className="flex items-center">
                            <div className="w-full text-sm p-2 bg-slate-100 rounded border text-slate-600 flex items-center justify-center">
                              <Calculator className="w-4 h-4 mr-1" />
                              <span data-testid={`monthly-value-${index}`}>
                                {isCurrencyMetric(step.step) 
                                  ? formatCurrency(currentValue)
                                  : isPercentageMetric(step.step)
                                  ? formatPercentage(currentValue)
                                  : (currentValue ? currentValue.toFixed(2) : "—")
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Edit and Export Buttons - Above Optimization Suggestions */}
              <div className="flex justify-end gap-2 mt-6 mb-3">
                {isEditingSuggestions ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleCancelEdit}
                      className="bg-embodied-coral hover:bg-embodied-orange text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEditedSuggestions}
                      className="gap-2 bg-embodied-coral hover:bg-embodied-orange text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      data-testid="button-save-suggestions"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={handleEditSuggestions}
                      className="gap-2 bg-embodied-coral hover:bg-embodied-orange text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      data-testid="button-edit-suggestions"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className="gap-2 bg-embodied-coral hover:bg-embodied-orange text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          data-testid="button-export-suggestions"
                        >
                          <Download className="w-4 h-4" />
                          Export Document
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={exportOptimizationSuggestionsPDF}
                          data-testid="button-export-pdf"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Download as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={exportOptimizationSuggestionsDOCX}
                          data-testid="button-export-docx"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Download as DOCX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>

              {/* Optimization Suggestions Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-black">Optimization Suggestions</CardTitle>
                  </div>
                  <CardDescription className="text-black">
                    Based on your current metrics, here are specific recommendations to improve your funnel performance. Suggestions are automatically saved to IGNITE Docs when generated.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Use saved suggestions if available, otherwise generate new ones
                    const suggestions = savedSuggestions?.suggestions && savedSuggestions.suggestions.length > 0 
                      ? savedSuggestions.suggestions 
                      : generateSuggestions();
                    
                    if (suggestions.length === 0) {
                      return (
                        <div className="p-6 text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-700 mb-2">No Suggestions Yet</h3>
                          <p className="text-slate-500 mb-4">
                            Enter your funnel metrics above to get personalized optimization recommendations based on industry standards.
                          </p>
                          <div className="text-sm text-slate-400">
                            I'll analyze your metrics and suggest specific improvements when you add data.
                          </div>
                        </div>
                      );
                    }
                    
                    // Display editable or read-only suggestions
                    const displaySuggestions = isEditingSuggestions ? editedSuggestions : suggestions;
                    
                    return (
                      <div className="space-y-4">
                        {displaySuggestions.map((suggestion, index) => (
                          <div key={index} className={`p-4 rounded-lg border ${
                            suggestion.type === 'success' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-amber-50 border-amber-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                suggestion.type === 'success' 
                                  ? 'bg-green-100' 
                                  : 'bg-amber-100'
                              }`}>
                                {suggestion.type === 'success' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                {isEditingSuggestions ? (
                                  <>
                                    {/* Editable Title */}
                                    <Input
                                      value={suggestion.title}
                                      onChange={(e) => updateSuggestion(index, 'title', e.target.value)}
                                      className="font-semibold mb-2 bg-white"
                                      data-testid={`input-suggestion-title-${index}`}
                                    />
                                    {/* Editable Issue */}
                                    <Textarea
                                      value={suggestion.issue}
                                      onChange={(e) => updateSuggestion(index, 'issue', e.target.value)}
                                      className="text-sm mb-3 bg-white min-h-[60px]"
                                      data-testid={`input-suggestion-issue-${index}`}
                                    />
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className={`text-sm font-medium ${
                                          suggestion.type === 'success' 
                                            ? 'text-green-800' 
                                            : 'text-amber-800'
                                        }`}>
                                          {suggestion.type === 'success' ? 'Keep doing this:' : 'Action steps:'}
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => addSuggestionAction(index)}
                                          className="h-7 gap-1"
                                          data-testid={`button-add-action-${index}`}
                                        >
                                          <Plus className="w-3 h-3" />
                                          Add Action
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {suggestion.actions.map((action, actionIndex) => (
                                          <div key={actionIndex} className="flex items-start gap-2">
                                            <span className="font-medium mt-2">•</span>
                                            <Input
                                              value={action}
                                              onChange={(e) => updateSuggestionAction(index, actionIndex, e.target.value)}
                                              className="flex-1 bg-white text-sm"
                                              data-testid={`input-action-${index}-${actionIndex}`}
                                            />
                                            {suggestion.actions.length > 1 && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeSuggestionAction(index, actionIndex)}
                                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                data-testid={`button-remove-action-${index}-${actionIndex}`}
                                              >
                                                <XCircle className="w-4 h-4" />
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Read-only display */}
                                    <h4 className="font-semibold mb-2 text-black">
                                      {suggestion.title}
                                    </h4>
                                    <p className="text-sm mb-3 text-black">
                                      {suggestion.issue}
                                    </p>
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-black">
                                        {suggestion.type === 'success' ? 'Keep doing this:' : 'Action steps:'}
                                      </p>
                                      <ul className="space-y-1">
                                        {suggestion.actions.map((action, actionIndex) => (
                                          <li key={actionIndex} className="text-sm flex items-start gap-2 text-black">
                                            <span className="font-medium">•</span>
                                            <span>{action}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="default"
                  onClick={() => {
                    const newData = funnelData.map(step => ({
                      ...step,
                      values: {},
                      sevenDayAvg: 0,
                      thirtyDayAvg: 0
                    }));
                    setFunnelData(newData);
                  }}
                  className="text-sm"
                  data-testid="button-clear-data"
                >
                  Clear All Data
                </Button>
                <Button 
                  variant="default"
                  onClick={() => navigateDate('today')}
                  className="text-sm"
                  data-testid="button-jump-today"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Jump to Today
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          {/* Implementation Steps Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <CardTitle>Implementation Steps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700">
                It's time to start tracking and optimizing your ads! Although this is an ongoing process these steps will help you get your tracking set up and make your first optimization moves!
              </p>

              {/* Step-by-step sections */}
              <div className="grid gap-4">
                {/* Step 1 */}
                <Collapsible open={expandedSections.leadMagnet} onOpenChange={() => handleSectionExpand('leadMagnet')}>
                  <Card className={`border-2 transition-colors ${completedSections.leadMagnet ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.leadMagnet}
                              onCheckedChange={() => handleSectionComplete('leadMagnet')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-step-1"
                            />
                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              1
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Start Tracking Your Data</h3>
                          </div>
                          {expandedSections.leadMagnet ? (
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
                          Use our training & tracking tool to start filling in your data from the ads all the way through the funnel.
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 2 */}
                <Collapsible open={expandedSections.landingPage} onOpenChange={() => handleSectionExpand('landingPage')}>
                  <Card className={`border-2 transition-colors ${completedSections.landingPage ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.landingPage}
                              onCheckedChange={() => handleSectionComplete('landingPage')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-step-2"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              2
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Perform Strategic Outreach To Any Leads</h3>
                          </div>
                          {expandedSections.landingPage ? (
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
                          If it makes sense for your strategy try and have as many connecting conversations as possible with your leads. Use my strategy and messaging ideas under the training video for guidance. The more you can connect with these initial leads and build relationships, the better!
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 3 */}
                <Collapsible open={expandedSections.automation} onOpenChange={() => handleSectionExpand('automation')}>
                  <Card className={`border-2 transition-colors ${completedSections.automation ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.automation}
                              onCheckedChange={() => handleSectionComplete('automation')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-step-3"
                            />
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              3
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Perform Optimization Moves</h3>
                          </div>
                          {expandedSections.automation ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4 text-slate-600">
                          <p>
                            Based on your data you can start making optimizations to both your ads and funnel.
                          </p>
                          <p>
                            Your ads will likely need to be optimized first and your funnel needs to have some time for leads to go through the journey.
                          </p>
                          <p>
                            Use our trainings to guide what your optimizations should be based on your data and come to our support calls to get help.
                          </p>
                          <p className="font-medium">
                            Some of your initial moves might look like:
                          </p>
                          <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Turning off an audience that isn't working and adding a new one to test</li>
                            <li>Testing additional ad copy / creative</li>
                            <li>Adjusting the headline of your opt in or tripwire page for improved conversion</li>
                          </ol>
                          <p>
                            This is an ongoing process that takes both patience and an understanding if your numbers.
                          </p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Step 4 */}
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
                              data-testid="checkbox-step-4"
                            />
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              4
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Continue Optimizing & Start Working On Your Live Launch</h3>
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
                          At this point your lead gen funnel should be running and leads should be coming in consistently. You will continue to optimize this funnel while starting to build out your live launch funnel. You should have a tenative date for your first live launch that you'll begin prepping for. Remember, we're going to invite all of those leads to this live launch!
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

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Add Bulk Data
            </DialogTitle>
            <DialogDescription>
              Choose between <strong>Week View</strong> for detailed editing or <strong>Bulk Entry</strong> for quickly adding multiple days of data at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Mode Toggle */}
            <Tabs value={bulkEntryMode ? "bulk" : "week"} onValueChange={(value) => {
              setBulkEntryMode(value === "bulk");
              if (value === "bulk") {
                initializeBulkData();
              }
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="week" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Week View
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Bulk Entry
                </TabsTrigger>
              </TabsList>

              {/* Week View Mode */}
              <TabsContent value="week" className="space-y-4 mt-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <Button variant="outline" size="sm" onClick={() => {
                    const weekAgo = new Date(selectedDate);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setSelectedDate(weekAgo.toISOString().split('T')[0]);
                  }}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous Week
                  </Button>
                  <span className="font-medium">
                    Week of {new Date(selectedDate).toLocaleDateString()}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => {
                    const weekForward = new Date(selectedDate);
                    weekForward.setDate(weekForward.getDate() + 7);
                    setSelectedDate(weekForward.toISOString().split('T')[0]);
                  }}>
                    Next Week
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Historical Data Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    {/* Generate 7 days starting from selected date */}
                    {(() => {
                      const startDate = new Date(selectedDate);
                      const days: string[] = [];
                      for (let i = 0; i < 7; i++) {
                        const date = new Date(startDate);
                        date.setDate(startDate.getDate() + i);
                        days.push(date.toISOString().split('T')[0]);
                      }
                      
                      return (
                        <div className="space-y-6">
                          {funnelData.filter(metric => metric.isManual).map((metric, metricIndex) => {
                            const originalIndex = funnelData.findIndex(m => m.step === metric.step);
                            return (
                              <div key={originalIndex} className="border border-blue-200 rounded-lg p-4 bg-blue-25">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                  <Edit3 className="w-4 h-4" />
                                  {metric.step}
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Manual Input</span>
                                </h3>
                                <div className="grid grid-cols-7 gap-3">
                                  {days.map((date, dayIndex) => (
                                    <div key={dayIndex} className="space-y-1">
                                      <Label className="text-xs text-slate-600 text-center block">
                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                      </Label>
                                      <Input
                                        type="number"
                                        placeholder={
                                          isCurrencyMetric(metric.step) ? "0.00" :
                                          isPercentageMetric(metric.step) ? "0.00%" :
                                          "0"
                                        }
                                        value={metric.values[date] || ""}
                                        onChange={(e) => updateMetricValue(originalIndex, date, e.target.value)}
                                        className="text-sm text-center border-blue-200 focus:border-blue-500"
                                        data-testid={`input-history-${originalIndex}-${dayIndex}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </TabsContent>

              {/* Bulk Entry Mode */}
              <TabsContent value="bulk" className="space-y-4 mt-4">
                {/* Bulk Entry Controls */}
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-amber-800">Start Date</Label>
                    <Input
                      type="date"
                      value={bulkStartDate}
                      onChange={(e) => setBulkStartDate(e.target.value)}
                      className="border-amber-200 focus:border-amber-500"
                      data-testid="input-bulk-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-amber-800">Number of Days</Label>
                    <Input
                      type="number"
                      min="1"
                      max="14"
                      value={bulkDaysCount}
                      onChange={(e) => setBulkDaysCount(parseInt(e.target.value) || 5)}
                      className="border-amber-200 focus:border-amber-500"
                      data-testid="input-bulk-days-count"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={bulkOverwriteExisting}
                        onCheckedChange={(checked) => setBulkOverwriteExisting(checked as boolean)}
                        data-testid="checkbox-overwrite-existing"
                      />
                      <span className="text-sm font-medium text-amber-800">
                        Overwrite Existing Data
                      </span>
                    </div>
                    <div className="text-xs text-amber-700">
                      {bulkOverwriteExisting ? "Will replace existing values" : "Will only fill empty days"}
                    </div>
                  </div>
                </div>

                {/* Bulk Entry Grid */}
                <div className="overflow-x-auto">
                  {(() => {
                    const dates = generateBulkDates(bulkStartDate, bulkDaysCount);
                    const manualMetrics = funnelData.filter(metric => metric.isManual);
                    
                    return (
                      <div className="min-w-full space-y-4">
                        {/* Table Header */}
                        <div className="grid gap-3 p-3 bg-slate-100 rounded-lg font-medium text-slate-700 text-sm" style={{gridTemplateColumns: `200px repeat(${dates.length}, 1fr) 120px`}}>
                          <div>Metric</div>
                          {dates.map((date, index) => (
                            <div key={index} className="text-center">
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          ))}
                          <div className="text-center">Quick Fill</div>
                        </div>

                        {/* Metric Rows */}
                        {manualMetrics.map((metric, metricIndex) => (
                          <div key={metricIndex} className="grid gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-25" style={{gridTemplateColumns: `200px repeat(${dates.length}, 1fr) 120px`}}>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              <span className="text-sm">{metric.step}</span>
                            </div>
                            
                            {/* Date inputs */}
                            {dates.map((date, dateIndex) => (
                              <div key={dateIndex}>
                                <Input
                                  type="number"
                                  placeholder={
                                    isCurrencyMetric(metric.step) ? "0.00" :
                                    isPercentageMetric(metric.step) ? "0.00%" :
                                    "0"
                                  }
                                  value={bulkData[metric.step]?.[date] || ""}
                                  onChange={(e) => updateBulkValue(metric.step, date, e.target.value)}
                                  className="text-sm text-center border-slate-200 focus:border-blue-500"
                                  data-testid={`input-bulk-${metricIndex}-${dateIndex}`}
                                />
                              </div>
                            ))}
                            
                            {/* Quick Fill */}
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                placeholder="Value"
                                className="text-xs text-center border-slate-200 focus:border-orange-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    fillRowWithSameValue(metric.step, input.value);
                                    input.value = '';
                                  }
                                }}
                                data-testid={`input-quick-fill-${metricIndex}`}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="p-1 h-8 w-8"
                                onClick={(e) => {
                                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                  fillRowWithSameValue(metric.step, input.value);
                                  input.value = '';
                                }}
                                data-testid={`button-quick-fill-${metricIndex}`}
                              >
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Summary */}
                        <div className="p-3 bg-slate-50 rounded-lg border text-sm text-slate-600">
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4" />
                            <span className="font-medium">Bulk Entry Summary</span>
                          </div>
                          <div>
                            Dates: {new Date(bulkStartDate).toLocaleDateString()} to {new Date(dates[dates.length - 1]).toLocaleDateString()} 
                            ({bulkDaysCount} days)
                          </div>
                          {!bulkOverwriteExisting && (
                            <div className="text-orange-600 text-xs mt-1">
                              Only empty days will be filled. Check "Overwrite Existing Data" to replace existing values.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>
            </Tabs>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
                Close
              </Button>
              {bulkEntryMode ? (
                <Button onClick={applyBulkEntries} className="bg-amber-600 hover:bg-amber-700" data-testid="button-apply-bulk">
                  Apply Bulk Entries
                </Button>
              ) : (
                <Button onClick={() => {
                  setShowHistoryModal(false);
                  navigateDate('today');
                }}>
                  Save & Return to Today
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
