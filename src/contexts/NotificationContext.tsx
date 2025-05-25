import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { NotificationPayload, requestNotificationPermission, sendNotification } from '@/utils/notifications';
import { toast } from '@/components/ui/use-toast';

interface NotificationContextType {
  sendNotificationToUser: (payload: NotificationPayload) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
  isRequestingPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();
  const { currentUser } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);

  // Check notification permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if ('Notification' in window) {
        const permission = Notification.permission;
        setHasPermission(permission === 'granted');
      }
    };
    
    checkPermission();
  }, []);

  // Request permission function
  const requestPermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    try {
      const granted = await requestNotificationPermission();
      setHasPermission(granted);
      
      if (granted) {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive notifications about updates to reports you're following.",
        });
      } else {
        toast({
          title: "Notifications Disabled",
          description: "You won't receive browser notifications. You can change this in your browser settings.",
          variant: "destructive",
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Send notification to the current user
  const sendNotificationToUser = async (payload: NotificationPayload): Promise<void> => {
    if (!currentUser) return;
    
    await sendNotification(
      payload,
      currentUser.email,
      {
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications
      }
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        sendNotificationToUser,
        requestPermission,
        hasPermission,
        isRequestingPermission
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
