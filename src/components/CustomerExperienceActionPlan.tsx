import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, ArrowRight, Target, Copy } from "lucide-react";

interface CustomerExperienceActionPlanProps {
  responses: { [key: string]: string };
  userId: number;
}

interface ActionItem {
  id: string;
  category: string;
  priority: "high" | "medium" | "low";
  timeframe: string;
  title: string;
  description: string;
  steps: string[];
  dependsOn?: string[];
}

export default function CustomerExperienceActionPlan({ responses, userId }: CustomerExperienceActionPlanProps) {
  const [actionPlan, setActionPlan] = useState<ActionItem[]>([]);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showPlan, setShowPlan] = useState(false);

  const generateActionPlan = () => {
    const actions: ActionItem[] = [];

    // Analyze responses and generate specific actions
    const hasOnboardingPlan = responses["onboarding-0"] || responses["onboarding-1"] || responses["onboarding-2"];
    const hasCommunicationStrategy = responses["communication-0"] || responses["communication-1"];
    const hasSupportSystem = responses["support-0"] || responses["support-1"] || responses["support-2"] || responses["support-3"];
    const hasSuccessTracking = responses["success-measurement-0"] || responses["success-measurement-1"];

    // Week 1: Foundation Setup
    if (hasOnboardingPlan) {
      actions.push({
        id: "onboarding-sequence",
        category: "Onboarding",
        priority: "high",
        timeframe: "Week 1",
        title: "Create Welcome Email Sequence",
        description: "Set up automated emails for the first 48 hours after purchase",
        steps: [
          "Write welcome email with access instructions",
          "Create quick win or first action email",
          "Set up access credentials delivery system",
          "Test the complete sequence"
        ]
      });

      actions.push({
        id: "customer-portal",
        category: "Onboarding",
        priority: "high", 
        timeframe: "Week 1",
        title: "Set Up Customer Access Portal",
        description: "Create the platform where customers will access your content",
        steps: [
          "Choose platform (course site, membership area, etc.)",
          "Set up user accounts and login system",
          "Upload initial content and resources",
          "Create navigation and user experience"
        ]
      });
    }

    // Week 2: Communication Systems
    if (hasCommunicationStrategy) {
      actions.push({
        id: "communication-cadence",
        category: "Engagement",
        priority: "high",
        timeframe: "Week 2", 
        title: "Implement Communication Schedule",
        description: "Set up regular touchpoints to maintain engagement",
        steps: [
          "Schedule weekly check-in emails",
          "Create milestone celebration templates",
          "Set up progress tracking notifications",
          "Plan community or group interaction points"
        ]
      });
    }

    // Week 2-3: Support Infrastructure  
    if (hasSupportSystem) {
      actions.push({
        id: "support-channels",
        category: "Support",
        priority: "medium",
        timeframe: "Week 2-3",
        title: "Establish Support Channels",
        description: "Create clear pathways for customers to get help",
        steps: [
          "Set up primary support email/system",
          "Create FAQ or knowledge base",
          "Define response time commitments", 
          "Train yourself or team on support protocols"
        ]
      });

      actions.push({
        id: "self-service-resources",
        category: "Support",
        priority: "medium",
        timeframe: "Week 3",
        title: "Build Self-Service Resources",
        description: "Create resources customers can use to help themselves",
        steps: [
          "Compile frequently asked questions",
          "Create helpful video tutorials",
          "Design templates and worksheets",
          "Organize resources in easy-to-find locations"
        ]
      });
    }

    // Week 3-4: Success Tracking
    if (hasSuccessTracking) {
      actions.push({
        id: "success-metrics",
        category: "Outcomes",
        priority: "medium",
        timeframe: "Week 3-4",
        title: "Implement Success Tracking",
        description: "Create systems to measure and celebrate customer progress",
        steps: [
          "Define clear success metrics and milestones",
          "Set up progress tracking system",
          "Create before/after documentation process",
          "Plan celebration and recognition events"
        ]
      });

      actions.push({
        id: "testimonial-collection",
        category: "Outcomes", 
        priority: "low",
        timeframe: "Week 4+",
        title: "Success Story Collection Process",
        description: "Systematically gather testimonials and case studies",
        steps: [
          "Create success story interview template",
          "Set up automated testimonial requests",
          "Design case study documentation process",
          "Plan success story sharing and marketing"
        ],
        dependsOn: ["success-metrics"]
      });
    }

    // Always include these foundational actions
    actions.push({
      id: "customer-journey-documentation",
      category: "Foundation",
      priority: "high",
      timeframe: "Week 1",
      title: "Document Complete Customer Journey",
      description: "Create a visual map of your customer's entire experience",
      steps: [
        "Map all touchpoints from purchase to completion",
        "Identify potential friction points",
        "Design solutions for common obstacles",
        "Share journey map with any team members"
      ]
    });

    setActionPlan(actions);
    setShowPlan(true);
  };

  const toggleActionComplete = (actionId: string) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Onboarding": return "bg-blue-50 border-blue-200";
      case "Engagement": return "bg-coral-50 border-coral-200";
      case "Support": return "bg-amber-50 border-amber-200";
      case "Outcomes": return "bg-green-50 border-green-200";
      case "Foundation": return "bg-slate-50 border-slate-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getCompletionStats = () => {
    const total = actionPlan.length;
    const completed = completedActions.size;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const exportActionPlan = () => {
    const planText = actionPlan.map(action => 
      `${action.title} (${action.timeframe})
Priority: ${action.priority.toUpperCase()}
${action.description}

Steps:
${action.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---`
    ).join('\n\n');

    navigator.clipboard.writeText(planText);
  };

  if (!showPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-500" />
            Generate Your Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-slate-600">
              Transform your customer experience planning into a concrete action plan with specific steps and timelines.
            </p>
            <Button onClick={generateActionPlan} size="lg">
              <ArrowRight className="w-4 h-4 mr-2" />
              Generate My Action Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-500" />
              Your Customer Experience Action Plan
            </CardTitle>
            <Button variant="outline" onClick={exportActionPlan}>
              <Copy className="w-4 h-4 mr-2" />
              Export Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-green-600">{stats.percentage}%</div>
              <div className="text-sm text-slate-600">
                {stats.completed} of {stats.total} actions completed
              </div>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This action plan is generated from your customer experience responses. Complete these steps in order to build a comprehensive customer journey system.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {actionPlan.map((action) => {
          const isCompleted = completedActions.has(action.id);
          const canStart = !action.dependsOn || action.dependsOn.every(dep => completedActions.has(dep));
          
          return (
            <Card 
              key={action.id} 
              className={`${getCategoryColor(action.category)} ${isCompleted ? 'opacity-75' : ''} ${!canStart ? 'opacity-50' : ''}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActionComplete(action.id)}
                      disabled={!canStart}
                      className={isCompleted ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </Button>
                    <div>
                      <CardTitle className={`text-lg ${isCompleted ? 'line-through' : ''}`}>
                        {action.title}
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getPriorityColor(action.priority)}>
                      {action.priority} priority
                    </Badge>
                    <Badge variant="outline">
                      {action.timeframe}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Implementation Steps:</h4>
                  <ul className="space-y-1">
                    {action.steps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-slate-700">
                        <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                          {index + 1}
                        </span>
                        <span className={isCompleted ? 'line-through opacity-60' : ''}>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {action.dependsOn && action.dependsOn.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Prerequisite:</strong> Complete the following actions first: {
                        action.dependsOn.map(dep => 
                          actionPlan.find(a => a.id === dep)?.title
                        ).join(', ')
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Ready to Launch?</h3>
            <p className="text-slate-600">
              Once you've completed the high-priority actions, you'll have a solid foundation for delivering an exceptional customer experience.
            </p>
            <Button 
              onClick={() => setShowPlan(false)}
              variant="outline"
            >
              Regenerate Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
