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
import { Skeleton } from "@/components/ui/skeleton";
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

interface TeamMember {
  id: string;
  name: string;
  title: string;
  description: string;
  vimeoId: string;
  stepNumber: number;
  order?: number;
  backgroundColor?: 'blue' | 'coral' | 'orange' | 'navy';
}

interface TeamMemberFormData {
  name: string;
  title: string;
  description: string;
  vimeoId: string;
  stepNumber: number;
  backgroundColor: 'blue' | 'coral' | 'orange' | 'navy';
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
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof OnboardingStepFormData, string>>>({});
  
  // Team Member states
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [isDeleteTeamMemberModalOpen, setIsDeleteTeamMemberModalOpen] = useState(false);
  const [teamMemberToDelete, setTeamMemberToDelete] = useState<TeamMember | null>(null);
  const [teamMemberFormData, setTeamMemberFormData] = useState<TeamMemberFormData>({
    name: "",
    title: "",
    description: "",
    vimeoId: "",
    stepNumber: 0,
    backgroundColor: "blue"
  });
  const [teamMemberFormErrors, setTeamMemberFormErrors] = useState<Partial<Record<keyof TeamMemberFormData, string>>>({});

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
    onMutate: async (newStep) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/onboarding-steps'] });

      // Snapshot the previous value
      const previousSteps = queryClient.getQueryData<OnboardingStep[]>(['/api/onboarding-steps']);

      // Optimistically update to the new value
      const tempId = `temp-${Date.now()}`;
      const optimisticStep: OnboardingStep = {
        id: tempId,
        title: newStep.title,
        description: newStep.description,
        descriptor: newStep.descriptor || undefined,
        color: newStep.color,
        order: newStep.order ?? (previousSteps?.length ?? 0),
        buttonText: newStep.buttonText || undefined,
        buttonLink: newStep.buttonLink || undefined,
        buttonAction: newStep.buttonAction || undefined
      };

      queryClient.setQueryData<OnboardingStep[]>(['/api/onboarding-steps'], (old = []) => {
        const updated = [...old, optimisticStep];
        return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
      });

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

      // Return a context object with the snapshotted value
      return { previousSteps };
    },
    onError: (error: any, newStep, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSteps) {
        queryClient.setQueryData(['/api/onboarding-steps'], context.previousSteps);
      }
      console.error('Failed to create step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create the onboarding step. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: OnboardingStep) => {
      // Immediately update state with the server response after API success
      queryClient.setQueryData<OnboardingStep[]>(['/api/onboarding-steps'], (old = []) => {
        // Remove any temporary steps - ensure id is a string before calling startsWith
        const withoutTemp = old.filter(step => {
          if (!step || !step.id) return false;
          const stepId = String(step.id);
          return !stepId.startsWith('temp-');
        });
        // Check if step with this ID already exists
        const stepIndex = withoutTemp.findIndex(step => String(step.id) === String(data.id));
        
        if (stepIndex === -1) {
          // Step doesn't exist, add the new step from server response
          const updated = [...withoutTemp, data];
          return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
        } else {
          // Step exists, replace it with server response
          const updated = [...withoutTemp];
          updated[stepIndex] = data;
          return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      });
      
      toast({
        title: "Step Created",
        description: "The onboarding step has been created successfully.",
      });
    }
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OnboardingStepFormData> }) => {
      const response = await apiRequest('PUT', `/api/onboarding-steps/${id}`, data);
      return response.json();
    },
    onMutate: async ({ id, data: updateData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/onboarding-steps'] });

      // Snapshot the previous value
      const previousSteps = queryClient.getQueryData<OnboardingStep[]>(['/api/onboarding-steps']);

      // Optimistically update to the new value
      queryClient.setQueryData<OnboardingStep[]>(['/api/onboarding-steps'], (old = []) => {
        return old.map(step => 
          step.id === id 
            ? { ...step, ...updateData }
            : step
        );
      });

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

      // Return a context object with the snapshotted value
      return { previousSteps };
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSteps) {
        queryClient.setQueryData(['/api/onboarding-steps'], context.previousSteps);
      }
      console.error('Failed to update step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the onboarding step. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // Update with the actual server response
      queryClient.setQueryData<OnboardingStep[]>(['/api/onboarding-steps'], (old = []) => {
        return old.map(step => step.id === data.id ? data : step);
      });
      toast({
        title: "Step Updated",
        description: "The onboarding step has been updated successfully.",
      });
    }
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/onboarding-steps/${id}`);
      return response.json();
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/onboarding-steps'] });

      // Snapshot the previous value
      const previousSteps = queryClient.getQueryData<OnboardingStep[]>(['/api/onboarding-steps']);

      // Optimistically update to the new value
      queryClient.setQueryData<OnboardingStep[]>(['/api/onboarding-steps'], (old = []) => {
        return old.filter(step => step.id !== id);
      });

      setIsDeleteModalOpen(false);
      setStepToDelete(null);

      // Return a context object with the snapshotted value
      return { previousSteps };
    },
    onError: (error: any, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSteps) {
        queryClient.setQueryData(['/api/onboarding-steps'], context.previousSteps);
      }
      console.error('Failed to delete step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete the onboarding step. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Step Deleted",
        description: "The onboarding step has been deleted successfully.",
      });
    }
  });

  const handleOpenModal = (step?: OnboardingStep) => {
    setFormErrors({});
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
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof OnboardingStepFormData, string>> = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (formData.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters";
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    } else if (formData.description.trim().length > 1000) {
      errors.description = "Description must be less than 1000 characters";
    }

    // Button validation - if buttonText is provided, buttonLink is required
    if (formData.buttonText.trim() && !formData.buttonLink.trim()) {
      errors.buttonLink = "Button link is required when button text is provided";
    }

    // Button link validation - if provided, validate format
    if (formData.buttonLink.trim()) {
      if (formData.buttonAction === 'link') {
        // Validate URL format
        try {
          new URL(formData.buttonLink);
        } catch {
          errors.buttonLink = "Please enter a valid URL (e.g., https://example.com)";
        }
      } else if (formData.buttonAction === 'route') {
        // Validate route format (should start with /)
        if (!formData.buttonLink.startsWith('/')) {
          errors.buttonLink = "Route path must start with / (e.g., /profile)";
        }
      }
    }

    // Button text validation - if buttonLink is provided, buttonText is required
    if (formData.buttonLink.trim() && !formData.buttonText.trim()) {
      errors.buttonText = "Button text is required when button link is provided";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (editingStep) {
      updateStepMutation.mutate({ id: editingStep.id, data: formData });
    } else {
      createStepMutation.mutate({ ...formData, order: onboardingSteps.length });
    }
  };

  const handleFieldChange = (field: keyof OnboardingStepFormData, value: string | OnboardingStepColor | 'link' | 'route') => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: undefined });
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

  // Fetch team members from API
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers, error: teamMembersError } = useQuery({
    queryKey: ['/api/team-members'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/team-members');
        const data = await response.json();
        return Array.isArray(data) 
          ? data.sort((a: TeamMember, b: TeamMember) => (a.order || 0) - (b.order || 0))
          : [];
      } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
      }
    },
    retry: 1
  });

  // Create team member mutation
  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData & { order?: number }) => {
      const response = await apiRequest('POST', '/api/team-members', data);
      return response.json();
    },
    onMutate: async (newMember) => {
      await queryClient.cancelQueries({ queryKey: ['/api/team-members'] });
      const previousMembers = queryClient.getQueryData<TeamMember[]>(['/api/team-members']);
      
      const tempId = `temp-${Date.now()}`;
      const optimisticMember: TeamMember = {
        id: tempId,
        name: newMember.name,
        title: newMember.title,
        description: newMember.description,
        vimeoId: newMember.vimeoId,
        stepNumber: newMember.stepNumber,
        order: newMember.order ?? (previousMembers?.length ?? 0),
        backgroundColor: newMember.backgroundColor
      };

      queryClient.setQueryData<TeamMember[]>(['/api/team-members'], (old = []) => {
        const updated = [...old, optimisticMember];
        return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
      });

      setIsTeamMemberModalOpen(false);
      setTeamMemberFormData({
        name: "",
        title: "",
        description: "",
        vimeoId: "",
        stepNumber: 0,
        backgroundColor: "blue"
      });
      setEditingTeamMember(null);
      setTeamMemberFormErrors({});

      return { previousMembers };
    },
    onError: (error: any, newMember, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['/api/team-members'], context.previousMembers);
      }
      console.error('Failed to create team member:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create the team member. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: TeamMember) => {
      // Replace optimistic update with actual data from database
      queryClient.setQueryData<TeamMember[]>(['/api/team-members'], (old = []) => {
        // Remove any temporary members
        const withoutTemp = old.filter(member => {
          if (!member || !member.id) return false;
          const memberId = String(member.id);
          return !memberId.startsWith('temp-');
        });
        
        // Check if the member already exists (shouldn't, but just in case)
        const existingIndex = withoutTemp.findIndex(member => String(member.id) === String(data.id));
        
        if (existingIndex === -1) {
          // Add the new member from database response
          const updated = [...withoutTemp, data];
          return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
        } else {
          // Replace existing member with database response
          const updated = [...withoutTemp];
          updated[existingIndex] = data;
          return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      });
      
      // Invalidate and refetch to ensure we have the latest data from database
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Team Member Created",
        description: "The team member has been created successfully and is now visible.",
      });
    }
  });

  // Update team member mutation
  const updateTeamMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeamMemberFormData> }) => {
      const response = await apiRequest('PUT', `/api/team-members/${id}`, data);
      return response.json();
    },
    onMutate: async ({ id, data: updateData }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/team-members'] });
      const previousMembers = queryClient.getQueryData<TeamMember[]>(['/api/team-members']);

      queryClient.setQueryData<TeamMember[]>(['/api/team-members'], (old = []) => {
        return old.map(member => 
          member.id === id 
            ? { ...member, ...updateData }
            : member
        );
      });

      setIsTeamMemberModalOpen(false);
      setTeamMemberFormData({
        name: "",
        title: "",
        description: "",
        vimeoId: "",
        stepNumber: 0,
        backgroundColor: "blue"
      });
      setEditingTeamMember(null);
      setTeamMemberFormErrors({});

      return { previousMembers };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['/api/team-members'], context.previousMembers);
      }
      console.error('Failed to update team member:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the team member. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: TeamMember) => {
      // Update with actual data from database
      queryClient.setQueryData<TeamMember[]>(['/api/team-members'], (old = []) => {
        return old.map(member => member.id === data.id ? data : member)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      // Invalidate and refetch to ensure we have the latest data from database
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Team Member Updated",
        description: "The team member has been updated successfully.",
      });
    }
  });

  // Delete team member mutation
  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/team-members/${id}`);
      return response.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['/api/team-members'] });
      const previousMembers = queryClient.getQueryData<TeamMember[]>(['/api/team-members']);

      queryClient.setQueryData<TeamMember[]>(['/api/team-members'], (old = []) => {
        return old.filter(member => member.id !== id);
      });

      setIsDeleteTeamMemberModalOpen(false);
      setTeamMemberToDelete(null);

      return { previousMembers };
    },
    onError: (error: any, id, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['/api/team-members'], context.previousMembers);
      }
      console.error('Failed to delete team member:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete the team member. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Team Member Deleted",
        description: "The team member has been deleted successfully.",
      });
    }
  });

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

  // Team Member handlers
  const handleOpenTeamMemberModal = (member?: TeamMember) => {
    setTeamMemberFormErrors({});
    if (member) {
      setEditingTeamMember(member);
      setTeamMemberFormData({
        name: member.name,
        title: member.title,
        description: member.description,
        vimeoId: member.vimeoId,
        stepNumber: member.stepNumber,
        backgroundColor: member.backgroundColor || "blue"
      });
    } else {
      setEditingTeamMember(null);
      setTeamMemberFormData({
        name: "",
        title: "",
        description: "",
        vimeoId: "",
        stepNumber: 0,
        backgroundColor: "blue"
      });
    }
    setIsTeamMemberModalOpen(true);
  };

  const handleCloseTeamMemberModal = () => {
    setIsTeamMemberModalOpen(false);
    setEditingTeamMember(null);
    setTeamMemberFormData({
      name: "",
      title: "",
      description: "",
      vimeoId: "",
      stepNumber: 0,
      backgroundColor: "blue"
    });
    setTeamMemberFormErrors({});
  };

  const validateTeamMemberForm = (): boolean => {
    const errors: Partial<Record<keyof TeamMemberFormData, string>> = {};

    if (!teamMemberFormData.name.trim()) {
      errors.name = "Name is required";
    } else if (teamMemberFormData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!teamMemberFormData.title.trim()) {
      errors.title = "Title is required";
    } else if (teamMemberFormData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    if (!teamMemberFormData.description.trim()) {
      errors.description = "Description is required";
    } else if (teamMemberFormData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    if (!teamMemberFormData.vimeoId.trim()) {
      errors.vimeoId = "Vimeo ID is required";
    } else {
      // Validate Vimeo ID format (e.g., "1121677183/6654f58fc7")
      const vimeoPattern = /^\d+\/[a-zA-Z0-9]+$/;
      if (!vimeoPattern.test(teamMemberFormData.vimeoId.trim())) {
        errors.vimeoId = "Invalid Vimeo ID format. Use format: 1234567890/abcdef1234";
      }
    }

    if (teamMemberFormData.stepNumber < 0) {
      errors.stepNumber = "Step number must be 0 or greater";
    }

    setTeamMemberFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTeamMemberSubmit = () => {
    if (!validateTeamMemberForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (editingTeamMember) {
      updateTeamMemberMutation.mutate({ id: editingTeamMember.id, data: teamMemberFormData });
    } else {
      createTeamMemberMutation.mutate({ ...teamMemberFormData, order: teamMembers.length });
    }
  };

  const handleTeamMemberDeleteClick = (member: TeamMember) => {
    setTeamMemberToDelete(member);
    setIsDeleteTeamMemberModalOpen(true);
  };

  const handleTeamMemberDeleteConfirm = () => {
    if (teamMemberToDelete) {
      deleteTeamMemberMutation.mutate(teamMemberToDelete.id);
    }
  };

  const handleTeamMemberDeleteCancel = () => {
    setIsDeleteTeamMemberModalOpen(false);
    setTeamMemberToDelete(null);
  };

  const handleTeamMemberFieldChange = (field: keyof TeamMemberFormData, value: string | number | 'blue' | 'coral' | 'orange' | 'navy') => {
    setTeamMemberFormData({ ...teamMemberFormData, [field]: value });
    if (teamMemberFormErrors[field]) {
      setTeamMemberFormErrors({ ...teamMemberFormErrors, [field]: undefined });
    }
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
            {user && user.isAdmin && <Button
              onClick={() => handleOpenModal()}
              className="bg-embodied-blue hover:bg-embodied-blue/90 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSteps ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex items-start space-x-4 p-4 rounded-lg border bg-slate-50/50 border-slate-200 animate-pulse"
                >
                  {/* Checkbox skeleton */}
                  <Skeleton className="h-5 w-5 rounded mt-1" />
                  
                  {/* Content skeleton */}
                  <div className="flex-1 space-y-3">
                    {/* Title skeleton */}
                    <Skeleton className="h-5 w-3/4" />
                    
                    {/* Description skeleton */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    
                    {/* Optional button skeleton */}
                    {index % 2 === 0 && (
                      <Skeleton className="h-8 w-32 mt-3" />
                    )}
                  </div>
                  
                  {/* Action buttons skeleton (only for admin) */}
                  {user && user.isAdmin && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                onboardingSteps?.map((step: OnboardingStep, index: number) => {
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
               {user && user?.isAdmin &&   <div className="flex items-center space-x-2 flex-shrink-0">
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
                  </div>}
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
                onChange={(e) => handleFieldChange('title', e.target.value)}
                onBlur={() => {
                  if (formData.title.trim() && formData.title.trim().length < 3) {
                    setFormErrors({ ...formErrors, title: "Title must be at least 3 characters" });
                  }
                }}
                placeholder="e.g., Complete Your Profile"
                className={`w-full ${formErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {formErrors.title && (
                <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-embodied-navy">
                Description *
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={() => {
                  if (formData.description.trim() && formData.description.trim().length < 10) {
                    setFormErrors({ ...formErrors, description: "Description must be at least 10 characters" });
                  }
                }}
                placeholder="Enter a description for this step"
                className={`w-full min-h-[80px] ${formErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {formErrors.description && (
                <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="descriptor" className="text-sm font-medium text-embodied-navy">
                Additional Descriptor (Optional)
              </label>
              <Textarea
                id="descriptor"
                value={formData.descriptor}
                onChange={(e) => handleFieldChange('descriptor', e.target.value)}
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
                onValueChange={(value: OnboardingStepColor) => handleFieldChange('color', value)}
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
                onValueChange={(value: 'link' | 'route') => {
                  handleFieldChange('buttonAction', value);
                  // Clear buttonLink error when changing action type
                  if (formErrors.buttonLink) {
                    setFormErrors({ ...formErrors, buttonLink: undefined });
                  }
                }}
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
                onChange={(e) => handleFieldChange('buttonText', e.target.value)}
                placeholder="e.g., Complete Your Profile"
                className={`w-full ${formErrors.buttonText ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {formErrors.buttonText && (
                <p className="text-xs text-red-600 mt-1">{formErrors.buttonText}</p>
              )}
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
                  onChange={(e) => handleFieldChange('buttonLink', e.target.value)}
                  onBlur={() => {
                    if (formData.buttonLink.trim()) {
                      if (formData.buttonAction === 'link') {
                        try {
                          new URL(formData.buttonLink);
                        } catch {
                          setFormErrors({ ...formErrors, buttonLink: "Please enter a valid URL (e.g., https://example.com)" });
                        }
                      } else if (formData.buttonAction === 'route' && !formData.buttonLink.startsWith('/')) {
                        setFormErrors({ ...formErrors, buttonLink: "Route path must start with / (e.g., /profile)" });
                      }
                    }
                  }}
                  placeholder={formData.buttonAction === 'link' 
                    ? "e.g., https://example.com" 
                    : "e.g., /profile or /support/community-forum"
                  }
                  className={`w-full ${formErrors.buttonLink ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {formErrors.buttonLink && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.buttonLink}</p>
                )}
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
              disabled={createStepMutation.isPending || updateStepMutation.isPending}
              className="bg-embodied-blue hover:bg-embodied-blue/90 text-white disabled:opacity-50"
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

      {/* Add/Edit Team Member Modal */}
      <Dialog open={isTeamMemberModalOpen} onOpenChange={setIsTeamMemberModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTeamMember ? "Edit Team Member" : "Add New Team Member"}
            </DialogTitle>
            <DialogDescription>
              {editingTeamMember 
                ? "Update the team member details below."
                : "Fill in the details to add a new team member."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="teamMemberName" className="text-sm font-medium text-embodied-navy">
                Name *
              </label>
              <Input
                id="teamMemberName"
                value={teamMemberFormData.name}
                onChange={(e) => handleTeamMemberFieldChange('name', e.target.value)}
                placeholder="e.g., Rena"
                className={`w-full ${teamMemberFormErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {teamMemberFormErrors.name && (
                <p className="text-xs text-red-600 mt-1">{teamMemberFormErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="teamMemberTitle" className="text-sm font-medium text-embodied-navy">
                Title *
              </label>
              <Input
                id="teamMemberTitle"
                value={teamMemberFormData.title}
                onChange={(e) => handleTeamMemberFieldChange('title', e.target.value)}
                placeholder="e.g., Marketing Coach & Strategist"
                className={`w-full ${teamMemberFormErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {teamMemberFormErrors.title && (
                <p className="text-xs text-red-600 mt-1">{teamMemberFormErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="teamMemberDescription" className="text-sm font-medium text-embodied-navy">
                Description *
              </label>
              <Textarea
                id="teamMemberDescription"
                value={teamMemberFormData.description}
                onChange={(e) => handleTeamMemberFieldChange('description', e.target.value)}
                placeholder="Enter a description for this team member"
                className={`w-full min-h-[80px] ${teamMemberFormErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {teamMemberFormErrors.description && (
                <p className="text-xs text-red-600 mt-1">{teamMemberFormErrors.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="teamMemberVimeoId" className="text-sm font-medium text-embodied-navy">
                Vimeo ID *
              </label>
              <Input
                id="teamMemberVimeoId"
                value={teamMemberFormData.vimeoId}
                onChange={(e) => handleTeamMemberFieldChange('vimeoId', e.target.value)}
                placeholder="e.g., 1121677183/6654f58fc7"
                className={`w-full ${teamMemberFormErrors.vimeoId ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {teamMemberFormErrors.vimeoId && (
                <p className="text-xs text-red-600 mt-1">{teamMemberFormErrors.vimeoId}</p>
              )}
              <p className="text-xs text-embodied-navy/60">
                Format: videoId/hash (e.g., 1121677183/6654f58fc7)
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="teamMemberStepNumber" className="text-sm font-medium text-embodied-navy">
                Step Number *
              </label>
              <Input
                id="teamMemberStepNumber"
                type="number"
                min="0"
                value={teamMemberFormData.stepNumber}
                onChange={(e) => handleTeamMemberFieldChange('stepNumber', parseInt(e.target.value) || 0)}
                placeholder="e.g., 21"
                className={`w-full ${teamMemberFormErrors.stepNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {teamMemberFormErrors.stepNumber && (
                <p className="text-xs text-red-600 mt-1">{teamMemberFormErrors.stepNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="teamMemberBackgroundColor" className="text-sm font-medium text-embodied-navy">
                Background Color *
              </label>
              <Select
                value={teamMemberFormData.backgroundColor}
                onValueChange={(value: 'blue' | 'coral' | 'orange' | 'navy') => handleTeamMemberFieldChange('backgroundColor', value)}
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseTeamMemberModal}
              disabled={createTeamMemberMutation.isPending || updateTeamMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTeamMemberSubmit}
              disabled={createTeamMemberMutation.isPending || updateTeamMemberMutation.isPending}
              className="bg-embodied-coral hover:bg-embodied-coral/90 text-white disabled:opacity-50"
            >
              {createTeamMemberMutation.isPending || updateTeamMemberMutation.isPending
                ? "Saving..."
                : editingTeamMember
                ? "Update Team Member"
                : "Add Team Member"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Member Confirmation Modal */}
      <Dialog open={isDeleteTeamMemberModalOpen} onOpenChange={setIsDeleteTeamMemberModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleTeamMemberDeleteCancel}
              disabled={deleteTeamMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTeamMemberDeleteConfirm}
              disabled={deleteTeamMemberMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteTeamMemberMutation.isPending ? "Deleting..." : "Delete Team Member"}
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
          <div className="flex items-center justify-between">
            <CardTitle className="editorial-header flex items-center text-embodied-navy">
              <UserCheck className="w-5 h-5 mr-2 text-embodied-coral" />
              Meet The Team
            </CardTitle>
            {user && user.isAdmin && (
              <Button
                onClick={() => handleOpenTeamMemberModal()}
                className="bg-embodied-coral hover:bg-embodied-coral/90 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTeamMembers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={`team-skeleton-${index}`} className="text-center space-y-3 p-6 bg-slate-50/50 rounded-lg animate-pulse">
                  <Skeleton className="w-full aspect-video rounded-lg" />
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : teamMembersError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Error loading team members</p>
              <p className="text-sm text-embodied-navy/60">
                {teamMembersError instanceof Error ? teamMembersError.message : 'Unknown error occurred'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.length === 0 ? (
                <div className="col-span-full text-center py-8 text-embodied-navy/60">
                  No team members found. {user && user.isAdmin && 'Click "Add Team Member" to create one.'}
                </div>
              ) : (
                teamMembers.map((member: TeamMember) => {
                  const bgColorClasses = {
                    blue: "bg-embodied-blue/5",
                    coral: "bg-embodied-coral/5",
                    orange: "bg-embodied-orange/5",
                    navy: "bg-embodied-navy/5"
                  };
                  const bgColor = member.backgroundColor || "blue";

                  return (
                    <div
                      key={member.id}
                      className={`text-center space-y-3 p-6 ${bgColorClasses[bgColor]} rounded-lg relative group`}
                    >
                      {user && user.isAdmin && (
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenTeamMemberModal(member)}
                            className="h-7 w-7 p-0 text-embodied-navy hover:text-embodied-blue bg-white/90 hover:bg-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTeamMemberDeleteClick(member)}
                            className="h-7 w-7 p-0 text-embodied-navy hover:text-red-600 bg-white/90 hover:bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                      <div className="w-full aspect-video rounded-lg overflow-hidden">
                        <VimeoEmbed 
                          vimeoId={member.vimeoId} 
                          title={`${member.name} - ${member.title}`}
                          userId={user?.id || 1}
                          stepNumber={member.stepNumber}
                        />
                      </div>
                      <div>
                        <h4 className="editorial-subheader text-embodied-navy">{member.name} - {member.title}</h4>
                        <p className="editorial-body text-sm text-embodied-navy/80 mt-2">{member.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
