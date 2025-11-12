import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { apiRequest } from "@/services/apiClient";

// Use VITE_STRIPE_PUBLIC_KEY (Stripe public key starts with pk_)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

export default function App() {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'subscribe'>('home');

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Create checkout session
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        amount: 397,
        currency: 'usd',
        product_name: 'Launch Platform Access'
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create checkout session');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: responseData.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentPage === 'subscribe') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Launch</h1>
              <p className="text-slate-600">AI-Powered Entrepreneurship Platform</p>
            </div>

            <div className="mb-8">
              <div className="text-5xl font-bold text-slate-900 mb-2">$397</div>
              <p className="text-slate-600">One-time payment for full access</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-left">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Complete messaging strategy development</span>
              </div>
              <div className="flex items-center text-left">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-slate-700">AI-powered offer creation tools</span>
              </div>
              <div className="flex items-center text-left">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Sales page generator with coaching</span>
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={loading}
              className="w-full h-12 text-lg font-semibold mb-4"
            >
              {loading ? "Processing..." : "Pay with Stripe - $397"}
            </Button>

            <button 
              onClick={() => setCurrentPage('home')}
              className="text-slate-500 text-sm hover:text-slate-700"
            >
              ← Back to home
            </button>

            <p className="text-xs text-slate-500 mt-4">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-slate-900 mb-6">Launch</h1>
          <p className="text-xl text-slate-600 mb-8">
            AI-Powered Entrepreneurship Platform
          </p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Transform your expertise into a profitable business with our step-by-step guided process. 
            Create compelling messaging, develop your offer, and build high-converting sales pages.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => setCurrentPage('subscribe')}
          >
            Get Started - $397
          </Button>
          
          <div className="text-sm text-slate-500">
            One-time payment • Full platform access • AI coaching included
          </div>
        </div>
      </div>
    </div>
  );
}
