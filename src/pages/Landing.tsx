import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Users, Target, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-embodied-cream to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-embodied-blue rounded-xl flex items-center justify-center">
              <Rocket className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-oswald font-bold text-embodied-navy ml-4">Launch</h1>
          </div>
          
          <h2 className="text-5xl font-oswald font-bold text-embodied-navy mb-6 leading-tight">
            Transform Your Expertise Into<br />
            <span className="text-embodied-coral">A Profitable Business</span>
          </h2>
          
          <p className="text-xl font-open-sans text-slate-700 mb-8 max-w-3xl mx-auto">
            Stop struggling with messaging that doesn't convert. Launch provides step-by-step guidance 
            to create compelling offers, perfect your positioning, and build sales pages that actually sell.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="YOUR_ONTRAPORT_CHECKOUT_URL" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-embodied-coral hover:bg-embodied-orange text-white text-lg px-8 py-4 font-oswald font-semibold">
                  Get Launch Platform
                </Button>
              </a>
              <a href="/login">
                <Button size="lg" variant="outline" className="border-embodied-coral text-embodied-coral hover:bg-embodied-coral hover:text-white text-lg px-8 py-4 font-oswald font-semibold">
                  Member Login
                </Button>
              </a>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600">
                After purchase, you'll receive instant access to the platform
              </p>
              <p className="text-xs text-slate-500">
                New member? <a href="/set-password" className="text-embodied-blue hover:underline">Set your password here</a>
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 border-embodied-blue/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-embodied-navy font-oswald">
                <Users className="w-6 h-6 mr-3 text-embodied-coral" />
                Perfect Your Messaging
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-open-sans text-slate-700">
                Discover exactly what your ideal customers need to hear. Our AI-powered system helps you craft messaging that resonates and converts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-embodied-coral/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-embodied-navy font-oswald">
                <Target className="w-6 h-6 mr-3 text-embodied-blue" />
                Create Irresistible Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-open-sans text-slate-700">
                Structure your expertise into compelling offers with clear pricing, benefits, and guarantees that make customers say "yes."
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-embodied-orange/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-embodied-navy font-oswald">
                <TrendingUp className="w-6 h-6 mr-3 text-embodied-orange" />
                Launch with Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-open-sans text-slate-700">
                Generate high-converting sales pages and develop proven sales strategies that turn conversations into customers.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-embodied-navy rounded-2xl py-12 px-8">
          <h3 className="text-3xl font-oswald font-bold text-white mb-4">
            Ready to Launch Your Success?
          </h3>
          <p className="text-xl font-open-sans text-embodied-cream mb-8">
            Join entrepreneurs who've transformed their expertise into thriving businesses.
          </p>
          <a href="/subscribe">
            <Button size="lg" className="bg-embodied-coral hover:bg-embodied-orange text-white text-lg px-8 py-4 font-oswald font-semibold">
              Start Building Your Offer Today - $197/month
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
