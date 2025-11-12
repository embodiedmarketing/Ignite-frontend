import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Lock } from "lucide-react";
import { Link } from "wouter";

interface PaywallCardProps {
  title: string;
  description: string;
  features?: string[];
}

export default function PaywallCard({ title, description, features }: PaywallCardProps) {
  const defaultFeatures = [
    "AI-Powered Messaging Strategy",
    "Complete Offer Development System", 
    "Sales Page Generator",
    "Customer Experience Design",
    "Interactive Coaching & Feedback",
    "Project Management Dashboard",
    "Sales Conversation Scripts",
    "Community Access & Support"
  ];

  return (
    <div className="min-h-screen bg-[#f7f3ef] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-[#4593ed]/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#4593ed]/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#4593ed]" />
            </div>
          </div>
          <CardTitle className="text-2xl text-[#192231] mb-2">
            {title}
          </CardTitle>
          <CardDescription className="text-lg text-[#192231]/70">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-[#4593ed]/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-[#192231] mb-4">
              What You Get with Launch Premium
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(features || defaultFeatures).map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-[#4593ed] flex-shrink-0" />
                  <span className="text-[#192231] text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-[#f76548]/10 rounded-lg p-4">
              <div className="text-3xl font-bold text-[#192231] mb-2">
                $197<span className="text-lg font-normal text-[#192231]/70">/month</span>
              </div>
              <p className="text-sm text-[#192231]/60">
                30-day money-back guarantee
              </p>
            </div>
            
            <Link href="/subscribe">
              <Button 
                size="lg" 
                className="w-full bg-[#4593ed] hover:bg-[#3478d4] text-white font-semibold py-3 text-lg"
              >
                Get Full Access to Launch
              </Button>
            </Link>
            
            <p className="text-xs text-[#192231]/50">
              Secure payment processing powered by Stripe
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
