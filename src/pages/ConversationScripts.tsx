import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Play, BookOpen, Mic } from "lucide-react";

export default function ConversationScripts() {
  const scriptTemplates = [
    {
      title: "Cold Outreach",
      description: "First contact with potential customers",
      tags: ["Email", "DM", "LinkedIn"],
    },
    {
      title: "Discovery Call",
      description: "Understanding customer needs and pain points",
      tags: ["Phone", "Video", "Zoom"],
    },
    {
      title: "Sales Presentation",
      description: "Presenting your offer and value proposition",
      tags: ["Demo", "Pitch", "Presentation"],
    },
    {
      title: "Objection Handling",
      description: "Responding to common customer concerns",
      tags: ["Price", "Time", "Trust"],
    },
    {
      title: "Closing",
      description: "Finalizing the sale and next steps",
      tags: ["Payment", "Onboarding", "Contract"],
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Conversation Scripts</h2>
        <p className="text-slate-600">Master the art of selling through structured conversations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Script Templates */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Script Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {scriptTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{template.title}</h4>
                      <Button size="sm" variant="outline">
                        <Play className="w-3 h-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Custom Script Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Script Name
                </label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="e.g., My Discovery Call Script"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Opening (How you'll start the conversation)
                </label>
                <Textarea 
                  placeholder="Hi [Name], thanks for taking the time to chat with me today..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Key Questions to Ask
                </label>
                <Textarea 
                  placeholder="What's your biggest challenge with [problem area]? How are you currently handling [specific situation]?"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Value Proposition
                </label>
                <Textarea 
                  placeholder="Based on what you've told me, I think our [offer] could help you..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Call to Action
                </label>
                <Textarea 
                  placeholder="Would you be interested in learning more about how this could work for you?"
                  rows={2}
                />
              </div>
              
              <Button className="w-full">
                Save Custom Script
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Saved Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-4">No saved scripts yet</p>
                <p className="text-xs text-slate-400">
                  Create your first script to get started
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Mic className="w-4 h-4 mr-2" />
                Practice Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Practice your scripts with our AI role-play feature
              </p>
              <Button className="w-full" variant="outline">
                Start Practice Session
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Script Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">1. Keep It Natural</h4>
                <p className="text-slate-600">Scripts should guide, not restrict your conversation.</p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">2. Listen More</h4>
                <p className="text-slate-600">Great salespeople listen 80% and talk 20%.</p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">3. Practice Daily</h4>
                <p className="text-slate-600">The more you practice, the more natural it becomes.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
