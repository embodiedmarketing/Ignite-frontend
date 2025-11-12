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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  ArrowLeft,
  Calendar,
  User,
  Reply,
  Users,
  Heart,
  Sparkles,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertForumPostSchema, type InsertForumPost } from "@shared/schema";
import { queryClient } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function WelcomeThread() {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<InsertForumPost>({
    resolver: zodResolver(insertForumPostSchema),
    defaultValues: {
      body: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertForumPost) => {
      // This would normally post to a specific thread, but we'll handle this specially
      const response = await apiRequest(
        "POST",
        "/api/forum/welcome/posts",
        postData
      );
      return response.json();
    },
    onSuccess: () => {
      form.reset();
      toast({
        title: "Introduction posted",
        description:
          "Welcome to the IGNITE community! Your introduction has been shared.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post introduction",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (postData: InsertForumPost) => {
    createPostMutation.mutate(postData);
  };

  // Sample welcome thread data
  const welcomeThread = {
    title: "🎉 Welcome New Members! Introduce Yourself Here",
    body: "Welcome to the IGNITE community! This is the place for new members to introduce themselves. Share your name, business, and your #1 superpower! We're excited to have you here and can't wait to support you on your journey.",
    authorName: "IGNITE Team",
    createdAt: "2025-09-26T00:00:00Z",
    replyCount: 8,
  };

  // Sample introduction posts
  const samplePosts = [
    {
      id: 1,
      authorName: "Sarah M.",
      body: "Hi everyone! I'm Sarah and I run a wellness coaching business helping busy moms find balance. My #1 superpower is helping people see the possibilities when they feel stuck. So excited to be here!",
      createdAt: "2025-09-26T10:30:00Z",
    },
    {
      id: 2,
      authorName: "Mike R.",
      body: "Hey IGNITE community! I'm Mike, owner of a digital marketing agency for local businesses. My superpower is turning complex marketing strategies into simple, actionable steps. Looking forward to connecting with everyone!",
      createdAt: "2025-09-26T14:15:00Z",
    },
    {
      id: 3,
      authorName: "Lisa K.",
      body: "Hello! I'm Lisa and I help entrepreneurs build profitable online courses. My #1 superpower is simplifying complicated topics so anyone can understand and implement them. Can't wait to learn from all of you!",
      createdAt: "2025-09-26T16:45:00Z",
    },
    {
      id: 4,
      authorName: "David C.",
      body: "Hi team! I'm David, running a consulting business for small manufacturing companies. My superpower is spotting inefficiencies and turning them into profit opportunities. Excited to be part of this community!",
      createdAt: "2025-09-26T18:20:00Z",
    },
  ];
  console.log("user", user);
  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/community-forum">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <Badge
            variant="outline"
            className="text-emerald-600 border-emerald-600"
          >
            Welcome Thread
          </Badge>
        </div>
      </div>

      {/* Thread header */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            {welcomeThread.title}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {welcomeThread.authorName}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(welcomeThread.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {welcomeThread.replyCount} introductions
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed">{welcomeThread.body}</p>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Introductions */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Community Introductions
        </h3>

        {samplePosts.map((post, index) => (
          <Card key={post.id} className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {post.authorName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-slate-900">
                      {post.authorName}
                    </h4>
                    <span className="text-sm text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()} at{" "}
                      {new Date(post.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{post.body}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* Reply form */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Reply className="w-5 h-5 text-emerald-600" />
            Introduce Yourself
          </CardTitle>
          <CardDescription>
            Share your name, business, and your #1 superpower with the
            community!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Introduction</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hi everyone! I'm [your name] and I run [your business]. My #1 superpower is..."
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-introduction"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createPostMutation.isPending}
                data-testid="button-post-introduction"
              >
                {createPostMutation.isPending
                  ? "Posting..."
                  : "Post Introduction"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
