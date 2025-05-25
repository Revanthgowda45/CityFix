import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Clock, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Reporter {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
  reportedAt?: string;
}

interface ReporterDetailsProps {
  reporter?: Reporter;
  className?: string;
  status?: string;
  priority?: string;
  category?: string;
  isLoading?: boolean;
}

const ReporterDetails: React.FC<ReporterDetailsProps> = ({ 
  reporter, 
  className = '',
  status,
  priority = 'Medium',
  category,
  isLoading = false
}) => {
  const { currentUser } = useAuth();
  const user = reporter || currentUser;

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm border-muted", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-36" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  // Helper function to get status styling
  const getStatusStyles = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'resolved':
        return { bg: 'bg-green-50', text: 'text-green-700', icon: <CheckCircle className="h-3.5 w-3.5 mr-1" /> };
      case 'in_progress':
        return { bg: 'bg-red-50', text: 'text-red-700', icon: <Clock className="h-3.5 w-3.5 mr-1" /> };
      case 'reported':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: <AlertCircle className="h-3.5 w-3.5 mr-1" /> };
      case 'pending':
        return { bg: 'bg-amber-800/10', text: 'text-amber-800', icon: <AlertCircle className="h-3.5 w-3.5 mr-1" /> };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', icon: null };
    }
  };

  // Helper function to get priority styling
  const getPriorityStyles = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high':
        return { bg: 'bg-red-50', text: 'text-red-700' };
      case 'medium':
        return { bg: 'bg-amber-50', text: 'text-amber-700' };
      case 'low':
        return { bg: 'bg-blue-50', text: 'text-blue-700' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700' };
    }
  };

  const statusStyles = getStatusStyles(status || '');
  const priorityStyles = getPriorityStyles(priority || '');

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary/70" />
          <h3 className="text-lg font-medium">Reporter Details</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-sm">
            <AvatarImage src={user.avatar} alt={user.name || 'User'} />
            <AvatarFallback className="text-lg font-medium bg-primary/5 text-primary/80">
              {user.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="text-base font-semibold">
              {user.name || 'User'}
            </h3>
            {'reportedAt' in user && user.reportedAt && (
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5" /> Reported {user.reportedAt}
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-muted/60" />

        <div className="space-y-4 pt-1">
          {status && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge 
                variant="outline" 
                className={cn("px-3 py-1 rounded-full flex items-center", statusStyles.bg, statusStyles.text)}
              >
                {statusStyles.icon}
                {status.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Priority</span>
            <Badge 
              variant="outline" 
              className={cn("px-3 py-1 rounded-full", priorityStyles.bg, priorityStyles.text)}
            >
              {priority}
            </Badge>
          </div>
          {category && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <span className="text-sm font-medium">{category.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReporterDetails;