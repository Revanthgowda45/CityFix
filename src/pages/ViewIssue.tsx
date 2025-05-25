import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import LocationPicker from '@/components/LocationPicker';
import ModernPhotoUpload from '@/components/ModernPhotoUpload';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

import { useReports, Report, ReportComment, ReportCategory, ReportSeverity } from '@/contexts/ReportContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import LocationMap from '@/components/LocationMap';
import { 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  MessageSquare, 
  ThumbsUp, 
  ArrowLeft, 
  AlertCircle,
  Clock,
  User,
  Image as ImageIcon,
  Edit2,
  Trash2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import ManageIssueDialog from '@/components/ManageIssueDialog';
import { Loading } from "@/components/ui/loading";
import { supabase } from '@/lib/supabase';
import ReporterDetails from '@/components/ReporterDetails';

const editSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(['pothole', 'streetlight', 'garbage', 'graffiti', 'road_damage', 'flooding', 'sign_damage', 'other'] as const),
  severity: z.enum(['low', 'medium', 'high'] as const),
  address: z.string().min(1, "Location is required"),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).required(),
  imageUrl: z.union([
    // Single image (string)
    z.string()
      .refine(
        (val) => !val || val.startsWith('http') || val.startsWith('data:image/'), 
        { message: "Image URL must be empty, start with http, or be a valid image data" }
      )
      .optional()
      .or(z.literal('')),
    // Multiple images (array)
    z.array(
      z.string()
        .refine(
          (val) => !val || val.startsWith('http') || val.startsWith('data:image/'), 
          { message: "Image URL must be empty, start with http, or be a valid image data" }
        )
    )
  ])
});

type EditFormValues = z.infer<typeof editSchema>;

const ViewIssue = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getReportById, updateReport, upvoteReport, addComment, deleteReport, updateComment, deleteComment } = useReports();
  const { currentUser, isAuthenticated } = useAuth();
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [reporter, setReporter] = useState(null);
  const [loadingReporter, setLoadingReporter] = useState(true);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  
  // State for comment editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [commentActionLoading, setCommentActionLoading] = useState(false);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState<string | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
    title: '',
    description: '',
      category: 'pothole',
      severity: 'low',
    address: '',
    coordinates: { lat: 0, lng: 0 },
      imageUrl: ''
    }
  });
  
  const [loadError, setLoadError] = useState(false);
  
  // Define loadReport outside useEffect so it can be called from elsewhere
  const loadReport = async () => {
    if (!id) return;
    setIsLoadingReport(true);
    setLoadError(false);
    try {
      // Use the updated async getReportById function
      const loadedReport = await getReportById(id);
      if (!loadedReport) {
        throw new Error('Report not found');
      }
      setReport(loadedReport);
      console.log('Loaded report with comments:', loadedReport.comments);
    } catch (error) {
      console.error('Error loading report:', error);
      setLoadError(true);
      toast({
        title: "Error",
        description: error.message === 'Report not found' 
          ? "This report could not be found or has been removed." 
          : "Failed to load report details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Initial report loading
  useEffect(() => {
    loadReport();
  }, [id, getReportById]);
  
  useEffect(() => {
    async function fetchReporter() {
      if (!report?.reportedBy?.id) return;
      setLoadingReporter(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, role')
        .eq('id', report.reportedBy.id)
        .single();
      if (data) {
        setReporter({
          id: data.id,
          name: data.name,
          avatar: data.avatar_url,
          role: data.role,
          reportedAt: report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : undefined
        });
      }
      setLoadingReporter(false);
    }
    fetchReporter();
  }, [report?.reportedBy?.id]);
  
  if (isLoadingReport) {
    return (
      <div className="container py-16">
        <Loading 
          size="lg" 
          text="Please wait while we load the report details..."
        />
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="container py-16 text-center">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-3">Report Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The report you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/map">Browse All Reports</Link>
        </Button>
      </div>
    );
  }

  const hasUpvoted = currentUser ? (report.upvotedBy || []).includes(currentUser.id) : false;
  const isOwner = isAuthenticated && currentUser && report.reportedBy?.id === currentUser.id;

  const validCategories = [
    'pothole', 'streetlight', 'garbage', 'graffiti', 'road_damage', 'flooding', 'sign_damage', 'other'
  ];

  const handleUpvote = () => {
    if (!isAuthenticated || !currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upvote reports",
        variant: "destructive"
      });
      return;
    }
    
    if (hasUpvoted) {
      toast({
        title: "Already upvoted",
        description: "You have already upvoted this report",
        variant: "destructive"
      });
      return;
    }
    
    upvoteReport(report.id, currentUser.id);
    toast({
      title: "Report upvoted",
      description: "Thank you for your feedback!"
    });
  };
  
  // Handle updating a comment
  const handleUpdateComment = async (commentId: string) => {
    if (!editedCommentText.trim() || !report) return;
    
    setCommentActionLoading(true);
    try {
      await updateComment(report.id, commentId, editedCommentText.trim());
      
      // Clear edit state
      setEditingCommentId(null);
      setEditedCommentText('');
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCommentActionLoading(false);
    }
  };
  
  // Handle deleting a comment
  const handleDeleteComment = async () => {
    if (!showDeleteCommentDialog || !report) return;
    
    setCommentActionLoading(true);
    try {
      await deleteComment(report.id, showDeleteCommentDialog);
      
      // Close dialog
      setShowDeleteCommentDialog(null);
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCommentActionLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !currentUser || !comment.trim()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Submitting comment with user data:', currentUser);
      await addComment(report.id, {
        text: comment.trim(),
        user: {
          id: currentUser.id,
          name: currentUser.name || currentUser.email?.split('@')[0] || 'User',
          role: currentUser.role || 'citizen',
        },
      });
      
      // Force reload the report to get fresh comments
      await loadReport();
      
      setComment('');
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the report."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "There was a problem adding your comment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteReport(report.id);
    toast({
      title: 'Issue Deleted',
      description: 'Your issue has been deleted.',
    });
    navigate('/dashboard');
  };

  const handleEdit = () => {
    if (!report.location.coordinates.lat || !report.location.coordinates.lng) {
      toast({
        title: 'Error',
        description: 'Invalid location coordinates',
        variant: 'destructive'
      });
      return;
    }
    form.reset({
      title: report.title,
      description: report.description,
      category: validCategories.includes(report.category) ? report.category : 'pothole',
      severity: report.severity,
      address: report.location.address,
      coordinates: {
        lat: report.location.coordinates.lat ?? 0,
        lng: report.location.coordinates.lng ?? 0
      },
      imageUrl: report.images && report.images.length > 0 ? (report.images.length === 1 ? report.images[0] : report.images) : ''
    });
    setShowEditDialog(true);
  };

  const onSubmit = async (data: EditFormValues) => {
    try {
      await updateReport(report.id, {
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
      location: {
          address: data.address,
          coordinates: {
            lat: data.coordinates.lat,
            lng: data.coordinates.lng,
          },
        },
        images: Array.isArray(data.imageUrl) ? data.imageUrl : data.imageUrl ? [data.imageUrl] : []
      });
      
    toast({
      title: 'Issue Updated',
        description: 'Your issue has been updated successfully.',
    });
    setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the issue. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  return (
    <div className="container py-4 sm:py-8 max-w-7xl px-3 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Issues
        </Button>
        {isOwner && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Issue
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Content Card */}
          <Card className="overflow-hidden">
            {report.images && report.images.length > 0 && (
              <div className="relative h-48 sm:h-64">
                <img 
                  src={report.images[0]} 
                  alt={`Issue: ${report.title}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      getStatusColor(report.status),
                      "backdrop-blur-sm bg-opacity-90"
                    )}
                  >
                    {formatStatusLabel(report.status)}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      getSeverityColor(report.severity),
                      "backdrop-blur-sm bg-opacity-90"
                    )}
                  >
                    {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)} Priority
                  </Badge>
                </div>
              </div>
            )}
            
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-2xl font-bold">{report.title}</CardTitle>
                  <CardDescription className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{report.location.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Reported {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                    </div>
                  </CardDescription>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn(
                      "flex items-center gap-2",
                      hasUpvoted && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleUpvote}
                    disabled={!isAuthenticated || hasUpvoted}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{report.upvotes} Upvotes</span>
                  </Button>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{report.comments.length} Comments</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
                <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  Description
                </h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {report.description?.replace(/\[original_category:.*?\]/g, '')}
                </p>
                </div>
                
                {report.images && report.images.length > 0 && (
                  <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    Images
                  </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {report.images.map((image, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-lg h-auto">
                        <img
                          src={image}
                          alt={`Report image ${index + 1}`}
                          className="w-full h-36 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:text-white hover:bg-white/20"
                            onClick={() => setFullSizeImage(image)}
                          >
                            View Full Size
                          </Button>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
          
          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Comments & Updates
              </CardTitle>
            </CardHeader>
            
            <CardContent>
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <Textarea
                  placeholder="Add a comment or update..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                    className="mb-3 resize-none"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!comment.trim() || isLoading}
                    className="w-full sm:w-auto"
                >
                  {isLoading ? "Posting..." : "Add Comment"}
                </Button>
              </form>
            ) : (
                <div className="bg-muted/50 p-4 rounded-md mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Please sign in to add comments
                </p>
                <Button asChild>
                  <Link to="/login">Login</Link>
                </Button>
              </div>
            )}
            
            <div className="space-y-4">
              {report.comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
                  </div>
              ) : (
                report.comments.map((comment: ReportComment) => {
                  console.log('Rendering comment:', comment);
                  // Get user display name, falling back to various options
                  const userName = (comment.user?.name || 
                                  // Check if user is a direct property with values
                                  (comment.user && typeof comment.user === 'object' ? 
                                    comment.user.name : null) ||
                                  // Fall back to default - use consistent naming
                                  'Unknown User');
                                  
                  // Get initial for avatar
                  const userInitial = userName.charAt(0).toUpperCase();
                  
                  // Format timestamp
                  const timestamp = comment.createdAt ? 
                    formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 
                    'Recently';
                  
                  // Check if current user is the comment author (only the original author can edit/delete)
                  const canModifyComment = isAuthenticated && currentUser?.id === comment.user?.id;
                  
                  // Check if this comment is in edit mode
                  const isEditing = editingCommentId === comment.id;
                  
                  return (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{userInitial}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {userName}
                              {comment.user?.role === 'admin' && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timestamp}
                            </p>
                          </div>
                        </div>
                        
                        {/* Comment actions menu for edit/delete */}
                        {canModifyComment && !isEditing && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Edit comment"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditedCommentText(comment.text);
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive/90"
                              title="Delete comment"
                              onClick={() => setShowDeleteCommentDialog(comment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editedCommentText}
                            onChange={(e) => setEditedCommentText(e.target.value)}
                            className="resize-none min-h-[80px]"
                            disabled={commentActionLoading}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditedCommentText('');
                              }}
                              disabled={commentActionLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={!editedCommentText.trim() || commentActionLoading}
                            >
                              {commentActionLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-line leading-relaxed">
                          {comment.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap 
                address={report.location.address}
                lat={report.location.coordinates.lat}
                lng={report.location.coordinates.lng}
                interactive={true}
              />
            </CardContent>
          </Card>
          
          <ReporterDetails
            reporter={reporter}
            status={report.status}
            priority={report.severity}
            category={report.category}
            isLoading={loadingReporter}
          />
          
          {isAuthenticated && currentUser?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full text-sm sm:text-base py-2 h-auto" 
                  onClick={() => setShowManageDialog(true)}
                >
                  Manage Issue
                </Button>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Issue?</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this issue? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Issue Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-auto mx-auto">
          <div className="rounded-lg shadow-lg">
            <DialogHeader className="px-6 pt-6 pb-2 border-b">
              <div className="flex items-center gap-3">
                <Edit2 className="h-5 w-5 text-muted-foreground" />
                <DialogTitle className="text-2xl font-bold">Edit Issue Report</DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Update the details of your issue report. All fields marked with * are required.
              </p>
          </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Title Field */}
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base flex items-center gap-1">
                            Issue Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
            <Input
                              placeholder="e.g., Large pothole on Main Street" 
                              {...field} 
                              className="bg-background text-foreground h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Category and Severity Fields */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base flex items-center gap-1">
                          Category <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background text-foreground h-11">
                              <SelectValue placeholder="Select a category" />
              </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background text-foreground">
                <SelectItem value="pothole">Pothole</SelectItem>
                <SelectItem value="streetlight">Streetlight</SelectItem>
                <SelectItem value="garbage">Garbage</SelectItem>
                <SelectItem value="graffiti">Graffiti</SelectItem>
                <SelectItem value="road_damage">Road Damage</SelectItem>
                <SelectItem value="flooding">Flooding</SelectItem>
                <SelectItem value="sign_damage">Sign Damage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base flex items-center gap-1">
                          Priority Level <span className="text-destructive">*</span>
                        </FormLabel>
                          <div className="grid grid-cols-3 gap-1 sm:gap-2">
                          <Button
                            type="button"
                            variant={field.value === 'low' ? 'default' : 'outline'}
                            className={cn(
                              "h-11",
                              field.value === 'low' && "bg-blue-500 hover:bg-blue-600"
                            )}
                            onClick={() => field.onChange('low')}
                          >
                            Low
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'medium' ? 'default' : 'outline'}
                            className={cn(
                              "h-11",
                              field.value === 'medium' && "bg-yellow-500 hover:bg-yellow-600"
                            )}
                            onClick={() => field.onChange('medium')}
                          >
                            Medium
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'high' ? 'default' : 'outline'}
                            className={cn(
                              "h-11",
                              field.value === 'high' && "bg-red-500 hover:bg-red-600"
                            )}
                            onClick={() => field.onChange('high')}
                          >
                            High
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-1">
                        Description <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed information about the issue..."
                          className="min-h-[120px] resize-none bg-background text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location and Image Fields */}
                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base flex items-center gap-1">
                          Location <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
            <LocationPicker
                            onLocationSelect={(address, lat, lng) => {
                              field.onChange(address);
                              form.setValue('coordinates', { lat: lat ?? 0, lng: lng ?? 0 });
                            }}
                            initialAddress={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Issue Image</FormLabel>
                        <FormControl>
            <ModernPhotoUpload
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="sticky bottom-0 bg-background pt-3 sm:pt-4 border-t flex flex-row gap-2 sm:gap-3 z-10 p-3 sm:p-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
          </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <ManageIssueDialog
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
        issueId={report.id}
        currentStatus={report.status}
      />
      
      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={!!showDeleteCommentDialog} onOpenChange={(open) => !open && setShowDeleteCommentDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteCommentDialog(null)}
              disabled={commentActionLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeleteComment()}
              disabled={commentActionLoading}
            >
              {commentActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Size Image Modal */}
      <Dialog open={!!fullSizeImage} onOpenChange={(open) => !open && setFullSizeImage(null)}>
        <DialogContent className="max-w-screen-lg w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/20 hover:bg-black/40 text-white h-8 w-8"
                onClick={() => setFullSizeImage(null)}
              >
                ✕
              </Button>
            </div>
            {fullSizeImage && (
              <img
                src={fullSizeImage}
                alt="Full size view"
                className="max-w-full max-h-[calc(90vh-2rem)] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reporter details section removed */}
    </div>
  );
};

export default ViewIssue;
