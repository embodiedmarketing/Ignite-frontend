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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order?: number;
}

interface FAQFormData {
  question: string;
  answer: string;
}

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  color: OnboardingStepColor;
  order?: number;
}

interface JourneyStepFormData {
  title: string;
  description: string;
  color: OnboardingStepColor;
}

interface OrientationVideo {
  id: string;
  vimeoId: string;
  title: string;
  stepNumber: number;
}

interface OrientationVideoFormData {
  vimeoId: string;
  title: string;
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
  
  // FAQ states
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isDeleteFAQModalOpen, setIsDeleteFAQModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [faqFormData, setFaqFormData] = useState<FAQFormData>({
    question: "",
    answer: ""
  });
  const [faqFormErrors, setFaqFormErrors] = useState<Partial<Record<keyof FAQFormData, string>>>({});
  
  // Journey Step states
  const [isJourneyStepModalOpen, setIsJourneyStepModalOpen] = useState(false);
  const [editingJourneyStep, setEditingJourneyStep] = useState<JourneyStep | null>(null);
  const [isDeleteJourneyStepModalOpen, setIsDeleteJourneyStepModalOpen] = useState(false);
  const [journeyStepToDelete, setJourneyStepToDelete] = useState<JourneyStep | null>(null);
  const [journeyStepFormData, setJourneyStepFormData] = useState<JourneyStepFormData>({
    title: "",
    description: "",
    color: "blue"
  });
  const [journeyStepFormErrors, setJourneyStepFormErrors] = useState<Partial<Record<keyof JourneyStepFormData, string>>>({});
  
  // Orientation Video states
  const [isOrientationVideoModalOpen, setIsOrientationVideoModalOpen] = useState(false);
  const [editingOrientationVideo, setEditingOrientationVideo] = useState<OrientationVideo | null>(null);
  const [isDeleteOrientationVideoModalOpen, setIsDeleteOrientationVideoModalOpen] = useState(false);
  const [orientationVideoToDelete, setOrientationVideoToDelete] = useState<OrientationVideo | null>(null);
  const [orientationVideoFormData, setOrientationVideoFormData] = useState<OrientationVideoFormData>({
    vimeoId: "",
    title: ""
  });
  const [orientationVideoFormErrors, setOrientationVideoFormErrors] = useState<Partial<Record<keyof OrientationVideoFormData, string>>>({});

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

  // Fetch FAQs from API
  const { data: faqs = [], isLoading: isLoadingFAQs, error: faqsError } = useQuery({
    queryKey: ['/api/faqs'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/faqs');
        const data = await response.json();
        return Array.isArray(data) 
          ? data.sort((a: FAQ, b: FAQ) => (a.order || 0) - (b.order || 0))
          : [];
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
      }
    },
    retry: 1
  });

  // Create FAQ mutation
  const createFAQMutation = useMutation({
    mutationFn: async (data: FAQFormData & { order?: number }) => {
      const response = await apiRequest('POST', '/api/faqs', data);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to create FAQ:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create the FAQ. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: FAQ) => {
      // Update state only after successful API response
      queryClient.setQueryData<FAQ[]>(['/api/faqs'], (old = []) => {
        const updated = [...old, data];
        return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      // Invalidate and refetch to ensure we have the latest data from database
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      
      // Close modal and reset form after successful creation
      setIsFAQModalOpen(false);
      setFaqFormData({
        question: "",
        answer: ""
      });
      setEditingFAQ(null);
      setFaqFormErrors({});
      
      toast({
        title: "FAQ Created",
        description: "The FAQ has been created successfully and is now visible.",
      });
    }
  });

  // Update FAQ mutation
  const updateFAQMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FAQFormData> }) => {
      const response = await apiRequest('PUT', `/api/faqs/${id}`, data);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to update FAQ:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the FAQ. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: FAQ) => {
      // Update state only after successful API response
      queryClient.setQueryData<FAQ[]>(['/api/faqs'], (old = []) => {
        return old.map(faq => faq.id === data.id ? data : faq)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      // Invalidate and refetch to ensure we have the latest data from database
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      
      // Close modal and reset form after successful update
      setIsFAQModalOpen(false);
      setFaqFormData({
        question: "",
        answer: ""
      });
      setEditingFAQ(null);
      setFaqFormErrors({});
      
      toast({
        title: "FAQ Updated",
        description: "The FAQ has been updated successfully.",
      });
    }
  });

  // Delete FAQ mutation
  const deleteFAQMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/faqs/${id}`);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to delete FAQ:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete the FAQ. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Update state only after successful API response
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      
      // Close modal after successful deletion
      setIsDeleteFAQModalOpen(false);
      setFaqToDelete(null);
      
      toast({
        title: "FAQ Deleted",
        description: "The FAQ has been deleted successfully.",
      });
    }
  });

  // Fetch journey steps from API
  const { data: journeySteps = [], isLoading: isLoadingJourneySteps, error: journeyStepsError } = useQuery({
    queryKey: ['/api/journey-steps'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/journey-steps');
        const data = await response.json();
        return Array.isArray(data) 
          ? data.sort((a: JourneyStep, b: JourneyStep) => (a.order || 0) - (b.order || 0))
          : [];
      } catch (error) {
        console.error('Error fetching journey steps:', error);
        return [];
      }
    },
    retry: 1
  });

  // Create journey step mutation
  const createJourneyStepMutation = useMutation({
    mutationFn: async (data: JourneyStepFormData & { order?: number }) => {
      const response = await apiRequest('POST', '/api/journey-steps', data);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to create journey step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create the journey step. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: JourneyStep) => {
      queryClient.setQueryData<JourneyStep[]>(['/api/journey-steps'], (old = []) => {
        const updated = [...old, data];
        return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/journey-steps'] });
      
      setIsJourneyStepModalOpen(false);
      setJourneyStepFormData({
        title: "",
        description: "",
        color: "blue"
      });
      setEditingJourneyStep(null);
      setJourneyStepFormErrors({});
      
      toast({
        title: "Journey Step Created",
        description: "The journey step has been created successfully.",
      });
    }
  });

  // Update journey step mutation
  const updateJourneyStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JourneyStepFormData> }) => {
      const response = await apiRequest('PUT', `/api/journey-steps/${id}`, data);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to update journey step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the journey step. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: JourneyStep) => {
      queryClient.setQueryData<JourneyStep[]>(['/api/journey-steps'], (old = []) => {
        return old.map(step => step.id === data.id ? data : step)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/journey-steps'] });
      
      setIsJourneyStepModalOpen(false);
      setJourneyStepFormData({
        title: "",
        description: "",
        color: "blue"
      });
      setEditingJourneyStep(null);
      setJourneyStepFormErrors({});
      
      toast({
        title: "Journey Step Updated",
        description: "The journey step has been updated successfully.",
      });
    }
  });

  // Delete journey step mutation
  const deleteJourneyStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/journey-steps/${id}`);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to delete journey step:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete the journey step. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey-steps'] });
      
      setIsDeleteJourneyStepModalOpen(false);
      setJourneyStepToDelete(null);
      
      toast({
        title: "Journey Step Deleted",
        description: "The journey step has been deleted successfully.",
      });
    }
  });

  // Fetch orientation video from API
  const { data: orientationVideo, isLoading: isLoadingOrientationVideo, error: orientationVideoError } = useQuery({
    queryKey: ['/api/orientation-video'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/orientation-video');
        if (response.status === 404) {
          return null; // No orientation video set yet
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching orientation video:', error);
        return null;
      }
    },
    retry: 1
  });

  // Create orientation video mutation
  const createOrientationVideoMutation = useMutation({
    mutationFn: async (data: OrientationVideoFormData) => {
      const response = await apiRequest('POST', '/api/orientation-video', { ...data, stepNumber: 0 });
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to create orientation video:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create the orientation video. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: OrientationVideo) => {
      queryClient.setQueryData(['/api/orientation-video'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/orientation-video'] });
      
      setIsOrientationVideoModalOpen(false);
      setOrientationVideoFormData({
        vimeoId: "",
        title: ""
      });
      setEditingOrientationVideo(null);
      setOrientationVideoFormErrors({});
      
      toast({
        title: "Orientation Video Created",
        description: "The orientation video has been created successfully.",
      });
    }
  });

  // Update orientation video mutation
  const updateOrientationVideoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrientationVideoFormData> }) => {
      const response = await apiRequest('PUT', `/api/orientation-video/${id}`, data);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to update orientation video:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update the orientation video. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data: OrientationVideo) => {
      queryClient.setQueryData(['/api/orientation-video'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/orientation-video'] });
      
      setIsOrientationVideoModalOpen(false);
      setOrientationVideoFormData({
        vimeoId: "",
        title: ""
      });
      setEditingOrientationVideo(null);
      setOrientationVideoFormErrors({});
      
      toast({
        title: "Orientation Video Updated",
        description: "The orientation video has been updated successfully.",
      });
    }
  });

  // Delete orientation video mutation
  const deleteOrientationVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/orientation-video/${id}`);
      return response.json();
    },
    onError: (error: any) => {
      console.error('Failed to delete orientation video:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete the orientation video. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/orientation-video'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/orientation-video'] });
      
      setIsDeleteOrientationVideoModalOpen(false);
      setOrientationVideoToDelete(null);
      
      toast({
        title: "Orientation Video Deleted",
        description: "The orientation video has been deleted successfully.",
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

  // FAQ handlers
  const handleOpenFAQModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq);
      setFaqFormData({
        question: faq.question,
        answer: faq.answer
      });
    } else {
      setEditingFAQ(null);
      setFaqFormData({
        question: "",
        answer: ""
      });
    }
    setFaqFormErrors({});
    setIsFAQModalOpen(true);
  };

  const handleCloseFAQModal = () => {
    setIsFAQModalOpen(false);
    setEditingFAQ(null);
    setFaqFormData({
      question: "",
      answer: ""
    });
    setFaqFormErrors({});
  };

  const validateFAQForm = (): boolean => {
    const errors: Partial<Record<keyof FAQFormData, string>> = {};

    if (!faqFormData.question.trim()) {
      errors.question = "Question is required";
    } else if (faqFormData.question.trim().length < 5) {
      errors.question = "Question must be at least 5 characters";
    }

    if (!faqFormData.answer.trim()) {
      errors.answer = "Answer is required";
    } else if (faqFormData.answer.trim().length < 10) {
      errors.answer = "Answer must be at least 10 characters";
    }

    setFaqFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFAQSubmit = () => {
    if (!validateFAQForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (editingFAQ) {
      updateFAQMutation.mutate({ id: editingFAQ.id, data: faqFormData });
    } else {
      createFAQMutation.mutate({ ...faqFormData, order: faqs.length });
    }
  };

  const handleFAQFieldChange = (field: keyof FAQFormData, value: string) => {
    setFaqFormData({ ...faqFormData, [field]: value });
    // Clear error for this field when user starts typing
    if (faqFormErrors[field]) {
      setFaqFormErrors({ ...faqFormErrors, [field]: undefined });
    }
  };

  const handleFAQDeleteClick = (faq: FAQ) => {
    setFaqToDelete(faq);
    setIsDeleteFAQModalOpen(true);
  };

  const handleFAQDeleteConfirm = () => {
    if (faqToDelete) {
      deleteFAQMutation.mutate(faqToDelete.id);
    }
  };

  const handleFAQDeleteCancel = () => {
    setIsDeleteFAQModalOpen(false);
    setFaqToDelete(null);
  };

  // Journey Step handlers
  const handleOpenJourneyStepModal = (step?: JourneyStep) => {
    setJourneyStepFormErrors({});
    if (step) {
      setEditingJourneyStep(step);
      setJourneyStepFormData({
        title: step.title,
        description: step.description,
        color: step.color
      });
    } else {
      setEditingJourneyStep(null);
      setJourneyStepFormData({
        title: "",
        description: "",
        color: "blue"
      });
    }
    setIsJourneyStepModalOpen(true);
  };

  const handleCloseJourneyStepModal = () => {
    setIsJourneyStepModalOpen(false);
    setEditingJourneyStep(null);
    setJourneyStepFormData({
      title: "",
      description: "",
      color: "blue"
    });
    setJourneyStepFormErrors({});
  };

  const validateJourneyStepForm = (): boolean => {
    const errors: Partial<Record<keyof JourneyStepFormData, string>> = {};

    if (!journeyStepFormData.title.trim()) {
      errors.title = "Title is required";
    } else if (journeyStepFormData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    if (!journeyStepFormData.description.trim()) {
      errors.description = "Description is required";
    } else if (journeyStepFormData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    setJourneyStepFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleJourneyStepSubmit = () => {
    if (!validateJourneyStepForm()) {
      return;
    }

    if (editingJourneyStep) {
      updateJourneyStepMutation.mutate({
        id: editingJourneyStep.id,
        data: journeyStepFormData
      });
    } else {
      createJourneyStepMutation.mutate({
        ...journeyStepFormData,
        order: journeySteps.length
      });
    }
  };

  const handleJourneyStepFieldChange = (field: keyof JourneyStepFormData, value: string | OnboardingStepColor) => {
    setJourneyStepFormData({ ...journeyStepFormData, [field]: value });
    if (journeyStepFormErrors[field]) {
      setJourneyStepFormErrors({ ...journeyStepFormErrors, [field]: undefined });
    }
  };

  const handleJourneyStepDeleteClick = (step: JourneyStep) => {
    setJourneyStepToDelete(step);
    setIsDeleteJourneyStepModalOpen(true);
  };

  const handleJourneyStepDeleteConfirm = () => {
    if (journeyStepToDelete) {
      deleteJourneyStepMutation.mutate(journeyStepToDelete.id);
    }
  };

  const handleJourneyStepDeleteCancel = () => {
    setIsDeleteJourneyStepModalOpen(false);
    setJourneyStepToDelete(null);
  };

  // Orientation Video handlers
  const handleOpenOrientationVideoModal = (video?: OrientationVideo) => {
    setOrientationVideoFormErrors({});
    if (video) {
      setEditingOrientationVideo(video);
      setOrientationVideoFormData({
        vimeoId: video.vimeoId,
        title: video.title
      });
    } else {
      setEditingOrientationVideo(null);
      setOrientationVideoFormData({
        vimeoId: "",
        title: ""
      });
    }
    setIsOrientationVideoModalOpen(true);
  };

  const handleCloseOrientationVideoModal = () => {
    setIsOrientationVideoModalOpen(false);
    setEditingOrientationVideo(null);
    setOrientationVideoFormData({
      vimeoId: "",
      title: ""
    });
    setOrientationVideoFormErrors({});
  };

  const validateOrientationVideoForm = (): boolean => {
    const errors: Partial<Record<keyof OrientationVideoFormData, string>> = {};

    if (!orientationVideoFormData.title.trim()) {
      errors.title = "Title is required";
    } else if (orientationVideoFormData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    if (!orientationVideoFormData.vimeoId.trim()) {
      errors.vimeoId = "Vimeo ID is required";
    } else {
      // Validate Vimeo ID format (e.g., "1123902105/e223b2adb0" or just "1123902105")
      const vimeoIdPattern = /^[\d]+(\/[\w]+)?$/;
      if (!vimeoIdPattern.test(orientationVideoFormData.vimeoId.trim())) {
        errors.vimeoId = "Invalid Vimeo ID format. Use format like '1123902105' or '1123902105/e223b2adb0'";
      }
    }

    setOrientationVideoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrientationVideoSubmit = () => {
    if (!validateOrientationVideoForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (editingOrientationVideo) {
      updateOrientationVideoMutation.mutate({
        id: editingOrientationVideo.id,
        data: orientationVideoFormData
      });
    } else {
      createOrientationVideoMutation.mutate(orientationVideoFormData);
    }
  };

  const handleOrientationVideoFieldChange = (field: keyof OrientationVideoFormData, value: string) => {
    setOrientationVideoFormData({ ...orientationVideoFormData, [field]: value });
    if (orientationVideoFormErrors[field]) {
      setOrientationVideoFormErrors({ ...orientationVideoFormErrors, [field]: undefined });
    }
  };

  const handleOrientationVideoDeleteClick = (video: OrientationVideo) => {
    setOrientationVideoToDelete(video);
    setIsDeleteOrientationVideoModalOpen(true);
  };

  const handleOrientationVideoDeleteConfirm = () => {
    if (orientationVideoToDelete) {
      deleteOrientationVideoMutation.mutate(orientationVideoToDelete.id);
    }
  };

  const handleOrientationVideoDeleteCancel = () => {
    setIsDeleteOrientationVideoModalOpen(false);
    setOrientationVideoToDelete(null);
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
              <div className="flex items-center space-x-2">
                {user && user.isAdmin  && orientationVideo?.vimeoId&& (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenOrientationVideoModal(orientationVideo || undefined)}
                      className="text-embodied-navy hover:text-embodied-blue"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {orientationVideo ? 'Edit' : 'Add'}
                    </Button>
                    {orientationVideo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrientationVideoDeleteClick(orientationVideo)}
                        className="text-embodied-navy hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowWelcomeVideo(false)}
                  className="text-embodied-navy hover:text-embodied-coral"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingOrientationVideo ? (
                <div className="max-w-2xl mx-auto">
                  <Skeleton className="w-full aspect-video rounded-lg" />
                </div>
              ) : orientationVideoError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">Error loading orientation video</p>
                  <p className="text-sm text-embodied-navy/60">
                    {orientationVideoError instanceof Error ? orientationVideoError.message : 'Unknown error occurred'}
                  </p>
                </div>
              ) : !orientationVideo ? (
                <div className="text-center py-8 text-embodied-navy/60">
                  {user && user.isAdmin ? (
                    <>
                      <p className="mb-4">No orientation video set.</p>
                      <Button
                        onClick={() => handleOpenOrientationVideoModal()}
                        className="bg-embodied-coral hover:bg-embodied-coral/90 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Orientation Video
                      </Button>
                    </>
                  ) : (
                    <p>Orientation video coming soon.</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Welcome Video */}
                  <div className="max-w-2xl mx-auto">
                    <VimeoEmbed 
                      vimeoId={orientationVideo.vimeoId} 
                      title={orientationVideo.title}
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
                </>
              )}
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

      {/* Add/Edit FAQ Modal */}
      <Dialog open={isFAQModalOpen} onOpenChange={setIsFAQModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingFAQ ? "Edit FAQ" : "Add New FAQ"}
            </DialogTitle>
            <DialogDescription>
              {editingFAQ 
                ? "Update the FAQ details below."
                : "Fill in the details to add a new FAQ."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="faqQuestion" className="text-sm font-medium text-embodied-navy">
                Question *
              </label>
              <Input
                id="faqQuestion"
                value={faqFormData.question}
                onChange={(e) => handleFAQFieldChange('question', e.target.value)}
                placeholder="e.g., What should I do first when I join?"
                className={`w-full ${faqFormErrors.question ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {faqFormErrors.question && (
                <p className="text-xs text-red-600 mt-1">{faqFormErrors.question}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="faqAnswer" className="text-sm font-medium text-embodied-navy">
                Answer *
              </label>
              <Textarea
                id="faqAnswer"
                value={faqFormData.answer}
                onChange={(e) => handleFAQFieldChange('answer', e.target.value)}
                placeholder="Enter the answer to this question"
                className={`w-full min-h-[120px] ${faqFormErrors.answer ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {faqFormErrors.answer && (
                <p className="text-xs text-red-600 mt-1">{faqFormErrors.answer}</p>
              )}
              <p className="text-xs text-embodied-navy/60">
                You can use line breaks (Enter) to format your answer. They will be preserved when displayed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseFAQModal}
              disabled={createFAQMutation.isPending || updateFAQMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFAQSubmit}
              disabled={createFAQMutation.isPending || updateFAQMutation.isPending}
              className="bg-embodied-navy hover:bg-embodied-navy/90 text-white disabled:opacity-50"
            >
              {createFAQMutation.isPending || updateFAQMutation.isPending
                ? "Saving..."
                : editingFAQ
                ? "Update FAQ"
                : "Add FAQ"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete FAQ Confirmation Modal */}
      <Dialog open={isDeleteFAQModalOpen} onOpenChange={setIsDeleteFAQModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete FAQ</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleFAQDeleteCancel}
              disabled={deleteFAQMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFAQDeleteConfirm}
              disabled={deleteFAQMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteFAQMutation.isPending ? "Deleting..." : "Delete FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Journey Step Modal */}
      <Dialog open={isJourneyStepModalOpen} onOpenChange={setIsJourneyStepModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingJourneyStep ? "Edit Journey Step" : "Add New Journey Step"}
            </DialogTitle>
            <DialogDescription>
              {editingJourneyStep 
                ? "Update the journey step details below."
                : "Fill in the details to create a new journey step."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="journeyStepTitle" className="text-sm font-medium text-embodied-navy">
                Title *
              </label>
              <Input
                id="journeyStepTitle"
                value={journeyStepFormData.title}
                onChange={(e) => handleJourneyStepFieldChange('title', e.target.value)}
                onBlur={() => {
                  if (journeyStepFormData.title.trim() && journeyStepFormData.title.trim().length < 3) {
                    setJourneyStepFormErrors({ ...journeyStepFormErrors, title: "Title must be at least 3 characters" });
                  }
                }}
                placeholder="e.g., Your Foundation"
                className={`w-full ${journeyStepFormErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {journeyStepFormErrors.title && (
                <p className="text-xs text-red-600 mt-1">{journeyStepFormErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="journeyStepDescription" className="text-sm font-medium text-embodied-navy">
                Description *
              </label>
              <Textarea
                id="journeyStepDescription"
                value={journeyStepFormData.description}
                onChange={(e) => handleJourneyStepFieldChange('description', e.target.value)}
                onBlur={() => {
                  if (journeyStepFormData.description.trim() && journeyStepFormData.description.trim().length < 10) {
                    setJourneyStepFormErrors({ ...journeyStepFormErrors, description: "Description must be at least 10 characters" });
                  }
                }}
                placeholder="e.g., Master your messaging and define your irresistible offers so that the rest of your marketing is easy!"
                className={`w-full min-h-[100px] ${journeyStepFormErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {journeyStepFormErrors.description && (
                <p className="text-xs text-red-600 mt-1">{journeyStepFormErrors.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="journeyStepColor" className="text-sm font-medium text-embodied-navy">
                Color *
              </label>
              <Select
                value={journeyStepFormData.color}
                onValueChange={(value: OnboardingStepColor) => handleJourneyStepFieldChange('color', value)}
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
              onClick={handleCloseJourneyStepModal}
              disabled={createJourneyStepMutation.isPending || updateJourneyStepMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJourneyStepSubmit}
              disabled={createJourneyStepMutation.isPending || updateJourneyStepMutation.isPending}
              className="bg-embodied-coral hover:bg-embodied-coral/90 text-white disabled:opacity-50"
            >
              {createJourneyStepMutation.isPending || updateJourneyStepMutation.isPending
                ? "Saving..."
                : editingJourneyStep
                ? "Update Step"
                : "Add Step"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Journey Step Confirmation Modal */}
      <Dialog open={isDeleteJourneyStepModalOpen} onOpenChange={setIsDeleteJourneyStepModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Journey Step</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this journey step? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleJourneyStepDeleteCancel}
              disabled={deleteJourneyStepMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJourneyStepDeleteConfirm}
              disabled={deleteJourneyStepMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteJourneyStepMutation.isPending ? "Deleting..." : "Delete Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Orientation Video Modal */}
      <Dialog open={isOrientationVideoModalOpen} onOpenChange={setIsOrientationVideoModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingOrientationVideo ? "Edit Orientation Video" : "Add Orientation Video"}
            </DialogTitle>
            <DialogDescription>
              {editingOrientationVideo 
                ? "Update the orientation video details below."
                : "Fill in the details to add an orientation video."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="orientationVideoTitle" className="text-sm font-medium text-embodied-navy">
                Title *
              </label>
              <Input
                id="orientationVideoTitle"
                value={orientationVideoFormData.title}
                onChange={(e) => handleOrientationVideoFieldChange('title', e.target.value)}
                onBlur={() => {
                  if (orientationVideoFormData.title.trim() && orientationVideoFormData.title.trim().length < 3) {
                    setOrientationVideoFormErrors({ ...orientationVideoFormErrors, title: "Title must be at least 3 characters" });
                  }
                }}
                placeholder="e.g., Welcome to IGNITE!"
                className={`w-full ${orientationVideoFormErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {orientationVideoFormErrors.title && (
                <p className="text-xs text-red-600 mt-1">{orientationVideoFormErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="orientationVideoVimeoId" className="text-sm font-medium text-embodied-navy">
                Vimeo ID *
              </label>
              <Input
                id="orientationVideoVimeoId"
                value={orientationVideoFormData.vimeoId}
                onChange={(e) => handleOrientationVideoFieldChange('vimeoId', e.target.value)}
                onBlur={() => {
                  if (orientationVideoFormData.vimeoId.trim()) {
                    const vimeoIdPattern = /^[\d]+(\/[\w]+)?$/;
                    if (!vimeoIdPattern.test(orientationVideoFormData.vimeoId.trim())) {
                      setOrientationVideoFormErrors({ ...orientationVideoFormErrors, vimeoId: "Invalid Vimeo ID format. Use format like '1123902105' or '1123902105/e223b2adb0'" });
                    }
                  }
                }}
                placeholder="e.g., 1123902105/e223b2adb0 or 1123902105"
                className={`w-full ${orientationVideoFormErrors.vimeoId ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {orientationVideoFormErrors.vimeoId && (
                <p className="text-xs text-red-600 mt-1">{orientationVideoFormErrors.vimeoId}</p>
              )}
              <p className="text-xs text-embodied-navy/60">
                Enter the Vimeo video ID. You can find this in the Vimeo video URL or embed code.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseOrientationVideoModal}
              disabled={createOrientationVideoMutation.isPending || updateOrientationVideoMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOrientationVideoSubmit}
              disabled={createOrientationVideoMutation.isPending || updateOrientationVideoMutation.isPending}
              className="bg-embodied-coral hover:bg-embodied-coral/90 text-white disabled:opacity-50"
            >
              {createOrientationVideoMutation.isPending || updateOrientationVideoMutation.isPending
                ? "Saving..."
                : editingOrientationVideo
                ? "Update Video"
                : "Add Video"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Orientation Video Confirmation Modal */}
      <Dialog open={isDeleteOrientationVideoModalOpen} onOpenChange={setIsDeleteOrientationVideoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Orientation Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this orientation video? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleOrientationVideoDeleteCancel}
              disabled={deleteOrientationVideoMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOrientationVideoDeleteConfirm}
              disabled={deleteOrientationVideoMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteOrientationVideoMutation.isPending ? "Deleting..." : "Delete Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Steps Overview */}
      <Card className="border-embodied-coral/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="editorial-header flex items-center text-embodied-navy">
              <Rocket className="w-5 h-5 mr-2 text-embodied-coral" />
              Your IGNITE Journey
            </CardTitle>
            {user && user.isAdmin && (
              <Button
                onClick={() => handleOpenJourneyStepModal()}
                className="bg-embodied-coral hover:bg-embodied-coral/90 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Journey
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingJourneySteps ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50 animate-pulse">
                  <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : journeyStepsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Error loading journey steps</p>
              <p className="text-sm text-embodied-navy/60">
                {journeyStepsError instanceof Error ? journeyStepsError.message : 'Unknown error occurred'}
              </p>
            </div>
          ) : journeySteps.length === 0 ? (
            <div className="text-center py-8 text-embodied-navy/60">
              No journey steps found. {user && user.isAdmin && 'Click "Add Step" to create one.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {journeySteps.map((step: JourneyStep, index: number) => {
                const stepNumber = step.order !== undefined ? step.order + 1 : index + 1;
                const colorClasses = {
                  blue: "bg-embodied-blue",
                  coral: "bg-embodied-coral",
                  orange: "bg-embodied-orange",
                  navy: "bg-embodied-navy"
                };
                const badgeColor = colorClasses[step.color as keyof typeof colorClasses] || "bg-embodied-blue";

                return (
                  <div key={step.id} className="relative text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50 group">
                    {user && user.isAdmin && (
                      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenJourneyStepModal(step);
                          }}
                          className="h-7 w-7 p-0 text-embodied-navy hover:text-embodied-blue bg-white/90 hover:bg-white shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJourneyStepDeleteClick(step);
                          }}
                          className="h-7 w-7 p-0 text-embodied-navy hover:text-red-600 bg-white/90 hover:bg-white shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full ${badgeColor} flex items-center justify-center mx-auto shadow-lg`}>
                      <span className="text-white font-bold">{stepNumber}</span>
                    </div>
                    <div>
                      <h3 className="editorial-subheader text-embodied-navy">{step.title}</h3>
                      <p className="editorial-body text-sm">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
          <div className="flex items-center justify-between">
            <CardTitle className="editorial-header flex items-center text-embodied-navy">
              <HelpCircle className="w-5 h-5 mr-2 text-embodied-navy" />
              FAQ's
            </CardTitle>
            {user && user.isAdmin && (
              <Button
                onClick={() => handleOpenFAQModal()}
                className="bg-embodied-navy hover:bg-embodied-navy/90 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingFAQs ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={`faq-skeleton-${index}`} className="border border-embodied-navy/10 rounded-lg p-4 animate-pulse">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : faqsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Error loading FAQs</p>
              <p className="text-sm text-embodied-navy/60">
                {faqsError instanceof Error ? faqsError.message : 'Unknown error occurred'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.length === 0 ? (
                <div className="text-center py-8 text-embodied-navy/60">
                  No FAQs found. {user && user.isAdmin && 'Click "Add FAQ" to create one.'}
                </div>
              ) : (
                faqs.map((faq: FAQ) => (
                  <div key={faq.id} className="border border-embodied-navy/10 rounded-lg relative group">
                    {user && user.isAdmin && (
                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFAQModal(faq)}
                          className="h-7 w-7 p-0 text-embodied-navy hover:text-embodied-blue bg-white/90 hover:bg-white"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFAQDeleteClick(faq)}
                          className="h-7 w-7 p-0 text-embodied-navy hover:text-red-600 bg-white/90 hover:bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-embodied-navy/5 transition-colors"
                    >
                      <span className="editorial-subheader text-embodied-navy pr-8">{faq.question}</span>
                      {expandedFaq === faq.id ? (
                        <ChevronDown className="w-5 h-5 text-embodied-navy flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-embodied-navy flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-4 pt-0">
                        <p className="editorial-body text-embodied-navy/80 whitespace-pre-line">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
