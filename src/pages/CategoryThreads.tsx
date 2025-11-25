import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Plus,
  ArrowLeft,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertForumThreadSchema,
  type InsertForumThread,
} from "@shared/schema";
import { queryClient } from "@/services/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import { MentionTextarea } from "@/components/MentionTextarea";
import RichTextEditor, { RichTextEditorRef } from "@/components/RichTextEditor";
import { useRef } from "react";

export default function CategoryThreads() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/forum/categories", slug, "threads"],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_BASE_URL}/api/forum/categories/${slug}/threads`
      ).then((res) => res.json()),
    enabled: !!slug,
  });

  const form = useForm<InsertForumThread>({
    resolver: zodResolver(insertForumThreadSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: InsertForumThread) => {
      // Upload attachments first if any
      let uploadedAttachments: any[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadResponse = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/forum/upload-attachment`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );
          if (uploadResponse.ok) {
            const attachment = await uploadResponse.json();
            uploadedAttachments.push(attachment);
          }
        }
      }

      const dataWithAttachments = {
        ...data,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      const response = await apiRequest(
        "POST",
        `/api/forum/categories/${slug}/threads`,
        dataWithAttachments
      );
      return response.json();
    },
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/forum/categories", slug, "threads"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      setIsDialogOpen(false);
      form.reset();
      setAttachments([]);
      editorRef.current?.clear();
      toast({
        title: "Thread created",
        description: "Your thread has been posted successfully.",
      });
      navigate(`/forum/thread/${newThread.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create thread",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertForumThread) => {
    createThreadMutation.mutate(data);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Category Not Found
          </h2>
          <p className="text-slate-600 mt-2">
            The category you're looking for doesn't exist.
          </p>
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/community-forum">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forum
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 capitalize">
              {slug?.replace("-", " ")} Discussions
            </h1>
            <p className="text-slate-600 mt-2">
              Join the conversation and get support from the community
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-new-thread"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Thread
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Thread</DialogTitle>
                <DialogDescription>
                  Start a new discussion in this category. Be clear and
                  descriptive in your title.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thread Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What's your question or topic?"
                            data-testid="input-thread-title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thread Content</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            ref={editorRef}
                            value={field.value}
                            onChange={field.onChange}
                            onAttachmentsChange={setAttachments}
                            placeholder="Provide more details about your question or topic. Use the toolbar to format text, add links, or attach files..."
                            minHeight="200px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createThreadMutation.isPending}
                      data-testid="button-submit-thread"
                    >
                      {createThreadMutation.isPending
                        ? "Creating..."
                        : "Create Thread"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Threads List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Recent Threads
            </CardTitle>
            <CardDescription>
              Latest discussions in this category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 w-16 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.threads?.length > 0 ? (
              <div className="space-y-4">
                {data.threads.map((thread: any) => (
                  <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
                    <div
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`thread-${thread.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-2">
                            {thread.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {thread.authorName || "Anonymous"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(thread.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {thread.replyCount} replies
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Last activity{" "}
                              {new Date(
                                thread.lastActivityAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-slate-600">
                            {thread.replyCount} replies
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No threads yet
                </h3>
                <p className="text-slate-600 mb-4">
                  Be the first to start a discussion in this category!
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-start-discussion"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Discussion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
