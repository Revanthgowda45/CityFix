import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useReports, Report } from '@/contexts/ReportContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MapPin, Locate, Loader2, Maximize, Minimize, Clock, Map as MapIcon, AlertCircle, Layers, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OpenStreetMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  reports?: Report[];
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  selectedLocation?: [number, number] | null;
  enableManualPin?: boolean;
  onLoad?: () => void;
  showUseMyLocation?: boolean;
  showMapStyles?: boolean;
}

// Custom marker icons
// Use a simple object for icon caching to avoid Map constructor issues
const iconCache: Record<string, Icon> = {};

const createCustomIcon = (color: string) => {
  // Check if we already created this icon
  if (iconCache[color]) {
    return iconCache[color];
  }
  
  // Create new icon if not cached
  const icon = new Icon({
    iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
    iconSize: [37, 37],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    // Add these properties to improve stability
    className: 'map-pin-stable'
  });
  
  // Store in cache
  iconCache[color] = icon;
  return icon;
};

const LocationMarker = ({ onLocationSelect, enableManualPin }: { onLocationSelect?: (lat: number, lng: number, address: string) => void, enableManualPin?: boolean }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const map = useMap();
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const lastPositionRef = useRef<[number, number] | null>(null);
  const updateIntervalRef = useRef<number>(1000);
  const isFirstUpdateRef = useRef<boolean>(true);
  const { settings } = useSettings();

  // Function to get detailed address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1&extratags=1&accept-language=en`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'CityFix/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      if (data && data.address) {
        setAddressDetails(data.address);
        
        // Build a professional address string with proper formatting
        const addressParts = [];
        
        // Primary address components
        if (data.address.house_number || data.address.road) {
          const streetAddress = [
            data.address.house_number,
            data.address.road
          ].filter(Boolean).join(' ');
          addressParts.push(streetAddress);
        }
        
        // Secondary address components
        const secondaryComponents = [
          data.address.suburb,
          data.address.neighbourhood,
          data.address.quarter
        ].filter(Boolean);
        
        if (secondaryComponents.length > 0) {
          addressParts.push(secondaryComponents[0]); // Use the most specific one
        }
        
        // City/Town/Village
        const cityComponent = data.address.city || data.address.town || data.address.village;
        if (cityComponent) {
          addressParts.push(cityComponent);
        }
        
        // District/County
        if (data.address.district) {
          addressParts.push(data.address.district);
        }
        
        // State/Province
        if (data.address.state) {
          addressParts.push(data.address.state);
        }
        
        // Postal code
        if (data.address.postcode) {
          addressParts.push(data.address.postcode);
        }
        
        // Country
        if (data.address.country) {
          addressParts.push(data.address.country);
        }

        // Format the address with proper separators
        const formattedAddress = addressParts
          .filter(Boolean)
          .join(', ')
          .replace(/\s*,\s*/g, ', ') // Ensure consistent spacing around commas
          .replace(/,\s*,/g, ','); // Remove double commas

        setAddress(formattedAddress);
        return formattedAddress;
      }
      
      // Fallback to display_name if address components are not available
      if (data.display_name) {
        const addressParts = data.display_name
          .split(',')
          .map((part: string) => part.trim())
          .filter(Boolean);
        
        const formattedAddress = addressParts.join(', ');
        setAddress(formattedAddress);
        return formattedAddress;
      }
      
      // Ultimate fallback to coordinates
      const coordinateAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(coordinateAddress);
      return coordinateAddress;
    } catch (error) {
      console.error('Error getting address:', error);
      const coordinateAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(coordinateAddress);
      return coordinateAddress;
    }
  };

  // Function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: 'km' | 'mi' = 'km') => {
    const R = unit === 'km' ? 6371 : 3958.8; // Radius of the earth in km or miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km or miles
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // Function to format distance with proper units
  const formatDistance = (distance: number, unit: 'km' | 'mi') => {
    const formatted = distance.toFixed(1);
    return `${formatted} ${unit}`;
  };

  useEffect(() => {
    // Configure location options for higher accuracy
    const locationOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const newPosition: [number, number] = [latitude, longitude];
        const now = Date.now();

        // Update heading and speed if available
        if (heading !== null) setHeading(heading);
        if (speed !== null) setSpeed(speed);

        // Check if we should update based on distance and time
        if (lastPositionRef.current) {
          const distanceKm = calculateDistance(
            lastPositionRef.current[0],
            lastPositionRef.current[1],
            newPosition[0],
            newPosition[1],
            settings.distanceUnit
          );

          // Convert threshold to proper unit and only update if moved more than 5 meters
          const minDistanceThreshold = settings.distanceUnit === 'km' ? 0.005 : 0.003; // 5 meters in km or ~15 feet in miles

          // If we haven't moved enough or it's too soon, skip update
          if (distanceKm < minDistanceThreshold && now - lastUpdateTimeRef.current < updateIntervalRef.current) {
            return;
          }

          // Adjust update interval based on speed
          if (speed !== null) {
            if (speed > 5) { // If moving faster than 5 m/s
              updateIntervalRef.current = 500; // Update more frequently
            } else {
              updateIntervalRef.current = 1000; // Normal update interval
            }
          }
        }

        setIsUpdating(true);
        setPosition(newPosition);
        setAccuracy(accuracy);
        lastPositionRef.current = newPosition;
        lastUpdateTimeRef.current = now;
        
        // Only update map view if accuracy is good enough (less than 50 meters)
        if (accuracy < 50) {
          // Calculate zoom level based on speed
          let zoomLevel = map.getZoom();
          if (speed !== null) {
            if (speed > 5) {
              zoomLevel = Math.min(zoomLevel, 15); // Zoom out when moving fast
            } else {
              zoomLevel = Math.max(zoomLevel, 16); // Zoom in when stationary
            }
          }

          map.flyTo(newPosition, zoomLevel, {
            duration: 1,
            easeLinearity: 0.25
          });

          // Get address for the new position
          const newAddress = await getAddressFromCoordinates(latitude, longitude);
          
          // Never call onLocationSelect for live location updates
          isFirstUpdateRef.current = false;
        }
        setIsUpdating(false);
      },
      (error) => {
        console.error('Location error:', error);
        let errorMessage = "Unable to get your location. ";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable. Please check your device's location settings.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "Please check your location settings and try again.";
        }

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsUpdating(false);
      },
      locationOptions
    );

    // Cleanup
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [map, onLocationSelect, enableManualPin, settings.distanceUnit]);

  if (!position) return null;

  // Calculate marker rotation based on heading
  const rotationStyle = heading !== null ? {
    transform: `rotate(${heading}deg)`,
    transition: 'transform 0.3s ease-out'
  } : {};

  return (
    <>
      <Marker 
        position={position} 
        icon={createCustomIcon('blue')}
        zIndexOffset={1000}
      >
        <Popup closeButton={false} autoPan={true} className="leaflet-popup-modern">
          <div className="w-[280px] xs:w-[300px] sm:w-[320px] p-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100/50">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                  <Locate className="h-4 w-4" />
                </span>
                <div className="text-gray-800 font-medium">
                  Your Location
                </div>
              </div>
              {isUpdating && (
                <div className="animate-pulse text-blue-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            {address && (
              <div className="text-xs sm:text-sm space-y-1">
                <p className="font-medium line-clamp-2">{address}</p>
                {addressDetails && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
                    {addressDetails.house_number && addressDetails.road && (
                      <p className="truncate flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">Street:</span> {addressDetails.house_number} {addressDetails.road}</p>
                    )}
                    {addressDetails.suburb && (
                      <p className="truncate flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">Area:</span> {addressDetails.suburb}</p>
                    )}
                    {addressDetails.city && (
                      <p className="truncate flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">City:</span> {addressDetails.city}</p>
                    )}
                    {addressDetails.state && (
                      <p className="truncate flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">State:</span> {addressDetails.state}</p>
                    )}
                    {addressDetails.postcode && (
                      <p className="truncate flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">Postal Code:</span> {addressDetails.postcode}</p>
                    )}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
                  {accuracy && (
                    <p className="flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">Accuracy:</span> {Math.round(accuracy)} meters</p>
                  )}
                  {speed !== null && (
                    <p className="flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">Speed:</span> {Math.round(speed * 3.6)} km/h</p>
                  )}
                  {heading !== null && (
                    <p className="flex items-center"><span className="w-20 flex-shrink-0 text-gray-500">Heading:</span> {Math.round(heading)}°</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
      {accuracy && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.1,
            weight: 1
          }}
        />
      )}
    </>
  );
};

// Update ManualPinHandler to use the same improved address fetching
const ManualPinHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, address: string) => void }) => {
  const map = useMap();
  
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1&extratags=1&accept-language=en`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'CityFix/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      if (data && data.address) {
        // Build a professional address string with proper formatting
        const addressParts = [];
        
        // Primary address components
        if (data.address.house_number || data.address.road) {
          const streetAddress = [
            data.address.house_number,
            data.address.road
          ].filter(Boolean).join(' ');
          addressParts.push(streetAddress);
        }
        
        // Secondary address components
        const secondaryComponents = [
          data.address.suburb,
          data.address.neighbourhood,
          data.address.quarter
        ].filter(Boolean);
        
        if (secondaryComponents.length > 0) {
          addressParts.push(secondaryComponents[0]); // Use the most specific one
        }
        
        // City/Town/Village
        const cityComponent = data.address.city || data.address.town || data.address.village;
        if (cityComponent) {
          addressParts.push(cityComponent);
        }
        
        // District/County
        if (data.address.district) {
          addressParts.push(data.address.district);
        }
        
        // State/Province
        if (data.address.state) {
          addressParts.push(data.address.state);
        }
        
        // Postal code
        if (data.address.postcode) {
          addressParts.push(data.address.postcode);
        }
        
        // Country
        if (data.address.country) {
          addressParts.push(data.address.country);
        }

        // Format the address with proper separators
        const formattedAddress = addressParts
          .filter(Boolean)
          .join(', ')
          .replace(/\s*,\s*/g, ', ') // Ensure consistent spacing around commas
          .replace(/,\s*,/g, ','); // Remove double commas

        return addressParts.join(', ');
      }
      
      // Fallback to display_name if address components are not available
      if (data.display_name) {
        const addressParts = data.display_name
          .split(',')
          .map((part: string) => part.trim())
          .filter(Boolean);
        
        const formattedAddress = addressParts.join(', ');
        return formattedAddress;
      }
      
      // Ultimate fallback to coordinates
      const coordinateAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      return coordinateAddress;
    } catch (error) {
      console.error('Error getting address:', error);
      const coordinateAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      return coordinateAddress;
    }
  };
  
  useMapEvent('click', async (e) => {
    // Prevent any default behavior
    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();
    
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Get address using the improved function
    const address = await getAddressFromCoordinates(lat, lng);
    
    // Ensure the map is centered on the clicked location
    map.setView([lat, lng], map.getZoom());
    
    // Call onLocationSelect with the precise coordinates and formatted address
    onLocationSelect(lat, lng, address);
  });
  
  return null;
};

const IssueCard = ({ report }: { report: Report }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'in_progress':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pothole':
        return '🕳️';
      case 'streetlight':
        return '💡';
      case 'garbage':
        return '🗑️';
      case 'graffiti':
        return '🖌️';
      case 'road_damage':
        return '🚧';
      case 'flooding':
        return '💧';
      case 'sign_damage':
        return '🚫';
      default:
        return '📍';
    }
  };

  return (
    <div className="w-[280px] xs:w-[300px] sm:w-[320px] p-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100/50">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 max-w-[70%]">
          <span className="text-xl flex-shrink-0">{getCategoryIcon(report.category)}</span>
          <h3 className="font-medium text-sm truncate">{report.title}</h3>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs whitespace-nowrap ml-1 flex-shrink-0 ${getStatusColor(report.status)}`}
        >
          {report.status.replace('_', ' ')}
        </Badge>
      </div>
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{report.location.address}</p>
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
        </span>
        <Link 
          to={`/issue/${report.id}`}
          className="text-primary hover:underline font-medium flex items-center gap-1"
        >
          View details
          <MapPin className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

// Component to handle map click events
const MapClickHandler = React.memo(() => {
  useMapEvent('click', (e) => {
    // Prevent default only if needed to avoid unnecessary operations
    if (e.originalEvent && e.originalEvent.target && 
        (e.originalEvent.target as HTMLElement).tagName !== 'BUTTON') {
      e.originalEvent.preventDefault();
    }
  });
  return null;
});

const OpenStreetMap = ({
  center = [12.9716, 77.5946], // Default to Bengaluru
  zoom = 11, // Changed from 13 to 11 for a wider view
  height = '600px',
  reports,
  onLocationSelect,
  selectedLocation,
  enableManualPin,
  onLoad,
  showUseMyLocation = false,
  showMapStyles = true
}: OpenStreetMapProps) => {
  // Get settings from context
  const { settings, updateSettings } = useSettings();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { reports: allReports } = useReports();
  const [isLocating, setIsLocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveLocationActive, setIsLiveLocationActive] = useState(false);
  const [manualPinLocation, setManualPinLocation] = useState<[number, number] | null>(null);
  const [manualPinAddress, setManualPinAddress] = useState<string>('');
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const reportsList = reports || allReports;

  // Add effect to handle center changes - with debounce to prevent frequent updates
  useEffect(() => {
    if (!mapRef.current || !center) return;
    
    const timeoutId = setTimeout(() => {
      mapRef.current?.flyTo(center, zoom, {
        duration: 1.5
      });
    }, 50); // Small debounce to avoid multiple rapid flyTo calls
    
    return () => clearTimeout(timeoutId);
  }, [center, zoom]);

  // Add effect to handle selected location changes
  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      console.log('Updating map to selected location:', selectedLocation);
      mapRef.current.flyTo(selectedLocation, zoom, {
        duration: 1.5
      });
      setManualPinLocation(selectedLocation);
    }
  }, [selectedLocation, zoom]);

  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  // Fullscreen toggle logic
  const handleFullscreenToggle = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'in_progress':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pothole':
        return '🕳️';
      case 'streetlight':
        return '💡';
      case 'garbage':
        return '🗑️';
      case 'graffiti':
        return '🖌️';
      case 'road_damage':
        return '🚧';
      case 'flooding':
        return '💧';
      case 'sign_damage':
        return '🚫';
      default:
        return '📍';
    }
  };

  const getCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      pothole: 'Pothole',
      streetlight: 'Street Light',
      garbage: 'Garbage',
      graffiti: 'Graffiti',
      road_damage: 'Road Damage',
      flooding: 'Flooding',
      sign_damage: 'Sign Damage',
      tree: 'Tree Issue',
      sidewalk: 'Sidewalk',
      traffic: 'Traffic Issue',
      other: 'Other'
    };
    return categoryNames[category] || 'Other';
  };

  // Handle manual pin selection
  const handleManualPinSelect = (lat: number, lng: number, address: string) => {
    setManualPinLocation([lat, lng]);
    setManualPinAddress(address);
    setIsLiveLocationActive(false);
    
    // Only pass to parent if onLocationSelect is defined
    if (onLocationSelect) {
      onLocationSelect(lat, lng, address);
    }
  };

  // Optimized function to get address from coordinates
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Add cache buster to avoid browser caching the API response
      const cacheBuster = Date.now();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&cb=${cacheBuster}&accept-language=en`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'CityFix/1.0'
          },
          // Add cache control
          cache: 'no-store'
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      
      if (!data || (!data.address && !data.display_name)) {
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      
      if (data.display_name) {
        return data.display_name;
      }
      
      // Build a professional address string
      const addressParts = [];
      
      // Only include the most relevant address components
      const components = [
        data.address.house_number && data.address.road ? 
          `${data.address.house_number} ${data.address.road}` : data.address.road,
        data.address.suburb || data.address.neighbourhood || data.address.quarter,
        data.address.city || data.address.town || data.address.village,
        data.address.state,
        data.address.postcode,
        data.address.country
      ];
      
      return components
        .filter(Boolean)
        .join(', ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/,\s*,/g, ',');
    } catch (error) {
      console.error('Error getting address:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  // Handle live location activation - optimized version
  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    // If live location is already active, toggle it off
    if (isLiveLocationActive) {
      setIsLiveLocationActive(false);
      setManualPinLocation(null);
      
      // Zoom out to a wider view when disabling live location
      mapRef.current?.flyTo(center, zoom, { duration: 1.5 });
      
      toast({
        title: "Live location disabled",
        description: "Location tracking has been turned off.",
      });
      return;
    }

    setIsLocating(true);
    try {
      // Use a promise with a timeout to handle geolocation more gracefully
      const position = await Promise.race([
        new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Location request timed out')), 12000)
        )
      ]);

      const { latitude, longitude } = position.coords;
      
      // Immediately update the map view - don't wait for address
      mapRef.current?.flyTo([latitude, longitude], 16, { duration: 1.5 });
      
      // Update state in a single batch
      setManualPinLocation(null);
      setIsLiveLocationActive(true);
      
      // Get detailed address asynchronously - don't block UI update
      const address = await getAddressFromCoordinates(latitude, longitude);
      
      // Call onLocationSelect with the address
      onLocationSelect?.(latitude, longitude, address);

      toast({
        title: "Live location enabled",
        description: "Your location is now being tracked on the map.",
      });
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: "Location error",
        description: "Failed to get your location. Please check your location settings and try again.",
        variant: "destructive",
      });
      setIsLiveLocationActive(false);
    } finally {
      setIsLocating(false);
    }
  };

  // Create a separate stable rendering function for report markers
  const renderReportMarker = useCallback((report: Report) => {
    return (
      <Marker
        key={report.id}
        position={[report.location.coordinates.lat, report.location.coordinates.lng]}
        icon={createCustomIcon(getStatusColor(report.status))}
        eventHandlers={{
          click: () => setSelectedReport(report),
        }}
      >
        <Popup>
          <IssueCard report={report} />
        </Popup>
      </Marker>
    );
  }, []);
  
  // Memoize the report markers to prevent unnecessary re-renders
  const reportMarkers = useMemo(() => {
    return reportsList.map(renderReportMarker);
  }, [reportsList, renderReportMarker]);

  return (
    <Card 
      ref={containerRef}
      style={{ 
        height, 
        width: '100%',
        position: 'relative',
        zIndex: 1
      }} 
      className={`overflow-hidden relative border-0 ${isFullscreen ? 'fixed inset-0 z-50 h-full w-full rounded-none' : 'shadow-lg rounded-xl'}`}
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.preventDefault()}
    >
      <CardContent className="p-0 h-full">
      {/* Map Controls Group - Top Right */}
      <div className="absolute top-2 md:top-4 right-2 md:right-4 z-30 flex flex-col space-y-2.5">
        {/* Map Styles Menu */}
        {showMapStyles && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className={`bg-white/90 backdrop-blur-sm hover:bg-white/100 shadow-lg hover:shadow-xl rounded-full p-1.5 sm:p-2 transition-all duration-300 ease-in-out text-gray-700 hover:text-gray-900 border border-gray-100/30`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      aria-label="Change Map Style"
                    >
                      <Layers className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className={settings.mapView === 'standard' ? 'bg-muted font-medium' : ''}
                      onClick={() => updateSettings({ mapView: 'standard' })}
                    >
                      Standard
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={settings.mapView === 'satellite' ? 'bg-muted font-medium' : ''}
                      onClick={() => updateSettings({ mapView: 'satellite' })}
                    >
                      Satellite
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={settings.mapView === 'terrain' ? 'bg-muted font-medium' : ''}
                      onClick={() => updateSettings({ mapView: 'terrain' })}
                    >
                      Terrain
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={settings.mapView === 'detailed_streets' ? 'bg-muted font-medium' : ''}
                      onClick={() => updateSettings({ mapView: 'detailed_streets' })}
                    >
                      Detailed Streets
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change Map Style</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Fullscreen Toggle Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
                <Button
                variant="secondary"
                size="icon"
                className={`bg-white/90 backdrop-blur-sm hover:bg-white/100 shadow-lg hover:shadow-xl rounded-full p-1.5 sm:p-2 transition-all duration-300 ease-in-out border border-gray-100/30 ${
                  isFullscreen ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400' : 'text-gray-700 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFullscreenToggle();
                }}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Use My Location Button */}
      {showUseMyLocation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className={`absolute bottom-2 md:bottom-4 right-2 md:right-4 z-20 bg-white/90 backdrop-blur-sm hover:bg-white/100 shadow-lg hover:shadow-xl rounded-full p-1.5 sm:p-2 transition-all duration-300 ease-in-out border border-gray-100/30 ${
                  isLiveLocationActive 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400 animate-pulse' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUseMyLocation();
                }}
                disabled={isLocating}
                aria-label={isLiveLocationActive ? "Live Location Active" : "Use My Location"}
              >
                {isLocating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Locate className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isLiveLocationActive ? "Live Location Active" : "Use My Location"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ 
          height: '100%', 
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}
        className="z-10 [&>.leaflet-control-container>.leaflet-top.leaflet-left]:!left-2 md:!left-4 [&>.leaflet-control-container>.leaflet-top.leaflet-left]:!top-2 md:!top-4 [&>.leaflet-control-container>.leaflet-top.leaflet-left>.leaflet-control]:!shadow-md [&>.leaflet-control-container>.leaflet-top.leaflet-left>.leaflet-control]:!rounded-lg [&>.leaflet-control-container>.leaflet-top.leaflet-right]:!right-2 md:!right-4 [&>.leaflet-control-container>.leaflet-top.leaflet-right]:!top-2 md:!top-4 [&>.leaflet-control-container>.leaflet-bottom.leaflet-right]:!right-2 md:!right-4 [&>.leaflet-control-container>.leaflet-bottom.leaflet-right]:!bottom-2 md:!bottom-4 [&>.leaflet-control-container>.leaflet-bottom.leaflet-left]:!left-2 md:!left-4 [&>.leaflet-control-container>.leaflet-bottom.leaflet-left]:!bottom-2 md:!bottom-4"
        ref={mapRef}
        zoomControl={window.innerWidth > 640} /* Only show zoom controls on larger screens */
        attributionControl={false} /* We'll add a custom attribution control */
        doubleClickZoom={false}
        scrollWheelZoom={true}
      >
        {/* Map click handler */}
        <MapClickHandler />
        
        {/* Custom attribution control with better styling */}
        <div className="absolute bottom-0 right-0 z-20 bg-white/70 backdrop-blur-[2px] px-1.5 py-0.5 text-[10px] text-gray-500 rounded-tl-md" style={{margin: 0}}>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" className="hover:text-gray-700">© OpenStreetMap</a> | <a href="https://cityfix.app" className="text-primary hover:underline">CityFix</a>
        </div>
        {/* Use the map style from settings */}
        {settings.mapView === 'standard' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {settings.mapView === 'satellite' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        {settings.mapView === 'terrain' && (
          <TileLayer
            attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a> contributors'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        )}
        {settings.mapView === 'detailed_streets' && (
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>'
            url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
          />
        )}
        
        {/* Show manual pin if selected */}
        {manualPinLocation && !isLiveLocationActive && (
          <Marker 
            position={manualPinLocation} 
            icon={createCustomIcon('red')}
            zIndexOffset={1000}
          >
            <Popup closeButton={false} autoPan={true} className="leaflet-popup-modern">
              <div className="w-[280px] xs:w-[300px] sm:w-[320px] p-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100/50">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="text-gray-800 font-medium">
                      Selected Location
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{manualPinAddress || 'Loading address information...'}</p>
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {manualPinLocation[0].toFixed(6)}, {manualPinLocation[1].toFixed(6)}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 px-2 text-xs gap-1 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => {
                      if (onLocationSelect && manualPinAddress) {
                        onLocationSelect(manualPinLocation[0], manualPinLocation[1], manualPinAddress);
                      }
                    }}
                  >
                    Confirm
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Manual pin handler for map click */}
        {enableManualPin && !isLiveLocationActive && (
          <ManualPinHandler onLocationSelect={handleManualPinSelect} />
        )}

        {/* Location marker for current position */}
        {showUseMyLocation && isLiveLocationActive && (
          <LocationMarker onLocationSelect={onLocationSelect} enableManualPin={enableManualPin} />
        )}

        {/* Use memoized report markers instead of inline mapping */}
        {reportMarkers}
      </MapContainer>
      </CardContent>
    </Card>
  );
};

export default OpenStreetMap; 