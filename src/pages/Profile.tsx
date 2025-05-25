
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import AvatarUploadField from '@/components/AvatarUploadField';
import { Separator } from '@/components/ui/separator';
import { getUserStats } from '@/lib/userReportStats';
import { LogOut, Calendar, MapPin, AlertCircle, FileText, MessageSquare, ThumbsUp, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  avatar: z.string()
    .optional()
    .or(z.literal(''))
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserStats {
  reportsCount: number;
  commentsCount: number;
  upvotesCount: number;
}

const Profile = () => {
  const { currentUser, isAuthenticated, updateProfile, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ reportsCount: 0, commentsCount: 0, upvotesCount: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      avatar: currentUser?.avatar || '',
    },
  });

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUser?.id) return;
      
      setIsLoadingStats(true);
      try {
        const stats = await getUserStats(currentUser.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchUserStats();
  }, [currentUser?.id]);


  
  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await updateProfile({
        name: data.name,
        avatar: data.avatar || undefined,
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container max-w-4xl py-12 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and preferences</p>
        </div>
        <Button variant="outline" onClick={logout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Profile Summary</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group overflow-hidden">
                  <Avatar className="h-24 w-24 border-2 border-primary/10">
                    <AvatarImage src={currentUser.avatar} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">{currentUser.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                    <div className="text-white text-xs font-medium">Profile</div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-medium">{currentUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Type</span>
                  <span className="text-sm">{currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm">{new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary/70" />
                    Reports Submitted
                  </span>
                  {isLoadingStats ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-sm font-medium">{userStats.reportsCount}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary/70" />
                    Comments Made
                  </span>
                  {isLoadingStats ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-sm font-medium">{userStats.commentsCount}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5 text-primary/70" />
                    Issues Upvoted
                  </span>
                  {isLoadingStats ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-sm font-medium">{userStats.upvotesCount}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Edit Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
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
                          <Input placeholder="Your email" {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Email cannot be changed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <AvatarUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label="Profile Photo"
                        description="Upload a photo for your profile"
                        fallbackText={currentUser?.name?.[0] || '?'}
                        size="xl"
                        border={true}
                        borderColor="border-primary/20"
                        rounded="full"
                        showRemoveButton={true}
                        className="shadow-sm hover:shadow-md transition-shadow duration-200"
                      />
                    )}
                  />
                  <div className="pt-2">
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
};

export default Profile;
