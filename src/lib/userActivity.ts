import { supabase } from './supabase';
import { safeGetItem, safeSetItem, getCookie, setCookie } from './storageUtils';

export interface UserActivity {
  id: string;
  type: 'report' | 'comment' | 'upvote';
  timestamp: string;
  title: string;
  description?: string;
  issueId?: string;
  issueTitle?: string;
}

// Fetch user activities (reported issues, comments, and upvotes)
export const getUserActivities = async (userId: string, limit: number = 5): Promise<UserActivity[]> => {
  try {
    const activities: UserActivity[] = [];
    
    // 1. Get issues reported by the user (newest first)
    const { data: reportedIssues, error: reportError } = await supabase
      .from('issues')
      .select('id, title, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reportError) throw reportError;
    
    // Add reported issues to activities
    if (reportedIssues) {
      reportedIssues.forEach(issue => {
        activities.push({
          id: `report_${issue.id}`,
          type: 'report',
          timestamp: issue.created_at,
          title: issue.title,
          description: issue.description,
          issueId: issue.id
        });
      });
    }
    
    // 2. Get comments made by the user (newest first)
    const { data: userComments, error: commentError } = await supabase
      .from('issue_comments')
      .select(`
        id, 
        content, 
        created_at,
        issue_id,
        issues:issues(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (commentError) throw commentError;
    
    // Add comments to activities
    if (userComments) {
      userComments.forEach((comment: any) => {
        activities.push({
          id: `comment_${comment.id}`,
          type: 'comment',
          timestamp: comment.created_at,
          title: 'Commented on an issue',
          description: comment.content,
          issueId: comment.issue_id,
          issueTitle: comment.issues?.title
        });
      });
    }
    
    // 3. Get upvotes made by the user
    const { data: userVotes, error: voteError } = await supabase
      .from('issue_votes')
      .select(`
        id, 
        created_at,
        issue_id,
        issues:issues(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (voteError) throw voteError;
    
    // Add votes to activities
    if (userVotes) {
      userVotes.forEach((vote: any) => {
        activities.push({
          id: `vote_${vote.id}`,
          type: 'upvote',
          timestamp: vote.created_at,
          title: 'Upvoted an issue',
          issueId: vote.issue_id,
          issueTitle: vote.issues?.title
        });
      });
    }
    
    // Sort all activities by timestamp (newest first)
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
    
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};

// Format relative time (e.g., "2 days ago")
export const getRelativeTimeFromNow = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffDays > 30) {
    return `${Math.floor(diffDays / 30)} months ago`;
  } else if (diffDays > 0) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
};

// Get activity type icon name
export const getActivityIcon = (type: UserActivity['type']): string => {
  switch (type) {
    case 'report':
      return 'Upload';
    case 'comment':
      return 'MessageSquare';
    case 'upvote':
      return 'ThumbsUp';
    default:
      return 'Activity';
  }
};

/**
 * Interface for tracking user session and app usage
 */
export interface UsageData {
  // Session tracking
  sessionStart?: string;
  sessionId?: string;
  lastActivity?: string;
  pageViews?: number;
  // User preferences that might be in the problematic 'Usage' item
  preferences?: {
    religion?: string;
    [key: string]: any;
  };
  // Session performance
  loadTime?: number;
  version: number;
}

/**
 * Default usage data structure
 */
const defaultUsageData: UsageData = {
  sessionStart: new Date().toISOString(),
  sessionId: crypto.randomUUID?.() || String(Date.now()),
  lastActivity: new Date().toISOString(),
  pageViews: 0,
  preferences: {},
  version: 1
};

/**
 * Safely initializes or updates the Usage tracking
 * This helps prevent the "Loading authentication..." delay issue
 * while preserving important user preferences like religion
 */
export const initializeUsageTracking = (): void => {
  try {
    // First, check if there's an existing Usage item
    const existingUsage = localStorage.getItem('Usage');
    let usageData: UsageData;

    if (existingUsage) {
      try {
        // Try to parse the existing data
        const parsed = JSON.parse(existingUsage);
        
        // Extract user preferences (especially religion)
        const preferences = parsed?.preferences || {};
        
        // If the religion preference is set in a cookie, use that as backup
        const religionCookie = getCookie('cityfix-religion');
        if (religionCookie && !preferences.religion) {
          preferences.religion = decodeURIComponent(religionCookie);
        }
        
        // Create a clean, minimal Usage object that won't cause performance issues
        usageData = {
          ...defaultUsageData,
          preferences,
          version: 2 // Increment version to indicate we've cleaned it
        };
      } catch (parseError) {
        console.warn('Found corrupted Usage data, resetting with preserved preferences');
        
        // If we couldn't parse, create a new usage object
        // but try to preserve religion preference from cookie if available
        const religionCookie = getCookie('cityfix-religion');
        usageData = {
          ...defaultUsageData,
          preferences: religionCookie ? { religion: decodeURIComponent(religionCookie) } : {}
        };
      }
    } else {
      // No existing Usage item, create a fresh one
      usageData = { ...defaultUsageData };
      
      // Check if religion preference exists in cookie
      const religionCookie = getCookie('cityfix-religion');
      if (religionCookie) {
        usageData.preferences = { 
          religion: decodeURIComponent(religionCookie) 
        };
      }
    }
    
    // Store the clean usage data
    localStorage.setItem('Usage', JSON.stringify(usageData));
    
    // Also update the last activity on page load
    updateLastActivity();
    
  } catch (error) {
    console.error('Error initializing usage tracking:', error);
    // If all else fails, remove the problematic item
    try {
      localStorage.removeItem('Usage');
      
      // And create a minimal valid version
      localStorage.setItem('Usage', JSON.stringify(defaultUsageData));
    } catch (removeError) {
      console.error('Failed to reset usage data:', removeError);
    }
  }
};

/**
 * Updates the last activity timestamp in Usage data
 * Call this on important user interactions
 */
export const updateLastActivity = (): void => {
  try {
    const usageData = safeGetItem<UsageData>('Usage', defaultUsageData);
    
    // Update last activity time
    usageData.lastActivity = new Date().toISOString();
    usageData.pageViews = (usageData.pageViews || 0) + 1;
    
    // Save back to localStorage
    safeSetItem('Usage', usageData);
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
};

/**
 * Get user preference from Usage data
 * @param key The preference key to retrieve
 * @param defaultValue Default value if preference doesn't exist
 */
export const getUserPreference = <T>(key: string, defaultValue: T): T => {
  try {
    const usageData = safeGetItem<UsageData>('Usage', defaultUsageData);
    return (usageData.preferences?.[key] as T) || defaultValue;
  } catch (error) {
    console.error(`Error getting user preference ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Save user preference to Usage data
 * @param key The preference key to save
 * @param value The preference value
 */
export const saveUserPreference = <T>(key: string, value: T): void => {
  try {
    const usageData = safeGetItem<UsageData>('Usage', defaultUsageData);
    
    // Ensure preferences object exists
    if (!usageData.preferences) {
      usageData.preferences = {};
    }
    
    // Set the preference
    usageData.preferences[key] = value;
    
    // Save back to localStorage
    safeSetItem('Usage', usageData);
    
    // For important preferences like religion, also set a cookie as backup
    if (key === 'religion' && value) {
      setCookie('cityfix-religion', String(value), 365);
    }
  } catch (error) {
    console.error(`Error saving user preference ${key}:`, error);
  }
};
