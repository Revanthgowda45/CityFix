import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPayload } from '@/utils/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/ThemeProvider';
import { Bell, MapPin, Eye, UserCog, CircleUser, RotateCcw, Sun, Moon, Laptop } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { requestPermission, hasPermission, isRequestingPermission } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [showPermissionButton, setShowPermissionButton] = useState(false);
  
  // Local state to track changes before saving
  const [localSettings, setLocalSettings] = useState({
    notificationsEnabled: settings.notificationsEnabled,
    emailNotifications: settings.emailNotifications,
    mapView: settings.mapView,
    distanceUnit: settings.distanceUnit
  });

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  const handleUpdateLocalSettings = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Show permission button when enabling notifications
    if (key === 'notificationsEnabled' && value === true && !hasPermission) {
      setShowPermissionButton(true);
    }
  };
  
  // Check permission status when component loads
  useEffect(() => {
    // Show permission button if notifications are enabled but we don't have permission
    if (settings.notificationsEnabled && !hasPermission && 'Notification' in window && Notification.permission !== 'granted') {
      setShowPermissionButton(true);
    } else {
      setShowPermissionButton(false);
    }
  }, [settings.notificationsEnabled, hasPermission]);
  
  // Test notification function
  const { sendNotificationToUser } = useNotifications();
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  const sendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const testNotification: NotificationPayload = {
        title: "Test Notification",
        message: "This is a test notification based on your current settings.",
        type: "system"
      };
      
      await sendNotificationToUser(testNotification);
    } catch (error) {
      console.error('Error sending test notification:', error);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveSettings = () => {
    setSaving(true);
    
    // Save settings to context (and localStorage via the context)
    updateSettings(localSettings);
    
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    }, 600);
  };
  
  const handleResetSettings = () => {
    resetSettings();
    setLocalSettings({
      notificationsEnabled: true,
      emailNotifications: true,
      mapView: 'standard',
      distanceUnit: 'km'
    });
    
    toast({
      title: "Settings Reset",
      description: "Your preferences have been reset to defaults.",
    });
  };

  return (
    <div className="container max-w-4xl py-12 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your application preferences</p>
        </div>
      </div>
      
      <Tabs defaultValue="appearance">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="appearance" className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5">
            <CircleUser className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how CityFix looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Choose your preferred color theme</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-accent transition-colors ${theme === 'light' ? 'border-primary bg-accent/50' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Sun className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Light</p>
                      <p className="text-xs text-muted-foreground">Light mode interface</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-accent transition-colors ${theme === 'dark' ? 'border-primary bg-accent/50' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Moon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Dark</p>
                      <p className="text-xs text-muted-foreground">Dark mode interface</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-accent transition-colors ${theme === 'system' ? 'border-primary bg-accent/50' : ''}`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Laptop className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">System</p>
                      <p className="text-xs text-muted-foreground">Matches your device</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="flex flex-col space-y-2">
                  <Label className="font-medium">Current Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'system' 
                      ? 'System preference (follows your device settings)' 
                      : theme === 'dark' 
                        ? 'Dark mode (easier on the eyes in low-light conditions)' 
                        : 'Light mode (better visibility in bright environments)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how CityFix notifies you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications" className="font-medium">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">Receive notifications about reports and updates</p>
                </div>
                <Switch 
                  id="notifications" 
                  checked={localSettings.notificationsEnabled} 
                  onCheckedChange={(value) => handleUpdateLocalSettings('notificationsEnabled', value)} 
                />
              </div>
              
              {showPermissionButton && (
                <div className="mt-4 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={requestPermission}
                    disabled={isRequestingPermission}
                    className="w-full"
                  >
                    {isRequestingPermission ? 'Requesting...' : 'Allow Browser Notifications'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Your browser requires permission to show notifications</p>
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">Receive notifications via email</p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={localSettings.emailNotifications}
                  onCheckedChange={(value) => handleUpdateLocalSettings('emailNotifications', value)}
                  disabled={!localSettings.notificationsEnabled}
                />
              </div>
              
              <div className="mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={sendTestNotification}
                  disabled={isSendingTest || !localSettings.notificationsEnabled}
                >
                  {isSendingTest ? 'Sending...' : 'Send Test Notification'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Test your current notification settings
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Map Preferences</CardTitle>
              <CardDescription>Customize your map viewing experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="default-map-view" className="font-medium">Default Map View</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-2">Choose how the map appears by default</p>
                <RadioGroup 
                  id="default-map-view" 
                  value={localSettings.mapView}
                  onValueChange={(value) => handleUpdateLocalSettings('mapView', value)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="cursor-pointer">Standard</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent">
                    <RadioGroupItem value="satellite" id="satellite" />
                    <Label htmlFor="satellite" className="cursor-pointer">Satellite</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent">
                    <RadioGroupItem value="terrain" id="terrain" />
                    <Label htmlFor="terrain" className="cursor-pointer">Terrain</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent bg-accent/10">
                    <RadioGroupItem value="detailed_streets" id="detailed_streets" />
                    <Label htmlFor="detailed_streets" className="cursor-pointer">Detailed Streets</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <Label htmlFor="distance-unit" className="font-medium">Distance Unit</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-2">Choose your preferred distance unit</p>
                <Select 
                  value={localSettings.distanceUnit} 
                  onValueChange={(value) => handleUpdateLocalSettings('distanceUnit', value)}
                >
                  <SelectTrigger id="distance-unit" className="w-full sm:w-40">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2">
                <Label className="font-medium">Profile Settings</Label>
                <p className="text-sm text-muted-foreground">Update your personal information and profile photo</p>
                <Button variant="outline" className="w-full sm:w-auto mt-2" asChild>
                  <a href="/profile">Manage Profile</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between mt-8">
        <Button 
          onClick={handleResetSettings}
          variant="outline"
          className="w-auto"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button 
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-auto"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
