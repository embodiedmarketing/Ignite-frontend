import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Download, Play, FileText, Search, Filter } from "lucide-react";

export default function ResourceLibrary() {
  const resourceCategories = [
    { name: "Templates", count: 12, color: "bg-blue-50 text-blue-700" },
    { name: "Guides", count: 8, color: "bg-green-50 text-green-700" },
    { name: "Videos", count: 15, color: "bg-coral-50 text-coral-700" },
    { name: "Worksheets", count: 6, color: "bg-orange-50 text-orange-700" },
    { name: "Examples", count: 10, color: "bg-pink-50 text-pink-700" },
  ];

  const featuredResources = [
    {
      title: "Offer Creation Worksheet",
      type: "Worksheet",
      description: "Step-by-step worksheet to define your paid offer",
      category: "Templates",
      downloadCount: 1250,
      icon: FileText,
    },
    {
      title: "Customer Persona Template",
      type: "Template",
      description: "Complete template for creating detailed customer personas",
      category: "Templates", 
      downloadCount: 980,
      icon: FileText,
    },
    {
      title: "Sales Conversation Scripts",
      type: "Guide",
      description: "Proven scripts for different types of sales conversations",
      category: "Guides",
      downloadCount: 2100,
      icon: BookOpen,
    },
    {
      title: "Pricing Strategy Masterclass",
      type: "Video",
      description: "Complete guide to pricing your offers for maximum profit",
      category: "Videos",
      downloadCount: 850,
      icon: Play,
    },
    {
      title: "Community Outreach Toolkit",
      type: "Template",
      description: "Templates and strategies for effective community engagement",
      category: "Templates",
      downloadCount: 670,
      icon: FileText,
    },
    {
      title: "Value Proposition Canvas",
      type: "Worksheet",
      description: "Visual tool for crafting compelling value propositions",
      category: "Worksheets",
      downloadCount: 1400,
      icon: FileText,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Resource Library</h2>
        <p className="text-slate-600">Templates, guides, and tools to accelerate your success</p>
      </div>

      {/* Search and Filter */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search resources..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resourceCategories.map((category, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {category.name}
                    </span>
                    <Badge className={category.color}>
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Popular This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-slate-900">Offer Creation Worksheet</p>
                  <p className="text-xs text-slate-500">245 downloads</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">Sales Scripts Bundle</p>
                  <p className="text-xs text-slate-500">189 downloads</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">Pricing Calculator</p>
                  <p className="text-xs text-slate-500">167 downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredResources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{resource.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {resource.downloadCount.toLocaleString()} downloads
                      </span>
                      <Button size="sm">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <Button variant="outline">
              Load More Resources
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
