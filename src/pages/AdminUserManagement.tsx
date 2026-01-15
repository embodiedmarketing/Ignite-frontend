import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Search, LogOut, Eye, BarChart3, Clock, Activity, XCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  subscriptionStatus: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  completedSections: number;
}

interface UserLogin {
  id: number;
  userId: number;
  loginAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userEmail?: string;
  userFirstName?: string | null;
  userLastName?: string | null;
}

interface UsageStats {
  overall: {
    totalUsers: number;
    activeUsers: number;
    totalCompletions: number;
    totalResponses: number;
    totalStrategies: number;
    totalOfferOutlines: number;
    totalLogins: number;
    loginsLast7Days: number;
    loginsLast30Days: number;
  };
  userStats: Array<{
    userId: number;
    userEmail: string;
    firstName: string | null;
    lastName: string | null;
    completedSections: number;
    totalResponses: number;
    hasMessagingStrategy: boolean;
    hasOfferOutline: boolean;
    loginCount: number;
    lastLogin: string | null;
  }>;
}

export default function AdminUserManagement() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  // Access control - redirect if not admin
  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="w-5 h-5 mr-2" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to access the admin portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: loginHistory, isLoading: isLoadingLogins } = useQuery<UserLogin[]>({
    queryKey: ['/api/admin/analytics/logins'],
  });

  const { data: usageStats, isLoading: isLoadingUsage } = useQuery<UsageStats>({
    queryKey: ['/api/admin/analytics/usage'],
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { 
      method: "POST",
      credentials: 'include'
    });
    setLocation("/admin/login");
  };

  const filteredUsers = users?.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(search) ||
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.businessName?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Admin Portal</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">User Management Dashboard</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" data-testid="button-admin-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {users?.filter(u => u.subscriptionStatus === 'active').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {users?.length ? Math.round(users.reduce((acc, u) => acc + u.completedSections, 0) / users.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Users and Analytics */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      All Users
                    </CardTitle>
                    <CardDescription>View and manage platform users</CardDescription>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading users...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers && filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-slate-500">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600 dark:text-slate-300">
                                  {user.businessName || "-"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                  {user.subscriptionStatus || 'inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600 dark:text-slate-300">
                                  {user.completedSections} sections
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-500">
                                  {formatDate(user.lastLoginAt)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-500">
                                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setLocation(`/admin/users/${user.id}`)}
                                  data-testid={`button-view-user-${user.id}`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                              {searchQuery ? "No users found matching your search" : "No users found"}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Total Logins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {usageStats?.overall.totalLogins || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last 7 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {usageStats?.overall.loginsLast7Days || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last 30 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {usageStats?.overall.loginsLast30Days || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Completions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {usageStats?.overall.totalCompletions || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Login History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Login History
                </CardTitle>
                <CardDescription>Last 100 user logins across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogins ? (
                  <div className="text-center py-8 text-slate-500">Loading login history...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Login Time</TableHead>
                          <TableHead>IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loginHistory && loginHistory.length > 0 ? (
                          loginHistory.map((login) => (
                            <TableRow key={login.id} data-testid={`row-login-${login.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {login.userFirstName} {login.userLastName}
                                  </div>
                                  <div className="text-sm text-slate-500">{login.userEmail}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {formatDate(login.loginAt)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-500 font-mono">
                                  {login.ipAddress || "N/A"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                              No login history found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  User Activity & Completion Stats
                </CardTitle>
                <CardDescription>Detailed usage breakdown per user</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsage ? (
                  <div className="text-center py-8 text-slate-500">Loading usage statistics...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Logins</TableHead>
                          <TableHead>Sections</TableHead>
                          <TableHead>Responses</TableHead>
                          <TableHead>Strategy</TableHead>
                          <TableHead>Outline</TableHead>
                          <TableHead>Last Login</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageStats && usageStats.userStats.length > 0 ? (
                          usageStats.userStats.map((stat) => (
                            <TableRow key={stat.userId} data-testid={`row-user-stat-${stat.userId}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {stat.firstName} {stat.lastName}
                                  </div>
                                  <div className="text-sm text-slate-500">{stat.userEmail}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600 dark:text-slate-300">
                                  {stat.loginCount}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600 dark:text-slate-300">
                                  {stat.completedSections}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600 dark:text-slate-300">
                                  {stat.totalResponses}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={stat.hasMessagingStrategy ? 'default' : 'secondary'}>
                                  {stat.hasMessagingStrategy ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={stat.hasOfferOutline ? 'default' : 'secondary'}>
                                  {stat.hasOfferOutline ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-500">
                                  {formatDate(stat.lastLogin)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                              No usage statistics found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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
