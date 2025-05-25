import React, { useState } from 'react';
import { MapPin, Navigation, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LocationMapProps {
  address: string;
  lat: number;
  lng: number;
  className?: string;
  interactive?: boolean;
}



const LocationMap: React.FC<LocationMapProps> = ({ 
  address, 
  lat, 
  lng, 
  className,
  interactive = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  // Sanitize the address for URL usage
  const sanitizedAddress = encodeURIComponent(address);  
  
  // Create the OpenStreetMap URL based on coordinates
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleCopyLocation = async () => {
    const locationInfo = `${address}\nCoordinates: ${lat}, ${lng}`;
    
    try {
      // Try to use the Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(locationInfo);
        // Import and use toast notification instead of alert
        const { toast } = await import('@/components/ui/use-toast');
        toast({
          title: "Success",
          description: "Location details copied to clipboard",
          duration: 3000,
        });
      } else {
        // Fallback for browsers without clipboard API or when permission is denied
        const textArea = document.createElement('textarea');
        textArea.value = locationInfo;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          const { toast } = await import('@/components/ui/use-toast');
          toast({
            title: "Success",
            description: "Location details copied to clipboard",
            duration: 3000,
          });
        } else {
          throw new Error('Fallback copy method failed');
        }
      }
    } catch (err) {
      console.error('Copy failed:', err);
      alert("Failed to copy location. Please try again.");
    }
  };

  const handleViewLargerMap = () => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative overflow-hidden rounded-lg">
        <div className="w-full h-64 rounded-lg bg-muted">
          {isError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Unable to load map</p>
            </div>
          ) : (
            <iframe 
              src={mapUrl}
              width="100%" 
              height="100%" 
              frameBorder="0" 
              style={{ border: 0, borderRadius: '0.5rem' }} 
              allowFullScreen
              aria-hidden="false"
              tabIndex={0}
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsError(true)}
              title="Location Map"
              className={cn(
                "transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
          {!isLoaded && !isError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm z-10"
        >
          <MapPin className="h-3 w-3 mr-1" />
          Location Map
        </Badge>
      </div>
      
      <div className="space-y-2">
        <p className="font-medium">{address}</p>
        <p className="text-sm text-muted-foreground flex items-center">
          <MapPin className="h-3 w-3 mr-1 inline" />
          Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      </div>
      
      {interactive && (
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={handleGetDirections}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Directions
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get directions to this location</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={handleCopyLocation}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy location details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={handleViewLargerMap}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Map
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View in Google Maps</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
