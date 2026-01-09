import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Video, Calendar, Users, Clock, Play, ExternalLink, Target, MessageSquare, TrendingUp, CheckCircle, FileText, Settings, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod schema for call validation
const callSchema = z.object({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  category: z.enum(["Strategy", "Messaging", "Ads", "Tech Support", "Accountability"], {
    errorMap: () => ({ message: "Please select a category" })
  }),
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], {
    errorMap: () => ({ message: "Please select a day" })
  }),
  time: z.string().min(1, "Time is required").refine((time) => {
    // More flexible time validation - accepts formats like "1:00 PM EST", "10:30 AM", "2:00 PM EST", etc.
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*(AM|PM|am|pm)?\s*(EST|PST|CST|MST|est|pst|cst|mst)?$/i;
    return timePattern.test(time.trim());
  }, "Please enter a valid time format (e.g., 1:00 PM EST)"),
  date: z.string().optional(),
  recurring: z.boolean().default(false),
  description: z.string().optional(),
  link: z.string().optional().refine((link) => {
    if (!link || link.trim() === "") return true; // Optional field
    // Validate Zoom link or any valid URL
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    const zoomPattern = /^(https?:\/\/)?(www\.)?(zoom\.us|us\d+web\.zoom\.us)\/j\/[\d]+/i;
    return urlPattern.test(link) || zoomPattern.test(link);
  }, "Please enter a valid Zoom link or URL (e.g., https://us02web.zoom.us/j/4086742007)"),
  color: z.enum(["blue", "green", "purple", "orange", "coral", "slate"]).default("blue"),
  canceled: z.boolean().default(false),
  cancelReason: z.string().optional()
})
.refine((data) => {
  // Date validation: required for non-recurring calls, optional for recurring
  if (!data.recurring) {
    if (!data.date || data.date.trim() === "") {
      return false;
    }
    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(data.date)) {
      return false;
    }
    const selectedDate = new Date(data.date);
    if (isNaN(selectedDate.getTime())) {
      return false;
    }
  }
  // For recurring calls, date is optional
  return true;
}, {
  message: "Date is required for non-recurring calls",
  path: ["date"]
})
.refine((data) => {
  // If canceled is true, cancelReason should be provided
  if (data.canceled && (!data.cancelReason || data.cancelReason.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Cancel reason is required when call is canceled",
  path: ["cancelReason"]
});

type CallFormData = z.infer<typeof callSchema>;

// Live Coaching Calls - Updated Oct 29, 2025
export default function LiveCoachingCalls() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<string>("schedule");
  const [selectedRecordingCategory, setSelectedRecordingCategory] = useState<string>("strategy");
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [videoStartTimes, setVideoStartTimes] = useState<Record<string, number>>({});
  const [isAddRecordingModalOpen, setIsAddRecordingModalOpen] = useState(false);
  const [isEditRecordingModalOpen, setIsEditRecordingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<{ id: string; title: string } | null>(null);
  const [editingRecording, setEditingRecording] = useState<any>(null);
  const [newRecording, setNewRecording] = useState({
    title: "",
    date: "",
    duration: "",
    vimeoId: "",
    description: "",
    transcript: "",
    category: "strategy"
  });
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [isFetchingEditTranscript, setIsFetchingEditTranscript] = useState(false);
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Call management state
  const [calls, setCalls] = useState<any[]>([]);
  const [isAddCallModalOpen, setIsAddCallModalOpen] = useState(false);
  const [isEditCallModalOpen, setIsEditCallModalOpen] = useState(false);
  const [isDeleteCallModalOpen, setIsDeleteCallModalOpen] = useState(false);
  const [callToDelete, setCallToDelete] = useState<{ id: string; title: string } | null>(null);
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [originalCallData, setOriginalCallData] = useState<any>(null); // Store original call data to check if it was recurring
  const [callsLoading, setCallsLoading] = useState(false);

  // React Hook Form for Add Call
  const addCallForm = useForm<CallFormData>({
    resolver: zodResolver(callSchema),
    mode: "onChange", // Validate on change for real-time feedback
    defaultValues: {
      title: "",
      category: "Strategy",
      day: "Monday",
      time: "",
      date: "",
      description: "",
      link: "",
      color: "blue",
      canceled: false,
      cancelReason: "",
      recurring: false
    }
  });

  // React Hook Form for Edit Call
  const editCallForm = useForm<CallFormData>({
    resolver: zodResolver(callSchema),
    mode: "onChange", // Validate on change for real-time feedback
    defaultValues: {
      title: "",
      category: "Strategy",
      day: "Monday",
      time: "",
      date: "",
      description: "",
      link: "",
      color: "blue",
      canceled: false,
      cancelReason: "",
      recurring: false
    }
  });

  // Generate dynamic weeks based on current date
  const generateWeeksData = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the start of this week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weeks = [];
    
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(startOfWeek.getDate() + (weekOffset * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
      
      const weekLabel = weekOffset === 0 ? 
        `This Week (${formatDate(weekStart)}-${formatDate(weekEnd)})` :
        weekOffset === 1 ?
        `Next Week (${formatDate(weekStart)}-${formatDate(weekEnd)})` :
        `Week of ${formatDate(weekStart)}-${formatDate(weekEnd)}`;
      
      // Generate call dates for this week
      const mondayDate = new Date(weekStart);
      const tuesdayDate = new Date(weekStart);
      tuesdayDate.setDate(weekStart.getDate() + 1);
      const wednesdayDate = new Date(weekStart);
      wednesdayDate.setDate(weekStart.getDate() + 2);
      const thursdayDate = new Date(weekStart);
      thursdayDate.setDate(weekStart.getDate() + 3);
      const fridayDate = new Date(weekStart);
      fridayDate.setDate(weekStart.getDate() + 4);
      
      const baseCalls = [
        {
          id: weekOffset * 10 + 1,
          title: "Accountability Call",
          category: "Accountability",
          day: "Monday",
          time: "1:00 PM EST",
          date: mondayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: "Share progress and get clarity on your next steps.",
          link: "https://us02web.zoom.us/j/4086742007",
          icon: CheckCircle,
          color: "orange"
        },
        {
          id: weekOffset * 10 + 2,
          title: "Strategy and Conversion Call",
          category: "Strategy",
          day: "Tuesday",
          time: "1:00 PM EST",
          date: tuesdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: "Get feedback on your funnel strategy and overall business approach.",
          link: "https://us02web.zoom.us/j/4086742007", 
          icon: Target,
          color: "blue"
        },
        {
          id: weekOffset * 10 + 3,
          title: "Ads Strategy Call",
          category: "Ads",
          day: "Wednesday",
          time: "10:30 AM EST", 
          date: wednesdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: "Get expert feedback on your ad setup and performance.",
          link: "https://us02web.zoom.us/j/7442098096",
          icon: TrendingUp,
          color: "purple"
        },
        {
          id: weekOffset * 10 + 4,
          title: "Tech Support Call",
          category: "Tech Support",
          day: "Wednesday",
          time: "3:00 PM EST",
          date: wednesdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: "Live tech support for funnel setup and automation challenges.",
          link: "https://us02web.zoom.us/j/7442098096",
          icon: Settings,
          color: "coral",
          canceled:true,
        },
        {
          id: weekOffset * 10 + 5,
          title: "Messaging Support",
          category: "Messaging",
          day: "Thursday",
          time: "12:00 PM EST",
          date: thursdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: "Get feedback on your copy, offers, and messaging.",
          link: "https://us02web.zoom.us/j/4086742007",
          icon: MessageSquare,
          color: "green"
        },
        {
          id: weekOffset * 10 + 6,
          title: "Strategy and Conversion Call",
          category: "Strategy",
          day: "Friday",
          time: "10:00 AM EST",
          date: fridayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: "Get feedback on your funnel strategy and overall business approach.",
          link: "https://us02web.zoom.us/j/4086742007", 
          icon: Target,
          color: "blue"
        },
        {
          id: weekOffset * 10 + 7,
          title: "Ads Strategy Call",
          category: "Ads",
          day: "Friday",
          time: "3:00 PM EST",
          date: fridayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: "Get expert feedback on your ad setup and performance.",
          link: "https://us02web.zoom.us/j/7442098096",
          icon: TrendingUp,
          color: "purple"
        }
      ];





      weeks.push({
        weekLabel,
        calls: baseCalls
      });
    }
    
    return weeks;
  };

  // Fetch calls from API
  const getCalls = async () => {
    const response = await apiRequest(
      "GET",
      "/api/coaching-calls/schedule"
    );
    return response.json();
  };

  // Helper function to parse date from various formats
  const parseDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Try to parse formats like "Jan 12, 2026"
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
    
    // If parsing fails, return original string
    return dateString;
  };

  // Helper function to expand recurring calls into multiple weeks
  // Note: If backend already expands recurring calls (sends multiple calls with different dates),
  // we should NOT expand them again - just return them as-is
  const expandRecurringCalls = (calls: any[]): any[] => {
    // Group calls by a unique key to identify recurring call groups
    // If backend sends multiple calls with same title/category/day/time and recurring=true,
    // it means backend already expanded them - don't expand again
    const recurringGroups = new Map<string, any[]>();
    const nonRecurringCalls: any[] = [];
    
    calls.forEach((call: any) => {
      const isRecurring = call.recurring === true || call.recurring === "true" || call.recurring === 1;
      
      if (isRecurring) {
        // Create a key to group recurring calls (same call, different weeks)
        const groupKey = `${call.title}-${call.category}-${call.day}-${call.time}`;
        
        if (!recurringGroups.has(groupKey)) {
          recurringGroups.set(groupKey, []);
        }
        recurringGroups.get(groupKey)!.push(call);
      } else {
        nonRecurringCalls.push(call);
      }
    });
    
    const result: any[] = [...nonRecurringCalls];
    
    // Process recurring call groups
    recurringGroups.forEach((groupCalls) => {
      // If there are multiple calls in the group with different dates,
      // backend already expanded them - use them as-is (don't expand again)
      if (groupCalls.length > 1) {
        // Backend already expanded - just add all of them
        result.push(...groupCalls);
      } else {
        // Only one call in group - backend didn't expand, so expand on frontend
        const call = groupCalls[0];
        const today = new Date();
        const currentDay = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        
        // Expand for 4 weeks
        for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
          const weekStart = new Date(startOfWeek);
          weekStart.setDate(startOfWeek.getDate() + (weekOffset * 7));
          
          // Calculate date based on the day
          const dayMap: { [key: string]: number } = {
            "Monday": 1,
            "Tuesday": 2,
            "Wednesday": 3,
            "Thursday": 4,
            "Friday": 5,
            "Saturday": 6,
            "Sunday": 0
          };
          
          let callDate: string;
          if (call.date && call.date.trim() !== "") {
            // Use existing date as base
            const baseDate = new Date(call.date);
            const baseDayOfWeek = baseDate.getDay();
            const targetDate = new Date(weekStart);
            targetDate.setDate(weekStart.getDate() + (baseDayOfWeek === 0 ? 6 : baseDayOfWeek - 1));
            callDate = targetDate.toISOString().split('T')[0];
          } else {
            // Calculate based on day of week
            const targetDate = new Date(weekStart);
            const dayOfWeek = dayMap[call.day] || 1;
            targetDate.setDate(weekStart.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            callDate = targetDate.toISOString().split('T')[0];
          }
          
          result.push({
            ...call,
            id: `${call.id}-week-${weekOffset}`,
            date: callDate,
            recurring: true,
            isRecurring: true,
            originalId: call.id,
            weekOffset: weekOffset
          });
        }
      }
    });
    
    return result;
  };

  useEffect(() => {
    setCallsLoading(true);
    getCalls().then(data => {
      console.log("data", data);
      if (!data || !Array.isArray(data)) {
        console.error("Invalid data format:", data);
        setCalls([]);
        setCallsLoading(false);
        return;
      }
      
      const transformedCalls = data.map((call: any) => ({
        ...call,
        // Parse and convert date to YYYY-MM-DD format for consistency
        date: call.date ? parseDate(call.date) : '',
        // Ensure cancelReason is string, not null
        cancelReason: call.cancelReason || '',
        // Ensure recurring is boolean
        recurring: call.recurring === true || call.recurring === "true" || call.recurring === 1 || false,
      }));
      
      // Expand recurring calls into multiple weeks
      const expandedCalls = expandRecurringCalls(transformedCalls);
      
      console.log("transformedCalls", transformedCalls);
      console.log("expandedCalls", expandedCalls);
      setCalls(expandedCalls);
      setCallsLoading(false);
      const weeksData = generateWeeksData();
      console.log("weeksData",weeksData)
    }).catch((error) => {
      console.error("Error fetching calls:", error);
    
      setCalls([]);
      setCallsLoading(false);
    });
  }, []);

  // Filter calls for current week
  const getCurrentWeekCalls = () => {
    if (!calls || calls.length === 0) return [];
    
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(startOfWeek.getDate() + (currentWeek * 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return calls.filter((call: any) => {
      // Recurring calls are already expanded with specific dates for each week
      // So we can filter them normally
      if (!call.date) {
        // Skip calls without dates (shouldn't happen after expansion)
        return false;
      }
      
      // Parse the date - handle both YYYY-MM-DD and other formats
      let callDate: Date;
      if (typeof call.date === 'string') {
        // If it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(call.date)) {
          callDate = new Date(call.date);
        } else {
          // Try to parse other formats like "Jan 12, 2026"
          callDate = new Date(call.date);
        }
      } else {
        callDate = new Date(call.date);
      }
      
      // Check if date is valid
      if (isNaN(callDate.getTime())) {
        console.warn("Invalid date for call:", call);
        return false;
      }
      
      callDate.setHours(0, 0, 0, 0);
      return callDate >= weekStart && callDate <= weekEnd;
    });
  };

  const thisWeeksCalls = getCurrentWeekCalls();


  // Generate week label for current week
  const generateWeekLabel = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(startOfWeek.getDate() + (currentWeek * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    if (currentWeek === 0) {
      return `This Week (${formatDate(weekStart)}-${formatDate(weekEnd)})`;
    } else if (currentWeek === 1) {
      return `Next Week (${formatDate(weekStart)}-${formatDate(weekEnd)})`;
    } else {
      return `Week of ${formatDate(weekStart)}-${formatDate(weekEnd)}`;
    }
  };



const [recordings, setRecordings] = useState<any>({});

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('strategy')) return Target;
    if (categoryLower.includes('messaging')) return MessageSquare;
    if (categoryLower.includes('ads')) return TrendingUp;
    if (categoryLower.includes('tech')) return Settings;
    if (categoryLower.includes('accountability')) return CheckCircle;
    return Video;
  };

  const getCategoryColor = (category: string) => {
    switch(category.toLowerCase()) {
      case 'strategy': return 'blue';
      case 'messaging': return 'green';
      case 'ads': return 'purple';
      case 'tech': return 'slate';
      case 'accountability': return 'orange';
      default: return 'slate';
    }
  };

  // Sort recordings by date (newest first)
  const getSortedRecordings = (categoryRecordings: any[]) => {
    return [...categoryRecordings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Parse timestamp to seconds
  const parseTimestamp = (timestamp: string): number => {
    // Handle both [HH:MM:SS] and HH:MM:SS formats
    const match = timestamp.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  // Handle timestamp click
  const handleTimestampClick = (recordingId: string, timestamp: string) => {
    const seconds = parseTimestamp(timestamp);
    setVideoStartTimes(prev => ({
      ...prev,
      [recordingId]: seconds
    }));
  };


const getRecordings = async () => {
  const response = await apiRequest(
    "GET",
    "/api/coaching-calls/recordings"
  );
  return response.json();
};
const [callRecordingLoading, setCallRecordingLoading] = useState(false);

useEffect(() => {
  setCallRecordingLoading(true);
  getRecordings().then(data => {
    // 1. Transform the array into a grouped object
    const groupedData = data.reduce((acc: any, recording: any) => {
      // Get the category name (e.g., 'strategy' or 'messaging')
      const category = recording.category.toLowerCase();
      
      // If the category doesn't exist in our object yet, create an empty array
      if (!acc[category]) {
        acc[category] = [];
      }
      
      // Push the recording into the correct category array
      acc[category].push({
        id: String(recording.id),
        vimeoId: recording.vimeoId,
        title: recording.title,
        date: recording.date,
        duration: recording.duration,
        description: recording.description,
        transcript: recording.transcript
      });
      
      return acc;
    }, {});
    setRecordings(groupedData);
    
    setCallRecordingLoading(false)
    console.log("Structured data:", groupedData);
  });
}, []);

  const addRecordingMutation = useMutation({
    mutationFn: async (recordingData: {
      title: string;
      date: string;
      duration: string;
      vimeoId: string;
      description: string;
      transcript: string;
      category: string;
    }) => {
      // API Payload
      const payload = {
        title: recordingData.title,
        date: recordingData.date,
        duration: recordingData.duration || "60 min",
        vimeoId: recordingData.vimeoId,
        description: recordingData.description || "",
        transcript: recordingData.transcript || "",
        category: recordingData.category
      };

      console.log("API Payload:", payload);

      const response = await apiRequest(
        "POST",
        "/api/coaching-calls/recordings",
        payload
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add recording");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Update local state with the new recording
      const category = newRecording.category as keyof typeof recordings;
      const recordingToAdd = {
        id: data.id || Date.now().toString(),
        title: data.title,
        date: data.date,
        duration: data.duration,
        vimeoId: data.vimeoId,
        description: data.description,
        transcript: data.transcript
      };

      setRecordings((prev: any) => ({
        ...prev,
        [category]: [...(prev[category] || []), recordingToAdd]
      }));

      // Reset form and close modal
      setNewRecording({
        title: "",
        date: "",
        duration: "",
        vimeoId: "",
        description: "",
        transcript: "",
        category: selectedRecordingCategory
      });
      setIsAddRecordingModalOpen(false);

      toast({
        title: "Success",
        description: "Call recording added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add recording",
        variant: "destructive",
      });
    },
  });

  // Delete recording mutation
  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/coaching-calls/recordings/${recordingId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete recording");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Refetch recordings
      getRecordings().then(data => {
        const groupedData = data.reduce((acc: any, recording: any) => {
          const category = recording.category.toLowerCase();
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: String(recording.id),
            vimeoId: recording.vimeoId,
            title: recording.title,
            date: recording.date,
            duration: recording.duration,
            description: recording.description,
            transcript: recording.transcript
          });
          return acc;
        }, {});
        setRecordings(groupedData);
      });

      setIsDeleteModalOpen(false);
      setRecordingToDelete(null);
      toast({
        title: "Success",
        description: "Recording deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete recording",
        variant: "destructive",
      });
    },
  });

  // Update recording mutation
  const updateRecordingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        title: data.title,
        date: data.date,
        duration: data.duration || "60 min",
        vimeoId: data.vimeoId,
        description: data.description || "",
        transcript: data.transcript || "",
        category: data.category
      };

      const response = await apiRequest(
        "PUT",
        `/api/coaching-calls/recordings/${id}`,
        payload
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update recording");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Refetch recordings
      getRecordings().then(data => {
        const groupedData = data.reduce((acc: any, recording: any) => {
          const category = recording.category.toLowerCase();
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: String(recording.id),
            vimeoId: recording.vimeoId,
            title: recording.title,
            date: recording.date,
            duration: recording.duration,
            description: recording.description,
            transcript: recording.transcript
          });
          return acc;
        }, {});
        setRecordings(groupedData);
      });

      setIsEditRecordingModalOpen(false);
      setEditingRecording(null);
      toast({
        title: "Success",
        description: "Recording updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update recording",
        variant: "destructive",
      });
    },
  });

  // Fetch Vimeo transcript
  const fetchVimeoTranscript = async (vimeoId: string, isEdit: boolean = false) => {
    if (!vimeoId || vimeoId.trim() === "") {
      return;
    }

    // Construct Vimeo URL
    // Handle both formats: "1152029055/4d6c0ef3d2" or just "1152029055"
    const videoUrl = `https://vimeo.com/${vimeoId}`;

    if (isEdit) {
      setIsFetchingEditTranscript(true);
    } else {
      setIsFetchingTranscript(true);
    }

    try {
      const response = await apiRequest(
        "POST",
        "/api/vimeo-transcript",
        { videoUrl }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch transcript" }));
        throw new Error(errorData.message || "Failed to fetch transcript");
      }

      const data = await response.json();
      const transcript = data.transcript || data.text || data.content || "";

      if (isEdit) {
        setEditingRecording((prev: any) => ({
          ...prev,
          transcript: transcript
        }));
      } else {
        setNewRecording(prev => ({
          ...prev,
          transcript: transcript
        }));
      }

      toast({
        title: "Success",
        description: "Transcript fetched and filled automatically",
      });
    } catch (error: any) {
      console.error("Error fetching transcript:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch transcript from Vimeo",
        variant: "destructive",
      });
    } finally {
      if (isEdit) {
        setIsFetchingEditTranscript(false);
      } else {
        setIsFetchingTranscript(false);
      }
    }
  };

  // Handle Vimeo ID change with debounce
  const handleVimeoIdChange = (vimeoId: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditingRecording((prev: any) => ({
        ...prev,
        vimeoId: vimeoId
      }));
    } else {
      setNewRecording(prev => ({
        ...prev,
        vimeoId: vimeoId
      }));
    }

    // Clear previous timeout
    if (isEdit) {
      if (editTranscriptTimeoutRef.current) {
        clearTimeout(editTranscriptTimeoutRef.current);
        editTranscriptTimeoutRef.current = null;
      }
    } else {
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
        transcriptTimeoutRef.current = null;
      }
    }

    // If Vimeo ID is cleared, also clear the transcript
    if (!vimeoId || vimeoId.trim() === "") {
      if (isEdit) {
        setEditingRecording((prev: any) => ({
          ...prev,
          transcript: ""
        }));
      } else {
        setNewRecording(prev => ({
          ...prev,
          transcript: ""
        }));
      }
      return;
    }

    // Fetch transcript when Vimeo ID is entered (debounced - wait 1 second after user stops typing)
    const timeoutId = setTimeout(() => {
      fetchVimeoTranscript(vimeoId, isEdit);
    }, 1000);

    if (isEdit) {
      editTranscriptTimeoutRef.current = timeoutId;
    } else {
      transcriptTimeoutRef.current = timeoutId;
    }
  };

  // Handle add recording
  const handleAddRecording = () => {
    // 1. Validation check using .trim() to ensure fields aren't just whitespace
    if (!newRecording.title?.trim() || !newRecording.date?.trim() || !newRecording.vimeoId?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Date, Vimeo ID)",
        variant: "destructive",
      });
      return;
    }

    // 2. Create a new object with all string values trimmed
    const trimmedRecording:any = Object.fromEntries(
      Object.entries(newRecording).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
      ])
    );

    // 3. Send the clean, trimmed payload
    addRecordingMutation.mutate(trimmedRecording);
  };

  // Handle edit recording
  const handleEditRecording = (recording: any, category: string) => {
    setEditingRecording({
      id: recording.id,
      title: recording.title,
      date: recording.date,
      duration: recording.duration,
      vimeoId: recording.vimeoId,
      description: recording.description || "",
      transcript: recording.transcript || "",
      category: category
    });
    setIsEditRecordingModalOpen(true);
  };

  // Handle update recording
  const handleUpdateRecording = () => {
    // 1. Perform validation before trimming to ensure required fields aren't just whitespace
    if (!editingRecording?.title?.trim() || !editingRecording?.date?.trim() || !editingRecording?.vimeoId?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Date, Vimeo ID)",
        variant: "destructive",
      });
      return;
    }

    // 2. Create a trimmed version of the entire object
    const trimmedData = Object.fromEntries(
      Object.entries(editingRecording).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value
      ])
    );

    // 3. Send the clean payload to the API
    updateRecordingMutation.mutate({
      id: editingRecording.id,
      data: trimmedData
    });
  };

  // Handle delete recording
  const handleDeleteRecording = (recording: any) => {
    setRecordingToDelete({ id: recording.id, title: recording.title });
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (recordingToDelete) {
      deleteRecordingMutation.mutate(recordingToDelete.id);
    }
  };

  // Helper function to generate recurring calls for each week
  const generateRecurringCallsPayload = (callData: CallFormData): any[] => {
    const calls: any[] = [];
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    // Generate calls for 4 weeks ahead
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(startOfWeek.getDate() + (weekOffset * 7));
      
      // Calculate the date for this week based on the selected day
      const dayMap: { [key: string]: number } = {
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6,
        "Sunday": 0
      };
      
      let callDate: string;
      if (callData.date) {
        const baseDate = new Date(callData.date);
        const baseDayOfWeek = baseDate.getDay();
        const targetDate = new Date(weekStart);
        targetDate.setDate(weekStart.getDate() + (baseDayOfWeek === 0 ? 6 : baseDayOfWeek - 1));
        callDate = targetDate.toISOString().split('T')[0];
      } else {
        // If no date, use the selected day of the target week
        const targetDate = new Date(weekStart);
        const dayOfWeek = dayMap[callData.day] || 1;
        targetDate.setDate(weekStart.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        callDate = targetDate.toISOString().split('T')[0];
      }
      
      calls.push({
        title: callData.title,
        category: callData.category,
        day: callData.day,
        time: callData.time,
        date: callDate,
        description: callData.description || "",
        link: callData.link || "",
        color: callData.color || "blue",
        canceled: callData.canceled || false,
        cancelReason: callData.cancelReason || "",
        recurring: true
      });
    }
    
    return calls;
  };

  // Add Call mutation
  const addCallMutation = useMutation({
    mutationFn: async (callData: CallFormData) => {
      let payload: any[];
      
      if (callData.recurring) {
        // Generate multiple calls for each week
        payload = generateRecurringCallsPayload(callData);
      } else {
        // Regular call - send as array with single item
        payload = [{
          title: callData.title,
          category: callData.category,
          day: callData.day,
          time: callData.time,
          date: callData.date,
          description: callData.description || "",
          link: callData.link || "",
          color: callData.color || "blue",
          canceled: callData.canceled || false,
          cancelReason: callData.cancelReason || "",
          recurring: false
        }];
      }

      // Send payload as array
      const response = await apiRequest(
        "POST",
        "/api/coaching-calls/schedule",
        payload
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add call(s)");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Refetch all calls to get the updated list
      getCalls().then(fetchedData => {
        if (!fetchedData || !Array.isArray(fetchedData)) {
          // If refetch fails, try to add the returned data
          if (Array.isArray(data)) {
            setCalls((prev: any[]) => [...prev, ...data]);
          } else {
            setCalls((prev: any[]) => [...prev, data]);
          }
          return;
        }
        
        const transformedCalls = fetchedData.map((call: any) => ({
          ...call,
          date: call.date ? parseDate(call.date) : '',
          cancelReason: call.cancelReason || '',
        }));
        
        const expandedCalls = expandRecurringCalls(transformedCalls);
        setCalls(expandedCalls);
      }).catch(() => {
        // If refetch fails, try to add the returned data
        if (Array.isArray(data)) {
          setCalls((prev: any[]) => [...prev, ...data]);
        } else {
          setCalls((prev: any[]) => [...prev, data]);
        }
      });
      
      addCallForm.reset();
      setIsAddCallModalOpen(false);
      
      const isRecurring = Array.isArray(data) && data.length > 1;
      toast({
        title: "Success",
        description: isRecurring 
          ? `Recurring call added successfully for ${data.length} weeks` 
          : "Call added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add call",
        variant: "destructive",
      });
    },
  });

  // Update Call mutation
  const updateCallMutation = useMutation({
    mutationFn: async ({ id, data, originalCall }: { id: string; data: CallFormData; originalCall?: any }) => {
      try {
        // Check if recurring is being set to true (and it wasn't before)
        const wasRecurring = originalCall && (originalCall.recurring === true || originalCall.recurring === "true" || originalCall.recurring === 1);
        const isNowRecurring = data.recurring === true;
        
        // If recurring is being set to true, delete the original call and create recurring calls
        if (isNowRecurring && !wasRecurring) {
          // First, delete the original call
          const deleteResponse = await apiRequest(
            "DELETE",
            `/api/coaching-calls/schedule/${id}`
          );

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json().catch(() => ({ message: "Unknown error" }));
            throw new Error(errorData.message || `Failed to delete original call: ${deleteResponse.status}`);
          }

          // Then, create recurring calls (same as add call)
          const recurringPayload = generateRecurringCallsPayload(data);
          
          const createResponse = await apiRequest(
            "POST",
            "/api/coaching-calls/schedule",
            recurringPayload
          );

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({ message: "Unknown error" }));
            throw new Error(errorData.message || `Failed to create recurring calls: ${createResponse.status}`);
          }

          return await createResponse.json();
        }
        
        // Otherwise, update the single call as normal
        // If recurring is true and date is empty, calculate date based on the selected day
        let dateToSend = data.date;
        if (data.recurring && (!data.date || data.date.trim() === "")) {
          const today = new Date();
          const currentDay = today.getDay();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
          
          const dayMap: { [key: string]: number } = {
            "Monday": 1,
            "Tuesday": 2,
            "Wednesday": 3,
            "Thursday": 4,
            "Friday": 5,
            "Saturday": 6,
            "Sunday": 0
          };
          
          const targetDate = new Date(startOfWeek);
          const dayOfWeek = dayMap[data.day] || 1;
          targetDate.setDate(startOfWeek.getDate() + (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
          dateToSend = targetDate.toISOString().split('T')[0];
        }
        
        const payload = {
          title: data.title,
          category: data.category,
          day: data.day,
          time: data.time,
          date: dateToSend,
          description: data.description || "",
          link: data.link || "",
          color: data.color || "blue",
          canceled: data.canceled || false,
          cancelReason: data.cancelReason || "",
          recurring: data.recurring || false
        };

        const response = await apiRequest(
          "PUT",
          `/api/coaching-calls/schedule/${id}`,
          payload
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        // Check if the error is due to a cancelled request (e.g., component unmount, tab switch)
        if (error instanceof Error && (
          error.message.includes("canceled") || 
          error.message.includes("cancelled") ||
          error.message.includes("abort") ||
          error.name === "CanceledError" ||
          error.name === "AbortError"
        )) {
          console.info("Update call request cancelled:", error.message);
          throw new Error("Request was cancelled. Please try again.");
        }
        console.error("Error updating call:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Refetch all calls to get the updated list (especially important when recurring calls were created)
      getCalls().then(fetchedData => {
        if (!fetchedData || !Array.isArray(fetchedData)) {
          // If refetch fails, try to update with returned data
          if (Array.isArray(data)) {
            // Multiple calls created (recurring)
            setCalls((prev: any[]) => {
              // Remove the original call and add new ones
              const filtered = prev.filter((call: any) => call.id !== variables.id);
              const transformedCalls = data.map((call: any) => ({
                ...call,
                date: call.date ? parseDate(call.date) : '',
                cancelReason: call.cancelReason || '',
              }));
              return [...filtered, ...transformedCalls];
            });
          } else {
            // Single call updated
            setCalls((prev: any[]) => 
              prev.map((call: any) => call.id === data.id ? data : call)
            );
          }
          return;
        }
        
        const transformedCalls = fetchedData.map((call: any) => ({
          ...call,
          date: call.date ? parseDate(call.date) : '',
          cancelReason: call.cancelReason || '',
        }));
        
        const expandedCalls = expandRecurringCalls(transformedCalls);
        setCalls(expandedCalls);
      }).catch(() => {
        // If refetch fails, try to update with returned data
        if (Array.isArray(data)) {
          setCalls((prev: any[]) => {
            const filtered = prev.filter((call: any) => call.id !== variables.id);
            const transformedCalls = data.map((call: any) => ({
              ...call,
              date: call.date ? parseDate(call.date) : '',
              cancelReason: call.cancelReason || '',
            }));
            return [...filtered, ...transformedCalls];
          });
        } else {
          setCalls((prev: any[]) => 
            prev.map((call: any) => call.id === data.id ? data : call)
          );
        }
      });
      
      setIsEditCallModalOpen(false);
      setEditingCallId(null);
      setOriginalCallData(null);
      editCallForm.reset();
      
      const isRecurring = Array.isArray(data) && data.length > 1;
      toast({
        title: "Success",
        description: isRecurring 
          ? `Call updated to recurring for ${data.length} weeks` 
          : "Call updated successfully",
      });
    },
    onError: (error: Error) => {
      const isCancelled = error.message.includes("cancelled") || error.message.includes("canceled");
      toast({
        title: isCancelled ? "Request Cancelled" : "Error",
        description: error.message || "Failed to update call",
        variant: "destructive",
      });
    },
    retry: (failureCount, error) => {
      // Don't retry if the request was explicitly cancelled
      if (error instanceof Error && (
        error.message.includes("cancelled") || 
        error.message.includes("canceled") ||
        error.message.includes("abort")
      )) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });

  // Delete Call mutation
  const deleteCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      try {
        const response = await apiRequest(
          "DELETE",
          `/api/coaching-calls/schedule/${callId}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        // Check if the error is due to a cancelled request (e.g., component unmount, tab switch)
        if (error instanceof Error && (
          error.message.includes("canceled") || 
          error.message.includes("cancelled") ||
          error.message.includes("abort") ||
          error.name === "CanceledError" ||
          error.name === "AbortError"
        )) {
          console.info("Delete call request cancelled:", error.message);
          throw new Error("Request was cancelled. Please try again.");
        }
        console.error("Error deleting call:", error);
        throw error;
      }
    },
    onSuccess: () => {
      if (callToDelete) {
        setCalls((prev: any[]) => 
          prev.filter((call: any) => call.id !== callToDelete.id)
        );
      }
      setIsDeleteCallModalOpen(false);
      setCallToDelete(null);
      toast({
        title: "Success",
        description: "Call deleted successfully",
      });
    },
    onError: (error: Error) => {
      const isCancelled = error.message.includes("cancelled") || error.message.includes("canceled");
      toast({
        title: isCancelled ? "Request Cancelled" : "Error",
        description: error.message || "Failed to delete call",
        variant: "destructive",
      });
    },
    retry: (failureCount, error) => {
      // Don't retry if the request was explicitly cancelled
      if (error instanceof Error && (
        error.message.includes("cancelled") || 
        error.message.includes("canceled") ||
        error.message.includes("abort")
      )) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });

  // Handle add call
  const handleAddCall = (data: CallFormData) => {
    addCallMutation.mutate(data);
  };

  // Handle edit call
  const handleEditCall = (call: any) => {
    // Store original call data to check if it was recurring
    setOriginalCallData(call);
    
    // Check if call is recurring
    const isRecurring = call.recurring === true || call.recurring === "true" || call.recurring === 1;
    
    // Format date for input field (YYYY-MM-DD)
    // If recurring, clear the date (it will be calculated for each week)
    let formattedDate = "";
    if (!isRecurring && call.date) {
      const dateObj = new Date(call.date);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0];
      }
    }
    
    editCallForm.reset({
      title: call.title,
      category: call.category as "Strategy" | "Messaging" | "Ads" | "Tech Support" | "Accountability",
      day: call.day as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
      time: call.time,
      date: formattedDate, // Empty string if recurring, formatted date otherwise
      description: call.description || "",
      link: call.link || "",
      color: (call.color || "blue") as "blue" | "green" | "purple" | "orange" | "coral" | "slate",
      canceled: call.canceled || false,
      cancelReason: call.cancelReason || "",
      recurring: isRecurring
    });
    setEditingCallId(call.id);
    setIsEditCallModalOpen(true);
  };

  // Handle update call
  const handleUpdateCall = (data: CallFormData) => {
    if (editingCallId) {
      updateCallMutation.mutate({
        id: editingCallId,
        data: data,
        originalCall: originalCallData // Pass original call data to check if it was recurring
      });
    }
  };

  // Handle delete call
  const handleDeleteCall = (call: any) => {
    setCallToDelete({ id: call.id, title: call.title });
    setIsDeleteCallModalOpen(true);
  };

  // Confirm delete call
  const confirmDeleteCall = () => {
    if (callToDelete) {
      deleteCallMutation.mutate(callToDelete.id);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Live Coaching Calls</h1>
          </div>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            Live This Week
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="schedule" className="flex items-center gap-2" data-testid="tab-schedule">
            <Calendar className="w-4 h-4" />
            Call Schedule
          </TabsTrigger>
          <TabsTrigger value="recordings" className="flex items-center gap-2" data-testid="tab-recordings">
            <Play className="w-4 h-4" />
            Call Recordings
          </TabsTrigger>
        </TabsList>

        {/* Schedule Tab Content */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <CardTitle>{generateWeekLabel()}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {user?.isAdmin && (
                  <Dialog 
                    open={isAddCallModalOpen} 
                    onOpenChange={(open) => {
                      setIsAddCallModalOpen(open);
                      if (!open) {
                        addCallForm.reset();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 mr-2">
                        <Plus className="w-4 h-4" />
                        Add Call
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Call</DialogTitle>
                        <DialogDescription>
                          Add a new coaching call to the schedule
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...addCallForm}>
                        <form onSubmit={addCallForm.handleSubmit(handleAddCall)} className="space-y-4 py-4">
                          <FormField
                            control={addCallForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Strategy and Conversion Call"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addCallForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Strategy">Strategy</SelectItem>
                                      <SelectItem value="Messaging">Messaging</SelectItem>
                                      <SelectItem value="Ads">Ads</SelectItem>
                                      <SelectItem value="Tech Support">Tech Support</SelectItem>
                                      <SelectItem value="Accountability">Accountability</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addCallForm.control}
                              name="day"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Day *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select day" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Monday">Monday</SelectItem>
                                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                                      <SelectItem value="Thursday">Thursday</SelectItem>
                                      <SelectItem value="Friday">Friday</SelectItem>
                                      <SelectItem value="Saturday">Saturday</SelectItem>
                                      <SelectItem value="Sunday">Sunday</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addCallForm.control}
                              name="recurring"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Recurring</FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      const isRecurring = value === "true";
                                      field.onChange(isRecurring);
                                      // Clear date when enabling recurring
                                      if (isRecurring) {
                                        addCallForm.setValue("date", "");
                                      }
                                    }} 
                                    value={field.value ? "true" : "false"}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="false">False</SelectItem>
                                      <SelectItem value="true">True</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addCallForm.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Date {!addCallForm.watch("recurring") && "*"}
                                    {addCallForm.watch("recurring") && (
                                      <span className="text-xs text-slate-500 ml-1">(Optional - will be calculated for each week)</span>
                                    )}
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field}
                                      disabled={addCallForm.watch("recurring")}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addCallForm.control}
                              name="time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., 1:00 PM EST"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={addCallForm.control}
                            name="link"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Zoom Link</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., https://us02web.zoom.us/j/4086742007"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addCallForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Brief description of the call"
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addCallForm.control}
                              name="color"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select color" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="blue">Blue</SelectItem>
                                      <SelectItem value="green">Green</SelectItem>
                                      <SelectItem value="purple">Purple</SelectItem>
                                      <SelectItem value="orange">Orange</SelectItem>
                                      <SelectItem value="coral">Coral</SelectItem>
                                      <SelectItem value="slate">Slate</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addCallForm.control}
                              name="canceled"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(value === "canceled")} 
                                    value={field.value ? "canceled" : "active"}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="canceled">Canceled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          {addCallForm.watch("canceled") && (
                            <FormField
                              control={addCallForm.control}
                              name="cancelReason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cancel Reason *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Reason for cancellation"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <DialogFooter>
                            <Button 
                              type="button"
                              variant="outline" 
                              onClick={() => {
                                setIsAddCallModalOpen(false);
                                addCallForm.reset();
                              }}
                              disabled={addCallMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={addCallMutation.isPending}
                            >
                              {addCallMutation.isPending ? "Adding..." : "Add Call"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                  disabled={currentWeek === 0}
                  className="px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600">
                  {currentWeek === 0 ? 'This Week' : 
                   currentWeek === 1 ? 'Next Week' : 
                   `${currentWeek + 1} Weeks Ahead`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(Math.min(3, currentWeek + 1))}
                  disabled={currentWeek >= 3}
                  className="px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Here's this week's coaching call schedule! Join any of the calls you feel would help you the most to get strategy support, copy reviewed, ads feedback or anything else! We always encourage you to SHOW UP MESSY. Let us help you sort through any overwhelm, confusion or lack of clarity. You do not need perfectly scripted questions - just come show up with where you're at!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {callsLoading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : thisWeeksCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                <Calendar className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium mb-2">No calls scheduled for this week</p>
                <p className="text-sm text-slate-500">Try navigating to a different week or add a new call</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {thisWeeksCalls.map((call: any) => {
                  const IconComponent = getCategoryIcon(call.category);
                  const isCanceled = call.canceled;
                  
                  return (
                    <div key={call.id} className={`border rounded-lg p-4 transition-shadow ${
                      isCanceled ? 'border-red-200 bg-red-50/50' : 'border-slate-200 hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${
                            isCanceled ? 'bg-red-100' : `bg-${call.color}-100`
                          } rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`w-5 h-5 ${
                              isCanceled ? 'text-red-600' : `text-${call.color}-600`
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${isCanceled ? 'text-slate-600' : 'text-slate-900'}`}>
                              {call.title}
                            </h3>
                            <p className="text-sm text-slate-500">{call.category} Call</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {user?.isAdmin && (
                            <div className="flex items-center gap-2 mb-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCall(call)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCall(call)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                          {isCanceled ? (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Cancelled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`text-${call.color}-600 border-${call.color}-600`}>
                              {call.day}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-3 ${isCanceled ? 'text-slate-500' : 'text-slate-600'}`}>
                        {isCanceled && call.cancelReason ? call.cancelReason : call.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {call.time}
                          </span>
                        </div>
                        {isCanceled ? (
                          ""
                        ) : (
                          call.link && (
                            <a href={call.link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className={
                                call.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                call.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                                call.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                                call.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                                call.color === 'coral' ? 'bg-embodied-coral hover:bg-embodied-orange' :
                                'bg-slate-600 hover:bg-slate-700'
                              }>
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Join Call
                              </Button>
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* Recordings Tab Content */}
        <TabsContent value="recordings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-purple-600" />
                    Call Recordings
                  </CardTitle>
                  <CardDescription>
                    Watch previous coaching call recordings organized by category
                  </CardDescription>
                </div>
                <Dialog 
                  open={isAddRecordingModalOpen} 
                  onOpenChange={(open) => {
                    setIsAddRecordingModalOpen(open);
                    if (open) {
                      // Set category to selected tab when opening modal
                      setNewRecording(prev => ({ ...prev, category: selectedRecordingCategory }));
                    } else {
                      // Clear timeout if modal closes
                      if (transcriptTimeoutRef.current) {
                        clearTimeout(transcriptTimeoutRef.current);
                        transcriptTimeoutRef.current = null;
                      }
                      setIsFetchingTranscript(false);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                   {user?.isAdmin && (
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Recording
                    </Button>
                   )}
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Call Recording</DialogTitle>
                      <DialogDescription>
                        Add a new call recording to the {selectedRecordingCategory} category
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newRecording.category}
                          onValueChange={(value) => setNewRecording(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strategy">Strategy</SelectItem>
                            <SelectItem value="messaging">Messaging</SelectItem>
                            <SelectItem value="ads">Ads</SelectItem>
                            <SelectItem value="tech">Tech</SelectItem>
                            <SelectItem value="accountability">Accountability</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Jan 6, 2026 Strategy & Conversion Call Recording"
                          value={newRecording.title}
                          onChange={(e) => setNewRecording(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newRecording.date}
                            onChange={(e) => setNewRecording(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration</Label>
                          <Input
                            id="duration"
                            placeholder="e.g., 60 min"
                            value={newRecording.duration}
                            onChange={(e) => setNewRecording(prev => ({ ...prev, duration: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vimeoId">Vimeo ID *</Label>
                        <Input
                          id="vimeoId"
                          placeholder="e.g., 1152029055/4d6c0ef3d2"
                          value={newRecording.vimeoId}
                          onChange={(e) => handleVimeoIdChange(e.target.value, false)}
                        />
                        <p className="text-xs text-slate-500">
                          Enter Vimeo ID to automatically fetch transcript
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of the call"
                          value={newRecording.description}
                          onChange={(e) => setNewRecording(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transcript">Transcript / Timestamps</Label>
                        <div className="relative">
                          <Textarea
                            id="transcript"
                            placeholder="Enter timestamps and transcript content, e.g., [00:01:09] Speaker name - content"
                            value={newRecording.transcript}
                            onChange={(e) => setNewRecording(prev => ({ ...prev, transcript: e.target.value }))}
                            rows={6}
                            disabled={isFetchingTranscript}
                          />
                          {isFetchingTranscript && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Fetching transcript from Vimeo...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddRecordingModalOpen(false)}
                        disabled={addRecordingMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddRecording} 
                        disabled={!newRecording.title || !newRecording.date || !newRecording.vimeoId || addRecordingMutation.isPending}
                      >
                        {addRecordingMutation.isPending ? "Adding..." : "Add Recording"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedRecordingCategory} onValueChange={setSelectedRecordingCategory}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="strategy" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Strategy
                </TabsTrigger>
                <TabsTrigger value="messaging" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messaging
                </TabsTrigger>
                <TabsTrigger value="ads" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Ads
                </TabsTrigger>
                <TabsTrigger value="tech" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Tech
                </TabsTrigger>
                <TabsTrigger value="accountability" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Accountability
                </TabsTrigger>
              </TabsList>

              {callRecordingLoading ? <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div> :    Object.entries(recordings).map(([category, categoryRecordings]:any) => {
                const sortedRecordings = getSortedRecordings(categoryRecordings);
                return (
                  <TabsContent key={category} value={category} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900 capitalize">
                        {category} Call Recordings ({categoryRecordings.length as number})
                      </h3>
                      <Badge variant="outline" className="text-slate-600">
                        Sorted by Date (Newest First)
                      </Badge>
                    </div>

                    <div className="space-y-6">
                      {sortedRecordings.map((recording, index) => (
                        <Card key={recording.id} className="overflow-hidden">
                          <CardContent className="p-6">
                            <div className="grid lg:grid-cols-3 gap-6">
                              {/* Video Section */}
                              <div className="lg:col-span-1">
                                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden mb-3">
                                  <VimeoEmbed
                                    vimeoId={recording.vimeoId}
                                    title={recording.title}
                                    userId={1} 
                                    stepNumber={300 + parseInt(recording.id) + index}
                                    startTime={videoStartTimes[recording.id] || 0}
                                  />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(recording.date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {recording.duration}
                                  </span>
                                </div>
                              </div>

                              {/* Content Section */}
                              <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-xl font-semibold text-slate-900 mb-2">
                                      {recording.title}
                                    </h4>
                                    <p className="text-slate-600">
                                      {recording.description}
                                    </p>
                                  </div>
                            {user?.isAdmin && (<div className="flex items-center gap-2 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditRecording(recording, category)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRecording(recording)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>)}
                                </div>

                                {/* Transcript Section */}
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-slate-600" />
                                    <h5 className="font-medium text-slate-900">Timestamps & Questions</h5>
                                  </div>
                                  <div className="text-sm text-slate-700 leading-relaxed space-y-2 max-h-[200px] overflow-y-auto">
                                    {(recording.transcript || '').split('\n').filter((line: string) => line.trim()).map((line: string, lineIndex: number) => {
                                      const timestampMatch = line.match(/\[([^\]]+)\]/);
                                      const timestamp = timestampMatch ? timestampMatch[0] : '';
                                      const content = line.replace(/\[([^\]]+)\]\s*/, '');
                                      
                                      return (
                                        <div key={lineIndex} className="flex gap-3">
                                          {timestamp && (
                                            <button
                                              onClick={() => handleTimestampClick(recording.id, timestamp)}
                                              className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-xs mt-0.5 flex-shrink-0 cursor-pointer transition-colors"
                                              data-testid={`timestamp-${recording.id}-${lineIndex}`}
                                            >
                                              {timestampMatch?.[1] || ''}
                                            </button>
                                          )}
                                          <span className="flex-1">
                                            {content}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Recording Modal */}
      <Dialog open={isEditRecordingModalOpen} onOpenChange={(open) => {
        setIsEditRecordingModalOpen(open);
        if (!open) {
          // Clear timeout if modal closes
          if (editTranscriptTimeoutRef.current) {
            clearTimeout(editTranscriptTimeoutRef.current);
            editTranscriptTimeoutRef.current = null;
          }
          setIsFetchingEditTranscript(false);
          setEditingRecording(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Call Recording</DialogTitle>
            <DialogDescription>
              Update the call recording information
            </DialogDescription>
          </DialogHeader>
          {editingRecording && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingRecording.category}
                  onValueChange={(value) => setEditingRecording((prev: any) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="messaging">Messaging</SelectItem>
                    <SelectItem value="ads">Ads</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="accountability">Accountability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g., Jan 6, 2026 Strategy & Conversion Call Recording"
                  value={editingRecording.title}
                  onChange={(e) => setEditingRecording((prev: any) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingRecording.date}
                    onChange={(e) => setEditingRecording((prev: any) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input
                    id="edit-duration"
                    placeholder="e.g., 60 min"
                    value={editingRecording.duration}
                    onChange={(e) => setEditingRecording((prev: any) => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vimeoId">Vimeo ID *</Label>
                <Input
                  id="edit-vimeoId"
                  placeholder="e.g., 1152029055/4d6c0ef3d2"
                  value={editingRecording.vimeoId}
                  onChange={(e) => handleVimeoIdChange(e.target.value, true)}
                />
                <p className="text-xs text-slate-500">
                  Enter Vimeo ID to automatically fetch transcript
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Brief description of the call"
                  value={editingRecording.description}
                  onChange={(e) => setEditingRecording((prev: any) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-transcript">Transcript / Timestamps</Label>
                <div className="relative">
                  <Textarea
                    id="edit-transcript"
                    placeholder="Enter timestamps and transcript content, e.g., [00:01:09] Speaker name - content"
                    value={editingRecording.transcript}
                    onChange={(e) => setEditingRecording((prev: any) => ({ ...prev, transcript: e.target.value }))}
                    rows={6}
                    disabled={isFetchingEditTranscript}
                  />
                  {isFetchingEditTranscript && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Fetching transcript from Vimeo...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditRecordingModalOpen(false);
                setEditingRecording(null);
              }}
              disabled={updateRecordingMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRecording} 
              disabled={!editingRecording?.title || !editingRecording?.date || !editingRecording?.vimeoId || updateRecordingMutation.isPending}
            >
              {updateRecordingMutation.isPending ? "Updating..." : "Update Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recording</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {recordingToDelete && (
            <div className="py-4">
              <p className="text-sm text-slate-600">
                <strong>{recordingToDelete.title}</strong>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setRecordingToDelete(null);
              }}
              disabled={deleteRecordingMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteRecordingMutation.isPending}
            >
              {deleteRecordingMutation.isPending ? "Deleting..." : "Delete Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Call Modal */}
      <Dialog open={isEditCallModalOpen} onOpenChange={(open) => {
        setIsEditCallModalOpen(open);
        if (!open) {
          setEditingCallId(null);
          editCallForm.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Call</DialogTitle>
            <DialogDescription>
              Update the call information
            </DialogDescription>
          </DialogHeader>
          <Form {...editCallForm}>
            <form onSubmit={editCallForm.handleSubmit(handleUpdateCall)} className="space-y-4 py-4">
              <FormField
                control={editCallForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Strategy and Conversion Call"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editCallForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Strategy">Strategy</SelectItem>
                          <SelectItem value="Messaging">Messaging</SelectItem>
                          <SelectItem value="Ads">Ads</SelectItem>
                          <SelectItem value="Tech Support">Tech Support</SelectItem>
                          <SelectItem value="Accountability">Accountability</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCallForm.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCallForm.control}
                  name="recurring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const isRecurring = value === "true";
                          field.onChange(isRecurring);
                          // Clear date when enabling recurring
                          if (isRecurring) {
                            editCallForm.setValue("date", "");
                          }
                        }} 
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">False</SelectItem>
                          <SelectItem value="true">True</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editCallForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date {!editCallForm.watch("recurring") && "*"}
                        {editCallForm.watch("recurring") && (
                          <span className="text-xs text-slate-500 ml-1">(Optional - will be calculated for each week)</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          disabled={editCallForm.watch("recurring")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCallForm.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 1:00 PM EST"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editCallForm.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zoom Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., https://us02web.zoom.us/j/4086742007"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editCallForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the call"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editCallForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="coral">Coral</SelectItem>
                          <SelectItem value="slate">Slate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editCallForm.control}
                  name="canceled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "canceled")} 
                        value={field.value ? "canceled" : "active"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {editCallForm.watch("canceled") && (
                <FormField
                  control={editCallForm.control}
                  name="cancelReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancel Reason *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Reason for cancellation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setIsEditCallModalOpen(false);
                    setEditingCallId(null);
                    editCallForm.reset();
                  }}
                  disabled={updateCallMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateCallMutation.isPending}
                >
                  {updateCallMutation.isPending ? "Updating..." : "Update Call"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Call Confirmation Modal */}
      <Dialog open={isDeleteCallModalOpen} onOpenChange={setIsDeleteCallModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Call</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this call? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {callToDelete && (
            <div className="py-4">
              <p className="text-sm text-slate-600">
                <strong>{callToDelete.title}</strong>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteCallModalOpen(false);
                setCallToDelete(null);
              }}
              disabled={deleteCallMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteCall}
              disabled={deleteCallMutation.isPending}
            >
              {deleteCallMutation.isPending ? "Deleting..." : "Delete Call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
