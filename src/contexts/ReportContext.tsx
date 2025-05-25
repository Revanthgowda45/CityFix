import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { createIssue, getIssues, updateIssue, deleteIssue, subscribeToIssues, voteOnIssue, createComment, getComments, getIssueById } from '@/lib/issues';
import { supabase } from '@/lib/supabase';
import type { IssueCategory, IssuePriority } from '@/lib/supabase';

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  status: ReportStatus;
  severity: ReportSeverity;
  reportedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  upvotedBy: string[];
  comments: ReportComment[];
  assignedTo?: {
    id: string;
    name: string;
  };
}

export interface ReportComment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: 'citizen' | 'admin';
  };
}

export type ReportCategory = 
  'pothole' | 
  'streetlight' | 
  'garbage' | 
  'graffiti' | 
  'road_damage' | 
  'flooding' | 
  'sign_damage' | 
  'other';

export type ReportStatus = 
  'reported' | 
  'in_progress' | 
  'resolved' | 
  'closed' |
  'under_review';

export type ReportSeverity = 
  'low' | 
  'medium' | 
  'high';

interface ReportContextType {
  reports: Report[];
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'comments'>) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  getReportById: (id: string) => Promise<Report | null>;
  upvoteReport: (id: string, userId: string) => void;
  addComment: (reportId: string, comment: Omit<ReportComment, 'id' | 'createdAt'>) => Promise<ReportComment>;
  updateComment: (reportId: string, commentId: string, text: string) => Promise<void>;
  deleteComment: (reportId: string, commentId: string) => Promise<void>;
  refreshReports: () => Promise<void>;
  isLoading: boolean;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const useReports = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

// Sample data for demo purposes
const sampleReports: Report[] = [
  {
    id: '1',
    title: 'Large pothole on Main Street',
    description: 'There is a large pothole in the middle of Main Street near the intersection with Oak Avenue that is causing damage to vehicles.',
    category: 'pothole',
    location: {
      address: '123 Main St, Anytown',
      coordinates: {
        lat: 40.7128,
        lng: -74.006,
      },
    },
    images: ['https://example.com/pothole1.jpg'],
    status: 'reported',
    severity: 'high',
    reportedBy: {
      id: '1',
      name: 'John Doe',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    upvotes: 5,
    upvotedBy: ['2', '3', '4', '5', '6'],
    comments: [],
  },
  {
    id: '2',
    title: 'Broken streetlight on Oak Avenue',
    description: 'Streetlight is not working at the corner of Oak Avenue and Pine Street.',
    category: 'streetlight',
    location: {
      address: '456 Oak Ave, Anytown',
      coordinates: {
        lat: 40.7129,
        lng: -74.007,
      },
    },
    images: ['https://example.com/streetlight1.jpg'],
    status: 'reported',
    severity: 'medium',
    reportedBy: {
      id: '2',
      name: 'Jane Smith',
    },
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    upvotes: 3,
    upvotedBy: ['1', '3', '4'],
    comments: [],
  },
  {
    id: '3',
    title: 'Garbage pileup in alley',
    description: 'Large amount of garbage has accumulated in the alley behind 789 Market Street.',
    category: 'garbage',
    location: {
      address: '789 Market St, Anytown',
      coordinates: {
        lat: 40.7130,
        lng: -74.008,
      },
    },
    images: ['https://example.com/garbage1.jpg'],
    status: 'in_progress',
    severity: 'low',
    reportedBy: {
      id: '3',
      name: 'Bob Johnson',
    },
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    upvotes: 2,
    upvotedBy: ['1', '4'],
    comments: [],
  }
];

interface ReportProviderProps {
  children: React.ReactNode;
}

const issueCategoryToReportCategory = (category: IssueCategory, originalCategory?: string, description?: string): ReportCategory => {
  // Valid frontend categories
  const validCategories: ReportCategory[] = [
    'pothole', 'road_damage', 'sign_damage', 'flooding', 'streetlight', 
    'garbage', 'graffiti', 'other'
  ];
  
  // First check if an original_category value is provided directly
  if (originalCategory && validCategories.includes(originalCategory as ReportCategory)) {
    return originalCategory as ReportCategory;
  }
  
  // Then try to extract original category from description metadata if available
  if (description) {
    const metadataMatch = description.match(/\[original_category:(.*?)\]/);
    if (metadataMatch && metadataMatch[1]) {
      const extractedCategory = metadataMatch[1];
      if (validCategories.includes(extractedCategory as ReportCategory)) {
        return extractedCategory as ReportCategory;
      }
    }
  }
  
  // Otherwise fall back to the default mapping
  switch (category) {
    case 'road':
      return 'pothole'; // Change default from road_damage to pothole
    case 'water':
      return 'flooding';
    case 'electricity':
      return 'streetlight';
    case 'waste':
      return 'garbage';
    case 'other':
    default:
      return 'other';
  }
};

const reportCategoryToIssueCategory = (category: ReportCategory): IssueCategory => {
  switch (category) {
    case 'pothole':
    case 'road_damage':
    case 'sign_damage':
      return 'road';
    case 'flooding':
      return 'water';
    case 'streetlight':
      return 'electricity';
    case 'garbage':
    case 'graffiti':
      return 'waste';
    case 'other':
    default:
      return 'other';
  }
};

export const ReportProvider: React.FC<ReportProviderProps> = ({ children }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const { currentUser } = useAuth(); // Get current user from AuthContext
  const { isAuthenticated } = useAuth();

  const validCategories = ['pothole', 'streetlight', 'garbage', 'graffiti', 'road_damage', 'flooding', 'sign_damage', 'other'];
  const validSeverities = ['low', 'medium', 'high'];

  // Define fetchReports at component scope so it can be used elsewhere
  const fetchReports = async () => {
    console.log('Fetching reports, auth state:', isAuthenticated, currentUser?.id);
    
    // Check multiple authentication indicators:
    // 1. React state (isAuthenticated)
    // 2. Auth cookie existence
    // 3. User ID in localStorage as last resort
    const hasAuthCookie = document.cookie.includes('cityfix-user-id=');
    const hasLocalStorageUser = localStorage.getItem('cityfix-user-data') !== null;
    
    // Only skip if we have no authentication indicators at all
    if (!isAuthenticated && !hasAuthCookie && !hasLocalStorageUser) {
      console.log('User not authenticated or no user ID available, skipping data fetch');
      setReports([]);
      setIsLoading(false);
      return;
    }

    // Even if isAuthenticated is false, we'll try to fetch if the cookie exists
    // This helps in cases where React state is reset but cookie still exists
    console.log('Authentication verified, proceeding with data fetch');
    
    try {
      setIsLoading(true);
      setLoadError(false);
      
      // Trace Supabase connection issue if any
      try {
        // Force refresh Supabase connection
        await supabase.auth.getSession();
      } catch (connError) {
        console.warn('Session check failed:', connError);
      }
      
      // Get reports from Supabase
      const issues = await getIssues();
      console.log('Reports fetched:', issues?.length);
      
      if (!issues || issues.length === 0) {
        setReports([]);
        setIsLoading(false);
        return;
      }
      
      // Transform issues into reports format with comments
      const reportsWithComments = await Promise.all(issues.map(async (issue) => {
        try {
          // Get reporter name
          let reporterName = issue.user_name || 'Unknown User';
          
          // Get assignee name if exists
          let assigneeName = issue.assigned_to_name || 'Assigned User';
          
          // Get comments for this issue
          let comments = [];
          try {
            const commentsData = await getComments(issue.id);
            if (commentsData) {
              // Process each comment
              comments = commentsData.map((comment) => {
                return {
                  id: comment.id,
                  text: comment.content,
                  user: {
                    id: comment.user_id || 'unknown',
                    name: comment.user_name || 'Unknown User',
                    role: 'citizen'
                  },
                  createdAt: comment.created_at,
                };
              });
            }
          } catch (commentError) {
            console.error(`Failed to fetch comments for issue ${issue.id}:`, commentError);
          }
          
          // Convert to our Report type
          // Add debug logging to trace category conversion
          console.log(`Processing issue ${issue.id} with category:`, {
            backendCategory: issue.category,
            originalCategory: issue.original_category,
            description: issue.description
          });

          // Get the proper frontend category
          const frontendCategory = issueCategoryToReportCategory(
            issue.category as IssueCategory, 
            issue.original_category, 
            issue.description
          );
          console.log(`Converted category for issue ${issue.id}:`, frontendCategory);
          
          return {
            id: issue.id,
            title: issue.title || '',
            description: issue.description || '',
            category: frontendCategory,
            location: {
              address: issue.location?.address || '',
              coordinates: {
                lat: issue.location?.latitude || 0,
                lng: issue.location?.longitude || 0,
              },
            },
            images: issue.images || [],
            status: issue.status as ReportStatus || 'reported',
            severity: issue.priority as ReportSeverity || 'low',
            reportedBy: {
              id: issue.user_id || 'unknown',
              name: reporterName,
            },
            assignedTo: issue.assigned_to ? {
              id: issue.assigned_to,
              name: assigneeName,
            } : undefined,
            createdAt: issue.created_at || new Date().toISOString(),
            updatedAt: issue.updated_at || new Date().toISOString(),
            upvotes: issue.votes || 0,
            upvotedBy: issue.voted_by || [],
            comments: comments,
          };
        } catch (err) {
          console.error(`Error processing issue ${issue.id}:`, err);
          // Return a minimal report object so we don't lose the data completely
          return {
            id: issue.id,
            title: issue.title || 'Unknown issue',
            description: issue.description || '',
            category: issueCategoryToReportCategory(issue.category as IssueCategory, issue.original_category, issue.description),
            location: {
              address: '',
              coordinates: { lat: 0, lng: 0 },
            },
            images: [],
            status: 'reported' as ReportStatus,
            severity: 'low' as ReportSeverity,
            reportedBy: {
              id: 'unknown',
              name: 'Unknown User',
            },
            createdAt: issue.created_at || new Date().toISOString(),
            updatedAt: issue.updated_at || new Date().toISOString(),
            upvotes: issue.votes || 0,
            upvotedBy: issue.voted_by || [],
            comments: [],
          };
        }
      }));
      
      setReports(reportsWithComments);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoadError(true);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch reports if we have an authenticated user
    if (isAuthenticated && currentUser?.id) {
      console.log('User authenticated, fetching reports...');
      fetchReports();

      // Set up real-time subscription for issues
      const subscription = subscribeToIssues((payload) => {
        console.log('Realtime update received:', payload);
        // Refresh reports when any issue changes
        fetchReports();
      });

      // Clean up subscription on unmount
      return () => {
        console.log('Cleaning up subscription');
        subscription.unsubscribe();
      };
    } else {
      console.log('User not authenticated or no user ID available, skipping data fetch');
      // Clear reports when not authenticated
      setReports([]);
    }
  }, [isAuthenticated, currentUser?.id]); // Re-fetch when authentication state or user changes

  const reportSeverityToPriority = (severity: ReportSeverity): IssuePriority => {
    switch (severity) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'medium';
    }
  };

  const addReport = async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'upvotedBy' | 'comments'>) => {
    try {
      // Store original category in description for backward compatibility
      const categoryMetadata = `[original_category:${report.category}]`;
      const descriptionWithMetadata = report.description + '\n\n' + categoryMetadata;
      
      // Create the issue object with only required fields to prevent validation errors
      const supabaseIssue = {
        title: report.title,
        description: descriptionWithMetadata,
        category: reportCategoryToIssueCategory(report.category),
        status: report.status === 'under_review' ? 'reported' : report.status, 
        priority: reportSeverityToPriority(report.severity),
        location: {
          latitude: report.location.coordinates.lat,
          longitude: report.location.coordinates.lng,
          address: report.location.address,
        },
        images: report.images,
        user_id: report.reportedBy.id,
      };
      
      // Do not include original_category as it may not exist in the database schema
      console.log('Submitting report to Supabase:', supabaseIssue);
      await createIssue(supabaseIssue);
    } catch (error) {
      console.error('Error in addReport:', error);
      throw error;
    }
  };

  const updateReport = async (id: string, updates: Partial<Report>) => {
    // Prepare updates for Supabase
    const supabaseUpdates: any = {};
    if (updates.title) supabaseUpdates.title = updates.title;
    if (updates.description) supabaseUpdates.description = updates.description;
    if (updates.category) {
      supabaseUpdates.category = reportCategoryToIssueCategory(updates.category);
      
      // If we're updating the category and have a description, add/update the metadata
      if (updates.description) {
        // Add category metadata
        supabaseUpdates.description += `\n\n[original_category:${updates.category}]`;
      } else if (reports.find(r => r.id === id)?.description) {
        // Get existing description and update the category metadata
        const existingDescription = reports.find(r => r.id === id)?.description || '';
        const metadataRegex = /\[original_category:.*?\]/;
        if (metadataRegex.test(existingDescription)) {
          // Replace existing metadata
          supabaseUpdates.description = existingDescription.replace(
            metadataRegex, 
            `[original_category:${updates.category}]`
          );
        } else {
          // Add new metadata
          supabaseUpdates.description = existingDescription + `\n\n[original_category:${updates.category}]`;
        }
      }
    }
    if (updates.severity) supabaseUpdates.priority = reportSeverityToPriority(updates.severity);
    if (updates.location) {
      supabaseUpdates.location = {
        latitude: updates.location.coordinates.lat,
        longitude: updates.location.coordinates.lng,
        address: updates.location.address,
      };
    }
    if (updates.images) supabaseUpdates.images = updates.images;
    if (updates.status) supabaseUpdates.status = updates.status;
    await updateIssue(id, supabaseUpdates);
    setReports(
      reports.map((report) => 
        report.id === id
          ? { ...report, ...updates, updatedAt: new Date().toISOString() }
          : report
      )
    );
  };

  const deleteReport = async (id: string) => {
    await deleteIssue(id);
    setReports(reports.filter((report) => report.id !== id));
  };

  // Helper function to get real username for a user ID
  const getRealUsername = async (userId: string): Promise<string> => {
    if (!userId) return 'Community Member';
    
    try {
      // First check if we have a cached username to avoid unnecessary DB calls
      let cachedUsernames;
      let usernameCache = {};
      
      try {
        cachedUsernames = localStorage.getItem('cityfix-username-cache');
        usernameCache = cachedUsernames ? JSON.parse(cachedUsernames) : {};
        
        // Only use cache if it's NOT our fallback name to prevent caching failure states
        if (usernameCache[userId] && usernameCache[userId] !== 'Community Member') {
          console.log('Retrieved username from cache:', usernameCache[userId]);
          return usernameCache[userId];
        }
      } catch (cacheError) {
        console.warn('Error accessing localStorage cache:', cacheError);
      }
      
      console.log('Fetching profile for user ID:', userId);
      // Always try to fetch from profiles table first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      if (profile?.name) {
        console.log('Found profile name:', profile.name);
        try {
          // Cache the result
          usernameCache[userId] = profile.name;
          localStorage.setItem('cityfix-username-cache', JSON.stringify(usernameCache));
        } catch (storageError) {
          console.warn('Could not store in cache:', storageError);
        }
        return profile.name;
      }
      
      // If no profile found, try to get directly from users table
      console.log('No profile found, trying users table...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
      }
      
      if (userData?.email) {
        const username = userData.email.split('@')[0];
        console.log('Found email, using as username:', username);
        try {
          // Cache the result
          usernameCache[userId] = username;
          localStorage.setItem('cityfix-username-cache', JSON.stringify(usernameCache));
        } catch (storageError) {
          console.warn('Could not store in cache:', storageError);
        }
        return username;
      }
      
      // Last resort: try to get from auth.users (if it exists and is accessible)
      try {
        const { data: authData } = await supabase.auth.getUser(userId);
        if (authData?.user?.email) {
          const username = authData.user.email.split('@')[0];
          console.log('Found user via auth API:', username);
          try {
            // Cache the result
            usernameCache[userId] = username;
            localStorage.setItem('cityfix-username-cache', JSON.stringify(usernameCache));
          } catch (storageError) {
            console.warn('Could not store in cache:', storageError);
          }
          return username;
        }
      } catch (authError) {
        console.warn('Could not access auth API:', authError);
      }
      
      console.log('Could not find user, returning Community Member');
      return 'Community Member';
    } catch (error) {
      console.error('Error in getRealUsername:', error);
      return 'Community Member';
    }
  };

  const getReportById = async (id: string): Promise<Report | null> => {
    console.log('Looking for report with ID:', id);
    // First try to find the report in local state
    const localReport = reports.find(report => report.id === id);
    
    try {
      // Fetch the report from Supabase
      const { issue, comments } = await getIssueById(id);
      
      if (!issue) {
        console.error('Issue not found in Supabase');
        return localReport; // Return local copy if we have it
      }
      
      // Helper function to get user profile information (name and role)
      async function getUserProfile(userId: string): Promise<{name: string, role: string}> {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', userId)
            .single();
          
          if (error) throw error;
          return { 
            name: data?.name || 'Unknown User', 
            role: data?.role || 'citizen' 
          };
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return { name: 'Unknown User', role: 'citizen' };
        }
      }
      
      // Get reporter information
      const reporterData = await getUserProfile(issue.user_id);
      
      // Get assignee information if applicable
      let assigneeData = { name: '', role: 'citizen' };
      if (issue.assigned_to) {
        assigneeData = await getUserProfile(issue.assigned_to);
      }
      
      // Format comments with complete user information
      const formattedComments: ReportComment[] = [];
      
      if (Array.isArray(comments)) {
        for (const comment of comments) {
          // Get the profile data for this comment's user
          const userData = await getUserProfile(comment.user_id);
          
          formattedComments.push({
            id: comment.id,
            text: comment.content,
            createdAt: comment.created_at,
            user: {
              id: comment.user_id,
              name: userData.name,
              role: userData.role as 'citizen' | 'admin'
            }
          });
        }
      }
      
      // Get severity from priority
      let severity: ReportSeverity = 'medium';
      switch (issue.priority) {
        case 'p1': severity = 'high'; break;
        case 'p2': severity = 'medium'; break;
        case 'p3': severity = 'low'; break;
      }
      
      // Get status
      let status: ReportStatus = 'reported';
      switch (issue.status) {
        case 'reported': status = 'reported'; break;
        case 'in_progress': status = 'in_progress'; break;
        case 'resolved': status = 'resolved'; break;
        case 'closed': status = 'closed'; break;
        case 'under_review': status = 'under_review'; break;
      }
      
      // Format upvotes
      const upvotedBy = issue.votes?.map((voter: string) => voter) || [];
      
      // Extract original category if present in description
      const categoryMatch = issue.description?.match(/\[original_category:(.*?)\]/);
      const originalCategory = categoryMatch ? categoryMatch[1] : null;
      
      const formattedReport: Report = {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issueCategoryToReportCategory(issue.category, originalCategory, issue.description),
        location: {
          address: issue.location || 'Unknown Location',
          coordinates: issue.coordinates ? {
            lat: issue.coordinates.latitude,
            lng: issue.coordinates.longitude
          } : { lat: 0, lng: 0 }
        },
        images: Array.isArray(issue.images) ? issue.images : 
                issue.images ? [issue.images] : [],
        status,
        severity,
        reportedBy: {
          id: issue.user_id,
          name: reporterData.name
        },
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        upvotes: upvotedBy.length,
        upvotedBy,
        comments: formattedComments,
        ...(issue.assigned_to ? {
          assignedTo: {
            id: issue.assigned_to,
            name: assigneeData.name
          }
        } : {})
      };
      
      // Update our reports state to include this report
      setReports(prevReports => {
        const reportIndex = prevReports.findIndex(r => r.id === id);
        if (reportIndex !== -1) {
          // Replace the existing report
          const newReports = [...prevReports];
          newReports[reportIndex] = formattedReport;
          return newReports;
        } else {
          // Add the report to our state
          return [...prevReports, formattedReport];
        }
      });
      
      return formattedReport;
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      // If there was an error, return the local copy if available, otherwise null
      return localReport || null;
    }
  };

  const upvoteReport = async (id: string, userId: string) => {
    // Check if user has already upvoted in the local state
    const targetReport = reports.find(report => report.id === id);
    if (targetReport && targetReport.upvotedBy.includes(userId)) {
      console.log('User already upvoted this issue (local check)');
      return; // Early return if already upvoted (client-side check)
    }

    // Call Supabase to persist the upvote
    try {
      // This will now throw an error if the user has already voted (server-side check)
      await voteOnIssue(id, userId);
      
      // Only update local state if the server operation was successful
      setReports(
        reports.map((report) => {
          if (report.id === id) {
            // Add user to upvotedBy array and increment upvotes
            return {
              ...report,
              upvotes: report.upvotes + 1,
              upvotedBy: [...report.upvotedBy, userId],
              updatedAt: new Date().toISOString()
            };
          }
          return report;
        })
      );
    } catch (error) {
      console.error('Error upvoting issue in Supabase:', error);
      // We don't update the local state if the server operation failed
      // This could be a duplicate vote or other error
      
      // Optionally, you could display an error message to the user here
      // For example, using a toast notification system
    }
  };

  const addComment = async (reportId: string, commentData: Omit<ReportComment, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    
    try {
      console.log('Adding comment for report:', reportId, 'with data:', commentData);
      
      // Format comment data for Supabase (issue_comments table)
      const supabaseComment = {
        issue_id: reportId,
        user_id: commentData.user.id,
        content: commentData.text,
      };
      
      console.log('Sending to Supabase:', supabaseComment);
      
      // Save comment to Supabase
      const savedComment = await createComment(supabaseComment);
      console.log('Comment saved to Supabase:', savedComment);
      
      // Get latest user data from profiles to ensure consistency
      const { data: userData } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', commentData.user.id)
        .single();

      // Update local state with the saved comment
      const newComment: ReportComment = {
        id: savedComment.id,
        text: savedComment.content,  // Use content from savedComment to match Supabase field
        user: {
          id: commentData.user.id,
          name: userData?.name || commentData.user.name || 'Unknown User',
          role: (userData?.role || commentData.user.role || 'citizen') as 'citizen' | 'admin'
        },
        createdAt: savedComment.created_at || now,
      };

      console.log('Adding comment to local state:', newComment);
      
      setReports(
        reports.map((report) => 
          report.id === reportId
            ? { 
                ...report, 
                comments: [...report.comments, newComment], 
                updatedAt: now 
              }
            : report
        )
      );
      
      return newComment;
    } catch (error) {
      console.error('Error saving comment to Supabase:', error);
      throw error;
    }
  };

  // Define refreshReports as a function that returns the result of fetchReports
  const refreshReports = async (): Promise<void> => {
    await fetchReports();
  };

  // Function to update a comment
  const updateComment = async (reportId: string, commentId: string, text: string): Promise<void> => {
    try {
      if (!currentUser) {
        throw new Error('You must be logged in to update a comment');
      }
      
      // First verify this comment belongs to the current user
      const { data: commentData, error: fetchError } = await supabase
        .from('issue_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Security check: Only allow the original comment author to edit their comment
      if (commentData.user_id !== currentUser.id) {
        throw new Error('You can only edit your own comments');
      }
      
      // Update comment in Supabase
      const { error } = await supabase
        .from('issue_comments')
        .update({ content: text })
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // Extra security: ensure user_id matches
        
      if (error) throw error;
      
      // Update comment in local state
      setReports(
        reports.map((report) => {
          if (report.id === reportId) {
            return {
              ...report,
              comments: report.comments.map((comment) => 
                comment.id === commentId 
                  ? { ...comment, text: text } 
                  : comment
              ),
              updatedAt: new Date().toISOString()
            };
          }
          return report;
        })
      );
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };
  
  // Function to delete a comment
  const deleteComment = async (reportId: string, commentId: string): Promise<void> => {
    try {
      if (!currentUser) {
        throw new Error('You must be logged in to delete a comment');
      }
      
      // First verify this comment belongs to the current user
      const { data: commentData, error: fetchError } = await supabase
        .from('issue_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Security check: Only allow the original comment author to delete their comment
      if (commentData.user_id !== currentUser.id) {
        throw new Error('You can only delete your own comments');
      }
      
      // Delete comment from Supabase
      const { error } = await supabase
        .from('issue_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // Extra security: ensure user_id matches
        
      if (error) throw error;
      
      // Remove comment from local state
      setReports(
        reports.map((report) => {
          if (report.id === reportId) {
            return {
              ...report,
              comments: report.comments.filter((comment) => comment.id !== commentId),
              updatedAt: new Date().toISOString()
            };
          }
          return report;
        })
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        addReport,
        updateReport,
        deleteReport,
        getReportById,
        upvoteReport,
        addComment,
        updateComment,
        deleteComment,
        refreshReports,
        isLoading,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};
