import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function MonthlyAdRequest() {
  const handleOpenForm = () => {
    window.open('https://embodiedmarketing.typeform.com/adsrequest', '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Monthly Ad Request</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Once you have received your initial visibility, lead generation, and live launch ads, you can use this form to request a new set of 4 ads each month that you are in Ignite. You may select the type of ads you are requesting, and make sure to include all pertinent details and assets! Our typical ad request turnaround is 4 business days.
          </p>
        </div>

        {/* Request Button Card */}
        <Card className="border-coral-200 bg-gradient-to-r from-coral-50 to-coral-100 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-embodied-coral rounded-full"></div>
              <CardTitle className="text-2xl text-embodied-navy">Submit Your Request</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="bg-white rounded-xl border border-coral-200 p-12 shadow-sm text-center">
              <div className="space-y-6 max-w-2xl mx-auto">
                <Button 
                  onClick={handleOpenForm}
                  className="bg-embodied-blue hover:bg-[#3a7fd4] text-white px-12 py-6 text-xl"
                  data-testid="button-open-ad-request-form"
                >
                  <ExternalLink className="w-6 h-6 mr-3" />
                  Open Ad Request Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
