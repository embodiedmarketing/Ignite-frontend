import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

const offerTypeSchema = z.object({
  type: z.enum(["course", "consulting", "service", "product"]),
});

const offerDetailsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

interface OfferWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const offerTypes = [
  {
    type: "course" as const,
    title: "Online Course",
    description: "Create comprehensive video lessons, modules, and assignments",
    icon: "🎓",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    selectedColor: "border-blue-500 bg-blue-50",
  },
  {
    type: "consulting" as const,
    title: "Consulting/Coaching",
    description: "One-on-one or group sessions with personalized guidance",
    icon: "👔",
    bgColor: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    selectedColor: "border-purple-500 bg-purple-50",
  },
  {
    type: "service" as const,
    title: "Done-for-You Service",
    description: "Complete a specific task or project for your clients",
    icon: "⚙️",
    bgColor: "bg-green-50 hover:bg-green-100 border-green-200",
    selectedColor: "border-green-500 bg-green-50",
  },
  {
    type: "product" as const,
    title: "Digital Product",
    description: "Templates, tools, software, or other downloadable products",
    icon: "📦",
    bgColor: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    selectedColor: "border-orange-500 bg-orange-50",
  },
];

export default function OfferWizard({ open, onOpenChange }: OfferWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const typeForm = useForm<z.infer<typeof offerTypeSchema>>({
    resolver: zodResolver(offerTypeSchema),
    defaultValues: { type: "course" },
  });

  const detailsForm = useForm<z.infer<typeof offerDetailsSchema>>({
    resolver: zodResolver(offerDetailsSchema),
    defaultValues: { title: "", description: "" },
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/offers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Success!",
        description: "Your offer has been created successfully.",
      });
      onOpenChange(false);
      resetWizard();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedType("");
    typeForm.reset();
    detailsForm.reset();
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    typeForm.setValue("type", type as any);
  };

  const handleCreateOffer = async () => {
    const typeData = typeForm.getValues();
    const detailsData = detailsForm.getValues();
    
    await createOfferMutation.mutateAsync({
      userId: 1, // Default user for demo
      type: typeData.type,
      title: detailsData.title,
      description: detailsData.description,
      status: "draft",
      progress: 16,
      currentStep: 2,
      totalSteps: 6,
    });
  };

  const stepTitles = [
    "Offer Type",
    "Details", 
    "Pricing",
    "Customers",
    "Validation",
    "Launch"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Create Your Paid Offer
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-slate-500">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              {stepTitles.map((title, index) => (
                <span
                  key={title}
                  className={index + 1 === currentStep ? "font-medium text-primary" : ""}
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                What type of offer do you want to create?
              </h3>
              <p className="text-slate-600 mb-6">
                Choose the format that best fits your expertise and target audience.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {offerTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => handleTypeSelect(type.type)}
                    className={`text-left p-4 border-2 rounded-lg transition-all ${
                      selectedType === type.type
                        ? type.selectedColor
                        : `${type.bgColor} border-slate-200`
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="text-2xl">{type.icon}</div>
                      <h4 className="font-semibold text-slate-900">{type.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Tell us about your offer
              </h3>
              <p className="text-slate-600 mb-6">
                Provide basic details about what you're creating.
              </p>
              
              <Form {...detailsForm}>
                <form className="space-y-4">
                  <FormField
                    control={detailsForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Master Digital Marketing in 30 Days"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={detailsForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what your offer includes and what outcomes customers can expect..."
                            rows={4}
                            spellCheck={true}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          )}

          {currentStep > 2 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Step {currentStep}: {stepTitles[currentStep - 1]}
              </h3>
              <p className="text-slate-600 mb-6">
                This step is coming soon! For now, let's complete your basic offer setup.
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 2 ? (
              <Button
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedType}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : currentStep === 2 ? (
              <Button
                onClick={handleCreateOffer}
                disabled={createOfferMutation.isPending}
              >
                {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={currentStep === totalSteps}>
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
