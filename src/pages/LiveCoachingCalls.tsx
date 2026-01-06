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

  // Recordings organized by category - easily updatable by your team
  const recordings = {
    strategy: [
      { 
        id: "47", 
        vimeoId: "1150467684/1b2cc0c235", 
        title: "Dec 30, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-30",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:05] Lauren - AI-generated podcast backgrounds, Telegram follow-up strategy for year-end offer cutoffs
[00:07:36] Fica - web copy completion, brand assets, email sequences progress, sales page CTA clarification
[00:11:45] Elle - timeline acceleration for February launch, visibility ad content creation, lead gen infrastructure
[00:41:00] Amanda - adding video to ads, recording tools comparison (Loom vs PowerPoint vs Sambavi)
[00:48:03] Cassandra - customer journey mapping, mini mind messaging reframe, high-risk pregnancy coaching positioning`
      },
      { 
        id: "46", 
        vimeoId: "1149071821/6cb55acacb", 
        title: "Dec 23, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-23",
        duration: "68 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:04:03] Lauren - email strategy win, sales conversion, content batching approach
[00:20:48] Cassandra - prenatal clarity call email review, 12 days of Christmas campaign, pricing one-on-one mindset mentorship
[00:39:01] Kara - offer outcomes deep dive, ads launch timing, balancing business with family during holidays
[01:01:51] Sheri Chen - year-end reflection, tracking business progress, planning for 2026`
      },
      { 
        id: "44", 
        vimeoId: "1148107847/caf161d381", 
        title: "Dec 19, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-19",
        duration: "61 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:01:09] Sherry - quiz landing page review, tripwire messaging, email sequences
[00:15:37] Kara - ads targeting strategy, offer transformation outcomes
[00:29:41] Jordan - Built for Bigger sales page review, tangible outcomes
[00:48:46] Cassandra - tripwire page CTA, launching ads`
      },
      { 
        id: "40", 
        vimeoId: "1147369138/03aa7fc6d4", 
        title: "Dec 16, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-16",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:02] Amanda
[00:03:55] Casey
[00:23:43] Lauren
[00:35:31] Cassandra
[00:45:44] Jordan
[00:58:40] Taylor`
      },
      { 
        id: "37", 
        vimeoId: "1146006835/f4518153e1", 
        title: "Dec 12, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-12",
        duration: "64 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:06] Caroline
[00:07:59] Ashley
[00:13:18] Sherry
[00:27:18] Jordan
[00:39:06] Lauren`
      },
      { 
        id: "34", 
        vimeoId: "1145276938/adb1197739", 
        title: "Dec 9, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-09",
        duration: "61 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:35] Alicia
[00:14:09] Sherry
[00:25:44] Casey
[00:36:48] Lauren`
      },
      { 
        id: "27", 
        vimeoId: "1143135939/aec88d38e0", 
        title: "Dec 2, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-02",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:07] Laura
[00:05:44] Lauren
[00:28:05] Jordan`
      },
      { 
        id: "26", 
        vimeoId: "1140576929/632d42eb80", 
        title: "Nov 25, 2025 Strategy & Conversion Call Recording", 
        date: "2025-11-25",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:00] Lauren
[00:26:45] Jordan
[00:28:17] Anne-Marie
[00:39:45] Sherry
[00:47:48] SiriChand`
      },
      { 
        id: "25", 
        vimeoId: "1139461567/c947fc319d", 
        title: "Nov 21, 2025 Strategy & Conversion Call Recording", 
        date: "2025-11-21",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:00] Sherry
[00:10:17] Jasmine
[00:26:07] Lauren
[00:38:17] SiriChand
[00:51:30] Taylor`
      },
      { 
        id: "23", 
        vimeoId: "1138260283/77c4b1439f", 
        title: "Nov 18, 2025 Strategy & Conversion Call Recording", 
        date: "2025-11-18",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:17] Cassandra
[00:11:22] Kasie
[00:22:32] Ruth
[00:37:39] Nadine and Jen
[00:51:51] Jasmine`
      },
      { 
        id: "22", 
        vimeoId: "1137810472/3f549f778d", 
        title: "Nov 14, 2025 Strategy & Conversion Call Recording", 
        date: "2025-11-14",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:00] Lauren
[00:30:08] Caroline
[00:42:18] Jasmine
[00:55:47] SiriChand`
      },
      { 
        id: "21", 
        vimeoId: "1136664353/721c623e33", 
        title: "Nov 11, 2025 Strategy & Conversion Call Recording", 
        date: "2025-11-11",
        duration: "60 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:02:29] Lauren
[00:23:29] Casey
[00:37:51] Jordan
[00:43:20] Feike
[00:51:47] SiriChand`
      },
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
        id: "31", 
        vimeoId: "1143893155/e09ab8cc90", 
        title: "Dec 5, 2025 Strategy & Conversion Call Recording", 
        date: "2025-12-05",
        duration: "62 min",
        description: "Strategy and conversion coaching session",
        transcript: `[00:00:21] Sherry
[00:11:26] Kim
[00:30:38] Lauren`
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
        transcript: `[00:15:11] Siri
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
[00:45:03] Cassandra`
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
        id: "43", 
        vimeoId: "1148060876/4cb0cadae2", 
        title: "Dec 18, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-12-18",
        duration: "62 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:09] Yasmin - visibility ads, messaging direction
[00:04:04] Elle - strategy call booking, messaging generator issues
[00:09:19] Lauren - scheduling coworking sessions, time zone accommodations
[00:17:43] Amanda - tripwire page review, Go High Level setup
[00:30:24] Taylor - funnel optimization, lead gen confirmation page
[00:48:48] Cassandra - tripwire copy review, launching ads`
      },
      { 
        id: "38", 
        vimeoId: "1147111789/00bcb590a0", 
        title: "Dec 11, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-12-11",
        duration: "51 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:00] Alicia
[00:13:55] Ruth
[00:28:21] Elle
[00:34:10] Jordan
[00:47:03] Sherry`
      },
      { 
        id: "30", 
        vimeoId: "1143845267/8a85f9d8af", 
        title: "Dec 4, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-12-04",
        duration: "56 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:05:35] Kim
[00:08:01] Lauren
[00:22:14] Laura
[00:36:17] Anne Marie
[00:46:00] Cassandra
[00:52:10] Sherry`
      },
      { 
        id: "25", 
        vimeoId: "1141518764/80725b8b3b", 
        title: "Nov 27, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-11-27",
        duration: "41 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:03] Sheri
[00:21:06] Caroline`
      },
      { 
        id: "24", 
        vimeoId: "1139078707/9d82e8c50b", 
        title: "Nov 20, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-11-20",
        duration: "60 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:00:22] Feike
[00:06:42] Jordan
[00:12:44] Lauren
[00:27:15] Anne Marie`
      },
      { 
        id: "22", 
        vimeoId: "1136664640/1735e0fd48", 
        title: "Nov 13, 2025 Messaging & Offer Positioning Call Recording", 
        date: "2025-11-13",
        duration: "60 min",
        description: "Messaging and offer positioning coaching session",
        transcript: `[00:01:51] SiriChand
[00:13:07] Feike
[00:17:31] Lauren
[00:33:01] Jordan
[00:38:14] Heather
[00:44:48] Jasmine`
      },
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
        id: "46", 
        vimeoId: "1150141802/729694a6b4", 
        title: "Dec 24, 2025 Ads Optimization Call Recording", 
        date: "2025-12-24",
        duration: "90 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:00] Participant - pixel setup, lead generation funnel, event tracking for speaker booking
[00:15:56] Yasmin - visibility ads setup, ads manager configuration, profile management
[00:38:32] Taylor - lead gen campaign optimization, ad testing strategy, conversion tracking`
      },
      { 
        id: "45", 
        vimeoId: "1148699098/bc573e5b43", 
        title: "Dec 19, 2025 Ads Optimization Call Recording", 
        date: "2025-12-19",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:07:22] Ashley - visibility campaigns, audience segmentation, lookalike audiences
[00:20:43] Kara - first ads setup, lead magnet campaign, ad request form
[00:38:54] Heather - lead gen campaign review, high net worth targeting`
      },
      { 
        id: "41", 
        vimeoId: "1147721751/ed99e05788", 
        title: "Dec 17, 2025 Ads Optimization Call Recording", 
        date: "2025-12-17",
        duration: "75 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:03] Sandra - Lookalike audiences, ad budgets, CPL optimization
[00:11:53] Cassie - Visibility ads, niche audience targeting
[00:28:27] Taylor - Lead gen campaign, teacher spotlight ads
[00:52:16] Heather - Audience setup, reach limitations`
      },
      { 
        id: "37", 
        vimeoId: "1146418516/ba1c7e43dc", 
        title: "Dec 12, 2025 Ads Optimization Call Recording", 
        date: "2025-12-12",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: ``
      },
      { 
        id: "35", 
        vimeoId: "1145424186/9d6c064c17", 
        title: "Dec 10, 2025 Ads Optimization Call Recording", 
        date: "2025-12-10",
        duration: "80 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:01] Cassandra
[00:08:14] Amanda
[00:34:43] Caroline`
      },
      { 
        id: "32", 
        vimeoId: "1144630856/d8815676ae", 
        title: "Dec 5, 2025 Ads Optimization Call Recording", 
        date: "2025-12-05",
        duration: "59 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:00] Heather
[00:13:09] Caroline`
      },
      { 
        id: "29", 
        vimeoId: "1143243463/da5cc40283", 
        title: "Dec 3, 2025 Ads Optimization Call Recording", 
        date: "2025-12-03",
        duration: "74 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:10:35] Lauren
[00:36:10] SiriChand
[00:54:23] Melissa`
      },
      { 
        id: "27", 
        vimeoId: "1140935730/31ef1f5589", 
        title: "Nov 26, 2025 Ads Optimization Call Recording", 
        date: "2025-11-26",
        duration: "78 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:08] Caroline
[00:08:57] Cassandra
[00:47:25] Jasmine
[00:52:13] SiriChand
[01:07:13] Taylor`
      },
      { 
        id: "26", 
        vimeoId: "1139814210/1828d12c30", 
        title: "Nov 21, 2025 Ads Optimization Call Recording", 
        date: "2025-11-21",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:05] Lauren
[00:05:48] Caroline
[00:12:26] Karli
[00:28:58] Taylor`
      },
      { 
        id: "22", 
        vimeoId: "1138661518/d941fa8af6", 
        title: "Nov 19, 2025 Ads Optimization Call Recording", 
        date: "2025-11-19",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:03] Ruth`
      },
      { 
        id: "21", 
        vimeoId: "1137815753/6d0aabc0fa", 
        title: "Nov 14, 2025 Ads Optimization Call Recording", 
        date: "2025-11-14",
        duration: "60 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:03] Steph
[00:10:43] Caroline
[00:24:19] SiriChand`
      },
      { 
        id: "20", 
        vimeoId: "1136519452/687cb0ed8f", 
        title: "Nov 12, 2025 Ads Optimization Call Recording", 
        date: "2025-11-12",
        duration: "78 min",
        description: "Expert feedback on ad performance and optimization strategies",
        transcript: `[00:00:01] Ruth
[00:23:18] Lawrence
[00:33:13] Caroline
[00:44:32] Siri`
      },
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
        id: "42", 
        vimeoId: "1147724166/f0116dd1d7", 
        title: "Dec 17, 2025 Tech Support Call Recording", 
        date: "2025-12-17",
        duration: "40 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:30] Heather - DNS records, email setup, payment links`
      },
      { 
        id: "36", 
        vimeoId: "1145424298/d7d0f7f6f7", 
        title: "Dec 10, 2025 Tech Support Call Recording", 
        date: "2025-12-10",
        duration: "61 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:18] Heather
[00:34:04] Elysha`
      },
      { 
        id: "28", 
        vimeoId: "1143239952/ab856bf64b", 
        title: "Dec 3, 2025 Tech Support Call Recording", 
        date: "2025-12-03",
        duration: "48 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:07] Melissa
[00:24:09] Heather
[00:40:50] Taylor`
      },
      { 
        id: "24", 
        vimeoId: "1140936117/0eacb88c8f", 
        title: "Nov 26, 2025 Tech Support Call Recording", 
        date: "2025-11-26",
        duration: "43 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:00] Caroline`
      },
      { 
        id: "23", 
        vimeoId: "1138960991/5a34e6bd02", 
        title: "Nov 19, 2025 Tech Support Call Recording", 
        date: "2025-11-19",
        duration: "60 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:05] Heather
[00:19:00] Ruth`
      },
      { 
        id: "21", 
        vimeoId: "1136519808/41de8ae452", 
        title: "Nov 12, 2025 Tech Support Call Recording", 
        date: "2025-11-12",
        duration: "60 min",
        description: "Tech support for funnel setup, integrations, troubleshooting, and more.",
        transcript: `[00:00:01] Heather`
      },
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
        id: "47", 
        vimeoId: "1150191291/afa51662af", 
        title: "Dec 29, 2025 Accountability Call Recording", 
        date: "2025-12-29",
        duration: "48 min",
        description: "Accountability coaching session",
        transcript: `[00:00:21] Shayna - tripwire setup, strategy questions, funnel next steps
[00:06:57] Beth - getting oriented, strategy pivot questions, visibility ads
[00:14:01] Fica - visibility ads win, email copy for lead generation
[00:18:03] Lauren - content batching, podcast relaunch, challenge prep
[00:28:18] Cassandra - domain switch, messaging for high risk pregnant women
[00:32:31] Elizabeth - strategy presentation, email sequence for quiz
[00:36:55] Kevin - messaging input forms, strategy call prep`
      },
      { 
        id: "40", 
        vimeoId: "1148809000/9cc1d874ca", 
        title: "Dec 22, 2025 Accountability Call Recording", 
        date: "2025-12-22",
        duration: "67 min",
        description: "Accountability coaching session",
        transcript: `[00:00:23] Cassandra - Discovery call follow-up and sales process
[00:10:54] Lauren - Setting boundaries with free calls
[00:46:55] SiriChand - Sold 17 seats in solstice class`
      },
      { 
        id: "39", 
        vimeoId: "1147361415/f6aafdd2f3", 
        title: "Dec 15, 2025 Accountability Call Recording", 
        date: "2025-12-15",
        duration: "55 min",
        description: "Accountability coaching session",
        transcript: `[00:00:18] Jordan
[00:07:05] Lauren`
      },
      { 
        id: "33", 
        vimeoId: "1144721574/fce7185a7e", 
        title: "Dec 8, 2025 Accountability Call Recording", 
        date: "2025-12-08",
        duration: "62 min",
        description: "Accountability coaching session",
        transcript: `[00:00:18] Steph
[00:06:11] Casey
[00:07:49] Lauren
[00:14:54] Anne-Marie
[00:24:10] Caroline
[00:26:22] SiriChand
[00:34:00] Cassandra`
      },
      { 
        id: "26", 
        vimeoId: "1142520619/ce199b20f4", 
        title: "Dec 1, 2025 Accountability Call Recording", 
        date: "2025-12-01",
        duration: "60 min",
        description: "Accountability coaching session",
        transcript: ``
      },
      { 
        id: "24", 
        vimeoId: "1140526538/32cb54b014", 
        title: "Nov 24, 2025 Accountability Call Recording", 
        date: "2025-11-24",
        duration: "60 min",
        description: "Accountability coaching session",
        transcript: `[00:00:15] Steph
[00:04:59] Caroline
[00:06:58] Anne-Marie
[00:12:06] Lauren
[00:17:43] SiriChand
[00:32:55] Kasie`
      },
      { 
        id: "22", 
        vimeoId: "1137818541/0500b07ed4", 
        title: "Nov 17, 2025 Accountability Call Recording", 
        date: "2025-11-17",
        duration: "60 min",
        description: "Accountability coaching session",
        transcript: `[00:00:56] Steph
[00:04:42] Caroline
[00:15:40] Lauren
[00:39:40] Anne-Marie
[00:44:43] SiriChand
[00:51:26] Jasmine`
      },
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
