import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Mail, 
  Users, 
  CheckCircle, 
  MessageSquare,
  Download,
  Copy,
  AlertTriangle,
  Target,
  Calendar,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerExperienceTabsProps {
  userId?: number;
}

export default function CustomerExperienceTabs({ userId }: CustomerExperienceTabsProps = {}) {
  const [activeTab, setActiveTab] = useState("onboarding");
  const [savedData, setSavedData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const saveData = (section: string, data: any) => {
    const updated = { ...savedData, [section]: data };
    setSavedData(updated);
    localStorage.setItem(`customerExperience_${userId || 'default'}`, JSON.stringify(updated));

    toast({
      title: "Saved!",
      description: `${section} data has been saved.`,
    });
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please select and copy manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="onboarding" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Onboarding</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Delivery</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Communication</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Feedback</span>
          </TabsTrigger>
        </TabsList>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Customer Onboarding Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Welcome Email Template</h3>
                <Textarea
                  placeholder="Craft your welcome email that sets expectations and gets customers excited..."
                  className="min-h-[200px]"
                  defaultValue={savedData.welcomeEmail || ""}
                  onBlur={(e) => saveData("welcomeEmail", e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Access Instructions</h3>
                <Textarea
                  placeholder="Clear step-by-step instructions for accessing your offer..."
                  className="min-h-[150px]"
                  defaultValue={savedData.accessInstructions || ""}
                  onBlur={(e) => saveData("accessInstructions", e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(savedData.welcomeEmail || "")}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Welcome Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Offer Delivery System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Delivery Schedule</h3>
                <Textarea
                  placeholder="Outline when and how customers receive each part of your offer..."
                  className="min-h-[150px]"
                  defaultValue={savedData.deliverySchedule || ""}
                  onBlur={(e) => saveData("deliverySchedule", e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Content Organization</h3>
                <Textarea
                  placeholder="How will you organize and present your content for easy consumption..."
                  className="min-h-[150px]"
                  defaultValue={savedData.contentOrganization || ""}
                  onBlur={(e) => saveData("contentOrganization", e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Support Resources</h3>
                <Textarea
                  placeholder="What additional resources and support will you provide..."
                  className="min-h-[150px]"
                  defaultValue={savedData.supportResources || ""}
                  onBlur={(e) => saveData("supportResources", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Ongoing Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Check-in Schedule</h3>
                <Textarea
                  placeholder="Plan your customer check-ins and touchpoints..."
                  className="min-h-[150px]"
                  defaultValue={savedData.checkinSchedule || ""}
                  onBlur={(e) => saveData("checkinSchedule", e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Progress Tracking</h3>
                <Textarea
                  placeholder="How will you help customers track their progress and wins..."
                  className="min-h-[150px]"
                  defaultValue={savedData.progressTracking || ""}
                  onBlur={(e) => saveData("progressTracking", e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Community Building</h3>
                <Textarea
                  placeholder="Ideas for building community among your customers..."
                  className="min-h-[150px]"
                  defaultValue={savedData.communityBuilding || ""}
                  onBlur={(e) => saveData("communityBuilding", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Feedback & Success Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Success Metrics</h3>
                <Textarea
                  placeholder="How will you measure customer success and results..."
                  className="min-h-[150px]"
                  defaultValue={savedData.successMetrics || ""}
                  onBlur={(e) => saveData("successMetrics", e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Feedback Collection</h3>
                <Textarea
                  placeholder="Your system for collecting and acting on customer feedback..."
                  className="min-h-[150px]"
                  defaultValue={savedData.feedbackCollection || ""}
                  onBlur={(e) => saveData("feedbackCollection", e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Testimonial Strategy</h3>
                <Textarea
                  placeholder="How you'll capture and use customer success stories..."
                  className="min-h-[150px]"
                  defaultValue={savedData.testimonialStrategy || ""}
                  onBlur={(e) => saveData("testimonialStrategy", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
