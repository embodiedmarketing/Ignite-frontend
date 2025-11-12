import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Network, Plus, ExternalLink, Users } from "lucide-react";

export default function CommunityOutreach() {
  const communityTypes = [
    { name: "Facebook Groups", icon: "📘", color: "bg-blue-50" },
    { name: "LinkedIn Groups", icon: "💼", color: "bg-blue-50" },
    { name: "Reddit Communities", icon: "🤖", color: "bg-orange-50" },
    { name: "Discord Servers", icon: "💬", color: "bg-coral-50" },
    { name: "Slack Communities", icon: "💼", color: "bg-green-50" },
    { name: "Forums", icon: "💭", color: "bg-gray-50" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Community Outreach</h2>
        <p className="text-slate-600">Find and engage with your ideal customers in online communities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Community Finder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="w-5 h-5 mr-2" />
                Community Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {communityTypes.map((type, index) => (
                  <button
                    key={index}
                    className={`${type.color} border border-slate-200 rounded-lg p-3 text-center hover:shadow-md transition-shadow`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs font-medium text-slate-700">{type.name}</div>
                  </button>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Search Communities
                </label>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="e.g., digital marketing, small business owners"
                    className="flex-1"
                  />
                  <Button>Search</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Your Target Communities
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Community
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Network className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-2">No communities added yet</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Start by identifying online communities where your ideal customers gather
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Community
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Strategy Planner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">
                  Plan your community engagement strategy once you've identified target communities
                </p>
                <Button variant="outline">Create Engagement Plan</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Communities Joined</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Active Conversations</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Connections Made</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">1. Give First</h4>
                <p className="text-slate-600">Provide value before asking for anything in return.</p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">2. Follow Rules</h4>
                <p className="text-slate-600">Read and respect each community's guidelines.</p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">3. Be Authentic</h4>
                <p className="text-slate-600">Build genuine relationships, not just sales prospects.</p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-slate-900 mb-1">4. Stay Consistent</h4>
                <p className="text-slate-600">Regular engagement builds trust and recognition.</p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-4 text-white">
            <h3 className="font-semibold text-sm mb-2">Community Goal</h3>
            <p className="text-xs opacity-90 mb-3">
              Aim to join 5-10 communities where your ideal customers are active
            </p>
            <Button size="sm" variant="secondary" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0">
              Set Goals
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
