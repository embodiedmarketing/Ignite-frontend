import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function GHLTemplates() {
  const handleOptInTripwire = () => {
    window.open('https://affiliates.gohighlevel.com/?fp_ref=embodied-marketing59&funnel_share=68d3738ff51fc6cab35b4cb9', '_blank');
  };

  const handleLiveLaunch = () => {
    window.open('https://affiliates.gohighlevel.com/?fp_ref=embodied-marketing59&funnel_share=68d5127baf4b491eb268f132', '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">GHL Templates</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Access pre-built GoHighLevel templates, snapshots, and workflows to accelerate your funnel setup.
          </p>
        </div>

        {/* Templates Card */}
        <Card className="border-coral-200 bg-gradient-to-r from-coral-50 to-coral-100 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-embodied-coral rounded-full"></div>
              <CardTitle className="text-2xl text-embodied-navy">GoHighLevel Templates</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="bg-white rounded-xl border border-coral-200 p-12 shadow-sm">
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="space-y-4">
                  <Button 
                    onClick={handleOptInTripwire}
                    className="w-full bg-embodied-blue hover:bg-[#3a7fd4] text-white px-8 py-6 text-base"
                    data-testid="button-opt-in-tripwire-templates"
                  >
                    <ExternalLink className="w-5 h-5 mr-3" />
                    Access Opt In & Tripwire Templates Here
                  </Button>
                  
                  <Button 
                    onClick={handleLiveLaunch}
                    className="w-full bg-embodied-blue hover:bg-[#3a7fd4] text-white px-8 py-6 text-base"
                    data-testid="button-live-launch-templates"
                  >
                    <ExternalLink className="w-5 h-5 mr-3" />
                    Access Live Launch, Sales Page, Order Form, & Confirmation Page Templates Here
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
