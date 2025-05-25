/**
 * Storage utility functions for handling localStorage and cookies
 * These utilities help ensure proper storage management and cleanup
 */

/**
 * List of known problematic localStorage keys that may cause issues
 * Add any keys here that are causing performance problems or conflicts
 */
const PROBLEMATIC_KEYS = ['Usage'];

/**
 * Safe localStorage getter with error handling
 * @param key The key to retrieve from localStorage
 * @param defaultValue Default value to return if key doesn't exist or has errors
 */
export function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safe localStorage setter with error handling
 * @param key The key to store in localStorage
 * @param value The value to store (will be JSON stringified)
 */
export function safeSetItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
}

/**
 * Clean up potentially problematic localStorage items
 * This helps prevent issues with authentication loading delays
 */
export function cleanupLocalStorage(): void {
  try {
    // If "Usage" exists and is causing issues, we'll handle it in a safe way
    const usageItem = localStorage.getItem('Usage');
    
    if (usageItem !== null) {
      try {
        // Try to parse it first to see if it's valid JSON
        const parsedUsage = JSON.parse(usageItem);
        
        // If it parsed successfully, check if it's an object and not too large
        const isLargeObject = 
          typeof parsedUsage === 'object' && 
          parsedUsage !== null && 
          JSON.stringify(parsedUsage).length > 10000;
        
        if (isLargeObject) {
          console.warn('Found large Usage object in localStorage, restructuring');
          
          // Save important user preferences if needed
          const userPreferences = parsedUsage.preferences || {};
          
          // Create a smaller version that keeps essential preferences
          const essentialData = { 
            preferences: userPreferences,
            version: 2,
            lastAccessed: new Date().toISOString()
          };
          
          // Replace with the minimized version
          localStorage.setItem('Usage', JSON.stringify(essentialData));
        }
      } catch (parseError) {
        // If we can't parse it, it's corrupted
        console.warn('Found corrupted Usage data in localStorage, removing');
        
        // Don't just delete it - that might cause UX issues
        // Instead replace with a minimal valid structure
        localStorage.setItem('Usage', JSON.stringify({ 
          version: 2,
          restored: true,
          timestamp: new Date().toISOString()
        }));
      }
    }
    
    // Handle any other problematic keys
    PROBLEMATIC_KEYS.forEach(key => {
      if (key === 'Usage') return; // Already handled above
      
      try {
        const item = localStorage.getItem(key);
        if (item === null) return;
        
        // Try to parse and fix if needed
        JSON.parse(item);
        // If we can parse it without error, it's probably OK
      } catch (error) {
        console.warn(`Found corrupted ${key} in localStorage, fixing`);
        localStorage.setItem(key, JSON.stringify({ restored: true }));
      }
    });
  } catch (error) {
    console.error('Error during localStorage cleanup:', error);
    // Don't throw - we want this to be non-blocking
  }
}

/**
 * Get a cookie value by name
 * @param name Cookie name to retrieve
 */
export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * Set a cookie with options
 * @param name Cookie name
 * @param value Cookie value
 * @param days Number of days until expiration (optional)
 * @param path Cookie path (defaults to '/')
 * @param sameSite SameSite policy (defaults to 'Strict')
 */
export function setCookie(
  name: string, 
  value: string, 
  days?: number, 
  path: string = '/', 
  sameSite: 'Strict' | 'Lax' | 'None' = 'Strict'
): void {
  let cookie = `${name}=${value}; path=${path}; SameSite=${sameSite}`;
  
  if (days) {
    const maxAge = days * 24 * 60 * 60;
    cookie += `; max-age=${maxAge}`;
  }
  
  if (sameSite === 'None') {
    cookie += '; Secure';
  }
  
  document.cookie = cookie;
}

/**
 * Delete a cookie by setting its expiration to the past
 * @param name Cookie name to delete
 * @param path Cookie path (defaults to '/')
 */
export function deleteCookie(name: string, path: string = '/'): void {
  document.cookie = `${name}=; path=${path}; max-age=0; SameSite=Strict`;
}
