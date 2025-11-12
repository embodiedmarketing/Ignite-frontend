import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import OfferWizard from "@/components/OfferWizard";
import type { Offer } from "@shared/schema";

export default function OfferDevelopment() {
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ["/api/offers/user/1"],
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "launched":
        return "default";
      case "ready":
        return "secondary";
      case "in_development":
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "course":
        return "Online Course";
      case "consulting":
        return "Consulting/Coaching";
      case "service":
        return "Done-for-You Service";
      case "product":
        return "Digital Product";
      default:
        return type;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Offer Development</h2>
            <p className="text-slate-600">Create and manage your paid offers</p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Offer
          </Button>
        </div>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No offers yet</h3>
            <p className="text-slate-600 mb-6">Create your first offer to get started on your journey to building a successful paid offering.</p>
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Offer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{offer.title}</CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">{getTypeDisplay(offer.type)}</Badge>
                      <Badge variant={getStatusBadgeVariant(offer.status)}>
                        {offer.status === "draft" ? "Draft" : 
                         offer.status === "ready" ? "Ready" : 
                         offer.status === "launched" ? "Live" : offer.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {offer.description && (
                  <p className="text-sm text-slate-600 line-clamp-3">{offer.description}</p>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Progress</span>
                      <span className="text-sm text-slate-500">{offer.progress}%</span>
                    </div>
                    <Progress value={offer.progress} />
                    <p className="text-xs text-slate-500 mt-1">
                      Step {offer.currentStep} of {offer.totalSteps}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button size="sm" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      {offer.status === "draft" ? "Continue" : "Edit"}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <OfferWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
