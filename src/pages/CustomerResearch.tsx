import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Search, Plus } from "lucide-react";

export default function CustomerResearch() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Customer Research</h2>
        <p className="text-slate-600">Identify and understand your ideal customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Persona Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Customer Persona Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Persona Name
                  </label>
                  <Input placeholder="e.g., Marketing Manager Mike" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Age Range
                  </label>
                  <Input placeholder="e.g., 25-35" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Job Title / Role
                </label>
                <Input placeholder="e.g., Digital Marketing Manager" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Main Pain Points
                </label>
                <Textarea 
                  placeholder="What are their biggest challenges and frustrations?"
                  rows={3}
                  spellCheck={true}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Goals & Desires
                </label>
                <Textarea 
                  placeholder="What do they want to achieve?"
                  rows={3}
                  spellCheck={true}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Where They Hang Out Online
                </label>
                <Textarea 
                  placeholder="Social media platforms, forums, communities, etc."
                  rows={2}
                  spellCheck={true}
                />
              </div>
              
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Save Persona
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Target Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">
                  Market analysis tools coming soon! This will help you research market size, competition, and opportunities.
                </p>
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Start Market Research
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Customer Personas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-4">No personas created yet</p>
                <p className="text-xs text-slate-400">
                  Create your first customer persona to get started
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Research Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">1. Be Specific</h4>
                <p className="text-slate-600">The more detailed your persona, the better you can target your messaging.</p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">2. Use Real Data</h4>
                <p className="text-slate-600">Base your personas on actual customer interviews and research.</p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">3. Update Regularly</h4>
                <p className="text-slate-600">Customer needs evolve, so should your personas.</p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-gradient-to-r from-blue-500 to-coral-600 rounded-xl p-4 text-white">
            <h3 className="font-semibold text-sm mb-2">Pro Tip</h3>
            <p className="text-xs opacity-90 mb-3">
              Interview 5-10 potential customers before creating your offer. Their insights are invaluable!
            </p>
            <Button size="sm" variant="secondary" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
