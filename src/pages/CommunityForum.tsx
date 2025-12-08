import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Users, TrendingUp, Clock, Plus, ArrowRight, Target, Megaphone, Settings, Heart, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function CommunityForum() {
  const [, navigate] = useLocation();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/forum/categories'],
    queryFn: () => fetch(`${import.meta.env.VITE_BASE_URL}/api/forum/categories`, {
      credentials: 'include'
    }).then(res => res.json())
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['/api/forum/recent-activity'],
    queryFn: () => fetch(`${import.meta.env.VITE_BASE_URL}/api/forum/recent-activity?limit=5`, {
      credentials: 'include'
    }).then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: accountabilityThread } = useQuery({
    queryKey: ['/api/accountability/active-thread'],
    queryFn: () => fetch(`${import.meta.env.VITE_BASE_URL}/api/accountability/active-thread`, {
      credentials: 'include'
    }).then(res => res.json()),
  });

  const handleCategorySelect = (categorySlug: string) => {
    setIsCategoryDialogOpen(false);
    navigate(`/forum/${categorySlug}`);
  };

  const getCategoryIcon = (slug: string) => {
    switch(slug) {
      case 'general': return Target;
      case 'ads': return Megaphone;
      case 'tech': return Settings;
      case 'celebrating': return Heart;
      default: return MessageSquare;
    }
  };

  const getCategoryColor = (slug: string) => {
    switch(slug) {
      case 'general': return 'blue';
      case 'ads': return 'purple';
      case 'tech': return 'green';
      case 'celebrating': return 'orange';
      default: return 'slate';
    }
  };

  const getAvatarColorClass = (slug: string) => {
    switch(slug) {
      case 'general': return 'bg-blue-500';
      case 'ads': return 'bg-purple-500';
      case 'tech': return 'bg-green-500';
      case 'celebrating': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  const getBadgeColorClass = (slug: string) => {
    switch(slug) {
      case 'general': return 'text-blue-600 border-blue-600';
      case 'ads': return 'text-purple-600 border-purple-600';
      case 'tech': return 'text-green-600 border-green-600';
      case 'celebrating': return 'text-orange-600 border-orange-600';
      default: return 'text-slate-600 border-slate-600';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Community Forum</h1>
            <p className="text-slate-600 mt-2">Connect with others in the IGNITE community and gets your questions answered in between support calls.</p>
          </div>
          
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-new-thread">
                <Plus className="w-4 h-4 mr-2" />
                New Thread
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Select a Category</DialogTitle>
                <DialogDescription>
                  Choose which category you'd like to post in. You'll be able to create your thread on the next page.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 mt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  categories?.map((category: any) => {
                    const Icon = getCategoryIcon(category.slug);
                    const colorClass = getAvatarColorClass(category.slug);
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.slug)}
                        className="w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                        data-testid={`category-option-${category.slug}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{category.name}</h3>
                            <p className="text-sm text-slate-600 mt-0.5">{category.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* New Member Introductions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">New Member Introductions</h2>
          <Link href="/forum/welcome">
            <Card className="border-emerald-200 bg-emerald-50 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Welcome New Members!</h3>
                      <p className="text-slate-600 text-sm mt-1">
                        New to IGNITE? Introduce yourself here! Share your name, business, and your #1 superpower!
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>Pinned thread for introductions</span>
                        <span>•</span>
                        <span>Click to view and add your introduction</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      data-testid="button-introduce-yourself"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Introduce Yourself
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Let's Celebrate Your WINS! */}
        {!isLoading && categories?.find((cat: any) => cat.slug === 'celebrating') && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Let's Celebrate Your WINS!</h2>
            {(() => {
              const celebratingCategory = categories.find((cat: any) => cat.slug === 'celebrating');
              return (
                <Link href={`/forum/${celebratingCategory.slug}`}>
                  <Card className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer" data-testid="category-celebrating">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{celebratingCategory.name}</h3>
                            <p className="text-slate-600 text-sm mt-1">
                              {celebratingCategory.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              <span>{celebratingCategory.threadCount || 0} threads</span>
                              {celebratingCategory.lastActivityAt && (
                                <>
                                  <span>•</span>
                                  <span>Last post {new Date(celebratingCategory.lastActivityAt).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            data-testid="button-celebrate-win"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Share a Win
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })()}
          </div>
        )}

        {/* Forum Categories */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Support Threads</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            categories
              ?.filter((category: any) => category.slug !== 'celebrating' && category.slug !== 'welcome')
              .map((category: any) => {
                const IconComponent = getCategoryIcon(category.slug);
                const color = getCategoryColor(category.slug);
                return (
                  <Link key={category.id} href={`/forum/${category.slug}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`category-${category.slug}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                              <IconComponent className={`w-6 h-6 text-${color}-600`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                              <p className="text-slate-600 text-sm mt-1">
                                {category.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <span>{category.threadCount || 0} threads</span>
                                {category.lastActivityAt && (
                                  <>
                                    <span>•</span>
                                    <span>Last post {new Date(category.lastActivityAt).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
          )}
        </div>

        {/* This Week's Accountability Thread */}
        {accountabilityThread?.threadDetails?.thread && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">This Week's Accountability Thread</h2>
            <Link href={`/forum/thread/${accountabilityThread.threadDetails.thread.id}`}>
              <Card className="border-embodied-orange/30 bg-embodied-orange/5 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-embodied-orange/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-embodied-orange" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{accountabilityThread.threadDetails.thread.title}</h3>
                        <p className="text-slate-600 text-sm mt-1">
                          Share your progress and stay accountable to your goals with yourself and your coaches.
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span>{accountabilityThread.threadDetails.thread.replyCount || 0} updates</span>
                          <span>•</span>
                          <span>Active this week</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="bg-embodied-orange hover:bg-embodied-coral text-white"
                        data-testid="button-join-accountability"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Share Your Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest discussions from the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity: any) => {
                  const isThread = activity.type === 'thread';
                  const avatarColorClass = getAvatarColorClass(activity.categorySlug);
                  const badgeColorClass = getBadgeColorClass(activity.categorySlug);
                  const targetUrl = isThread 
                    ? `/forum/thread/${activity.id}`
                    : `/forum/thread/${activity.threadId}`;
                  
                  return (
                    <Link key={`${activity.type}-${activity.id}`} href={targetUrl}>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${avatarColorClass} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                            {activity.userInitials}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {activity.userName} {isThread ? 'started a new thread' : 'replied to a thread'}
                            </p>
                            <p className="text-sm text-slate-600">"{activity.title}"</p>
                            <p className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })} in {activity.categoryName}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={badgeColorClass}>
                          {activity.categoryName}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No recent activity yet. Be the first to start a discussion!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
