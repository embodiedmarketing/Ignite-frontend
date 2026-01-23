import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Play, X, CheckCircle, ArrowRight, Rocket, BookOpen, Users, Target, ListChecks, UserCheck, HelpCircle, ChevronDown, ChevronRight, Check, Edit, Trash2, Plus } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

type OnboardingStepColor = "blue" | "coral" | "orange" | "navy";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  descriptor?: string;
  color: OnboardingStepColor;
  order?: number;
  buttonText?: string;
  buttonLink?: string;
  buttonAction?: 'link' | 'route'; // 'link' for external URLs, 'route' for internal routes
}

interface OnboardingStepFormData {
  title: string;
  description: string;
  descriptor: string;
  color: OnboardingStepColor;
  buttonText: string;
  buttonLink: string;
  buttonAction: 'link' | 'route';
}

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(true);
  const [watchedVideo, setWatchedVideo] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<OnboardingStep | null>(null);
  const [formData, setFormData] = useState<OnboardingStepFormData>({
    title: "",
    description: "",
    descriptor: "",
    color: "blue",
    buttonText: "",
    buttonLink: "",
    buttonAction: "link"
  });

  // Fetch onboarding steps from API
  const { data: onboardingSteps = [], isLoading: isLoadingSteps, error: stepsError } = useQuery({
    queryKey: ['/api/onboarding-steps'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/onboarding-steps');
        const data = await response.json();
        return Array.isArray(data) 
          ? data.sort((a: OnboardingStep, b: OnboardingStep) => (a.order || 0) - (b.order || 0))
          : [];
      } catch (error) {
        console.error('Error fetching onboarding steps:', error);
        return [];
      }
    },
    retry: 1
  });

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: async (data: OnboardingStepFormData & { order?: number }) => {
      const response = await apiRequest('POST', '/api/onboarding-steps', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-steps'] });
      setIsModalOpen(false);
      setFormData({ 
        title: "", 
        description: "", 
        descriptor: "", 
        color: "blue",
        buttonText: "",
        buttonLink: "",
        buttonAction: "link"
      });
      setEditingStep(null);
      toast({
        title: "Step Created",
        description: "The onboarding step has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to create step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create the onboarding step. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OnboardingStepFormData> }) => {
      const response = await apiRequest('PUT', `/api/onboarding-steps/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-steps'] });
      setIsModalOpen(false);
      setFormData({ 
        title: "", 
        description: "", 
        descriptor: "", 
        color: "blue",
        buttonText: "",
        buttonLink: "",
        buttonAction: "link"
      });
      setEditingStep(null);
      toast({
        title: "Step Updated",
        description: "The onboarding step has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to update step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the onboarding step. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/onboarding-steps/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-steps'] });
      setIsDeleteModalOpen(false);
      setStepToDelete(null);
      toast({
        title: "Step Deleted",
        description: "The onboarding step has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete the onboarding step. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleOpenModal = (step?: OnboardingStep) => {
    if (step) {
      setEditingStep(step);
      setFormData({
        title: step.title,
        description: step.description,
        descriptor: step.descriptor || "",
        color: step.color,
        buttonText: step.buttonText || "",
        buttonLink: step.buttonLink || "",
        buttonAction: step.buttonAction || "link"
      });
    } else {
      setEditingStep(null);
      setFormData({ 
        title: "", 
        description: "", 
        descriptor: "", 
        color: "blue",
        buttonText: "",
        buttonLink: "",
        buttonAction: "link"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStep(null);
    setFormData({ 
      title: "", 
      description: "", 
      descriptor: "", 
      color: "blue",
      buttonText: "",
      buttonLink: "",
      buttonAction: "link"
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    if (editingStep) {
      updateStepMutation.mutate({ id: editingStep.id, data: formData });
    } else {
      createStepMutation.mutate({ ...formData, order: onboardingSteps.length });
    }
  };

  const handleDeleteClick = (step: OnboardingStep) => {
    setStepToDelete(step);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (stepToDelete) {
      deleteStepMutation.mutate(stepToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setStepToDelete(null);
  };

  useEffect(() => {
    // Check if user has watched the welcome video
    const hasWatched = localStorage.getItem('welcome-video-watched');
    if (hasWatched) {
      setShowWelcomeVideo(false);
      setWatchedVideo(true);
    }

    // Load checked onboarding steps
    const savedSteps = localStorage.getItem('onboarding-checklist');
    if (savedSteps) {
      setCheckedSteps(new Set(JSON.parse(savedSteps)));
    }
  }, []);

  const handleVideoWatched = () => {
    localStorage.setItem('welcome-video-watched', 'true');
    setWatchedVideo(true);
    setShowWelcomeVideo(false);
  };

  const handleVideoToggle = () => {
    setShowWelcomeVideo(!showWelcomeVideo);
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const toggleStep = (stepId: string) => {
    const newCheckedSteps = new Set(checkedSteps);
    if (newCheckedSteps.has(stepId)) {
      newCheckedSteps.delete(stepId);
    } else {
      newCheckedSteps.add(stepId);
    }
    setCheckedSteps(newCheckedSteps);
    localStorage.setItem('onboarding-checklist', JSON.stringify(Array.from(newCheckedSteps)));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="editorial-header text-4xl text-embodied-navy">Welcome to IGNITE!</h1>
        <p className="editorial-body text-lg text-embodied-navy max-w-3xl mx-auto">
          Your complete step-by-step system to create, build, launch and optimize your entire marketing eco-system!
        </p>
      </div>

      {/* Welcome Video Section */}
      {showWelcomeVideo && (
        <Card className="bg-gradient-to-r from-embodied-cream to-white border-embodied-coral">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="editorial-header flex items-center text-embodied-navy">
                <Video className="w-5 h-5 mr-2 text-embodied-coral" />
                Start Here: Your IGNITE Orientation
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowWelcomeVideo(false)}
                className="text-embodied-navy hover:text-embodied-coral"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              {/* Welcome Video */}
              <div className="max-w-2xl mx-auto">
                <VimeoEmbed 
                  vimeoId="1123902105/e223b2adb0" 
                  title="Welcome to IGNITE!"
                  userId={user?.id || 0}
                  stepNumber={0}
                />
              </div>

              <div className="flex space-x-3 justify-center">
                <Button onClick={handleVideoWatched} className="bg-embodied-blue hover:bg-embodied-navy">
                  <Play className="w-4 h-4 mr-2" />
                  Mark as Watched
                </Button>
                <Button variant="outline" onClick={() => setShowWelcomeVideo(false)} className="border-embodied-coral text-embodied-coral hover:bg-embodied-coral hover:text-white">
                  Skip for Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact welcome for returning users */}
      {!showWelcomeVideo && (
        <Card className="border-embodied-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-embodied-coral" />
                <div>
                  <h3 className="editorial-subheader text-embodied-navy">Welcome Video Completed</h3>
                  <p className="editorial-body text-sm">You're all set to continue your IGNITE journey!</p>
                </div>
              </div>
              {watchedVideo && (
                <Button variant="outline" onClick={handleVideoToggle} size="sm" className="border-embodied-blue text-embodied-blue hover:bg-embodied-blue hover:text-white">
                  <Video className="w-4 h-4 mr-2" />
                  Rewatch Video
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Steps */}
      <Card className="border-embodied-blue/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="editorial-header flex items-center text-embodied-navy">
                <ListChecks className="w-5 h-5 mr-2 text-embodied-blue" />
                Onboarding Steps
              </CardTitle>
              <p className="text-sm text-embodied-navy/60 italic mt-1">
                Complete all {onboardingSteps.length} onboarding steps to get started
              </p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-embodied-blue hover:bg-embodied-blue/90 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSteps ? (
            <div className="text-center py-8 text-embodied-navy/60">Loading steps...</div>
          ) : stepsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Error loading onboarding steps</p>
              <p className="text-sm text-embodied-navy/60">
                {stepsError instanceof Error ? stepsError.message : 'Unknown error occurred'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {onboardingSteps.length === 0 ? (
                <div className="text-center py-8 text-embodied-navy/60">
                  No onboarding steps found. Click "Add Step" to create one.
                </div>
              ) : (
                onboardingSteps.map((step: OnboardingStep, index: number) => {
              const isChecked = checkedSteps.has(step.id);
              const colorClasses = {
                blue: "bg-embodied-blue/5 border-embodied-blue/20",
                coral: "bg-embodied-coral/5 border-embodied-coral/20",
                orange: "bg-embodied-orange/5 border-embodied-orange/20",
                navy: "bg-embodied-navy/5 border-embodied-navy/20"
              };


              return (
                <div
                  key={step.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${colorClasses[step.color as keyof typeof colorClasses]} ${
                    isChecked ? 'opacity-75' : ''
                  } transition-all duration-200`}
                >
                  <Checkbox
                    id={step.id}
                    checked={isChecked}
                    onCheckedChange={() => toggleStep(step.id)}
                    className="mt-1"
                    data-testid={`checkbox-${step.id}`}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={step.id}
                      className={`editorial-subheader text-embodied-navy ${
                        isChecked ? 'line-through text-embodied-navy/60' : ''
                      }`}
                    >
                      {index + 1}. {step.title}
                    </label>
                    <p className={`editorial-body text-sm mt-1 ${
                      isChecked ? 'text-embodied-navy/50' : 'text-embodied-navy/70'
                    }`}>
                      {step.description}
                    </p>
                    <p className={`editorial-body text-sm mt-1 ${
                      isChecked ? 'text-embodied-navy/50' : 'text-embodied-navy/70'
                    }`}>
                      {step?.descriptor || ''}
                    </p>
                    {step.buttonText && step.buttonLink && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (step.buttonAction === 'route' && step.buttonLink) {
                            setLocation(step.buttonLink);
                          } else if (step.buttonLink) {
                            window.open(step.buttonLink, '_blank');
                          }
                        }}
                        className={`mt-3 text-white ${
                          step.color === 'blue' 
                            ? 'bg-embodied-blue hover:bg-embodied-blue/90'
                            : step.color === 'coral'
                            ? 'bg-embodied-coral hover:bg-embodied-coral/90'
                            : step.color === 'orange'
                            ? 'bg-embodied-orange hover:bg-embodied-orange/90'
                            : 'bg-embodied-navy hover:bg-embodied-navy/90'
                        }`}
                        size="sm"
                        data-testid={`button-${step.id}`}
                      >
                        {step.buttonText}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(step);
                      }}
                      className="h-8 w-8 p-0 text-embodied-navy hover:text-embodied-blue"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(step);
                      }}
                      className="h-8 w-8 p-0 text-embodied-navy hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {isChecked && (
                      <Check className="w-5 h-5 text-green-600 mt-1" />
                    )}
                  </div>
                </div>
              );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Step Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingStep ? "Edit Onboarding Step" : "Add New Onboarding Step"}
            </DialogTitle>
            <DialogDescription>
              {editingStep 
                ? "Update the onboarding step details below."
                : "Fill in the details to create a new onboarding step."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-embodied-navy">
                Title *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Complete Your Profile"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-embodied-navy">
                Description *
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter a description for this step"
                className="w-full min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="descriptor" className="text-sm font-medium text-embodied-navy">
                Additional Descriptor (Optional)
              </label>
              <Textarea
                id="descriptor"
                value={formData.descriptor}
                onChange={(e) => setFormData({ ...formData, descriptor: e.target.value })}
                placeholder="Enter additional instructions or information"
                className="w-full min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="color" className="text-sm font-medium text-embodied-navy">
                Color *
              </label>
              <Select
                value={formData.color}
                onValueChange={(value: OnboardingStepColor) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="coral">Coral</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="navy">Navy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="buttonAction" className="text-sm font-medium text-embodied-navy">
                Button Action Type
              </label>
              <Select
                value={formData.buttonAction}
                onValueChange={(value: 'link' | 'route') => setFormData({ ...formData, buttonAction: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">External Link (opens in new tab)</SelectItem>
                  <SelectItem value="route">Internal Route (navigates within app)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="buttonText" className="text-sm font-medium text-embodied-navy">
                Button Text (Optional)
              </label>
              <Input
                id="buttonText"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                placeholder="e.g., Complete Your Profile"
                className="w-full"
              />
              <p className="text-xs text-embodied-navy/60">
                Leave empty if you don't want a button for this step
              </p>
            </div>
            {formData.buttonText && (
              <div className="space-y-2">
                <label htmlFor="buttonLink" className="text-sm font-medium text-embodied-navy">
                  Button Link {formData.buttonAction === 'link' ? '(URL)' : '(Route Path)'} *
                </label>
                <Input
                  id="buttonLink"
                  value={formData.buttonLink}
                  onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                  placeholder={formData.buttonAction === 'link' 
                    ? "e.g., https://example.com" 
                    : "e.g., /profile or /support/community-forum"
                  }
                  className="w-full"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={createStepMutation.isPending || updateStepMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.description.trim() || createStepMutation.isPending || updateStepMutation.isPending}
              className="bg-embodied-blue hover:bg-embodied-blue/90 text-white"
            >
              {createStepMutation.isPending || updateStepMutation.isPending
                ? "Saving..."
                : editingStep
                ? "Update Step"
                : "Create Step"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Onboarding Step</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this step? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleteStepMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteStepMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteStepMutation.isPending ? "Deleting..." : "Delete Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Steps Overview */}
      <Card className="border-embodied-coral/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <Rocket className="w-5 h-5 mr-2 text-embodied-coral" />
            Your IGNITE Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-blue flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Your Foundation</h3>
                <p className="editorial-body text-sm">Master your messaging and define your irresistible offers so that the rest of your marketing is easy!</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-coral flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Audience Growth</h3>
                <p className="editorial-body text-sm">Launch your visibility ad and start growing your audience quickly with quality leads!</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-orange flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Lead Generation</h3>
                <p className="editorial-body text-sm">Launch your lead gen funnel, start growing your email list and offsetting your ad cost with your tripwire product</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-navy flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">4</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Live Launch</h3>
                <p className="editorial-body text-sm">Time to launch your core offer! Capitalize on all the leads you've brought in and host your live launch experience.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">5</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Ongoing Optimization</h3>
                <p className="editorial-body text-sm">Continue to grow your list, host your next live launch and scale your business!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Meet The Team */}
      <Card className="border-embodied-coral/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <UserCheck className="w-5 h-5 mr-2 text-embodied-coral" />
            Meet The Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* <div className="text-center space-y-3 p-6 bg-embodied-coral/5 rounded-lg">
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <VimeoEmbed 
                  vimeoId="1121677190/051ad17016" 
                  title="Lisa - Senior Strategist Introduction"
                  userId={1}
                  stepNumber={20}
                />
              </div>
              <div>
                <h4 className="editorial-subheader text-embodied-navy">Lisa - Senior Strategist</h4>
                <p className="editorial-body text-sm text-embodied-navy/80 mt-2">She'll help develop your initial custom strategy</p>
              </div>
            </div> */}

            <div className="text-center space-y-3 p-6 bg-embodied-blue/5 rounded-lg">
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <VimeoEmbed 
                  vimeoId="1121677183/6654f58fc7" 
                  title="Rena - Marketing Coach Introduction"
                  userId={1}
                  stepNumber={21}
                />
              </div>
              <div>
                <h4 className="editorial-subheader text-embodied-navy">Rena - Marketing Coach & Strategist</h4>
                <p className="editorial-body text-sm text-embodied-navy/80 mt-2">She'll help develop your initial custom strategy and continue supporting you through the messaging, strategy and accountability calls every week. She's the main coach in Ignite and is here to support you every step of the way!</p>
              </div>
            </div>

            <div className="text-center space-y-3 p-6 bg-embodied-orange/5 rounded-lg">
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <VimeoEmbed 
                  vimeoId="1121677204/d084daa23a" 
                  title="Chris - Ads Coach Introduction"
                  userId={1}
                  stepNumber={22}
                />
              </div>
              <div>
                <h4 className="editorial-subheader text-embodied-navy">Chris - Ads Coach</h4>
                <p className="editorial-body text-sm text-embodied-navy/80 mt-2">Our lead ads manager who's here to run our ads support calls and help you with anything ads related from targeting to ad optimization!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ's */}
      <Card className="border-embodied-navy/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <HelpCircle className="w-5 h-5 mr-2 text-embodied-navy" />
            FAQ's
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                id: "first-steps",
                question: "What should I do first when I join?",
                answer: "Start by watching the welcome video above then complete the onboarding steps. \n\nOnce your onboarding steps are complete, you'll have your initial strategy call and dive into the first phase: Foundation!"
              },
              {
                id: "program-structure",
                question: "How is the program structured?",
                answer: "IGNITE follows a 5-step journey: Foundation (messaging & offer), Audience Growth, Lead Generation, Live Launch, and Ongoing Optimization. Each step builds on the previous one to create your complete marketing system. \n\nEach phase will have training videos and interactive components where our system completes things for you based on questions you fill out. \n\nLeverage our coaching calls to get live support and feedback on all the components of your marketing, making sure everything you create and launch is to the highest standard and set up for success!"
              },
              {
                id: "order-completion",
                question: "Do I need to go through everything in order?",
                answer: "Yes. This system is intended for you to go through it in order. If there is anything custom or specific to you and your business we will highlight that in your strategy call."
              },
              {
                id: "results-timeline",
                question: "How long will it take to start seeing results?",
                answer: "It depends how quickly you implement. Once your lead gen funnel is live (appx 6 weeks from onboarding) you will start generating leads and once you live launch you'll see sales for your core offer.  For most people this is within 90 days and then we spend the next 90 days optimizing and improving results."
              },
              {
                id: "getting-support",
                question: "How do I get support if I'm stuck?",
                answer: "We have many ways to support you! The best one being all of our live coaching options each week. Jump on any live coaching call you need that week to get 1:1 guidance. You can also leverage the community forum where our coaches are ready to support in between calls. \n\nThroughout this platform there is also programmed AI support so that as you're answering questions and working through the content you can get support in real time."
              },
              {
                id: "work-review",
                question: "Will someone review my work or give feedback?",
                answer: "Yes! Bring any copy from funnel copy to emails to our live support calls, screenshare and get real time feedback. You can also screenshare and get feedback on your ads on any of our ad support calls."
              }
            ].map((faq) => (
              <div key={faq.id} className="border border-embodied-navy/10 rounded-lg">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-embodied-navy/5 transition-colors"
                >
                  <span className="editorial-subheader text-embodied-navy">{faq.question}</span>
                  {expandedFaq === faq.id ? (
                    <ChevronDown className="w-5 h-5 text-embodied-navy" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-embodied-navy" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="editorial-body text-embodied-navy/80">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
