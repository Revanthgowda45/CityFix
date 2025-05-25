import { toast } from '@/components/ui/use-toast';
import { sendEmailNotification as sendEmail } from './emailService';

// Define notification types
export type NotificationType = 'report_update' | 'comment' | 'upvote' | 'admin_update' | 'system';

// Define notification payload
export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  reportId?: string;
  commentId?: string;
  userId?: string;
}

// Check if browser notifications are supported
const isBrowserNotificationSupported = () => {
  return 'Notification' in window;
};

// Request permission for browser notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isBrowserNotificationSupported()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Check if notification settings allow for the specific notification
const shouldShowNotification = async (
  notificationsEnabled: boolean, 
  emailNotifications: boolean, 
  type: NotificationType
): Promise<{ inApp: boolean; email: boolean }> => {
  // If notifications are disabled, don't show anything
  if (!notificationsEnabled) {
    return { inApp: false, email: false };
  }

  // Always show in-app notifications if they're enabled
  // For email, check if email notifications are enabled
  return { 
    inApp: true, 
    email: emailNotifications 
  };
};

// Send in-app notification using toast
const sendInAppNotification = (payload: NotificationPayload) => {
  toast({
    title: payload.title,
    description: payload.message,
  });
};

// Send browser notification
const sendBrowserNotification = async (payload: NotificationPayload) => {
  if (!isBrowserNotificationSupported()) {
    return;
  }

  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) {
      return;
    }
  }

  const notification = new Notification(payload.title, {
    body: payload.message,
    icon: '/favicon.ico', // Adjust path as needed
  });

  // Handle notification click
  notification.onclick = () => {
    // Navigate based on notification type
    if (payload.reportId) {
      window.location.href = `/issue/${payload.reportId}`;
    }
    notification.close();
  };
};

// Send email notification using our email service
const sendEmailNotification = async (payload: NotificationPayload, email: string) => {
  try {
    // Log the attempt for debugging
    console.log(`Sending email to ${email}: ${payload.title}`);
    
    // Use our email service to send the notification
    const result = await sendEmail({
      to: email,
      subject: payload.title,
      message: payload.message,
      reportId: payload.reportId,
      type: payload.type
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email notification');
    }
    
    // Show a success toast
    toast({
      title: "Email Notification Sent",
      description: `A notification email has been sent to ${email}`,
      variant: "default",
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    toast({
      title: "Email Notification Failed",
      description: "We couldn't send an email notification. Please try again later.",
      variant: "destructive",
    });
  }
};

// Main notification function to be called from components
export const sendNotification = async (
  payload: NotificationPayload,
  userEmail: string,
  settings: { notificationsEnabled: boolean; emailNotifications: boolean }
) => {
  const { inApp, email } = await shouldShowNotification(
    settings.notificationsEnabled,
    settings.emailNotifications,
    payload.type
  );

  if (inApp) {
    sendInAppNotification(payload);
    await sendBrowserNotification(payload);
  }

  if (email) {
    await sendEmailNotification(payload, userEmail);
  }
};
