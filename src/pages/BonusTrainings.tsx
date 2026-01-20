import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Play, MessageSquare, Users } from "lucide-react";
import { Link } from "wouter";

export default function BonusTrainings() {

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bonus Trainings</h1>
            <p className="text-slate-600 mt-2">Bonus content & workshops to support you in both going through the IGNITE program and in all areas of your business.</p>
          </div>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Premium Content
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Business Incubator Training Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Business Incubator Training
            </CardTitle>
            <CardDescription>
              Exclusive workshop series hosted live with Emily Hirsh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Business Incubator: Your Messaging */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Business Incubator: Your Messaging</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Advanced messaging strategies and frameworks to refine your communication
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        4 video replays available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Available
                    </Badge>
                    <Link href="/resources/business-incubator-messaging">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Play className="w-4 h-4 mr-1" />
                        Watch Replays
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Business Incubator: Your Customer Journey */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Business Incubator: Your Customer Journey</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Map and optimize every touchpoint in your customer's experience
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        4 video replays available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      Available
                    </Badge>
                    <Link href="/resources/business-incubator-customer-journey">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Play className="w-4 h-4 mr-1" />
                        Watch Replays
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
