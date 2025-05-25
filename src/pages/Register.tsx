import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { authService } from '@/lib/authService';
import { supabase } from '@/lib/supabase';
import CityFixLogo from '@/components/CityFixLogo';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean, error?: any} | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Check Supabase connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Use the enhanced verification method
        const status = await authService.verifyConnection();
        
        setConnectionStatus({
          success: status.connected && status.authConfigured,
          error: !status.connected ? 'Cannot connect to Supabase' :
                 !status.authConfigured ? 'Authentication not configured properly' :
                 !status.profilesTableExists ? 'Profiles table missing' : undefined
        });
        
        console.log('Supabase connection verification:', status);
      } catch (e) {
        console.error('Error verifying Supabase connection:', e);
        setConnectionStatus({ success: false, error: e });
      }
    };
    
    checkConnection();
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (formData: RegisterFormValues) => {
    // Verify connection before attempting signup
    if (connectionStatus && !connectionStatus.success) {
      toast({
        title: "Connection Error",
        description: connectionStatus.error || "Unable to connect to authentication service. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the professional auth service for registration
      const result = await authService.registerUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      
      if (result.success && result.user) {
        // Show success message
        toast({
          title: "Registration Successful",
          description: "Your account has been created. Please check your email for verification.",
        });
        
        // Redirect to login page
        navigate('/login');
      } else {
        // Handle registration failure with specific error message
        let errorMessage = result.message || result.error || "Registration failed. Please try again.";
        
        // Format user-friendly error messages
        if (errorMessage.toLowerCase().includes('already') || 
            errorMessage.toLowerCase().includes('email')) {
          errorMessage = "This email may already be registered or is invalid.";
        } else if (errorMessage.toLowerCase().includes('password')) {
          errorMessage = "Password doesn't meet the requirements. Use at least 6 characters.";
        } else if (errorMessage.toLowerCase().includes('rate')) {
          errorMessage = "Too many attempts. Please try again later.";
        }
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Unexpected error handling
      console.error('Unexpected error during registration:', error);
      
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add direct signup function as a fallback
  const handleDirectSignup = async () => {
    if (!form.formState.isValid) {
      form.trigger(); // Validate all fields
      return;
    }
    
    const formData = form.getValues();
    setIsLoading(true);
    
    try {
      // Direct Supabase signup bypassing our service layer
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            name: formData.name, 
            full_name: formData.name,
            role: 'citizen'
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message || "Could not create account",
          variant: "destructive"
        });
      } else if (data?.user) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully.",
        });
        navigate('/login');
      } else {
        toast({
          title: "Unexpected Response",
          description: "Received unexpected response from the server.",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Testing function to diagnose Supabase issues
  const runDiagnostics = async () => {
    setDiagnosticResults([]);
    const results: string[] = [];
    
    try {
      // Step 1: Check if we can connect to Supabase
      results.push("Testing Supabase connection...");
      try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
          results.push(`❌ Connection test failed: ${error.message}`);
        } else {
          results.push("✅ Successfully connected to Supabase");
        }
      } catch (e: any) {
        results.push(`❌ Connection error: ${e.message}`);
      }
      
      // Step 2: Check auth configuration
      results.push("Testing authentication config...");
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          results.push(`❌ Auth configuration error: ${error.message}`);
        } else {
          results.push("✅ Auth configuration is working");
        }
      } catch (e: any) {
        results.push(`❌ Auth error: ${e.message}`);
      }
      
      // Step 3: Try to create a test user
      results.push("Testing user creation...");
      const testEmail = `test${Math.floor(Math.random() * 1000000)}@example.com`;
      const testPassword = "Test123456!";
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: { name: "Test User", role: "citizen" },
          }
        });
        
        if (error) {
          results.push(`❌ User creation failed: ${error.message}`);
          results.push(`Error details: ${JSON.stringify(error)}`);
        } else if (data?.user?.id) {
          results.push(`✅ Test user created with ID: ${data.user.id}`);
          results.push(`Email: ${testEmail} (Password: ${testPassword})`); 
        } else {
          results.push("❌ User created but no ID returned");
          results.push(`Response: ${JSON.stringify(data)}`); 
        }
      } catch (e: any) {
        results.push(`❌ Exception during user creation: ${e.message}`);
      }
      
      // Step 4: Check if the profiles table exists
      results.push("Checking for profiles table...");
      try {
        // Try to list tables if the method exists
        try {
          const { data, error } = await supabase.rpc('get_all_tables');
          if (error) {
            results.push(`❌ Cannot list tables: ${error.message}`);
          } else {
            results.push(`Available tables: ${JSON.stringify(data)}`); 
            if (data.includes('profiles')) {
              results.push("✅ Profiles table exists");
            } else {
              results.push("❌ Profiles table does NOT exist");
            }
          }
        } catch {
          // Fallback: try querying the profiles table directly
          const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
          if (error && error.message.includes('does not exist')) {
            results.push("❌ Profiles table does NOT exist");
          } else if (error) {
            results.push(`❌ Error checking profiles table: ${error.message}`);
          } else {
            results.push("✅ Profiles table exists");
          }
        }
      } catch (e: any) {
        results.push(`❌ Error checking table structure: ${e.message}`);
      }
    } catch (e: any) {
      results.push(`❌ General testing error: ${e.message}`);
    }
    
    setDiagnosticResults(results);
  };
  
  return (
    <div className="container max-w-md px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex justify-center mb-6 px-2">
        <Link to="/" className="flex items-center">
          <CityFixLogo size={36} className="text-urban-600" />
          <span className="ml-2 text-xl font-semibold text-foreground">CityFix</span>
        </Link>
      </div>
      
      {/* Diagnostic Section - Toggle with button below the form */}
      {showDiagnostic && (
        <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="font-medium">Supabase Diagnostics</h3>
          </div>
          <div className="space-y-1 text-sm">
            {diagnosticResults.length === 0 ? (
              <p>Click "Run Tests" to diagnose Supabase issues</p>
            ) : (
              diagnosticResults.map((result, i) => (
                <p key={i} className={`${result.includes('❌') ? 'text-red-600' : result.includes('✅') ? 'text-green-600' : ''}`}>
                  {result}
                </p>
              ))
            )}
          </div>
          <div className="mt-3 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runDiagnostics}
              disabled={isLoading}
            >
              Run Tests
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDiagnostic(false)}
            >
              Hide
            </Button>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader className="space-y-2 p-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              

            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            <span>Already have an account? </span>
            <Link to="/login" className="text-urban-600 hover:text-urban-800 font-medium">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
      

    </div>
  );
};

export default Register;
