import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from '@/contexts/AuthContext';
import { useReports, Report, ReportCategory, ReportSeverity, ReportStatus } from '@/contexts/ReportContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';
import ModernPhotoUpload from '@/components/ModernPhotoUpload';

const reportSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  category: z.string(),
  severity: z.string(),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  imageUrl: z.union([
    // Single image (string)
    z.string()
      .refine(
        (val) => !val || val.startsWith('http') || val.startsWith('data:image/'), 
        { message: "Image URL must be empty, start with http, or be a valid image data" }
      )
      .optional()
      .or(z.literal('')),
    // Multiple images (array)
    z.array(
      z.string()
        .refine(
          (val) => !val || val.startsWith('http') || val.startsWith('data:image/'), 
          { message: "Image URL must be empty, start with http, or be a valid image data" }
        )
    )
  ]),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const ReportIssue = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { addReport, refreshReports } = useReports();
  const { sendNotificationToUser } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number}>({
    lat: 40.7128, 
    lng: -74.0060
  });
  
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'pothole',
      severity: 'medium',
      address: '',
      imageUrl: '',
    },
  });

  const handleLocationSelect = (address: string, lat: number, lng: number) => {
    form.setValue('address', address);
    setCoordinates({ lat, lng });
  };

  const onSubmit = async (data: ReportFormValues) => {
    if (!isAuthenticated || !currentUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to submit a report.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    // Validate coordinates are set
    if (!coordinates.lat || !coordinates.lng) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      
      const newReport = {
        title: data.title,
        description: data.description,
        category: data.category as ReportCategory,
        severity: data.severity as ReportSeverity,
        location: {
          address: data.address,
          coordinates: coordinates,
        },
        images: Array.isArray(data.imageUrl) ? data.imageUrl : data.imageUrl ? [data.imageUrl] : [],
        status: 'reported' as ReportStatus,
        reportedBy: {
          id: currentUser.id,
          name: currentUser.name,
        },
        upvotedBy: [],
      };
      
      // Submit the report - this is the only operation we wait for before showing feedback
      await addReport(newReport);

      // Show success toast immediately
      toast({
        title: "Report Submitted",
        description: "Your issue has been successfully reported.",
      });
      
      // Determine where to navigate
      const navigateTo = location.state && location.state.from === 'map' 
        ? '/map' 
        : '/dashboard';
      
      // Navigate immediately for faster perceived performance
      navigate(navigateTo, { state: { refresh: true } });
      
      // These operations can happen in the background after navigation for faster UX
      Promise.all([
        // Refresh reports in background
        refreshReports(),
        // Send notification in background
        sendNotificationToUser({
          title: "Report Submitted Successfully",
          message: `Your report "${data.title}" has been submitted and will be reviewed by city officials.`,
          type: "system"
        })
      ]).catch(error => {
        console.error('Background operations error:', error);
        // No need to show this error to the user since they've already navigated away
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: "There was a problem submitting your report. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Report an Issue</h1>
          <p className="text-muted-foreground mt-1">
            Fill out the form below to report an urban issue in your area.
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Issue Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Large pothole on Main Street" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short, descriptive title for the issue
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an issue category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pothole">Pothole</SelectItem>
                          <SelectItem value="streetlight">Streetlight</SelectItem>
                          <SelectItem value="garbage">Garbage</SelectItem>
                          <SelectItem value="graffiti">Graffiti</SelectItem>
                          <SelectItem value="road_damage">Road Damage</SelectItem>
                          <SelectItem value="flooding">Flooding</SelectItem>
                          <SelectItem value="sign_damage">Sign Damage</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-2"
                        >
                          <FormItem className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="low" />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer font-normal">Low</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="medium" />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer font-normal">Medium</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="high" />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer font-normal">High</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please provide detailed information about the issue..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <LocationPicker 
                        initialAddress={field.value}
                        onLocationSelect={handleLocationSelect}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <ModernPhotoUpload
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              
              <div className="bg-muted/50 p-4 rounded-md flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>By submitting this report, you confirm that:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>The information provided is accurate to the best of your knowledge</li>
                    <li>You have permission to share any images submitted</li>
                    <li>This is a public report that local authorities will be able to access</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 h-10 order-1 sm:order-none">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-10 order-0 sm:order-none mb-2 sm:mb-0" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportIssue;
