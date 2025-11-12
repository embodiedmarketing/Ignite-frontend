import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Target, Lightbulb, TrendingUp } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";
import TopicIdeaGenerator from "@/components/TopicIdeaGenerator";
import { useAuth } from "@/hooks/useAuth";

export default function BonusMaterial() {
  const { user } = useAuth();
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#192231] mb-2">Bonus Material</h1>
        <p className="text-gray-600">
          Additional resources and strategies to accelerate your growth through content creation, visibility ads and overall optimization of your strategy
        </p>
      </div>

      <Tabs defaultValue="strategic-content" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="strategic-content" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Strategic Content
          </TabsTrigger>
          <TabsTrigger value="visibility-ads" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Launching A Visibility Ad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategic-content" className="space-y-6">
          <TopicIdeaGenerator userId={user?.id || 0} />
        </TabsContent>

        <TabsContent value="visibility-ads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#192231]">
                <TrendingUp className="w-5 h-5 text-[#4593ed]" />
                Launching A Visibility Ad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Use our step by step tutorial to launch your visibility ad and get more eyes on your content!
                </p>
                <VimeoEmbed 
                  vimeoId="1094469357/82e654afde"
                  title="Launching A Visibility Ad"
                  userId={user?.id || 0}
                  stepNumber={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
