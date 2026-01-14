import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

export default function AccountDeactivated() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-embodied-cream to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-embodied-navy">Account Deactivated</CardTitle>
          <CardDescription className="text-base">
            You have been deactivated. Please contact the support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-slate-600">
              Your account has been temporarily deactivated. If you believe this is an error or need assistance, please reach out to our support team.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
            
            <Button
              onClick={() => window.location.href = "mailto:team@embodiedmarketing.com"}
              className="w-full bg-embodied-coral hover:bg-embodied-orange"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

