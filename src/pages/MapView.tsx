import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReports, Report } from '@/contexts/ReportContext';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Filter, AlertTriangle, Loader2, X, Search } from 'lucide-react';
import OpenStreetMap from '@/components/OpenStreetMap';
import MapSearch from '@/components/MapSearch';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loading } from "@/components/ui/loading";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const MapView = () => {
  const { reports, isLoading, refreshReports } = useReports();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filteredReports, setFilteredReports] = useState<Report[]>(reports);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get unique categories from reports with useEffect to ensure proper dependency tracking
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    // Filter out any undefined, null or empty categories and get unique values
    const uniqueCategories = [...new Set(reports
      .map(report => report.category)
      .filter(category => category && category.trim() !== '')
    )];
    setCategories(uniqueCategories);
  }, [reports]);
  
  // Status options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "reported", label: "Reported" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];
  

  const selectedReport = selectedId 
    ? reports.find(report => report.id === selectedId)
    : null;
  
  const handleReportSelect = (reportId: string) => {
    setSelectedId(reportId);
    navigate(`/issue/${reportId}`);
  };
  
  // Apply all filters
  // Auto-refresh when navigating from report submission
  useEffect(() => {
    const autoRefresh = async () => {
      // Check if we have a refresh parameter in the location state
      if (location.state && location.state.refresh) {
        setIsRefreshing(true);
        try {
          await refreshReports();
          // Reset the state so we don't refresh again on subsequent renders
          window.history.replaceState(
            { ...location.state, refresh: false },
            document.title
          );
          
          toast({
            title: "Map Updated",
            description: "The map has been refreshed with your new report.",
          });
        } catch (error) {
          console.error('Error refreshing reports:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };
    
    autoRefresh();
  }, [location, refreshReports, toast]);
  
  useEffect(() => {
    let filtered = [...reports];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(report => report.category === categoryFilter);
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        report =>
          report.title.toLowerCase().includes(query) ||
          report.description.toLowerCase().includes(query) ||
          report.location.address.toLowerCase().includes(query)
      );
    }
    
    setFilteredReports(filtered);
    
    if (filtered.length === 0 && (statusFilter !== "all" || categoryFilter !== "all" || searchQuery)) {
      toast({
        title: "No results found",
        description: "Try adjusting your filter criteria.",
      });
    }
  }, [reports, statusFilter, categoryFilter, searchQuery, toast]);
  
  const handleSearch = (searchResults: Report[]) => {
    // This is kept for the MapSearch component but no longer used directly
    // Instead, we're using the searchQuery state with useEffect
  };
  
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };
  
  const resetFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
  };

  const getStatusColor = (status: Report['status']) => {
    const colors: Record<string, string> = {
      'reported': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'in_progress': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issues Map</h1>
          <p className="text-muted-foreground mt-1">
            Explore reported issues in your community
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="lg:col-span-3">
          <Card className="mb-4 shadow-sm">
            <CardContent className="p-4 md:p-6">
              {/* Mobile filter layout */}
              <div className="md:hidden space-y-3">
                <div className="relative">
                  <Input
                    className="w-full pl-10 h-10"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={categoryFilter} 
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
              
              {/* Desktop filter layout */}
              <div className="hidden md:flex md:flex-row md:items-center md:gap-4">
                <div className="relative flex-1">
                  <Input
                    className="w-full pl-10"
                    placeholder="Search reports by title, description, or location..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center gap-3">
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={categoryFilter} 
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline"
                    onClick={resetFilters}
                    className="flex items-center"
                    size="default"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
              
              {/* Applied filters indicators - shows on both mobile and desktop */}
              {(statusFilter !== "all" || categoryFilter !== "all" || searchQuery) && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mr-2 flex items-center">
                    <Filter className="h-3 w-3 mr-1" />
                    Applied filters:
                  </p>
                  
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs bg-muted flex items-center gap-1">
                      Status: {statusFilter.replace('_', ' ')}
                      <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-foreground transition-colors" aria-label="Remove status filter">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {categoryFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs bg-muted flex items-center gap-1">
                      Category: {categoryFilter}
                      <button onClick={() => setCategoryFilter("all")} className="ml-1 hover:text-foreground transition-colors" aria-label="Remove category filter">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs bg-muted flex items-center gap-1">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-foreground transition-colors" aria-label="Remove search filter">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Map view with OpenStreetMap */}
        <div className="lg:col-span-2 relative min-h-[600px]">
          {isMapLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10">
              <Loading text="Loading map..." />
            </div>
          )}
          <div className="w-full h-full min-h-[600px] relative">
            <OpenStreetMap 
              reports={filteredReports}
              height="600px"
              onLoad={() => setIsMapLoading(false)}
              showUseMyLocation={true}
            />
          </div>
        </div>

        {/* Selected report or list */}
        <div>
          {isLoading ? (
            <Card className="h-[600px]">
              <Loading text="Loading reports..." />
            </Card>
          ) : selectedReport ? (
            <Card className="h-[600px] overflow-y-auto">
              <div className="relative h-48">
                {selectedReport.images && selectedReport.images.length > 0 ? (
                  <img 
                    src={selectedReport.images[0]} 
                    alt={`Issue: ${selectedReport.title}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-muted-foreground opacity-50" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(selectedReport.status)}
                    aria-label={`Status: ${selectedReport.status}`}
                  >
                    {selectedReport.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">{selectedReport.title}</h2>
                <p className="text-muted-foreground mb-4">{selectedReport.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">{selectedReport.location.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm capitalize">{selectedReport.category.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/issue/${selectedReport.id}`)}
                    aria-label={`View details for ${selectedReport.title}`}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] overflow-hidden flex flex-col">
              <div className="sticky top-0 z-10 bg-background border-b">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">All Reports</h3>
                    <Badge variant="secondary" className="bg-muted">
                      {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filtered by search criteria</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[500px] text-center px-4">
                    <MapPin className="h-12 w-12 text-muted-foreground opacity-50 mb-4" aria-hidden="true" />
                    <p className="text-muted-foreground">No reports found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  <div className="divide-y" role="list">
                    {filteredReports.map(report => (
                      <div 
                        key={report.id}
                        className={cn(
                          "group relative px-6 py-4 transition-all duration-200",
                          "hover:bg-muted/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-urban-500",
                          "first:rounded-t-lg last:rounded-b-lg"
                        )}
                        onClick={() => handleReportSelect(report.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleReportSelect(report.id);
                          }
                        }}
                        role="listitem"
                        tabIndex={0}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            {report.images && report.images.length > 0 ? (
                              <img 
                                src={report.images[0]} 
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                                loading="lazy"
                              />
                            ) : (
                              <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h4 className="font-medium truncate text-base">{report.title}</h4>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "flex-shrink-0 text-xs font-medium",
                                  getStatusColor(report.status)
                                )}
                                aria-label={`Status: ${report.status}`}
                              >
                                {report.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2.5 line-clamp-2">
                              {report.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                                <span className="truncate">{report.location.address}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                <time dateTime={report.createdAt}>
                                  {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-transparent group-hover:ring-border transition-all duration-200" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
