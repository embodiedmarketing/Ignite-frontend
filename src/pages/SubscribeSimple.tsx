import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { apiClient } from "@/services/api.config";

// Initialize Stripe outside component to avoid re-initialization
// Use VITE_STRIPE_PUBLIC_KEY (Stripe public key starts with pk_)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

export default function SubscribeSimple() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      console.log('Creating checkout session...');
      
      // Create checkout session instead of payment intent
      const { data: responseData } = await apiClient.post<{ sessionId: string; message?: string }>('/api/create-checkout-session', {
        amount: 397,
        currency: 'usd',
        product_name: 'Launch - Business Building Platform'
      });
      console.log('Checkout session response:', responseData);

      if (!responseData.sessionId) {
        throw new Error(responseData.message || 'No session ID received');
      }

      // Load Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      console.log('Redirecting to Stripe with session ID:', responseData.sessionId);

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: responseData.sessionId,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment setup error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Alternative: Direct browser redirect approach
  const handleDirectPayment = () => {
    // For now, let's use a direct approach - create a test user
    localStorage.setItem('dev_access', 'true');
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#192231] text-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
          <p className="text-lg opacity-90">Get instant access to Launch</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="bg-[#f7f3ef] rounded-lg p-8">
              <h2 className="text-2xl font-bold text-[#192231] mb-6">Your Order</h2>
              
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#192231]">Launch - Business Building Platform</h3>
                    <p className="text-[#192231]/70 mt-1">Complete access to the AI-powered business development system</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#192231]">$397</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#192231]">Total:</span>
                  <span className="text-[#192231]">$397.00 USD</span>
                </div>
              </div>

              <div className="bg-white rounded p-4 border-l-4 border-[#4593ed]">
                <h4 className="font-semibold text-[#192231] mb-2">What's Included:</h4>
                <ul className="space-y-2 text-sm">
                  {[
                    "AI-Powered Messaging Strategy Builder",
                    "Complete Offer Development System", 
                    "Sales Page Generator with Templates",
                    "Customer Experience Design Tools",
                    "Interactive AI Coaching & Feedback",
                    "Project Management Dashboard",
                    "Sales Conversation Scripts",
                    "Lifetime Access & Updates"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-[#4593ed] mr-2 flex-shrink-0" />
                      <span className="text-[#192231]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="order-1 lg:order-2">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#192231] mb-2">Complete Your Purchase</h2>
                <p className="text-[#192231]/70">Choose your payment method</p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-[#4593ed] hover:bg-[#3478d4] text-white py-4 text-lg font-semibold"
                >
                  {loading ? "Setting up payment..." : "Pay with Stripe - $397"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">For Development Testing</span>
                  </div>
                </div>

                <Button 
                  onClick={handleDirectPayment}
                  variant="outline"
                  className="w-full border-2 border-gray-300 text-gray-700 py-4 text-lg font-semibold"
                >
                  🚀 Access Platform (Dev Mode)
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <span>🔒 SSL Secured</span>
                  <span>•</span>
                  <span>30-Day Guarantee</span>
                  <span>•</span>
                  <span>Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
