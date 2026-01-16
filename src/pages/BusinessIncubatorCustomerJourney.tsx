import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useState } from "react";
import { Link } from "wouter";

export default function BusinessIncubatorCustomerJourney() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videos = [
    { id: "1", vimeoId: "1121271914/cfc6fad702", title: "Week 1: Your Foundation" },
    { id: "2", vimeoId: "1121272036/c5438aeed2", title: "Week 2: Your Audience" },
    { id: "3", vimeoId: "1123018184/a3613d0b09", title: "Week 3: Your Sales Funnel" },
    { id: "4", vimeoId: "1126899282/3340433dfa", title: "Week 4: Your Customer Experience" }
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
            <h1 className="text-3xl font-bold text-slate-900">Business Incubator: Your Customer Journey</h1>
            <p className="text-slate-600 mt-2">
              Exclusive workshop series hosted live with Emily Hirsh - Map and optimize every touchpoint in your customer's experience
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
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
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
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
              stepNumber={200 + currentVideoIndex} // Unique step number for each video
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
                      ? 'border-purple-500 bg-purple-50'
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
                      <Badge variant="outline" className="text-purple-600 border-purple-600">
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
