import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useState } from "react";
import { Link } from "wouter";

export default function BusinessIncubatorMessaging() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videos = [
    { id: "1", vimeoId: "1121271019/c3616c2a0e", title: "Business Incubator: Your Messaging - Week 1" },
    { id: "2", vimeoId: "1121271278/86bd9d1152", title: "Business Incubator: Your Messaging - Week 2" },
    { id: "3", vimeoId: "1121271529/2b6435887b", title: "Business Incubator: Your Messaging - Week 3" },
    { id: "4", vimeoId: "1121271752/657f5cbba6", title: "Business Incubator: Your Messaging - Week 4" }
  ];

  const navigateVideo = (direction: 'prev' | 'next') => {
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentVideoIndex > 0 ? currentVideoIndex - 1 : videos.length - 1;
    } else {
      newIndex = currentVideoIndex < videos.length - 1 ? currentVideoIndex + 1 : 0;
    }
    setCurrentVideoIndex(newIndex);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/resources/bonus-trainings">
                <Button variant="outline" size="sm">
                  ← Back to Trainings
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Business Incubator: Your Messaging</h1>
            <p className="text-slate-600 mt-2">
              Exclusive workshop series hosted live with Emily Hirsh - Advanced messaging strategies and frameworks
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            {videos.length} Videos
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Video Player */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>{videos[currentVideoIndex].title}</CardTitle>
                  <CardDescription>
                    Workshop recording from Emily Hirsh's Business Incubator series
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateVideo('prev')}
                  disabled={videos.length <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-slate-500">
                  {currentVideoIndex + 1} of {videos.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateVideo('next')}
                  disabled={videos.length <= 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <VimeoEmbed
              vimeoId={videos[currentVideoIndex].vimeoId}
              title={videos[currentVideoIndex].title}
              userId={1} // You can pass the actual user ID here
              stepNumber={100 + currentVideoIndex} // Unique step number for each video
            />
          </CardContent>
        </Card>

        {/* Video List */}
        <Card>
          <CardHeader>
            <CardTitle>All Workshop Videos</CardTitle>
            <CardDescription>
              Click on any video to watch it above
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    index === currentVideoIndex
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                  onClick={() => setCurrentVideoIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{video.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Workshop {index + 1} of {videos.length}
                      </p>
                    </div>
                    {index === currentVideoIndex && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Now Playing
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
