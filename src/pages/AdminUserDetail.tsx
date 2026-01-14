import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Calendar, FileText, MessageSquare, CheckCircle2, Clock, BarChart3, FileCheck, Video, Rocket, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserActivityOverview from "@/shared/components/UserActivityOverview";
import { IgniteDocButton, MessagingStrategyButton, OfferOutlineButton, SalesPageButton } from "./AdminDashboard";

export default function AdminUserDetail() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [resetType, setResetType] = useState<string>("all");
  const [showResetDialog, setShowResetDialog] = useState(false);

  const { data: userData, isLoading } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<any>({
    queryKey: [`/api/admin/users/${userId}/progress`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users/${userId}/progress`);
      return response.json();
    },
    enabled: !!userId,
  });

  const resetProgressMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reset-progress`, { resetType: type });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Progress Reset",
        description: "User progress has been reset successfully.",
      });
      setShowResetDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/progress`] });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset user progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!userData || !userData.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-600">User not found</p>
        </div>
      </div>
    );
  }

  const { user, logins = [], documents = [], createdThreads = [], posts = [], completedSections = [] } = userData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" data-testid="button-reset-progress">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Progress
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Reset User Progress
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete the selected user data. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Select what to reset:</label>
                <Select value={resetType} onValueChange={setResetType}>
                  <SelectTrigger data-testid="select-reset-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Progress</SelectItem>
                    <SelectItem value="workbook">Workbook Responses Only</SelectItem>
                    <SelectItem value="completions">Section Completions Only</SelectItem>
                    <SelectItem value="strategies">Messaging Strategies Only</SelectItem>
                    <SelectItem value="offers">Offer Outlines Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: This will permanently delete the selected data for this user.
                </AlertDescription>
              </Alert>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetDialog(false)} data-testid="button-cancel-reset">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => resetProgressMutation.mutate(resetType)}
                  disabled={resetProgressMutation.isPending}
                  data-testid="button-confirm-reset"
                >
                  {resetProgressMutation.isPending ? "Resetting..." : "Confirm Reset"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {user.firstName} {user.lastName}
            </CardTitle>
            <p className="text-slate-600">{user.email}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <p className="font-medium capitalize">{user.subscriptionStatus}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Joined</p>
                <p className="font-medium">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Last Login</p>
                <p className="font-medium">
                  {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy') : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Logins</p>
                <p className="font-medium">{logins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-5" data-testid="tabs-user-detail">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools">Tools Used</TabsTrigger>
            <TabsTrigger value="workbook" data-testid="tab-workbook">Workbook</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="logins" data-testid="tab-logins">Logins</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{logins.length}</p>
                      <p className="text-sm text-slate-600">Total Logins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{documents.length}</p>
                      <p className="text-sm text-slate-600">Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{createdThreads.length + posts.length}</p>
                      <p className="text-sm text-slate-600">Forum Activity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedSections.length}</p>
                      <p className="text-sm text-slate-600">Sections Done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-600" />
                  Completed Sections ({completedSections.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedSections.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No sections completed yet</p>
                ) : (
                  <div className="space-y-2">
                    {completedSections.map((section: any) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        data-testid={`section-${section.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{section.sectionTitle}</p>
                          <p className="text-sm text-slate-600">
                            Step {section.stepNumber} • Offer #{section.offerNumber}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {format(new Date(section.completedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No documents created yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        data-testid={`document-${doc.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{doc.title}</p>
                          <p className="text-sm text-slate-600 capitalize">{doc.docType.replace(/_/g, ' ')}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {progressLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ) : progressData?.userStats && [progressData?.userStats]?.length > 0 ? (
              <UserActivityOverview
                userStats={[progressData?.userStats]}
                MessagingStrategyButton={MessagingStrategyButton}
                OfferOutlineButton={OfferOutlineButton}
                SalesPageButton={SalesPageButton}
                IgniteDocButton={IgniteDocButton}
              />
            ) : null}
          </TabsContent>

          {/* Tools Used Tab */}
          <TabsContent value="tools" className="space-y-6 mt-6">
            {progressLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
              </div>
            ) : progressData ? (
              <>
                {/* Messaging Strategies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      Messaging Strategies ({progressData.strategies?.length || 0})
                    </CardTitle>
                    <CardDescription>AI-generated strategic messaging documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!progressData.strategies || progressData.strategies.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No messaging strategies created</p>
                    ) : (
                      <div className="space-y-3">
                        {progressData.strategies.map((strategy: any) => (
                          <div key={strategy.id} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-slate-900">{strategy.title || 'Messaging Strategy'}</p>
                                <p className="text-xs text-slate-500">Version {strategy.version} • {format(new Date(strategy.createdAt), 'MMM d, yyyy')}</p>
                              </div>
                              <Badge className={strategy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {strategy.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-3">{strategy.content?.substring(0, 200)}...</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                              <span>Completion: {strategy.completionPercentage}%</span>
                              <span>•</span>
                              <span>{strategy.content?.length || 0} characters</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Offer Outlines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-purple-600" />
                      Offer Outlines ({progressData.offers?.length || 0})
                    </CardTitle>
                    <CardDescription>Generated offer structures and frameworks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!progressData.offers || progressData.offers.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No offer outlines created</p>
                    ) : (
                      <div className="space-y-3">
                        {progressData.offers.map((offer: any) => (
                          <div key={offer.id} className="p-4 bg-slate-50 rounded-lg">
                            <p className="font-medium text-slate-900 capitalize">{offer.offerType?.replace(/_/g, ' ')} Offer</p>
                            <p className="text-xs text-slate-500 mt-1">{format(new Date(offer.createdAt), 'MMM d, yyyy h:mm a')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Content Strategies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Content Strategies ({progressData.contentStrategies?.length || 0})
                    </CardTitle>
                    <CardDescription>Generated content plans and strategies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!progressData.contentStrategies || progressData.contentStrategies.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No content strategies created</p>
                    ) : (
                      <div className="space-y-3">
                        {progressData.contentStrategies.map((strategy: any) => (
                          <div key={strategy.id} className="p-4 bg-slate-50 rounded-lg">
                            <p className="font-medium text-slate-900">Content Strategy</p>
                            <p className="text-xs text-slate-500 mt-1">{format(new Date(strategy.createdAt), 'MMM d, yyyy h:mm a')}</p>
                            {strategy.strategy && (
                              <p className="text-sm text-slate-600 line-clamp-2 mt-2">{strategy.strategy.substring(0, 150)}...</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Live Launches */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-orange-600" />
                      Live Launches ({progressData.liveLaunches?.length || 0})
                    </CardTitle>
                    <CardDescription>Tracked live launch campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!progressData.liveLaunches || progressData.liveLaunches.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No live launches tracked</p>
                    ) : (
                      <div className="space-y-3">
                        {progressData.liveLaunches.map((launch: any) => (
                          <div key={launch.id} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{launch.campaignName}</p>
                                {launch.startDate && launch.endDate && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {format(new Date(launch.startDate), 'MMM d, yyyy')} - {format(new Date(launch.endDate), 'MMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                              <Badge>{launch.status}</Badge>
                            </div>
                            {launch.totalBudget && (
                              <p className="text-sm text-slate-600 mt-2">Budget: ${launch.totalBudget}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Video Scripts */}
                {progressData.videoScripts && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-red-600" />
                        Video Script Generator
                      </CardTitle>
                      <CardDescription>Video script generation tool usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Input Method</p>
                            <p className="font-medium capitalize">{progressData.videoScripts.inputMethod || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Last Updated</p>
                            <p className="font-medium">
                              {progressData.videoScripts.updatedAt 
                                ? format(new Date(progressData.videoScripts.updatedAt), 'MMM d, yyyy')
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <p className="text-slate-500 text-center py-8">No progress data available</p>
            )}
          </TabsContent>

          {/* Workbook Tab */}
          <TabsContent value="workbook" className="space-y-6 mt-6">
            {progressLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Workbook Responses</CardTitle>
                  <CardDescription>User's answers and inputs throughout the program</CardDescription>
                </CardHeader>
                <CardContent>
                  {!progressData?.workbookProgress || progressData.workbookProgress.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No workbook responses yet</p>
                  ) : (
                    <div className="space-y-4">
                      {progressData.workbookProgress.map((response: any, idx: number) => (
                        <div key={`${response.stepNumber}-${response.questionKey}-${idx}`} className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">Step {response.stepNumber}</p>
                              <p className="text-xs text-slate-500">{response.questionKey}</p>
                            </div>
                            <Badge variant="outline">
                              {response.updatedAt && format(new Date(response.updatedAt), 'MMM d, yyyy')}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {response.responseText || '(No response)'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Created Threads ({createdThreads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {createdThreads.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No threads created yet</p>
                  ) : (
                    <div className="space-y-2">
                      {createdThreads.map((thread: any) => (
                        <div
                          key={thread.id}
                          className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          data-testid={`thread-${thread.id}`}
                        >
                          <p className="font-medium text-slate-900 mb-1">{thread.title}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-600">
                            <span>{thread.replyCount} replies</span>
                            <span>•</span>
                            <span>{format(new Date(thread.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Posts & Comments ({posts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {posts.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No posts yet</p>
                  ) : (
                    <div className="space-y-2">
                      {posts.map((post: any) => (
                        <div
                          key={post.id}
                          className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          data-testid={`post-${post.id}`}
                        >
                          <p className="text-sm text-slate-600 mb-1">On: {post.threadTitle}</p>
                          <p className="text-sm text-slate-900 line-clamp-2">{post.body}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logins Tab */}
          <TabsContent value="logins" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Login History ({logins.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logins.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No login history</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {logins.map((login: any) => (
                      <div
                        key={login.id}
                        className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded"
                        data-testid={`login-${login.id}`}
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-700">
                          {format(new Date(login.loginAt), 'MMM d, yyyy h:mm:ss a')}
                        </p>
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
