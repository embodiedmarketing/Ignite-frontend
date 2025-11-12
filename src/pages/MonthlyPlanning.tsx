import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Table, ClipboardList, ExternalLink } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";

export default function MonthlyPlanning() {
  const { user } = useAuth();

  const resources = [
    {
      title: "Marketing Planning Resource Doc",
      url: "https://docs.google.com/document/d/1CqCaRWgA1gz848vY4_hn5cW30cj0z9RNObyMdXCgI9c/copy",
      icon: FileText,
      description: "Comprehensive marketing planning guide and templates"
    },
    {
      title: "Monthly Planning Document",
      url: "https://docs.google.com/spreadsheets/u/1/d/1GODo8AltsAKHnu-TKo5I2uY-Tk0x9uAXD4ZtM51equE/copy",
      icon: Table,
      description: "Monthly planning spreadsheet for organizing your activities"
    },
    {
      title: "Weekly/Daily Planning Sheet",
      url: "https://docs.google.com/document/d/1SAC6eeV4xwVxZGir8jsn7zYMlYzBhgBEG4LmrFfeSag/copy",
      icon: ClipboardList,
      description: "Daily and weekly planning template for execution"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#192231] mb-2">Planning Resources</h1>
      </div>

      {/* Video Section */}
      <Card className="border-coral-200 bg-gradient-to-r from-coral-50 to-blue-50 shadow-lg">
        <CardContent className="pt-6">
          <div className="bg-white rounded-xl border border-coral-200 p-8 shadow-sm">
            <VimeoEmbed 
              vimeoId="1123017103/51afcbdbac"
              title="Planning Resources Tutorial"
              userId={user?.id || 0}
              stepNumber={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resources Section */}
      <Card className="border-coral-200 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-coral-500 rounded-full"></div>
            <CardTitle className="text-2xl text-[#192231]">Planning Templates & Resources</CardTitle>
          </div>
          <p className="text-slate-600 text-lg">
            Click below to make a copy of each planning resource for your own use
          </p>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-r from-coral-50 to-blue-50 rounded-lg p-6 border border-coral-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-coral-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#192231]">{resource.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-[#4593ed] hover:bg-[#3582dc] text-white"
                      data-testid={`button-open-${resource.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Resource
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
