import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe("pk_live_51Q2vYlFuA8uUwFKGHDJsOVc8j5UXZTaE6CKs4T8o1fYz5QEG5Qe5vVYGRXxPfVR8lKjQ8T2Y5Hg8LxC4sK5YQ3Qg00ZvGCGGg5");

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Form submitted, checking stripe and elements...');

    if (!stripe || !elements) {
      console.error('Stripe or elements not ready');
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Confirming payment...');

    // Submit the form first to validate
    const submitResult = await elements.submit();
    if (submitResult.error) {
      console.error('Form validation error:', submitResult.error);
      toast({
        title: "Validation Error",
        description: submitResult.error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      console.log('Payment result:', result);

      if (result.error) {
        console.error('Payment failed:', result.error);
        let errorMessage = result.error.message || "Payment failed";
        
        // Handle specific error types
        if (result.error.type === 'card_error') {
          errorMessage = `Card Error: ${result.error.message}`;
        } else if (result.error.type === 'validation_error') {
          errorMessage = `Validation Error: ${result.error.message}`;
        }
        
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('Payment succeeded - redirecting...');
        // Payment succeeded, will redirect via return_url
      }
    } catch (error: any) {
      console.error('Payment exception:', error);
      toast({
        title: "Payment Error", 
        description: error.message || "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          fields: {
            billingDetails: {
              email: 'auto'
            }
          }
        }}
      />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isLoading}
        className="w-full bg-[#4593ed] hover:bg-[#3478d4] text-white py-4 text-lg font-semibold disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing Payment...
          </div>
        ) : (
          "Complete Purchase - $397"
        )}
      </Button>
      
      <p className="text-xs text-center text-gray-500">
        By completing this purchase, you agree to our Terms of Service. 
        You will receive immediate access to Launch upon successful payment.
      </p>
    </form>
  );
}

export default function SubscribeNew() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
          <p>Unable to initialize payment. Please try again.</p>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#192231] text-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
          <p className="text-lg opacity-90">Secure checkout - Your information is protected</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="bg-[#f7f3ef] rounded-lg p-8 mb-8">
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
                <div className="flex justify-between">
                  <span className="text-[#192231]">Subtotal:</span>
                  <span className="font-semibold">$397.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#192231]">Tax:</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
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

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-green-800 mb-3">Our Guarantee to You</h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  30-day money-back guarantee
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Secure payment processing
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Instant access after payment
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#192231] mb-2">Payment Information</h2>
                <p className="text-[#192231]/70">Complete your purchase securely</p>
              </div>

              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm />
              </Elements>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <span>🔒 SSL Secured</span>
                  <span>•</span>
                  <span>256-bit Encryption</span>
                  <span>•</span>
                  <span>PCI Compliant</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">Trusted payment processing by</p>
              <div className="flex justify-center items-center space-x-6 opacity-70">
                <span className="font-semibold text-[#635bff]">stripe</span>
                <span className="text-gray-400">|</span>
                <span className="text-sm">256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
