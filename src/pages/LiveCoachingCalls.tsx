import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Calendar, Users, Clock, Play, ExternalLink, Target, MessageSquare, TrendingUp, CheckCircle, FileText, Settings, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

  const weeksData = generateWeeksData();

  const currentWeekData = weeksData[currentWeek];
  const thisWeeksCalls = currentWeekData?.calls || [];



const [recordings, setRecordings] = useState<any>({});

  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'strategy': return Target;
      case 'messaging': return MessageSquare;
      case 'ads': return TrendingUp;
      case 'tech': return Settings;
      case 'accountability': return CheckCircle;
      default: return Video;
    }
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

  // Handle add recording
  const handleAddRecording = () => {
    if (!newRecording.title || !newRecording.date || !newRecording.vimeoId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Date, Vimeo ID)",
        variant: "destructive",
      });
      return;
    }

    addRecordingMutation.mutate(newRecording);
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
    if (!editingRecording?.title || !editingRecording?.date || !editingRecording?.vimeoId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Date, Vimeo ID)",
        variant: "destructive",
      });
      return;
    }

    updateRecordingMutation.mutate({
      id: editingRecording.id,
      data: editingRecording
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
                <CardTitle>{currentWeekData?.weekLabel || "Coaching Calls"}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
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
                  onClick={() => setCurrentWeek(Math.min(weeksData.length - 1, currentWeek + 1))}
                  disabled={currentWeek === weeksData.length - 1}
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
            <div className="grid md:grid-cols-2 gap-4">
              {thisWeeksCalls.map((call: any) => {
                const IconComponent = call.icon;
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
                        <div>
                          <h3 className={`font-semibold ${isCanceled ? 'text-slate-600' : 'text-slate-900'}`}>
                            {call.title}
                          </h3>
                          <p className="text-sm text-slate-500">{call.category} Call</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
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
                        // <Badge variant="outline" className="text-red-600 border-red-600">
                        //   {call.cancelReason}
                        // </Badge>

                        ""
                      ) : (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
                          onChange={(e) => setNewRecording(prev => ({ ...prev, vimeoId: e.target.value }))}
                        />
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
                        <Textarea
                          id="transcript"
                          placeholder="Enter timestamps and transcript content, e.g., [00:01:09] Speaker name - content"
                          value={newRecording.transcript}
                          onChange={(e) => setNewRecording(prev => ({ ...prev, transcript: e.target.value }))}
                          rows={6}
                        />
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
      <Dialog open={isEditRecordingModalOpen} onOpenChange={setIsEditRecordingModalOpen}>
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
                  onChange={(e) => setEditingRecording((prev: any) => ({ ...prev, vimeoId: e.target.value }))}
                />
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
                <Textarea
                  id="edit-transcript"
                  placeholder="Enter timestamps and transcript content, e.g., [00:01:09] Speaker name - content"
                  value={editingRecording.transcript}
                  onChange={(e) => setEditingRecording((prev: any) => ({ ...prev, transcript: e.target.value }))}
                  rows={6}
                />
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
    </div>
  );
}
