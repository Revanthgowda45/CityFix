import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useReports, Report, ReportCategory, ReportStatus } from '@/contexts/ReportContext';

interface MapSearchProps {
  onSearch: (filteredReports: Report[]) => void;
}

const MapSearch: React.FC<MapSearchProps> = ({ onSearch }) => {
  const { reports } = useReports();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  const handleSearch = () => {
    // Filter reports based on search criteria
    const filtered = reports.filter(report => {
      const matchesQuery = searchQuery === '' || 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = category === 'all' || report.category === category;
      const matchesStatus = status === 'all' || report.status === status;

      return matchesQuery && matchesCategory && matchesStatus;
    });

    onSearch(filtered);

  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-md p-2 text-sm bg-background text-foreground border-input dark:bg-popover dark:text-popover-foreground dark:border-border transition-colors"
        >
          <option value="all">All Categories</option>
          <option value="pothole">Pothole</option>
          <option value="streetlight">Streetlight</option>
          <option value="garbage">Garbage</option>
          <option value="graffiti">Graffiti</option>
          <option value="road_damage">Road Damage</option>
          <option value="flooding">Flooding</option>
          <option value="sign_damage">Sign Damage</option>
          <option value="other">Other</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-md p-2 text-sm bg-background text-foreground border-input dark:bg-popover dark:text-popover-foreground dark:border-border transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
  );
};

export default MapSearch;

