import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Video, Calendar, Users, Clock, Play, ExternalLink, Target, MessageSquare, TrendingUp, CheckCircle, FileText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useState } from "react";

// Live Coaching Calls - Updated Oct 29, 2025
export default function LiveCoachingCalls() {
  const [mainTab, setMainTab] = useState<string>("schedule");
  const [selectedRecordingCategory, setSelectedRecordingCategory] = useState<string>("strategy");
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [videoStartTimes, setVideoStartTimes] = useState<Record<string, number>>({});

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
          color: "coral"
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

  // Recordings organized by category - easily updatable by your team
  const recordings = {
    strategy: [
      { 
        id: "20", 
        vimeoId: "1134727878/c3d50f04ca", 
        title: "Nov 7, 2025 Strategy & Conversion Call Recording", 
        date: "2025-11-07",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:17] Caroline
[00:14:11] Jordan
[00:14:16] Sherry
[00:51:29] Lauren`
      },
      { 
        id: "17", 
        vimeoId: "1133621616/3229b27627", 
        title: "Nov 4, 2025 Strategy & Conversion Call Recording", 
        date: "2025-11-04",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:29] Carolyn
[00:09:57] Lauren
[00:21:57] Ruth
[00:26:22] Carly`
      },
      { 
        id: "15", 
        vimeoId: "1132569346/b1dd26721a", 
        title: "Oct 31, 2025 Strategy & Conversion Call Recording", 
        date: "2025-10-31",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:12] Minnie
[00:15:11] Siri
[00:36:10] Jordan
[00:42:45] Lauren`
      },
      { 
        id: "14", 
        vimeoId: "1131461062/9981c827f0", 
        title: "Oct 28, 2025 Strategy & Conversion Call Recording", 
        date: "2025-10-28",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:49] Caroline
[00:03:54] Jill
[00:12:56] Monica
[00:28:08] Christine
[00:36:52] Siri`
      },
      { 
        id: "11", 
        vimeoId: "1130296205/1367a4d1a2", 
        title: "Oct 24, 2025 Strategy & Conversion Call Recording", 
        date: "2025-10-24",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:54] Jordan
[00:17:03] Melissa
[00:43:17] Lauren`
      },
      { 
        id: "8", 
        vimeoId: "1129660643/a0f3c1b69c", 
        title: "Oct 22, 2025 Strategy & Conversion Call Recording", 
        date: "2025-10-22",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:16] Ruth
[00:15:40] Monica
[00:29:10] Lauren
[00:48:06] Tiana`
      },
      { 
        id: "7", 
        vimeoId: "1129313917/a613028199", 
        title: "Oct 21, 2025 Strategy & Conversion Call Recording", 
        date: "2025-10-21",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:21] Laura
[00:05:12] Jordan
[00:32:05] Jennifer
[00:45:03] Cassandra
[00:46:53] Minnie`
      },
      { 
        id: "4", 
        vimeoId: "1127630471/7125c9942f", 
        title: "Oct 14, 2025 Strategy & Conversion Call Recording", 
        date: "2025-10-14",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:20] Caroline
[00:10:20] Lauren
[00:19:20] Jordan
[00:29:40] Taylor
[00:36:50] Monica`
      }
    ],
    messaging: [
      { 
        id: "19", 
        vimeoId: "1134389485/febcc5c6d1", 
        title: "Nov 6, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-11-06",
        duration: "60 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:02] Caroline
[00:00:36] Lauren
[00:04:10] Tiana
[00:15:35] Ruth
[00:26:46] Sherry
[00:30:38] Jordan`
      },
      { 
        id: "16", 
        vimeoId: "1132266864/7591fb542a", 
        title: "Oct 30, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-10-30",
        duration: "67 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:17] Jasmine
[00:11:38] Caroline
[00:29:58] Tiana
[00:51:21] Lauren
[01:04:03] Jordan`
      },
      { 
        id: "2", 
        vimeoId: "1130013276/63180baf53", 
        title: "Oct 23, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-10-23",
        duration: "60 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:10] Monica
[00:19:05] Lauren
[00:38:50] Siri
[00:53:58] Tiana`
      },
      { 
        id: "1", 
        vimeoId: "1127630471/7125c9942f", 
        title: "Oct 15, 2025 Messaging & Offer Positioning Recording", 
        date: "2025-10-15",
        duration: "60 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:20] Caroline
[00:10:20] Lauren
[00:19:20] Jordan
[00:29:40] Taylor`
      }
    ],
    ads: [
      { 
        id: "19", 
        vimeoId: "1135370745/75052191ea", 
        title: "Nov 7, 2025 Ads Optimization Call Recording", 
        date: "2025-11-07",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:00] Lauren`
      },
      { 
        id: "17", 
        vimeoId: "1133935789/7f8ed131cb", 
        title: "Nov 5, 2025 Ads Optimization Call Recording", 
        date: "2025-11-05",
        duration: "74 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:03] Caroline
[00:08:52] Ruth
[00:23:20] Minnie
[00:51:59] Lauren`
      },
      { 
        id: "16", 
        vimeoId: "1132984921/d15b3df341", 
        title: "Oct 31, 2025 Ads Optimization Call Recording", 
        date: "2025-10-31",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:52] Caroline
[00:21:55] Jasmine
[00:37:28] Monica`
      },
      { 
        id: "15", 
        vimeoId: "1131763128/03ccfd9878", 
        title: "Oct 29, 2025 Ads Optimization Call Recording", 
        date: "2025-10-29",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:01] Tiana
[00:07:57] Lauren
[00:27:23] Ashley
[00:35:55] Siri
[00:50:41] Caroline`
      },
      { 
        id: "12", 
        vimeoId: "1131001423/8fad42ed4a", 
        title: "Oct 24, 2025 Ads Optimization Call Recording", 
        date: "2025-10-24",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:00] Monica
[00:06:47] Lauren`
      },
      { 
        id: "9", 
        vimeoId: "1129661332/e3fa9c1069", 
        title: "Oct 22, 2025 Ads Optimization Call Recording", 
        date: "2025-10-22",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:02] Monica
[00:09:16] Caroline
[01:00:45] Melissa
[01:21:30] Siri`
      },
      { 
        id: "5", 
        vimeoId: "1128888950/f3b8b4eba7", 
        title: "Oct 17, 2025 Ads Optimization Call Recording", 
        date: "2025-10-17",
        duration: "72 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:03] Lauren
[00:28:52] Monica`
      },
      { 
        id: "3", 
        vimeoId: "1127885664/849eca944b", 
        title: "Oct 15, 2025 Ads Optimization Call Recording", 
        date: "2025-10-15",
        duration: "90 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:00] Monica
[00:21:10] Doug
[00:41:15] Ruth
[01:03:40] Monica`
      },
      { 
        id: "2", 
        vimeoId: "1125632162/e7706a57cb", 
        title: "Oct 10, 2025 Ads Optimization Call Recording", 
        date: "2025-10-10",
        duration: "92 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:01:01] Monica
[00:23:17] Anna
[00:41:57] Lauren`
      }
    ],
    tech: [
      { 
        id: "18", 
        vimeoId: "1134332221/789d0d44fd", 
        title: "Nov 5, 2025 Tech Support Call Recording", 
        date: "2025-11-05",
        duration: "60 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:03] Lauren`
      },
      { 
        id: "10", 
        vimeoId: "1129916697/9d386d2954", 
        title: "Oct 22, 2025 Tech Support Call Recording", 
        date: "2025-10-22",
        duration: "60 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:16] Ruth`
      }
    ],
    accountability: [
      { 
        id: "14", 
        vimeoId: "1133263525/c943a2fe89", 
        title: "Nov 3, 2025 Accountability Call Recording", 
        date: "2025-11-03",
        duration: "60 min",
        description: "Accountability coaching session",
        transcript: `[00:02:03] Casey
[00:06:37] Tal
[00:22:33] Ruth
[00:28:56] Lauren`
      },
      { 
        id: "13", 
        vimeoId: "1131058853/326750b425", 
        title: "Oct 27, 2025 Accountability Call Recording", 
        date: "2025-10-27",
        duration: "60 min",
        description: "Accountability coaching session",
        transcript: `[00:10:32] Jordan
[00:22:09] Minnie
[00:24:16] Sophie
[00:30:26] Casey
[00:36:06] Jill
[00:45:25] Lauren`
      },
      { 
        id: "20", 
        vimeoId: "1135500077/17fae14c88", 
        title: "Nov 10, 2025 Accountability Call Recording", 
        date: "2025-11-10",
        duration: "60 min",
        description: "Accountability coaching session",
        transcript: `[00:01:34] Ann Marie
[00:03:11] Taylor
[00:04:55] Jasmine
[00:08:59] Jordan
[00:13:34] Lauren`
      },
      { 
        id: "6", 
        vimeoId: "1129313379/f629bf6c5a", 
        title: "Oct 20, 2025 Accountability Call Recording", 
        date: "2025-10-20",
        duration: "60 min",
        description: "Accountability coaching session",
        transcript: `[00:00:12] Christine
[00:02:24] Monica
[00:03:46] Jordan
[00:04:53] Lauren
[00:12:59] Caroline`
      }
    ]
  };

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
                            Canceled
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
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          {call.cancelReason}
                        </Badge>
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
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-600" />
                Call Recordings
              </CardTitle>
              <CardDescription>
                Watch previous coaching call recordings organized by category
              </CardDescription>
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

              {Object.entries(recordings).map(([category, categoryRecordings]) => {
                const sortedRecordings = getSortedRecordings(categoryRecordings);
                return (
                  <TabsContent key={category} value={category} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900 capitalize">
                        {category} Call Recordings ({categoryRecordings.length})
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
                                <div>
                                  <h4 className="text-xl font-semibold text-slate-900 mb-2">
                                    {recording.title}
                                  </h4>
                                  <p className="text-slate-600">
                                    {recording.description}
                                  </p>
                                </div>

                                {/* Transcript Section */}
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-slate-600" />
                                    <h5 className="font-medium text-slate-900">Timestamps & Questions</h5>
                                  </div>
                                  <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                                    {recording.transcript.split('\n').map((line: string, lineIndex: number) => {
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
    </div>
  );
}
