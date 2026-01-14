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
import { queryClient } from "@/services/queryClient";
import { loginUserSchema, type LoginUser } from "@shared/schema";
import { Flame, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect if already logged in and active
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Double check isActive to prevent redirecting inactive users
      const isActive = (user as any)?.isActive ?? true;
      
      if (isActive) {
        console.log("User already authenticated, redirecting to dashboard");
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      console.log("Login mutation started with data:", { email: data.email });
      try {
        const response = await apiClient.post("/api/auth/login", data);
        return response.data;
      } catch (error) {
        console.error("Login mutation error:", error);
        throw error;
      }
    },
    onSuccess: async (responseData) => {
      
      // Check if user is active
      const isActive = responseData?.user?.isActive;
      
      console.log("Login successful!", isActive);
      if (isActive === false) {      
        setLocation("/account-deactivated");
        return;
      }

      // Invalidate auth cache to ensure fresh user data with isAdmin
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });
      
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      console.error("Login onError handler:", error);
      
      // Check if this is a password setup error
      const errorMessage = error.message || "Invalid email or password. Please try again.";
      const isPasswordSetupNeeded = errorMessage.includes("Password not set") || errorMessage.includes("Forgot Password");
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
        action: isPasswordSetupNeeded ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/forgot-password")}
            className="bg-white text-slate-900 hover:bg-slate-100"
          >
            Reset Password
          </Button>
        ) : undefined,
      });
    },
  });

  const onSubmit = (data: LoginUser) => {
    console.log("=== LOGIN FORM SUBMITTED ===");
    console.log("Email:", data.email);
    console.log("Password length:", data.password?.length);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    console.log("About to call loginMutation.mutate...");
    
    try {
      loginMutation.mutate(data);
      console.log("loginMutation.mutate called successfully");
    } catch (error) {
      console.error("Error calling loginMutation.mutate:", error);
    }
  };

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
            Welcome Back
          </h2>
          <p className="text-slate-600">
            Continue building your profitable business
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-embodied-navy">Log In</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" name="launch-platform-login">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
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

                <Button
                  type="submit"
                  className="w-full bg-embodied-coral hover:bg-embodied-orange"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Log In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-slate-600">
                <Link href="/forgot-password">
                  <span className="text-embodied-blue hover:underline font-medium cursor-pointer">
                    Forgot your password?
                  </span>
                </Link>
              </p>
              <p className="text-sm text-slate-600">
                Don't have an account?{" "}
                <Link href="/signup">
                  <span className="text-embodied-blue hover:underline font-medium cursor-pointer">
                    Sign up here
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
