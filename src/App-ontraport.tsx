import { useState } from "react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'purchase'>('home');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Instead of Stripe, redirect to your Ontraport order form
      // Replace this URL with your actual Ontraport order form URL
      const ontraportOrderUrl = `https://your-account.ontraport.com/order-form-url?email=${encodeURIComponent(email)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`;
      
      // You can either redirect directly or submit to your backend first
      window.location.href = ontraportOrderUrl;
      
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert('Purchase failed: ' + error.message);
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
      maxWidth: currentPage === 'purchase' ? '400px' : '600px',
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '32px',
      textAlign: 'center' as const
    },
    title: {
      fontSize: currentPage === 'purchase' ? '2rem' : '3.5rem',
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
    form: {
      textAlign: 'left' as const,
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      marginBottom: '16px',
      boxSizing: 'border-box' as const
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
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Thank You!</h1>
          <p style={styles.subtitle}>Your purchase has been processed successfully.</p>
          <p>You'll receive access details via email shortly.</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'purchase') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Launch</h1>
          <p style={styles.subtitle}>Complete Your Purchase</p>

          <div style={styles.price}>$397</div>
          <p style={styles.priceSubtext}>One-time payment for full access</p>

          <form style={styles.form} onSubmit={handlePurchase}>
            <input
              style={styles.input}
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <input
              style={styles.input}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button 
              style={styles.button}
              type="submit"
              disabled={loading}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              {loading ? "Processing..." : "Continue to Payment"}
            </button>
          </form>

          <button 
            style={styles.backButton}
            onClick={() => setCurrentPage('home')}
          >
            ← Back to home
          </button>

          <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '16px'}}>
            Secure payment powered by Ontraport
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

        <button 
          style={styles.button}
          onClick={() => setCurrentPage('purchase')}
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
