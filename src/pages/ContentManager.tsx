import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, FileText, Plus, Edit, Save, Play, Trash2 } from "lucide-react";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StepContent, Template } from "@shared/schema";

const stepContentSchema = z.object({
  stepNumber: z.number(),
  stepName: z.string().min(1, "Step name is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  detailedContent: z.string().optional(),
  tips: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  questions: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).optional(),
  stepNumber: z.number().optional(),
});

interface VideoManagerProps {
  stepContent: StepContent;
  onUpdate: (videos: any) => void;
}

function VideoManager({ stepContent, onUpdate }: VideoManagerProps) {
  const [videos, setVideos] = useState<any>(stepContent.videos || { vimeoIds: [], titles: [], descriptions: [] });
  const [newVimeoId, setNewVimeoId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const addVideo = () => {
    if (!newVimeoId.trim() || !newTitle.trim()) return;
    
    const updatedVideos = {
      vimeoIds: [...(videos.vimeoIds || []), newVimeoId.trim()],
      titles: [...(videos.titles || []), newTitle.trim()],
      descriptions: [...(videos.descriptions || []), newDescription.trim()]
    };
    
    setVideos(updatedVideos);
    onUpdate(updatedVideos);
    setNewVimeoId("");
    setNewTitle("");
    setNewDescription("");
  };

  const removeVideo = (index: number) => {
    const updatedVideos = {
      vimeoIds: videos.vimeoIds?.filter((_: any, i: number) => i !== index) || [],
      titles: videos.titles?.filter((_: any, i: number) => i !== index) || [],
      descriptions: videos.descriptions?.filter((_: any, i: number) => i !== index) || []
    };
    
    setVideos(updatedVideos);
    onUpdate(updatedVideos);
  };

  return (
    <div className="space-y-4">
      {/* Existing Videos */}
      {videos.titles && videos.titles.length > 0 && (
        <div className="space-y-3">
          {videos.titles.map((title: string, index: number) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
              <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                <Play className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-slate-500">
                  ID: {videos.vimeoIds?.[index]} | {videos.descriptions?.[index] || "No description"}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVideo(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Video */}
      <div className="border border-dashed border-slate-300 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Vimeo Video ID</label>
            <Input
              value={newVimeoId}
              onChange={(e) => setNewVimeoId(e.target.value)}
              placeholder="e.g., 123456789"
              className="text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              From URL: vimeo.com/123456789
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Video Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Introduction to Brand Voice"
              className="text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Description (Optional)</label>
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Brief description of what this video covers"
            className="text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={addVideo}
          disabled={!newVimeoId.trim() || !newTitle.trim()}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Video
        </Button>
      </div>
    </div>
  );
}

export default function ContentManager() {
  const [selectedStep, setSelectedStep] = useState<StepContent | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTip, setNewTip] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newActionItem, setNewActionItem] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: stepContent = [] } = useQuery<StepContent[]>({
    queryKey: ["/api/step-content"],
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Forms
  const stepForm = useForm<z.infer<typeof stepContentSchema>>({
    resolver: zodResolver(stepContentSchema),
    defaultValues: {
      stepNumber: 1,
      stepName: "",
      title: "",
      description: "",
      detailedContent: "",
      tips: [],
      examples: [],
      questions: [],
      actionItems: [],
    },
  });

  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      content: "",
      tags: [],
    },
  });

  // Mutations
  const updateStepMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<StepContent> }) => {
      return apiRequest("PATCH", `/api/step-content/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/step-content"] });
      toast({ title: "Step content updated successfully" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      return apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      templateForm.reset();
      toast({ title: "Template created successfully" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Template> }) => {
      return apiRequest("PATCH", `/api/templates/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditingTemplate(null);
      toast({ title: "Template updated successfully" });
    },
  });

  const handleStepSelect = (step: StepContent) => {
    setSelectedStep(step);
    stepForm.reset({
      stepNumber: step.stepNumber,
      stepName: step.stepName,
      title: step.title,
      description: step.description,
      detailedContent: step.detailedContent || "",
      tips: step.tips || [],
      examples: step.examples || [],
      questions: step.questions || [],
      actionItems: step.actionItems || [],
    });
  };

  const handleUpdateStep = (data: z.infer<typeof stepContentSchema>) => {
    if (!selectedStep) return;
    updateStepMutation.mutate({
      id: selectedStep.id,
      updates: data,
    });
  };

  const addArrayItem = (field: 'tips' | 'examples' | 'questions' | 'actionItems', value: string) => {
    if (!value.trim()) return;
    const current = stepForm.getValues(field) || [];
    stepForm.setValue(field, [...current, value.trim()]);
    
    // Clear the input
    switch (field) {
      case 'tips': setNewTip(""); break;
      case 'examples': setNewExample(""); break;
      case 'questions': setNewQuestion(""); break;
      case 'actionItems': setNewActionItem(""); break;
    }
  };

  const removeArrayItem = (field: 'tips' | 'examples' | 'questions' | 'actionItems', index: number) => {
    const current = stepForm.getValues(field) || [];
    stepForm.setValue(field, current.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Content Manager</h2>
        <p className="text-slate-600">Customize step content and templates with your expertise</p>
      </div>

      <Tabs defaultValue="steps" className="space-y-6">
        <TabsList>
          <TabsTrigger value="steps" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Step Content</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Step List */}
            <Card>
              <CardHeader>
                <CardTitle>Offer Creation Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stepContent.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => handleStepSelect(step)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedStep?.id === step.id
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-medium text-slate-900">
                        Step {step.stepNumber}: {step.stepName}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{step.title}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step Editor */}
            <div className="lg:col-span-2">
              {selectedStep ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Step Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...stepForm}>
                      <form onSubmit={stepForm.handleSubmit(handleUpdateStep)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={stepForm.control}
                            name="stepName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Step Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={stepForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={stepForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} spellCheck={true} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={stepForm.control}
                          name="detailedContent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Detailed Content</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={4} spellCheck={true} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Tips Section */}
                        <div>
                          <FormLabel>Tips</FormLabel>
                          <div className="space-y-2 mt-2">
                            {(stepForm.watch("tips") || []).map((tip, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <div className="flex-1 p-2 bg-slate-50 rounded text-sm">{tip}</div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeArrayItem("tips", index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <Input
                                value={newTip}
                                onChange={(e) => setNewTip(e.target.value)}
                                placeholder="Add a tip..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem("tips", newTip))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addArrayItem("tips", newTip)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Examples Section */}
                        <div>
                          <FormLabel>Examples</FormLabel>
                          <div className="space-y-2 mt-2">
                            {(stepForm.watch("examples") || []).map((example, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <div className="flex-1 p-2 bg-slate-50 rounded text-sm">{example}</div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeArrayItem("examples", index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <Input
                                value={newExample}
                                onChange={(e) => setNewExample(e.target.value)}
                                placeholder="Add an example..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem("examples", newExample))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addArrayItem("examples", newExample)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Questions Section */}
                        <div>
                          <FormLabel>Guiding Questions</FormLabel>
                          <div className="space-y-2 mt-2">
                            {(stepForm.watch("questions") || []).map((question, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <div className="flex-1 p-2 bg-slate-50 rounded text-sm">{question}</div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeArrayItem("questions", index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <Input
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Add a guiding question..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem("questions", newQuestion))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addArrayItem("questions", newQuestion)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Action Items Section */}
                        <div>
                          <FormLabel>Action Items</FormLabel>
                          <div className="space-y-2 mt-2">
                            {(stepForm.watch("actionItems") || []).map((item, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <div className="flex-1 p-2 bg-slate-50 rounded text-sm">{item}</div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeArrayItem("actionItems", index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <Input
                                value={newActionItem}
                                onChange={(e) => setNewActionItem(e.target.value)}
                                placeholder="Add an action item..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem("actionItems", newActionItem))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addArrayItem("actionItems", newActionItem)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Video Configuration */}
                        <div className="border-t pt-6">
                          <FormLabel className="text-base font-semibold">Video Configuration</FormLabel>
                          <p className="text-sm text-slate-600 mb-4">Add your Vimeo video IDs for this step</p>
                          
                          <VideoManager 
                            stepContent={selectedStep}
                            onUpdate={(videos) => {
                              if (selectedStep) {
                                updateStepMutation.mutate({
                                  id: selectedStep.id,
                                  updates: { videos }
                                });
                              }
                            }}
                          />
                        </div>

                        {/* Workbook URL */}
                        <div>
                          <FormLabel>Workbook URL</FormLabel>
                          <div className="space-y-2 mt-2">
                            <Input
                              value={selectedStep?.workbookUrl || ""}
                              onChange={(e) => {
                                if (selectedStep) {
                                  updateStepMutation.mutate({
                                    id: selectedStep.id,
                                    updates: { workbookUrl: e.target.value }
                                  });
                                }
                              }}
                              placeholder="https://your-workbook-url.com/workbook.pdf"
                            />
                            <p className="text-xs text-slate-500">
                              Direct link to your downloadable workbook (PDF, Google Doc, etc.)
                            </p>
                          </div>
                        </div>

                        <Button type="submit" disabled={updateStepMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {updateStepMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Step</h3>
                    <p className="text-slate-600">Choose a step from the left to edit its content</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Template Creator */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...templateForm}>
                  <form onSubmit={templateForm.handleSubmit((data) => createTemplateMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Customer Interview Script" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={templateForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., worksheet, script" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="stepNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Step Number (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="e.g., 2" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={templateForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} spellCheck={true} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={templateForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Content</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={8} placeholder="Template content here..." spellCheck={true} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      <Plus className="w-4 h-4 mr-2" />
                      {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Template List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{template.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{template.category}</Badge>
                        {template.stepNumber && (
                          <Badge variant="outline">Step {template.stepNumber}</Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          {template.downloadCount} downloads
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
