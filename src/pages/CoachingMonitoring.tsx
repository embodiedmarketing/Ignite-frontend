import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Users, MessageSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface CoachingStats {
  total: number;
  uniqueUsers: number;
  byLevel: {
    'excellent-depth': number;
    'good-start': number;
    'needs-more-detail': number;
  };
  bySection: Record<string, number>;
  averageResponseLength: number;
  successRate: number;
}

interface CoachingEvent {
  id: number;
  userId: number;
  userEmail: string;
  timestamp: string;
  section: string;
  questionContext: string;
  userResponse: string;
  aiLevel: string;
  aiLevelDescription: string;
  aiFeedback: string;
  responseLength: number;
}

function getLevelColor(level: string) {
  switch (level) {
    case 'excellent-depth': return 'bg-green-100 text-green-800';
    case 'good-start': return 'bg-yellow-100 text-yellow-800';
    case 'needs-more-detail': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getLevelEmoji(level: string) {
  switch (level) {
    case 'excellent-depth': return '🟢';
    case 'good-start': return '🟡';
    case 'needs-more-detail': return '🔴';
    default: return '⚪';
  }
}

export default function CoachingMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery<CoachingStats>({
    queryKey: ['/api/coaching-monitoring/stats'],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds when enabled
  });

  const { data: events, refetch: refetchEvents } = useQuery<CoachingEvent[]>({
    queryKey: ['/api/coaching-monitoring/events?limit=20'],
    refetchInterval: autoRefresh ? 15000 : false, // Refresh every 15 seconds when enabled
  });

  const { data: problematic, refetch: refetchProblematic } = useQuery<CoachingEvent[]>({
    queryKey: ['/api/coaching-monitoring/problematic?limit=10'],
    refetchInterval: autoRefresh ? 20000 : false, // Refresh every 20 seconds when enabled
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchEvents();
    refetchProblematic();
  };

  useEffect(() => {
    if (autoRefresh) {
      console.log("🔄 Auto-refresh enabled - monitoring AI coaching in real-time");
    }
  }, [autoRefresh]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Coaching Monitoring</h1>
            <p className="text-gray-600 mt-1">Real-time monitoring of AI feedback quality and user interactions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>
            <Button onClick={handleRefreshAll} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events Today</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.uniqueUsers} unique users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Excellent + Good ratings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Length</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageResponseLength}</div>
                <p className="text-xs text-muted-foreground">
                  characters per response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byLevel['needs-more-detail']}</div>
                <p className="text-xs text-muted-foreground">
                  responses needing improvement
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Level Breakdown */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Response Quality Distribution</CardTitle>
              <CardDescription>Breakdown of AI feedback levels given today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    🟢 {stats.byLevel['excellent-depth']}
                  </div>
                  <div className="text-sm text-gray-600">Excellent Depth</div>
                  <div className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats.byLevel['excellent-depth'] / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    🟡 {stats.byLevel['good-start']}
                  </div>
                  <div className="text-sm text-gray-600">Good Start</div>
                  <div className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats.byLevel['good-start'] / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    🔴 {stats.byLevel['needs-more-detail']}
                  </div>
                  <div className="text-sm text-gray-600">Needs More Detail</div>
                  <div className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats.byLevel['needs-more-detail'] / stats.total) * 100) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Coaching Events</CardTitle>
              <CardDescription>Latest 20 user interactions with AI feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events?.map((event) => (
                  <div key={event.id} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{getLevelEmoji(event.aiLevel)}</span>
                        <Badge className={getLevelColor(event.aiLevel)}>
                          {event.aiLevel.replace('-', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">{event.userEmail}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(event.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{event.section}</div>
                    <div className="text-xs text-gray-500 truncate">
                      "{event.userResponse.substring(0, 80)}..."
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {event.responseLength} chars
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Problematic Responses</CardTitle>
              <CardDescription>Recent responses that got "needs more detail"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {problematic?.map((event) => (
                  <div key={event.id} className="border-l-4 border-red-200 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{event.userEmail}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(event.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{event.section}</div>
                    <div className="text-xs text-gray-700 mb-2">
                      User: "{event.userResponse.substring(0, 60)}..."
                    </div>
                    <div className="text-xs text-red-600">
                      AI: {event.aiFeedback.substring(0, 80)}...
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Activity */}
        {stats && Object.keys(stats.bySection).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Activity by Section</CardTitle>
              <CardDescription>Which sections are users working on most</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(stats.bySection)
                  .sort(([,a], [,b]) => b - a)
                  .map(([section, count]) => (
                    <div key={section} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-sm text-gray-600">{section}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
