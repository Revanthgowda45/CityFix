import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
// Import Supabase directly for the most direct authentication approach
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import CityFixLogo from '@/components/CityFixLogo';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log('Login attempt with email:', data.email);
      
      // Use Supabase directly for the most reliable login
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      
      if (error) throw error;
      
      console.log('Login successful, redirecting user immediately');
      
      toast({
        title: "Login Successful",
        description: "Welcome back to CityFix!",
      });
      
      // Force immediate navigation to dashboard
      console.log('Forcing navigation to dashboard');
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex justify-center mb-6 px-2">
        <Link to="/" className="flex items-center">
          <CityFixLogo size={36} className="text-urban-600" />
          <span className="ml-2 text-xl font-semibold text-foreground">CityFix</span>
        </Link>
      </div>
      <Card>
        <CardHeader className="space-y-2 p-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
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
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-10" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-urban-600 hover:text-urban-800 font-medium">
              Register
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="text-urban-600 hover:text-urban-800 font-medium">
              Forgot your password?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
