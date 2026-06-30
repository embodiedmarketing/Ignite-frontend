import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Play,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  BonusTrainingCategory,
  BonusTrainingCategoryFormData,
  BonusTrainingSeries,
  BonusTrainingSeriesFormData,
  BonusTrainingThemeColor,
  BonusTrainingVideoFormData,
} from "@/types/bonusTrainings";

interface VideoFieldEntry extends BonusTrainingVideoFormData {
  key: string;
}

const createEmptyVideoField = (): VideoFieldEntry => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  vimeoId: "",
});

const VIMEO_ID_PATTERN = /^\d+\/[a-zA-Z0-9]+$/;

const CATEGORIES_QUERY_KEY = ["/api/bonus-trainings"];

const seriesThemeStyles: Record<
  BonusTrainingThemeColor,
  { iconBg: string; iconText: string; button: string; badge: string }
> = {
  purple: {
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
    button: "bg-purple-600 hover:bg-purple-700",
    badge: "text-purple-600 border-purple-600",
  },
  blue: {
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
    badge: "text-blue-600 border-blue-600",
  },
  green: {
    iconBg: "bg-green-100",
    iconText: "text-green-600",
    button: "bg-green-600 hover:bg-green-700",
    badge: "text-green-600 border-green-600",
  },
  orange: {
    iconBg: "bg-orange-100",
    iconText: "text-orange-600",
    button: "bg-orange-600 hover:bg-orange-700",
    badge: "text-orange-600 border-orange-600",
  },
};

const defaultCategoryForm: BonusTrainingCategoryFormData = {
  title: "",
  description: "",
};

const defaultSeriesForm: BonusTrainingSeriesFormData = {
  title: "",
  description: "",
  themeColor: "purple",
};

const DEFAULT_SECTION: BonusTrainingCategoryFormData = {
  title: "Business Incubator Training",
  description: "Exclusive workshop series hosted live with Emily Hirsh",
};

export default function BonusTrainings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = Boolean(user?.isAdmin);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BonusTrainingCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<BonusTrainingCategoryFormData>(defaultCategoryForm);
  const [categoryFormErrors, setCategoryFormErrors] = useState<Partial<Record<keyof BonusTrainingCategoryFormData, string>>>({});

  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<BonusTrainingSeries | null>(null);
  const [seriesCategoryId, setSeriesCategoryId] = useState<string | null>(null);
  const [seriesForm, setSeriesForm] = useState<BonusTrainingSeriesFormData>(defaultSeriesForm);
  const [seriesFormErrors, setSeriesFormErrors] = useState<Partial<Record<keyof BonusTrainingSeriesFormData, string>>>({});

  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BonusTrainingCategory | null>(null);

  const [isDeleteSeriesOpen, setIsDeleteSeriesOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<BonusTrainingSeries | null>(null);

  const [seriesVideoFields, setSeriesVideoFields] = useState<VideoFieldEntry[]>([]);
  const [seriesVideoErrors, setSeriesVideoErrors] = useState<Record<string, Partial<Record<keyof BonusTrainingVideoFormData, string>>>>({});
  const [isEnsuringSection, setIsEnsuringSection] = useState(false);

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bonus-trainings");
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data
        .map((category: BonusTrainingCategory) => ({
          ...category,
          series: Array.isArray(category.series)
            ? [...category.series].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : [],
        }))
        .sort((a: BonusTrainingCategory, b: BonusTrainingCategory) => (a.order ?? 0) - (b.order ?? 0));
    },
  });

  const primaryCategory = categories[0];

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
  };

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BonusTrainingCategoryFormData }) => {
      const response = await apiRequest("PUT", `/api/bonus-trainings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateCategories();
      closeCategoryModal();
      toast({ title: "Training updated", description: "Bonus training category has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update training", description: err.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/bonus-trainings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      invalidateCategories();
      setIsDeleteCategoryOpen(false);
      setCategoryToDelete(null);
      toast({ title: "Training deleted", description: "Bonus training category has been removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete training", description: err.message, variant: "destructive" });
    },
  });

  const createSeriesMutation = useMutation({
    mutationFn: async ({
      categoryId,
      data,
      order,
      videos,
    }: {
      categoryId: string;
      data: BonusTrainingSeriesFormData;
      order: number;
      videos: BonusTrainingVideoFormData[];
    }) => {
      const response = await apiRequest("POST", `/api/bonus-trainings/${categoryId}/series`, {
        ...data,
        order,
        stepNumberBase: order * 100,
      });
      const series = await response.json();

      if (videos.length > 0) {
        await Promise.all(
          videos.map((video, index) =>
            apiRequest("POST", `/api/bonus-trainings/series/${series.id}/videos`, {
              title: video.title,
              vimeoId: video.vimeoId,
              order: index,
              stepNumber: (order * 100) + index,
            })
          )
        );
      }

      return series;
    },
    onSuccess: () => {
      invalidateCategories();
      closeSeriesModal();
      toast({ title: "Training added", description: "New training has been added to the section." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add series", description: err.message, variant: "destructive" });
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BonusTrainingSeriesFormData }) => {
      const response = await apiRequest("PUT", `/api/bonus-trainings/series/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      invalidateCategories();
      closeSeriesModal();
      toast({ title: "Series updated", description: "Training series has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update series", description: err.message, variant: "destructive" });
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/bonus-trainings/series/${id}`);
      return response.json();
    },
    onSuccess: () => {
      invalidateCategories();
      setIsDeleteSeriesOpen(false);
      setSeriesToDelete(null);
      toast({ title: "Series deleted", description: "Training series has been removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete series", description: err.message, variant: "destructive" });
    },
  });

  const openCategoryModal = (category: BonusTrainingCategory) => {
    setCategoryFormErrors({});
    setEditingCategory(category);
    setCategoryForm({ title: category.title, description: category.description });
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm(defaultCategoryForm);
    setCategoryFormErrors({});
  };

  const ensurePrimaryCategoryId = async (): Promise<string> => {
    if (primaryCategory) return primaryCategory.id;

    const response = await apiRequest("POST", "/api/bonus-trainings", {
      ...DEFAULT_SECTION,
      order: 0,
    });
    const category = await response.json();
    await invalidateCategories();
    return category.id;
  };

  const handleAddTrainingClick = async () => {
    setIsEnsuringSection(true);
    try {
      const categoryId = await ensurePrimaryCategoryId();
      openSeriesModal(categoryId);
    } catch (err) {
      toast({
        title: "Failed to open form",
        description: err instanceof Error ? err.message : "Could not prepare the training section.",
        variant: "destructive",
      });
    } finally {
      setIsEnsuringSection(false);
    }
  };

  const openSeriesModal = (categoryId: string, series?: BonusTrainingSeries) => {
    setSeriesFormErrors({});
    setSeriesVideoErrors({});
    setSeriesCategoryId(categoryId);
    if (series) {
      setEditingSeries(series);
      setSeriesForm({
        title: series.title,
        description: series.description,
        themeColor: series.themeColor,
      });
      setSeriesVideoFields([]);
    } else {
      setEditingSeries(null);
      setSeriesForm(defaultSeriesForm);
      setSeriesVideoFields([createEmptyVideoField()]);
    }
    setIsSeriesModalOpen(true);
  };

  const closeSeriesModal = () => {
    setIsSeriesModalOpen(false);
    setEditingSeries(null);
    setSeriesCategoryId(null);
    setSeriesForm(defaultSeriesForm);
    setSeriesFormErrors({});
    setSeriesVideoFields([]);
    setSeriesVideoErrors({});
  };

  const validateVideoFields = (
    fields: VideoFieldEntry[]
  ): { valid: boolean; errors: Record<string, Partial<Record<keyof BonusTrainingVideoFormData, string>>>; videos: BonusTrainingVideoFormData[] } => {
    const errors: Record<string, Partial<Record<keyof BonusTrainingVideoFormData, string>>> = {};
    const videos: BonusTrainingVideoFormData[] = [];

    fields.forEach((field) => {
      const title = field.title.trim();
      const vimeoId = field.vimeoId.trim();
      const isEmpty = !title && !vimeoId;
      if (isEmpty) return;

      const fieldErrors: Partial<Record<keyof BonusTrainingVideoFormData, string>> = {};

      if (!title) {
        fieldErrors.title = "Title is required";
      } else if (title.length < 3) {
        fieldErrors.title = "Title must be at least 3 characters";
      }

      if (!vimeoId) {
        fieldErrors.vimeoId = "Vimeo ID is required";
      } else if (!VIMEO_ID_PATTERN.test(vimeoId)) {
        fieldErrors.vimeoId = "Invalid format. Use: 1234567890/abcdef1234";
      }

      if (Object.keys(fieldErrors).length > 0) {
        errors[field.key] = fieldErrors;
      } else {
        videos.push({ title, vimeoId });
      }
    });

    return { valid: Object.keys(errors).length === 0, errors, videos };
  };

  const updateVideoField = (
    fields: VideoFieldEntry[],
    setFields: (fields: VideoFieldEntry[]) => void,
    errors: Record<string, Partial<Record<keyof BonusTrainingVideoFormData, string>>>,
    setErrors: (errors: Record<string, Partial<Record<keyof BonusTrainingVideoFormData, string>>>) => void,
    key: string,
    field: keyof BonusTrainingVideoFormData,
    value: string
  ) => {
    setFields(fields.map((entry) => (entry.key === key ? { ...entry, [field]: value } : entry)));
    if (errors[key]?.[field]) {
      const nextErrors = { ...errors };
      delete nextErrors[key];
      setErrors(nextErrors);
    }
  };

  const renderVideoFieldsSection = (
    fields: VideoFieldEntry[],
    setFields: (fields: VideoFieldEntry[]) => void,
    errors: Record<string, Partial<Record<keyof BonusTrainingVideoFormData, string>>>,
    setErrors: (errors: Record<string, Partial<Record<keyof BonusTrainingVideoFormData, string>>>) => void
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-900">Videos</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFields([...fields, createEmptyVideoField()])}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Video
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg p-4 text-center">
          No videos yet. Click &quot;Add Video&quot; to add one.
        </p>
      ) : (
        <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
          {fields.map((field, index) => (
            <div key={field.key} className="border border-slate-200 rounded-lg p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Video {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFields(fields.filter((f) => f.key !== field.key))}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Title *</label>
                <Input
                  value={field.title}
                  onChange={(e) =>
                    updateVideoField(fields, setFields, errors, setErrors, field.key, "title", e.target.value)
                  }
                  placeholder="e.g., Week 1: Your Foundation"
                  className={errors[field.key]?.title ? "border-red-500" : ""}
                />
                {errors[field.key]?.title && (
                  <p className="text-xs text-red-600">{errors[field.key].title}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Vimeo ID *</label>
                <Input
                  value={field.vimeoId}
                  onChange={(e) =>
                    updateVideoField(fields, setFields, errors, setErrors, field.key, "vimeoId", e.target.value)
                  }
                  placeholder="e.g., 1121271914/cfc6fad702"
                  className={errors[field.key]?.vimeoId ? "border-red-500" : ""}
                />
                {errors[field.key]?.vimeoId && (
                  <p className="text-xs text-red-600">{errors[field.key].vimeoId}</p>
                )}
                <p className="text-xs text-slate-500">Format: videoId/hash (e.g., 1121271914/cfc6fad702)</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const validateCategoryForm = (): boolean => {
    const errors: Partial<Record<keyof BonusTrainingCategoryFormData, string>> = {};
    if (!categoryForm.title.trim()) {
      errors.title = "Title is required";
    }
    if (!categoryForm.description.trim()) {
      errors.description = "Description is required";
    }
    setCategoryFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSeriesForm = (): boolean => {
    const errors: Partial<Record<keyof BonusTrainingSeriesFormData, string>> = {};
    if (!seriesForm.title.trim()) {
      errors.title = "Title is required";
    }
    if (!seriesForm.description.trim()) {
      errors.description = "Description is required";
    }
    setSeriesFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategorySubmit = () => {
    if (!validateCategoryForm() || !editingCategory) return;
    updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
  };

  const handleSeriesSubmit = () => {
    if (!validateSeriesForm() || !seriesCategoryId) return;

    if (editingSeries) {
      updateSeriesMutation.mutate({ id: editingSeries.id, data: seriesForm });
      return;
    }

    const videoValidation = validateVideoFields(seriesVideoFields);
    if (!videoValidation.valid) {
      setSeriesVideoErrors(videoValidation.errors);
      toast({
        title: "Validation Error",
        description: "Please fix the video field errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    const category = categories.find((c) => c.id === seriesCategoryId) ?? primaryCategory;
    createSeriesMutation.mutate({
      categoryId: seriesCategoryId,
      data: seriesForm,
      order: category?.series.length ?? 0,
      videos: videoValidation.videos,
    });
  };

  const isCategorySaving = updateCategoryMutation.isPending;
  const isSeriesSaving = createSeriesMutation.isPending || updateSeriesMutation.isPending;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bonus Trainings</h1>
            <p className="text-slate-600 mt-2">
              Bonus content & workshops to support you in both going through the IGNITE program and in all areas of your business.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                onClick={handleAddTrainingClick}
                disabled={isEnsuringSection}
                className="bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isEnsuringSection ? "Loading..." : "Add Training"}
              </Button>
            )}
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Premium Content</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-red-600">
              <p className="font-medium">Error loading bonus trainings</p>
              <p className="text-sm mt-1">{error instanceof Error ? error.message : "Unknown error"}</p>
            </CardContent>
          </Card>
        ) : !primaryCategory ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>No bonus trainings available yet.</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleAddTrainingClick}
                  disabled={isEnsuringSection}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Training
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card key={primaryCategory.id} className="group/category">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    {primaryCategory.title}
                  </CardTitle>
                  <CardDescription className="mt-1">{primaryCategory.description}</CardDescription>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover/category:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCategoryModal(primaryCategory)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCategoryToDelete(primaryCategory);
                        setIsDeleteCategoryOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {primaryCategory.series.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 rounded-lg">
                  <p>No trainings in this section yet.</p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleAddTrainingClick}
                      disabled={isEnsuringSection}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Training
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {primaryCategory.series.map((series) => {
                    const styles = seriesThemeStyles[series.themeColor] ?? seriesThemeStyles.purple;
                    const videoCount = series.videoCount ?? 0;

                    return (
                      <div
                        key={series.id}
                        className="border border-slate-200 rounded-lg p-4 group/series relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 ${styles.iconBg} rounded-lg flex items-center justify-center`}
                            >
                              <Play className={`w-5 h-5 ${styles.iconText}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{series.title}</h3>
                              <p className="text-sm text-slate-500 mt-1">{series.description}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {videoCount} video {videoCount === 1 ? "replay" : "replays"} available
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/series:opacity-100 transition-opacity mr-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openSeriesModal(primaryCategory.id, series)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSeriesToDelete(series);
                                    setIsDeleteSeriesOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <Badge variant="outline" className={styles.badge}>
                              Available
                            </Badge>
                            <Link href={`/resources/bonus-trainings/series/${series.id}`}>
                              <Button size="sm" className={`${styles.button} text-white`}>
                                <Play className="w-4 h-4 mr-1" />
                                Watch Replays
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update the main bonus training section title and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="categoryTitle" className="text-sm font-medium text-slate-900">
                Section Title *
              </label>
              <Input
                id="categoryTitle"
                value={categoryForm.title}
                onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                placeholder="e.g., Business Incubator Training"
                className={categoryFormErrors.title ? "border-red-500" : ""}
              />
              {categoryFormErrors.title && (
                <p className="text-xs text-red-600">{categoryFormErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="categoryDescription" className="text-sm font-medium text-slate-900">
                Section Description *
              </label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="e.g., Exclusive workshop series hosted live with Emily Hirsh"
                className={categoryFormErrors.description ? "border-red-500" : ""}
              />
              {categoryFormErrors.description && (
                <p className="text-xs text-red-600">{categoryFormErrors.description}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCategoryModal} disabled={isCategorySaving}>
              Cancel
            </Button>
            <Button
              onClick={handleCategorySubmit}
              disabled={isCategorySaving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCategorySaving ? "Saving..." : "Update Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSeriesModalOpen} onOpenChange={setIsSeriesModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSeries ? "Edit Training" : "Add Training"}</DialogTitle>
            <DialogDescription>
              {editingSeries
                ? "Update this training item and its details."
                : `Add a new training under ${primaryCategory?.title ?? "this section"} (e.g., Your Messaging).`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="seriesTitle" className="text-sm font-medium text-slate-900">
                Title *
              </label>
              <Input
                id="seriesTitle"
                value={seriesForm.title}
                onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                placeholder="e.g., Business Incubator: Your Messaging"
                className={seriesFormErrors.title ? "border-red-500" : ""}
              />
              {seriesFormErrors.title && (
                <p className="text-xs text-red-600">{seriesFormErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="seriesDescription" className="text-sm font-medium text-slate-900">
                Description *
              </label>
              <Textarea
                id="seriesDescription"
                value={seriesForm.description}
                onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                placeholder="Brief description of this series"
                className={seriesFormErrors.description ? "border-red-500" : ""}
              />
              {seriesFormErrors.description && (
                <p className="text-xs text-red-600">{seriesFormErrors.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Theme Color</label>
              <Select
                value={seriesForm.themeColor}
                onValueChange={(value: BonusTrainingThemeColor) =>
                  setSeriesForm({ ...seriesForm, themeColor: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingSeries &&
              renderVideoFieldsSection(
                seriesVideoFields,
                setSeriesVideoFields,
                seriesVideoErrors,
                setSeriesVideoErrors
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSeriesModal} disabled={isSeriesSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSeriesSubmit}
              disabled={isSeriesSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSeriesSaving ? "Saving..." : editingSeries ? "Update Training" : "Add Training"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Training</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.title}&quot;? This will also remove all
              series and videos under it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteCategoryOpen(false);
                setCategoryToDelete(null);
              }}
              disabled={deleteCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => categoryToDelete && deleteCategoryMutation.mutate(categoryToDelete.id)}
              disabled={deleteCategoryMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete Training"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteSeriesOpen} onOpenChange={setIsDeleteSeriesOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Series</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{seriesToDelete?.title}&quot;? This will also remove all
              videos in this series. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteSeriesOpen(false);
                setSeriesToDelete(null);
              }}
              disabled={deleteSeriesMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => seriesToDelete && deleteSeriesMutation.mutate(seriesToDelete.id)}
              disabled={deleteSeriesMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteSeriesMutation.isPending ? "Deleting..." : "Delete Series"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
