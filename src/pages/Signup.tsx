import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/api.config";
import { signupUserSchema, type SignupUser } from "@shared/schema";
import { Flame, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SignupUser>({
    resolver: zodResolver(signupUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupUser) => {
      console.log("=== SIGNUP MUTATION STARTED ===");
      console.log("Data:", { email: data.email, firstName: data.firstName, lastName: data.lastName });
      console.log("Password length:", data.password?.length);
      
      try {
        console.log("Making request to /api/auth/signup...");
        const response = await apiClient.post("/api/auth/signup", data);
        console.log("Response data received:", response.data);
        return response.data;
      } catch (error) {
        console.error("=== SIGNUP MUTATION ERROR ===");
        console.error("Error type:", error?.constructor?.name);
        console.error("Error message:", error instanceof Error ? error.message : String(error));
        console.error("Full error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Signup successful!");
      toast({
        title: "Welcome to Ignite!",
        description: "Your account has been created and you're now logged in.",
      });
      // Invalidate and refetch auth state to update the UI immediately
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to dashboard after successful signup
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      console.error("Signup onError handler:", error);
      toast({
        title: "Signup failed",
        description: error.response.data.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupUser) => {
    console.log("onSubmit called with data:", data);
    console.log("Form errors:", form.formState.errors);
    signupMutation.mutate(data);
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
            Create Your Account
          </h2>
          <p className="text-slate-600">
            Start building your profitable business today
          </p>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-embodied-navy">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                            placeholder="Create a secure password"
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
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-embodied-blue hover:underline font-medium cursor-pointer">
                    Log in here
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
