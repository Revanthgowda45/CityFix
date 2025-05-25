import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface AuthStatusProps {
  enabled?: boolean;
}

/**
 * Component that monitors authentication status and shows notifications
 * about session restoration
 */
export const AuthStatus: React.FC<AuthStatusProps> = ({ enabled = true }) => {
  const { toast } = useToast();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    // Only show toast once per session and only if enabled
    if (!enabled || hasShownToast) return;
    
    // Check if this is a session restore by looking for our auth markers
    const hasAuthCookie = document.cookie.includes('cityfix-user-id=');
    const hasLocalStorageUser = localStorage.getItem('cityfix-user-data') !== null;
    const isPageReload = performance.navigation && 
      (performance.navigation.type === 1 || document.referrer.includes(window.location.host));
    
    if ((hasAuthCookie || hasLocalStorageUser) && isPageReload) {
      // Show a toast notification that the session was restored
      toast({
        title: "Session Restored",
        description: "Your session has been successfully maintained.",
        duration: 3000,
        variant: "default"
      });
      
      setHasShownToast(true);
    }
  }, [toast, hasShownToast, enabled]);

  // This component doesn't render anything visible
  return null;
};

export default AuthStatus;
