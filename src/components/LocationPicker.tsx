import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Locate, MapPin } from 'lucide-react';
import OpenStreetMap from './OpenStreetMap';
import { toast } from '@/components/ui/use-toast';

interface LocationPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  initialAddress?: string;
}

const LocationPicker = ({ onLocationSelect, initialAddress = '' }: LocationPickerProps) => {
  const [address, setAddress] = useState(initialAddress);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLiveLocationActive, setIsLiveLocationActive] = useState(false);

  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bengaluru as default

  const handleLocationSelect = (lat: number, lng: number, formattedAddress: string) => {
    // Only update location if we're not in live location mode
    if (!isLiveLocationActive) {
      setSelectedLocation([lat, lng]);
      setAddress(formattedAddress);
      onLocationSelect(formattedAddress, lat, lng);
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) {
      toast({
        title: "Empty Search",
        description: "Please enter an address to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        handleLocationSelect(lat, lng, result.display_name);
      } else {
        toast({
          title: "No Results",
          description: "Could not find the address. Please try a different search term.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching address:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddressSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a location"
            className="pl-10"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleAddressSearch}
          disabled={isSearching}
          size="icon"
          className="h-10 w-10"
        >
          <MapPin className="h-5 w-5" />
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <OpenStreetMap
          height="300px"
          center={selectedLocation || defaultCenter}
          zoom={11}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          enableManualPin={true}
          showUseMyLocation={true}
        />
        <div className="bg-muted/50 p-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            <span>Search for an address or click on the map</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
