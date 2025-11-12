import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/api.config";
import { forgotPasswordSchema, type ForgotPasswordRequest } from "@shared/schema";
import { Flame, ArrowLeft, Mail } from "lucide-react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const { data: responseData } = await apiClient.post("/api/auth/forgot-password", data);
      return responseData;
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Reset link sent",
        description: "If your email is in our system, you'll receive a password reset link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordRequest) => {
    forgotPasswordMutation.mutate(data);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-embodied-cream to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-embodied-blue rounded-xl flex items-center justify-center">
                <Flame className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-oswald font-bold text-embodied-navy ml-3">Ignite</h1>
            </div>
            <h2 className="text-xl font-oswald font-semibold text-embodied-navy mb-2">
              Check Your Email
            </h2>
            <p className="text-slate-600">
              We've sent a password reset link to your email address
            </p>
          </div>

          {/* Success Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-embodied-navy mb-2">
                    Reset link sent!
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Check your inbox and click the link to reset your password. 
                    The link will expire in 1 hour for security.
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-slate-500 mb-4">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setEmailSent(false)}
                      variant="outline" 
                      className="w-full"
                    >
                      Send Another Email
                    </Button>
                    
                    <Link href="/login">
                      <Button variant="ghost" className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-embodied-cream to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-embodied-blue rounded-xl flex items-center justify-center">
              <Flame className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-oswald font-bold text-embodied-navy ml-3">Ignite</h1>
          </div>
          <h2 className="text-xl font-oswald font-semibold text-embodied-navy mb-2">
            Forgot Your Password?
          </h2>
          <p className="text-slate-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Forgot Password Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-embodied-navy">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full bg-embodied-coral hover:bg-embodied-orange"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Remember your password?{" "}
                <Link href="/login">
                  <span className="text-embodied-blue hover:underline font-medium cursor-pointer">
                    Back to Login
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
