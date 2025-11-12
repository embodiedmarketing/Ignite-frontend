import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function LandingSimple() {
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
          <Link href="/subscribe">
            <Button size="lg" className="text-lg px-8 py-4">
              Get Started - $397
            </Button>
          </Link>
          
          <div className="text-sm text-slate-500">
            One-time payment • Full platform access • AI coaching included
          </div>
        </div>
      </div>
    </div>
  );
}
