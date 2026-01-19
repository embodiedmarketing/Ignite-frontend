import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import { AlertCircle, Bug, Lightbulb, Zap } from "lucide-react";

interface IssueReportDialogProps {
  userId: number;
  userEmail?: string;
  userName?: string;
  trigger?: React.ReactNode;
}

export default function IssueReportDialog({ userId, userEmail,userName , trigger }: IssueReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    issueType: "",
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/issue-reports", {
        ...data,
        priority: "medium", // Default priority since user won't select it
        userId,
        userEmail,
        userName,
        pageUrl: window.location.href,
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue reported successfully",
        description: "Thank you for your feedback. We'll review your report and get back to you soon."
      });
      setOpen(false);
      setFormData({
        issueType: "",
        title: "",
        description: "",
        stepsToReproduce: "",
        expectedBehavior: "",
        actualBehavior: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/issue-reports"] });
    },
    onError: () => {
      toast({
        title: "Failed to submit report",
        description: "Please try again or contact support directly.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.issueType || !formData.title || !formData.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    submitIssueMutation.mutate(formData);
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug className="w-4 h-4" />;
      case "feature_request": return <Lightbulb className="w-4 h-4" />;
      case "improvement": return <Zap className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-embodied-navy border-embodied-coral hover:bg-embodied-coral hover:text-white">
            <AlertCircle className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-embodied-navy">
            <AlertCircle className="w-5 h-5 mr-2 text-embodied-coral" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs, requesting features, or suggesting improvements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type *</Label>
            <Select 
              value={formData.issueType} 
              onValueChange={(value) => setFormData({...formData, issueType: value})}
            >
              <SelectTrigger data-testid="select-issue-type">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  <div className="flex items-center">
                    <Bug className="w-4 h-4 mr-2" />
                    Bug Report
                  </div>
                </SelectItem>
                <SelectItem value="feature_request">
                  <div className="flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Feature Request
                  </div>
                </SelectItem>
                <SelectItem value="improvement">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Improvement
                  </div>
                </SelectItem>
                <SelectItem value="technical_issue">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Technical Issue
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Brief description of the issue"
              className="focus:border-embodied-blue"
              data-testid="input-issue-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Provide detailed information about the issue or request"
              rows={4}
              className="focus:border-embodied-blue"
              spellCheck={true}
              data-testid="textarea-issue-description"
            />
          </div>

          {formData.issueType === "bug" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
                <Textarea
                  id="stepsToReproduce"
                  value={formData.stepsToReproduce}
                  onChange={(e) => setFormData({...formData, stepsToReproduce: e.target.value})}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. Notice that..."
                  rows={3}
                  className="focus:border-embodied-blue"
                  spellCheck={true}
                  data-testid="textarea-steps-to-reproduce"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedBehavior">Expected Behavior</Label>
                  <Textarea
                    id="expectedBehavior"
                    value={formData.expectedBehavior}
                    onChange={(e) => setFormData({...formData, expectedBehavior: e.target.value})}
                    placeholder="What should happen?"
                    rows={3}
                    className="focus:border-embodied-blue"
                    spellCheck={true}
                    data-testid="textarea-expected-behavior"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualBehavior">Actual Behavior</Label>
                  <Textarea
                    id="actualBehavior"
                    value={formData.actualBehavior}
                    onChange={(e) => setFormData({...formData, actualBehavior: e.target.value})}
                    placeholder="What actually happens?"
                    rows={3}
                    className="focus:border-embodied-blue"
                    spellCheck={true}
                    data-testid="textarea-actual-behavior"
                  />
                </div>
              </div>
            </>
          )}

          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            <strong>Note:</strong> Your browser information and current page URL will be automatically included to help with debugging.
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            data-testid="button-cancel-report"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitIssueMutation.isPending}
            className="bg-embodied-blue hover:bg-embodied-navy"
            data-testid="button-submit-report"
          >
            {submitIssueMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
