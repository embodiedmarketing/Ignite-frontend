import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, ArrowLeft, Calendar, User, Reply, Trash2, CornerDownRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertForumPostSchema, type InsertForumPost } from "@shared/schema";
import { queryClient } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import { MentionTextarea } from "@/components/MentionTextarea";
import { MentionText } from "@/utils/mentionUtils";
import RichTextEditor, { RichTextEditorRef } from "@/components/RichTextEditor";
import RichContentDisplay from "@/components/RichContentDisplay";
import { useRef } from "react";

export default function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/forum/threads', id],
    queryFn: () => fetch(`/api/forum/threads/${id}`).then(res => res.json()),
    enabled: !!id
  });

  const form = useForm<InsertForumPost>({
    resolver: zodResolver(insertForumPostSchema),
    defaultValues: {
      body: ""
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertForumPost & { parentId?: number }) => {
      console.log('Submitting post data:', postData);
      
      // Upload attachments first if any
      let uploadedAttachments: any[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadResponse = await fetch('/api/forum/upload-attachment', {
            method: 'POST',
            body: formData
          });
          if (uploadResponse.ok) {
            const attachment = await uploadResponse.json();
            uploadedAttachments.push(attachment);
          }
        }
      }
      
      const dataWithAttachments = {
        ...postData,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
      };
      
      const response = await apiRequest('POST', `/api/forum/threads/${id}/posts`, dataWithAttachments);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post reply');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/threads', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/categories'] });
      form.reset();
      setReplyingToPostId(null);
      setAttachments([]);
      editorRef.current?.clear();
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully."
      });
    },
    onError: (error: any) => {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post reply. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/forum/threads/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/categories'] });
      toast({
        title: "Thread deleted",
        description: "Your thread has been deleted successfully."
      });
      navigate(`/forum/${data?.category?.slug}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete thread",
        variant: "destructive"
      });
    }
  });

  // Organize posts into a tree structure
  const organizedPosts = useMemo(() => {
    if (!data?.posts) return { topLevel: [], replies: new Map() };
    
    const topLevel: any[] = [];
    const replies = new Map<number, any[]>();
    
    data.posts.forEach((post: any) => {
      if (!post.parentId) {
        topLevel.push(post);
      } else {
        if (!replies.has(post.parentId)) {
          replies.set(post.parentId, []);
        }
        replies.get(post.parentId)!.push(post);
      }
    });
    
    return { topLevel, replies };
  }, [data?.posts]);

  const onSubmit = (postData: InsertForumPost) => {
    const payload = replyingToPostId 
      ? { body: postData.body, parentId: replyingToPostId }
      : { body: postData.body };
    createPostMutation.mutate(payload);
  };

  const handleDeleteThread = () => {
    deleteThreadMutation.mutate();
    setDeleteDialogOpen(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Thread Not Found</h2>
          <p className="text-slate-600 mt-2">The thread you're looking for doesn't exist.</p>
        </div>
        <Link href="/community-forum">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-slate-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
        
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href={`/forum/${data?.category?.slug}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {data?.category?.name}
              </Button>
            </Link>
            <Badge variant="outline">{data?.category?.name}</Badge>
          </div>
          
          {/* Delete button - only show if user owns the thread */}
          {user && data?.thread?.userId === user.id && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" data-testid="button-delete-thread">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Thread
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your thread and all its replies. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteThread}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteThreadMutation.isPending}
                  >
                    {deleteThreadMutation.isPending ? "Deleting..." : "Delete Thread"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {data?.thread?.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {data?.thread?.authorName || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(data?.thread?.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {data?.thread?.replyCount} replies
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Original Thread */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {data?.thread?.authorName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {data?.thread?.authorName || 'Anonymous'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(data?.thread?.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                Original Post
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RichContentDisplay 
              content={data?.thread?.body || ""} 
              attachments={data?.thread?.attachments}
            />
          </CardContent>
        </Card>

        {/* Replies */}
        {data?.posts?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Replies ({data.posts.length})
            </h2>
            
            {organizedPosts.topLevel.map((post: any, index: number) => (
              <div key={post.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {post.authorName?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {post.authorName || 'Anonymous'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <RichContentDisplay 
                      content={post.body || ""} 
                      attachments={post.attachments}
                    />
                    
                    {/* Reply button */}
                    {user && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setReplyingToPostId(replyingToPostId === post.id ? null : post.id)}
                          data-testid={`button-reply-to-${post.id}`}
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                      </div>
                    )}
                    
                    {/* Reply form for this specific post */}
                    {replyingToPostId === post.id && user && (
                      <Card className="bg-slate-50">
                        <CardContent className="pt-4">
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="body"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Your Reply</FormLabel>
                                    <FormControl>
                                      <RichTextEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        onAttachmentsChange={setAttachments}
                                        placeholder="Write your reply. Use the toolbar to format text, add links, or attach files..."
                                        minHeight="120px"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingToPostId(null);
                                    form.reset();
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={createPostMutation.isPending}
                                  data-testid={`button-submit-reply-to-${post.id}`}
                                >
                                  {createPostMutation.isPending ? "Posting..." : "Post Reply"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
                
                {/* Nested replies */}
                {organizedPosts.replies.has(post.id) && (
                  <div className="ml-8 mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
                    {organizedPosts.replies.get(post.id)!.map((reply: any) => (
                      <Card key={reply.id} className="bg-slate-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <CornerDownRight className="w-4 h-4 text-slate-400" />
                            <div className="w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {reply.authorName?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {reply.authorName || 'Anonymous'}
                              </p>
                              <p className="text-sm text-slate-500">
                                {new Date(reply.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <RichContentDisplay 
                            content={reply.body || ""} 
                            attachments={reply.attachments}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-blue-600" />
              Post a Reply
            </CardTitle>
            <CardDescription>
              Join the discussion and share your thoughts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Reply</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            ref={editorRef}
                            value={field.value}
                            onChange={field.onChange}
                            onAttachmentsChange={setAttachments}
                            placeholder="Share your thoughts, provide help, or ask follow-up questions. Use the toolbar to format text, add links, or attach files..."
                            minHeight="150px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createPostMutation.isPending}
                      data-testid="button-submit-reply"
                    >
                      {createPostMutation.isPending ? "Posting..." : "Post Reply"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">You must be logged in to post a reply</p>
                <Link href="/login">
                  <Button variant="default">
                    Log In to Reply
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
