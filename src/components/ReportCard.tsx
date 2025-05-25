import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Report, ReportStatus } from '@/contexts/ReportContext';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, ThumbsUp, MessageSquare, Loader2, AlertTriangle, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Add this import at the top with your other imports
import { cleanDescription } from '@/lib/utils';

interface ReportCardProps {
  report: Report;
  onUpvote: (reportId: string) => Promise<void>;
}

const getStatusColor = (status: ReportStatus) => {
  switch (status) {
    case 'reported':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
    case 'in_progress':
      return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
    case 'resolved':
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
    case 'closed':
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'medium':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'pothole':
      return <AlertTriangle className="h-4 w-4" />;
    case 'streetlight':
      return <Clock className="h-4 w-4" />;
    case 'garbage':
      return <AlertTriangle className="h-4 w-4" />;
    case 'graffiti':
      return <AlertTriangle className="h-4 w-4" />;
    case 'road_damage':
      return <AlertTriangle className="h-4 w-4" />;
    case 'flooding':
      return <AlertTriangle className="h-4 w-4" />;
    case 'sign_damage':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
};

const formatStatusLabel = (status: ReportStatus) => {
  return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const ReportCard: React.FC<ReportCardProps> = ({ report, onUpvote }) => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const { toast } = useToast();
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const {
    id,
    title,
    description,
    category,
    location,
    images,
    status,
    severity,
    reportedBy,
    createdAt,
    upvotes,
    upvotedBy = [],
    comments,
  } = report;

  const hasUpvoted = currentUser ? upvotedBy.includes(currentUser.id) : false;

  const handleUpvote = useCallback(async () => {
    // Early return with appropriate feedback if user cannot upvote
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upvote reports",
        variant: "destructive"
      });
      return;
    }
    
    if (hasUpvoted) {
      toast({
        title: "Already Upvoted",
        description: "You have already upvoted this report",
        variant: "default"
      });
      return;
    }
    
    if (isUpvoting) {
      return; // Prevent multiple concurrent upvote requests
    }
    
    try {
      setIsUpvoting(true);
      await onUpvote(id);
      toast({
        title: "Upvoted successfully",
        description: "Your upvote has been recorded.",
      });
    } catch (error) {
      // Check if the error is because the user already upvoted
      if (error instanceof Error && error.message.includes('already voted')) {
        toast({
          title: "Already Upvoted",
          description: "You have already upvoted this report",
          variant: "default"
        });
      } else {
        console.error('Upvote error:', error);
        toast({
          title: "Error",
          description: "There was an error upvoting this report",
          variant: "destructive"
        });
      }
    } finally {
      setIsUpvoting(false);
    }
  }, [id, isAuthenticated, hasUpvoted, isUpvoting, onUpvote, toast]);

  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setIsImageLoading(false);
    setImageError(true);
    // Don't show toast for every image error to avoid overwhelming the user
    console.error(`Failed to load image for report: ${id}`);
  }, [id]);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  // In the truncateDescription function, update it to clean the description first:
  const truncateDescription = useCallback((text: string, maxLength: number = 100) => {
  if (!text) return '';
  // Clean the description first to remove metadata tags
  const cleanedText = cleanDescription(text);
  if (cleanedText.length <= maxLength) return cleanedText;
  return cleanedText.substring(0, maxLength) + '...';
  }, []);

  const handleCardClick = useCallback(() => {
    navigate(`/issue/${id}`);
  }, [navigate, id]);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-border/50 cursor-pointer" 
      role="article"
      onClick={handleCardClick}
    >
      {images && images.length > 0 && (
        <div className="w-full h-48 relative group">
          {isImageLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          {imageError ? (
            <div className="absolute inset-0 bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mb-2 opacity-60" />
              <span className="text-sm">Image unavailable</span>
            </div>
          ) : (
            <img 
              src={images[0]} 
              alt={`Issue: ${title}`}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute bottom-3 right-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className={`${getSeverityColor(severity)} shadow-sm`}
                    aria-label={`Severity: ${severity}`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)} Priority
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Issue Priority Level</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(status)} shadow-sm`}
                  aria-label={`Status: ${formatStatusLabel(status)}`}
                >
                  {formatStatusLabel(status)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current Status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="capitalize bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 shadow-sm"
                  aria-label={`Category: ${category}`}
                >
                  <span className="flex items-center gap-1">
                    {getCategoryIcon(category)}
                    {category.replace('_', ' ')}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Issue Category</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardTitle className="text-xl mt-3 group">
          <div className="flex items-center gap-2">
            <span className="hover:text-urban-600 transition-colors">
              {title}
            </span>
            <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardTitle>
        <CardDescription className="flex items-center mt-2 text-sm">
          <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">{location.address}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {truncateDescription(description)}
        </p>
      </CardContent>
      <CardFooter 
        className="flex justify-between pt-4 border-t bg-muted/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          <Avatar className="h-6 w-6 mr-2 ring-2 ring-background">
            <AvatarFallback className="text-xs font-medium" aria-label={`Avatar of ${reportedBy.name}`}>
              {reportedBy.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            Posted by {reportedBy.name} · {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-muted-foreground" aria-label={`${comments.length} comments`}>
                  <MessageSquare className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  <span className="text-xs font-medium">{comments.length}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`flex items-center text-muted-foreground hover:text-urban-600 transition-colors ${
                    hasUpvoted ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleUpvote}
                  disabled={!isAuthenticated || hasUpvoted || isUpvoting}
                  aria-label={hasUpvoted ? 'Already upvoted' : `Upvote (${upvotes} upvotes)`}
                >
                  {isUpvoting ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-1.5" />
                  )}
                  <span className="text-xs font-medium">{upvotes}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasUpvoted ? 'Already upvoted' : 'Upvote this issue'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReportCard;
