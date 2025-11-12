import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const STRIPE_PUBLIC_KEY = "pk_live_51Q2vYlFuA8uUwFKGHDJsOVc8j5UXZTaE6CKs4T8o1fYz5QEG5Qe5vVYGRXxPfVR8lKjQ8T2Y5Hg8LxC4sK5YQ3Qg00ZvGCGGg5";

// Only initialize Stripe if the public key is available
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Submit the form to trigger validation
    const submitResult = await elements.submit();
    if (submitResult.error) {
      console.error('Elements submit error:', submitResult.error);
      toast({
        title: "Payment Error",
        description: submitResult.error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
    });

    if (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Launch! Redirecting to your dashboard...",
      });
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement 
          id="payment-element"
          options={{
            layout: 'tabs',
            fields: {
              billingDetails: {
                email: 'auto'
              }
            }
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-[#4593ed] hover:bg-[#3478d4] text-white py-4 text-lg font-semibold"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing Payment...
          </div>
        ) : (
          <>Complete Purchase - $397</>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 mt-4">
        By completing this purchase, you agree to our Terms of Service and Privacy Policy.
        You will receive immediate access to Launch upon successful payment.
      </p>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stripeElementsKey, setStripeElementsKey] = useState(0);

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Payment intent created:', data);
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          // Force re-render of Elements with new key
          setStripeElementsKey(prev => prev + 1);
        } else {
          console.error('No client secret received');
        }
      } catch (error) {
        console.error("Error creating payment intent:", error);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f7f3ef]">
        <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f7f3ef]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-[#192231]">Unable to Load Payment</CardTitle>
            <CardDescription>
              There was an issue setting up your payment. Please try again or contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#192231] text-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
          <p className="text-lg opacity-90">Secure checkout - Your information is protected</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Order Summary */}
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

            {/* Guarantees */}
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

          {/* Right Column - Payment Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#192231] mb-2">Payment Information</h2>
                <p className="text-[#192231]/70">Complete your purchase securely</p>
              </div>

              {!isLoading && stripePromise && clientSecret ? (
                <Elements 
                  key={stripeElementsKey}
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#4593ed',
                      }
                    }
                  }}
                >
                  <SubscribeForm />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-[#192231]/70">
                    {isLoading ? "Loading payment form..." : "Unable to load payment form"}
                  </p>
                  {!isLoading && !clientSecret && (
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-4 text-[#4593ed] hover:underline"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}

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

            {/* Trust Badges */}
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
