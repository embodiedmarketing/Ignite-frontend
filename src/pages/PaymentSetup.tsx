import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSetup() {
  return (
    <div className="min-h-screen bg-[#f7f3ef] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-[#4593ed]/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#4593ed]/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-[#4593ed]" />
            </div>
          </div>
          <CardTitle className="text-2xl text-[#192231] mb-2">
            Payment System Configuration
          </CardTitle>
          <CardDescription className="text-lg text-[#192231]/70">
            The payment system is ready for configuration
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To enable payments, please provide your Stripe secret key (starts with sk_). 
              Your Stripe publishable key has been configured.
            </AlertDescription>
          </Alert>

          <div className="bg-[#4593ed]/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#192231] mb-4">
              Launch Premium - $197/month
            </h3>
            <div className="space-y-3">
              {[
                "AI-Powered Messaging Strategy Builder",
                "Complete Offer Development System",
                "Sales Page Generator with Templates",
                "Customer Experience Design Tools",
                "Interactive Coaching & Feedback",
                "Project Management Dashboard",
                "Sales Conversation Scripts",
                "Community Access & Support"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#4593ed] rounded-full flex-shrink-0" />
                  <span className="text-[#192231] text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-[#192231]">Integration Options Available:</h4>
            
            <div className="grid gap-4">
              <div className="border border-[#4593ed]/20 rounded-lg p-4">
                <h5 className="font-medium text-[#192231] mb-2">Direct Platform Payments</h5>
                <p className="text-sm text-[#192231]/70 mb-3">
                  Secure Stripe integration with immediate platform access
                </p>
                <div className="flex items-center text-sm text-[#4593ed]">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Recommended approach
                </div>
              </div>

              <div className="border border-[#4593ed]/20 rounded-lg p-4">
                <h5 className="font-medium text-[#192231] mb-2">Ontraport CRM Integration</h5>
                <p className="text-sm text-[#192231]/70 mb-3">
                  Sync purchases with your existing CRM workflows
                </p>
                <div className="flex items-center text-sm text-[#192231]/50">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Available as add-on
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/">
              <Button 
                variant="outline"
                className="border-[#4593ed] text-[#4593ed] hover:bg-[#4593ed] hover:text-white"
              >
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
