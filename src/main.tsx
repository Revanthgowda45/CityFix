import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { initializeUsageTracking } from './lib/userActivity'
import { cleanupLocalStorage } from './lib/storageUtils'

// Perform cleanup and initialization before app loads
// This prevents the "Loading authentication..." delay
try {
  // First clean up any problematic localStorage items
  cleanupLocalStorage();
  
  // Then initialize the Usage tracking with proper structure
  initializeUsageTracking();
} catch (error) {
  console.warn('Error during app initialization:', error);
  // Continue loading the app even if there's an error
}

createRoot(document.getElementById("root")!).render(<App />);
