import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/services/apiClient";

// Use VITE_STRIPE_PUBLIC_KEY (Stripe public key starts with pk_)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

export default function App() {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'subscribe'>('home');
  const [error, setError] = useState<string>("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log('Creating checkout session...');
      
      // Create checkout session
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        amount: 397,
        currency: 'usd',
        product_name: 'Launch Platform Access'
      });

      const responseData = await response.json();
      console.log('Checkout session response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create checkout session');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      console.log('Redirecting to Stripe checkout...');
      
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: responseData.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setError('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    card: {
      maxWidth: currentPage === 'subscribe' ? '400px' : '600px',
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '32px',
      textAlign: 'center' as const
    },
    title: {
      fontSize: currentPage === 'subscribe' ? '2rem' : '3.5rem',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '1.1rem',
      color: '#64748b',
      marginBottom: '32px'
    },
    price: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '8px'
    },
    priceSubtext: {
      color: '#64748b',
      marginBottom: '32px'
    },
    button: {
      width: '100%',
      height: '48px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '16px',
      transition: 'background-color 0.2s'
    },
    buttonHover: {
      backgroundColor: '#2563eb'
    },
    backButton: {
      color: '#64748b',
      fontSize: '0.9rem',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'left' as const,
      marginBottom: '16px'
    },
    checkmark: {
      width: '20px',
      height: '20px',
      backgroundColor: '#10b981',
      borderRadius: '50%',
      marginRight: '12px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px'
    },
    error: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '0.9rem'
    }
  };

  if (currentPage === 'subscribe') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Launch</h1>
          <p style={styles.subtitle}>AI-Powered Entrepreneurship Platform</p>

          <div style={styles.price}>$397</div>
          <p style={styles.priceSubtext}>One-time payment for full access</p>

          <div style={{marginBottom: '32px'}}>
            <div style={styles.feature}>
              <div style={styles.checkmark}>✓</div>
              <span>Complete messaging strategy development</span>
            </div>
            <div style={styles.feature}>
              <div style={styles.checkmark}>✓</div>
              <span>AI-powered offer creation tools</span>
            </div>
            <div style={styles.feature}>
              <div style={styles.checkmark}>✓</div>
              <span>Sales page generator with coaching</span>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button 
            style={styles.button}
            onClick={handlePayment}
            disabled={loading}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            {loading ? "Processing..." : "Pay with Stripe - $397"}
          </button>

          <button 
            style={styles.backButton}
            onClick={() => setCurrentPage('home')}
          >
            ← Back to home
          </button>

          <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '16px'}}>
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Launch</h1>
        <p style={styles.subtitle}>AI-Powered Entrepreneurship Platform</p>
        <p style={{fontSize: '1.1rem', color: '#64748b', maxWidth: '500px', margin: '0 auto 32px'}}>
          Transform your expertise into a profitable business with our step-by-step guided process. 
          Create compelling messaging, develop your offer, and build high-converting sales pages.
        </p>

        <button 
          style={styles.button}
          onClick={() => setCurrentPage('subscribe')}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Get Started - $397
        </button>
        
        <div style={{fontSize: '0.9rem', color: '#64748b'}}>
          One-time payment • Full platform access • AI coaching included
        </div>
      </div>
    </div>
  );
}
