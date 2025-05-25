import React from 'react';
import { useReports, Report } from '@/contexts/ReportContext';
import { useAuth } from '@/contexts/AuthContext';
import ReportCard from './ReportCard';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';

interface ReportListProps {
  reports?: Report[];
  title?: string;
  emptyMessage?: string;
}

const ReportList: React.FC<ReportListProps> = ({ 
  reports,
  title = "Recent Reports",
  emptyMessage = "No reports found"
}) => {
  const { upvoteReport } = useReports();
  const { currentUser, isAuthenticated } = useAuth();
  
  const reportsList = reports || [];

  const handleUpvote = async (reportId: string): Promise<void> => {
    if (!isAuthenticated || !currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upvote reports",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await upvoteReport(reportId, currentUser.id);
      toast({
        title: "Report upvoted",
        description: "Thank you for your feedback!"
      });
    } catch (error) {
      console.error('Error upvoting report:', error);
      toast({
        title: "Error",
        description: "Failed to upvote report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{title}</h2>
      )}
      {reportsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-center text-muted-foreground text-sm sm:text-base">{emptyMessage}</p>
          </div>
          
          {!isAuthenticated && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">Sign in to view or report issues</p>
              <Button asChild className="mt-2 gap-2">
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Login to view reports
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reportsList.map(report => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportList;
