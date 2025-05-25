import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { PasswordInput } from '@/components/ui/password-input';
import { updatePassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import CityFixLogo from '@/components/CityFixLogo';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isValidResetUrl, setIsValidResetUrl] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if the URL contains the necessary hash parameters for password reset
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      setIsValidResetUrl(true);
      // Set the session with the recovery tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
    } else {
      setIsValidResetUrl(false);
    }
  }, [location.hash]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      await updatePassword(data.password);
      setIsSubmitted(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: "There was a problem resetting your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidResetUrl && !isSubmitted) {
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
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">Invalid Reset Link</CardTitle>
            <CardDescription className="text-center">
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 pt-0">
            <p className="text-center text-muted-foreground mb-4">
              Please request a new password reset link.
            </p>
            <Button onClick={() => navigate('/forgot-password')} className="w-full max-w-xs">
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex justify-center mb-6 px-2">
        <Link to="/" className="flex items-center">
          <CityFixLogo size={36} className="text-urban-600" />
          <span className="ml-2 text-xl font-semibold text-foreground">CityFix</span>
        </Link>
      </div>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">Create New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-lg font-medium">Password Reset Complete</h3>
              <p className="text-center text-muted-foreground">
                Your password has been successfully reset. You will be redirected to the login page.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} />
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
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-10" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            <span>Remember your password? </span>
            <Link to="/login" className="text-urban-600 hover:text-urban-800 font-medium">
              Back to Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
