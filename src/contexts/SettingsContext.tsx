import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/storageUtils';

// Define the settings structure
interface Settings {
  // Map settings
  mapView: 'standard' | 'satellite' | 'terrain' | 'detailed_streets';
  distanceUnit: 'km' | 'mi';
  // Notification settings
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  // User preferences
  religion?: string;
  // We can add more settings here as needed
}

// Default settings
const defaultSettings: Settings = {
  mapView: 'standard',
  distanceUnit: 'km',
  notificationsEnabled: true,
  emailNotifications: true,
  religion: undefined, // Religion is optional and will be prompted if not set
};

// Define the context interface
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Storage key for settings
const SETTINGS_STORAGE_KEY = 'cityfix-user-settings';

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on initial render
  useEffect(() => {
    // Using our safe getter to avoid localStorage issues
    const storedSettings = safeGetItem<Partial<Settings>>(SETTINGS_STORAGE_KEY, {});
    
    // Merge with defaults while ensuring type safety
    setSettings(prev => ({ ...defaultSettings, ...storedSettings }));
    
    // Create event listener for storage changes (for multi-tab support)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY && event.newValue) {
        try {
          const newSettings = JSON.parse(event.newValue);
          setSettings(prev => ({ ...defaultSettings, ...newSettings }));
        } catch (error) {
          console.error('Failed to parse settings from storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    // Create a new settings object with the updated values
    const updatedSettings = { ...settings, ...newSettings };
    
    // Update state
    setSettings(updatedSettings);
    
    // Save to localStorage using our safe setter
    safeSetItem(SETTINGS_STORAGE_KEY, updatedSettings);
    
    // For critical preferences like religion, set a cookie as backup
    if (newSettings.religion) {
      try {
        // Using standard cookie with 1 year expiration
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        document.cookie = `cityfix-religion=${encodeURIComponent(newSettings.religion)}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
      } catch (error) {
        console.error('Failed to set preference cookie:', error);
        // Continue anyway - localStorage is our primary storage
      }
    }
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    safeSetItem(SETTINGS_STORAGE_KEY, defaultSettings);
    
    // Clear preference cookies as well
    document.cookie = 'cityfix-religion=; path=/; max-age=0; SameSite=Strict';
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
