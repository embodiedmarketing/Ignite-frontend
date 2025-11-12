import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface UserActivityMetric {
  userId: number;
  email: string;
  sessionDuration: number;
  questionsAttempted: number;
  aiFeedbackRequests: number;
  errorRate: number;
  lastActivity: Date;
  frustrationIndicators: string[];
}

interface SystemHealthAlert {
  type: 'ai_feedback_failure' | 'user_abandonment' | 'error_spike' | 'low_completion_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedUsers: number;
  details: any;
  timestamp: Date;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
    case 'high':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

function formatLastActivity(date: string): string {
  const now = new Date();
  const activity = new Date(date);
  const diffMs = now.getTime() - activity.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.round(diffMins / 60)}h ago`;
  return `${Math.round(diffMins / 1440)}d ago`;
}

export default function UserMonitoring() {
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/user-monitoring/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user-monitoring/metrics");
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ["/api/user-monitoring/alerts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user-monitoring/alerts");
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchAlerts();
  };

  const criticalAlerts = alerts?.filter((alert: SystemHealthAlert) => alert.severity === 'critical') || [];
  const highAlerts = alerts?.filter((alert: SystemHealthAlert) => alert.severity === 'high') || [];
  const activeUsers = metrics?.filter((m: UserActivityMetric) => {
    const lastActivity = new Date(m.lastActivity);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return lastActivity > tenMinutesAgo;
  }).length || 0;

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-navy">User Monitoring Dashboard</h1>
            <p className="text-slate-600 mt-1">Real-time monitoring of user experience and system health</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-embodied-blue">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently active (10min)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-embodied-blue">{metrics?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Current session count</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Issues to investigate</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts">System Alerts</TabsTrigger>
            <TabsTrigger value="users">User Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  System Health Alerts
                </CardTitle>
                <CardDescription>
                  Automated monitoring alerts based on user behavior patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="text-center py-8">Loading alerts...</div>
                ) : alerts?.length === 0 ? (
                  <div className="text-center py-8 text-green-600">
                    ✅ No active alerts - system running smoothly
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts?.map((alert: SystemHealthAlert, index: number) => (
                      <Alert key={index} className={`border ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <AlertDescription>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {alert.type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatLastActivity(alert.timestamp.toString())}
                                </span>
                              </div>
                              <p className="font-medium mb-1">{alert.message}</p>
                              <p className="text-sm text-gray-600">
                                Affected users: {alert.affectedUsers}
                              </p>
                              {alert.details && (
                                <details className="mt-2">
                                  <summary className="text-sm cursor-pointer text-blue-600">
                                    View details
                                  </summary>
                                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(alert.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Activity Metrics
                </CardTitle>
                <CardDescription>
                  Real-time user behavior and engagement tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="text-center py-8">Loading user metrics...</div>
                ) : metrics?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active user sessions
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metrics?.map((metric: UserActivityMetric) => (
                      <div key={metric.userId} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">{metric.email}</div>
                            <Badge variant="outline">ID: {metric.userId}</Badge>
                            {metric.frustrationIndicators.length > 0 && (
                              <Badge variant="destructive">
                                {metric.frustrationIndicators.length} issues
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {formatLastActivity(metric.lastActivity.toString())}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Session:</span>
                            <div className="font-medium">{formatDuration(metric.sessionDuration)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Questions:</span>
                            <div className="font-medium">{metric.questionsAttempted}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">AI Requests:</span>
                            <div className="font-medium">{metric.aiFeedbackRequests}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Error Rate:</span>
                            <div className={`font-medium ${metric.errorRate > 20 ? 'text-red-600' : metric.errorRate > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {metric.errorRate}%
                            </div>
                          </div>
                        </div>

                        {metric.frustrationIndicators.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                            <p className="text-sm font-medium text-red-800 mb-1">Frustration Indicators:</p>
                            <div className="flex flex-wrap gap-1">
                              {metric.frustrationIndicators.map((indicator, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {indicator.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
