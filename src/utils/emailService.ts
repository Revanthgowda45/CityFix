import { NotificationType } from './notifications';

/**
 * Interface for email notification payload
 */
export interface EmailPayload {
  to: string;
  subject: string;
  message: string;
  reportId?: string;
  type: NotificationType;
}

/**
 * Simplified email notification service
 * This is a mock implementation that logs to console and returns success
 * In a production environment, you would implement actual email sending here
 */
export const sendEmailNotification = async (payload: EmailPayload): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Log the email details for debugging
    console.log('Email notification would be sent:', {
      to: payload.to,
      subject: payload.subject,
      message: payload.message,
      type: payload.type,
      reportId: payload.reportId
    });
    
    // For now, just pretend we sent it successfully
    // In a real implementation, you would integrate with your email service here
    
    return { 
      success: true,
      data: {
        emailSent: true,
        recipient: payload.to
      }
    };
  } catch (error) {
    console.error('Error in sendEmailNotification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
};

/**
 * Get color based on notification type for consistent styling
 */
export const getNotificationTypeColor = (type: NotificationType): string => {
  switch (type) {
    case 'report_update':
      return '#0284c7'; // Blue
    case 'comment':
      return '#059669'; // Green
    case 'upvote':
      return '#7c3aed'; // Purple
    case 'admin_update':
      return '#c2410c'; // Orange
    case 'system':
    default:
      return '#1f2937'; // Dark gray
  }
};
