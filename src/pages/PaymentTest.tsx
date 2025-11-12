export default function PaymentTest() {
  const testPayment = async () => {
    try {
      console.log('Testing payment API...');
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log('Payment API Response:', data);
      
      if (data.clientSecret) {
        console.log('✅ Payment intent created successfully');
        
        // Test Stripe loading
        const stripe = await import('@stripe/stripe-js').then(module => 
          module.loadStripe("pk_live_51Q2vYlFuA8uUwFKGHDJsOVc8j5UXZTaE6CKs4T8o1fYz5QEG5Qe5vVYGRXxPfVR8lKjQ8T2Y5Hg8LxC4sK5YQ3Qg00ZvGCGGg5")
        );
        
        if (stripe) {
          console.log('✅ Stripe loaded successfully');
        } else {
          console.error('❌ Failed to load Stripe');
        }
      } else {
        console.error('❌ No client secret received');
      }
    } catch (error) {
      console.error('❌ Payment test failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Payment System Test</h1>
        
        <button 
          onClick={testPayment}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 cursor-pointer"
          style={{ zIndex: 1000, position: 'relative' }}
        >
          Test Payment API
        </button>
        
        <button 
          onClick={() => window.open('/subscribe', '_blank')}
          className="ml-4 bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 cursor-pointer"
        >
          Open Subscribe Page
        </button>
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            Check the browser console for test results. This will verify:
          </p>
          <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
            <li>Payment intent creation</li>
            <li>Stripe library loading</li>
            <li>API connectivity</li>
          </ul>
        </div>
        
        <div className="mt-4">
          <a href="/subscribe" className="text-blue-500 hover:underline">
            → Go to actual payment page
          </a>
        </div>
      </div>
    </div>
  );
}
