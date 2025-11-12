import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import OfferManager from "@/components/OfferManager";
import InteractiveStep from "@/components/InteractiveStep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface OfferManagementProps {
  user: any;
}

export default function OfferManagement({ user }: OfferManagementProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<number | undefined>();
  const [currentStep, setCurrentStep] = useState<number>(2); // Start with Create Your Offer step

  // Fetch the selected offer details if one is selected
  const { data: selectedOffer } = useQuery({
    queryKey: ['/api/offers/single', selectedOfferId],
    queryFn: async () => {
      if (!selectedOfferId) return null;
      const response = await fetch(`/api/offers/${selectedOfferId}`);
      if (!response.ok) throw new Error('Failed to fetch offer');
      return response.json();
    },
    enabled: !!selectedOfferId,
  });

  const handleOfferSelect = (offerId: number) => {
    setSelectedOfferId(offerId);
  };

  const handleBackToOffers = () => {
    setSelectedOfferId(undefined);
  };

  if (selectedOfferId && selectedOffer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToOffers}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Offers
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Working on: {selectedOffer.title}
                </CardTitle>
                <p className="text-slate-600">{selectedOffer.description}</p>
              </CardHeader>
            </Card>
          </div>

          <InteractiveStep 
            stepNumber={currentStep}
            userId={user?.id?.toString() || "0"}
            offerId={selectedOfferId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                Offer Management
              </CardTitle>
              <p className="text-slate-600 text-lg">
                Create and manage multiple offer outlines to build your product portfolio
              </p>
            </CardHeader>
          </Card>
        </div>

        <OfferManager 
          userId={user?.id || 0}
          currentOfferId={selectedOfferId}
          onOfferSelect={handleOfferSelect}
        />
      </div>
    </div>
  );
}
