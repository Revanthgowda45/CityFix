import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ReportList from '@/components/ReportList';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportContext';
import { MapPin, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { reports, refreshReports, isLoading } = useReports();
  const [activeTab, setActiveTab] = useState('my-reports');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  
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
        } catch (error) {
          console.error('Error refreshing reports:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };
    
    autoRefresh();
  }, [location, refreshReports]);
  
  if (!currentUser) {
    return (
      <div className="container py-16 flex flex-col items-center">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-bold mb-3">Authentication Required</h1>
        <p className="text-muted-foreground mb-6">
          Please log in to access your dashboard.
        </p>
        <Button asChild>
          <Link to="/login">Log In</Link>
        </Button>
      </div>
    );
  }
  
  // Filter reports for the current user
  const userReports = reports.filter(report => report.reportedBy.id === currentUser.id);
  
  // Get reports by status
  const pendingReports = userReports.filter(report => 
    report.status === 'reported' || report.status === 'under_review'
  );
  
  const activeReports = userReports.filter(report => 
    report.status === 'in_progress'
  );
  
  const resolvedReports = userReports.filter(report => 
    report.status === 'resolved' || report.status === 'closed'
  );

  return (
    <div className="container px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {currentUser.name}
          </p>
        </div>
        <Button asChild className="mt-4 md:mt-0 w-full md:w-auto h-10">
          <Link to="/report">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report New Issue
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold">{pendingReports.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReports.length === 1 ? 'Issue' : 'Issues'} awaiting review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold">{activeReports.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeReports.length === 1 ? 'Issue' : 'Issues'} being addressed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold">{resolvedReports.length}</div>
            <p className="text-xs text-muted-foreground">
              {resolvedReports.length === 1 ? 'Issue' : 'Issues'} successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            View and manage your reported issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1">
              <TabsTrigger value="my-reports" className="flex items-center gap-2 py-2.5">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">My Reports</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2 py-2.5">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pending</span>
                <span className="sm:hidden">Pending</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2 py-2.5">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">In Progress</span>
                <span className="sm:hidden">Active</span>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center gap-2 py-2.5">
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Resolved</span>
                <span className="sm:hidden">Done</span>
              </TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="my-reports" className="mt-0">
                <ReportList 
                  reports={userReports} 
                  title="" 
                  emptyMessage="You haven't reported any issues yet."
                />
              </TabsContent>
              <TabsContent value="pending" className="mt-0">
                <ReportList 
                  reports={pendingReports} 
                  title="" 
                  emptyMessage="No pending reports."
                />
              </TabsContent>
              <TabsContent value="active" className="mt-0">
                <ReportList 
                  reports={activeReports} 
                  title="" 
                  emptyMessage="No reports are currently being addressed."
                />
              </TabsContent>
              <TabsContent value="resolved" className="mt-0">
                <ReportList 
                  reports={resolvedReports} 
                  title="" 
                  emptyMessage="No resolved reports yet."
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="p-4 sm:p-6">
          <Button 
            variant="default" 
            asChild 
            className="w-full h-10 bg-urban-600 hover:bg-urban-700 text-white dark:bg-urban-500 dark:hover:bg-urban-600"
          >
            <Link to="/map">
              <MapPin className="mr-2 h-4 w-4" />
              View All Reports on Map
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Dashboard;
