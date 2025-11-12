import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/api.config";
import { resetPasswordSchema, type ResetPasswordRequest } from "@shared/schema";
import { Flame, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/reset-password/:token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();

  // Extract token from URL params (supports both route param and query param)
  useEffect(() => {
    // First, check route params
    if (params?.token) {
      setToken(params.token);
    } else {
      // Fallback to query params for backwards compatibility
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      if (tokenParam) {
        setToken(tokenParam);
      } else {
        toast({
          title: "Invalid reset link",
          description: "This password reset link is invalid or missing the reset token.",
          variant: "destructive",
        });
      }
    }
  }, [params, toast]);

  const form = useForm<ResetPasswordRequest & { confirmPassword: string }>({
    resolver: zodResolver(
      resetPasswordSchema.extend({
        confirmPassword: resetPasswordSchema.shape.password,
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update form token when token state changes
  useEffect(() => {
    if (token) {
      form.setValue("token", token);
    }
  }, [token, form]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      const { data: responseData } = await apiClient.post("/api/auth/reset-password", data);
      return responseData;
    },
    onSuccess: () => {
      setResetSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password. The link may be expired or invalid.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordRequest & { confirmPassword: string }) => {
    const { confirmPassword, ...resetData } = data;
    resetPasswordMutation.mutate(resetData);
  };

  if (resetSuccess) {
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
              Password Reset Complete
            </h2>
            <p className="text-slate-600">
              Your password has been successfully updated
            </p>
          </div>

          {/* Success Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-embodied-navy mb-2">
                    All set!
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Your password has been updated successfully. You can now log in to your account with your new password.
                  </p>
                </div>

                <div className="pt-4">
                  <Link href="/login">
                    <Button className="w-full bg-embodied-coral hover:bg-embodied-orange">
                      Continue to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
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
              Invalid Reset Link
            </h2>
            <p className="text-slate-600">
              This password reset link is invalid or has expired
            </p>
          </div>

          {/* Error Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-embodied-navy mb-2">
                    Link expired or invalid
                  </h3>
                  <p className="text-slate-600 text-sm">
                    This password reset link is no longer valid. Reset links expire after 1 hour for security.
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <Link href="/forgot-password">
                    <Button className="w-full bg-embodied-coral hover:bg-embodied-orange">
                      Request New Reset Link
                    </Button>
                  </Link>
                  
                  <Link href="/login">
                    <Button variant="ghost" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
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
            Reset Your Password
          </h2>
          <p className="text-slate-600">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-embodied-navy">New Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full bg-embodied-coral hover:bg-embodied-orange"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? "Updating Password..." : "Update Password"}
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
