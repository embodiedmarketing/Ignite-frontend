import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, type LucideIcon } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WorkshopVideo {
  id: string;
  title: string;
  vimeoId: string;
  order?: number;
  stepNumber?: number;
}

interface WorkshopVideoFormData {
  title: string;
  vimeoId: string;
}

type ThemeColor = "purple" | "blue";

interface BusinessIncubatorVideoSeriesProps {
  apiPath: string;
  title: string;
  description: string;
  themeColor: ThemeColor;
  icon: LucideIcon;
  stepNumberBase: number;
}

const themeStyles: Record<ThemeColor, {
  badge: string;
  iconBg: string;
  iconText: string;
  activeBorder: string;
  activeBg: string;
  activeBadge: string;
  addButton: string;
  hoverEdit: string;
}> = {
  purple: {
    badge: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
    activeBorder: "border-purple-500",
    activeBg: "bg-purple-50",
    activeBadge: "text-purple-600 border-purple-600",
    addButton: "bg-purple-600 hover:bg-purple-700",
    hoverEdit: "hover:text-purple-600",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    activeBadge: "text-blue-600 border-blue-600",
    addButton: "bg-blue-600 hover:bg-blue-700",
    hoverEdit: "hover:text-blue-600",
  },
};

export default function BusinessIncubatorVideoSeries({
  apiPath,
  title,
  description,
  themeColor,
  icon: Icon,
  stepNumberBase,
}: BusinessIncubatorVideoSeriesProps) {
  const styles = themeStyles[themeColor];
  const queryKey = [apiPath];
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<WorkshopVideo | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<WorkshopVideo | null>(null);
  const [formData, setFormData] = useState<WorkshopVideoFormData>({ title: "", vimeoId: "" });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof WorkshopVideoFormData, string>>>({});

  const { data: videos = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiRequest("GET", apiPath);
      const data = await response.json();
      return Array.isArray(data)
        ? data.sort((a: WorkshopVideo, b: WorkshopVideo) => (a.order ?? 0) - (b.order ?? 0))
        : [];
    },
  });

  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex >= videos.length) {
      setCurrentVideoIndex(videos.length - 1);
    }
  }, [videos.length, currentVideoIndex]);

  const createVideoMutation = useMutation({
    mutationFn: async (data: WorkshopVideoFormData & { order: number; stepNumber: number }) => {
      const response = await apiRequest("POST", apiPath, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      handleCloseVideoModal();
      toast({ title: "Video added", description: "The workshop video has been added successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add video", description: err.message, variant: "destructive" });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkshopVideoFormData }) => {
      const response = await apiRequest("PUT", `${apiPath}/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      handleCloseVideoModal();
      toast({ title: "Video updated", description: "The workshop video has been updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update video", description: err.message, variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `${apiPath}/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsDeleteModalOpen(false);
      setVideoToDelete(null);
      toast({ title: "Video deleted", description: "The workshop video has been removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete video", description: err.message, variant: "destructive" });
    },
  });

  const navigateVideo = (direction: "prev" | "next") => {
    if (videos.length === 0) return;
    let newIndex;
    if (direction === "prev") {
      newIndex = currentVideoIndex > 0 ? currentVideoIndex - 1 : videos.length - 1;
    } else {
      newIndex = currentVideoIndex < videos.length - 1 ? currentVideoIndex + 1 : 0;
    }
    setCurrentVideoIndex(newIndex);
  };

  const handleOpenVideoModal = (video?: WorkshopVideo) => {
    setFormErrors({});
    if (video) {
      setEditingVideo(video);
      setFormData({ title: video.title, vimeoId: video.vimeoId });
    } else {
      setEditingVideo(null);
      setFormData({ title: "", vimeoId: "" });
    }
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setEditingVideo(null);
    setFormData({ title: "", vimeoId: "" });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof WorkshopVideoFormData, string>> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    if (!formData.vimeoId.trim()) {
      errors.vimeoId = "Vimeo ID is required";
    } else {
      const vimeoPattern = /^\d+\/[a-zA-Z0-9]+$/;
      if (!vimeoPattern.test(formData.vimeoId.trim())) {
        errors.vimeoId = "Invalid Vimeo ID format. Use format: 1234567890/abcdef1234";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVideoSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (editingVideo) {
      updateVideoMutation.mutate({ id: editingVideo.id, data: formData });
    } else {
      createVideoMutation.mutate({
        ...formData,
        order: videos.length,
        stepNumber: stepNumberBase + videos.length,
      });
    }
  };

  const handleDeleteClick = (video: WorkshopVideo) => {
    setVideoToDelete(video);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (videoToDelete) {
      deleteVideoMutation.mutate(videoToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setVideoToDelete(null);
  };

  const handleFieldChange = (field: keyof WorkshopVideoFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  const currentVideo = videos[currentVideoIndex];
  const isSaving = createVideoMutation.isPending || updateVideoMutation.isPending;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/resources/bonus-trainings">
                <Button variant="outline" size="sm">
                  ← Back to Trainings
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-600 mt-2">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {user?.isAdmin && (
              <Button
                onClick={() => handleOpenVideoModal()}
                className={`${styles.addButton} text-white`}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            )}
            <Badge className={styles.badge}>
              {videos.length} Videos
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${styles.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${styles.iconText}`} />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-48" />
                  ) : currentVideo ? (
                    <>
                      <CardTitle>{currentVideo.title}</CardTitle>
                      <CardDescription>
                        Workshop recording from Emily Hirsh's Business Incubator series
                      </CardDescription>
                    </>
                  ) : (
                    <>
                      <CardTitle>No video selected</CardTitle>
                      <CardDescription>
                        {user?.isAdmin ? 'Use "Add Video" above to get started.' : 'No workshop videos available yet.'}
                      </CardDescription>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user?.isAdmin && currentVideo && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenVideoModal(currentVideo)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(currentVideo)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateVideo("prev")}
                  disabled={videos.length <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-slate-500">
                  {videos.length > 0 ? `${currentVideoIndex + 1} of ${videos.length}` : "0 of 0"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateVideo("next")}
                  disabled={videos.length <= 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full aspect-video rounded-lg" />
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p className="font-medium">Error loading videos</p>
                <p className="text-sm mt-1">{error instanceof Error ? error.message : "Unknown error occurred"}</p>
              </div>
            ) : currentVideo ? (
              <VimeoEmbed
                vimeoId={currentVideo.vimeoId}
                title={currentVideo.title}
                userId={user?.id ?? 0}
                stepNumber={currentVideo.stepNumber ?? stepNumberBase + currentVideoIndex}
              />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>No workshop videos available.</p>
                {user?.isAdmin && (
                  <p className="text-sm mt-2">Use the "Add Video" button above to add one.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Workshop Videos</CardTitle>
            <CardDescription>
              Click on any video to watch it above
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-red-600 py-4">Failed to load video list.</p>
            ) : videos.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No workshop videos found.
                {user?.isAdmin && ' Use "Add Video" above to create one.'}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {videos.map((video: WorkshopVideo, index: number) => (
                  <div
                    key={video.id}
                    className={`border rounded-lg p-4 transition-all relative group ${
                      index === currentVideoIndex
                        ? `${styles.activeBorder} ${styles.activeBg}`
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setCurrentVideoIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{video.title}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Workshop {index + 1} of {videos.length}
                          </p>
                        </div>
                        {index === currentVideoIndex && (
                          <Badge variant="outline" className={styles.activeBadge}>
                            Now Playing
                          </Badge>
                        )}
                      </div>
                    </div>
                    {user?.isAdmin && (
                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVideoModal(video);
                          }}
                          className={`h-7 w-7 p-0 text-slate-600 ${styles.hoverEdit} bg-white/90 hover:bg-white`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(video);
                          }}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-red-600 bg-white/90 hover:bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Workshop Video" : "Add Workshop Video"}</DialogTitle>
            <DialogDescription>
              {editingVideo
                ? "Update the video details below."
                : "Add a new workshop video to this series."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="videoTitle" className="text-sm font-medium text-slate-900">
                Title *
              </label>
              <Input
                id="videoTitle"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="e.g., Week 1: Your Foundation"
                className={formErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="videoVimeoId" className="text-sm font-medium text-slate-900">
                Vimeo ID *
              </label>
              <Input
                id="videoVimeoId"
                value={formData.vimeoId}
                onChange={(e) => handleFieldChange("vimeoId", e.target.value)}
                placeholder="e.g., 1121271914/cfc6fad702"
                className={formErrors.vimeoId ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {formErrors.vimeoId && (
                <p className="text-xs text-red-600 mt-1">{formErrors.vimeoId}</p>
              )}
              <p className="text-xs text-slate-500">
                Format: videoId/hash (e.g., 1121271914/cfc6fad702)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseVideoModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleVideoSubmit}
              disabled={isSaving}
              className={`${styles.addButton} text-white`}
            >
              {isSaving ? "Saving..." : editingVideo ? "Update Video" : "Add Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Workshop Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={deleteVideoMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteVideoMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteVideoMutation.isPending ? "Deleting..." : "Delete Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
