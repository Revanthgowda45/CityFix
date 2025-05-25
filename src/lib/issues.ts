import { supabase } from './supabase';
import type { Issue, IssueComment, IssueStatus, IssuePriority, IssueCategory } from './supabase';

// Issue Functions
export const createIssue = async (issue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'votes'>) => {
  // Create a promise with timeout to prevent long operations
  const createWithTimeout = async (timeoutMs = 10000) => {
    // Use minimal select - we only need the ID and don't need the full record back
    // This speeds up the operation significantly
    const promise = supabase
      .from('issues')
      .insert([issue])
      .select('id') // Only select the ID field which is all we need
      .single();
      
    // Create a timeout promise
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Submission timed out')), timeoutMs)
    );

    // Race between the create operation and the timeout
    const result = await Promise.race([promise, timeout]) as { data: any, error: any };
    
    if (result.error) throw result.error;
    return result.data;
  };
  
  return await createWithTimeout();
};

import { hasActiveSession } from './authPersistence';

export const getIssues = async (filters?: {
  status?: IssueStatus;
  category?: IssueCategory;
  priority?: IssuePriority;
  userId?: string;
}) => {
  console.log('Fetching issues with filters:', filters || 'none');
  
  try {
    // First, use the quick check for active session from persistence utilities
    const activeSessionDetected = hasActiveSession();
    
    // Then verify with Supabase directly
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session && !activeSessionDetected) {
      console.warn('No active session when trying to fetch issues');
      // If this keeps happening, the session might be lost - try to refresh the page
      console.info('TIP: If this is a persistent issue, refreshing the page may help restore your session');
      return [];
    }
    
    // The API key is already configured in the Supabase client creation
    // We just need to ensure we have a valid session before proceeding
    // This helps address the "No API key found in request" error by ensuring
    // authentication is properly established
    
    // Build the query with all appropriate filters
    let query = supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching issues:', error);
      // Check for specific API key error
      if (error.message?.includes('API key')) {
        console.warn('API key error detected, attempting to recover...');
        // For now just return empty data
        return [];
      }
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} issues`);
    return data || [];
  } catch (e) {
    console.error('Exception in getIssues:', e);
    throw e;
  }
};

export const getIssueById = async (id: string) => {
  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      user:profiles(name, avatar_url),
      assigned_to:profiles(name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateIssue = async (id: string, updates: Partial<Issue>) => {
  const { data, error } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteIssue = async (id: string) => {
  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const voteOnIssue = async (id: string, userId: string) => {
  // First check if the user has already voted on this issue
  const { data: existingVotes, error: checkError } = await supabase
    .from('issue_votes')
    .select('*')
    .eq('issue_id', id)
    .eq('user_id', userId);

  if (checkError) throw checkError;

  // If user has already voted, don't allow another vote
  if (existingVotes && existingVotes.length > 0) {
    throw new Error('User has already voted on this issue');
  }

  // If not voted yet, proceed with the vote
  const { data, error } = await supabase.rpc('vote_on_issue', {
    issue_id: id,
    user_id: userId
  });

  if (error) throw error;
  return data;
};

// Comment Functions
export const createComment = async (comment: Omit<IssueComment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('issue_comments')
    .insert([comment])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getComments = async (issueId: string) => {
  console.log('Fetching comments for issue ID:', issueId);
  
  // First get the raw comments to ensure we have them
  const { data: rawComments, error: rawError } = await supabase
    .from('issue_comments')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });
    
  if (rawError) {
    console.error('Error fetching raw comments:', rawError);
    throw rawError;
  }
  
  console.log('Raw comments found:', rawComments);
  
  // Now fetch user data for each comment directly
  try {
    const commentsWithUsers = await Promise.all(rawComments.map(async (comment) => {
      // Explicitly fetch the user profile for each comment
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', comment.user_id)
        .single();
      
      if (userError) {
        console.warn(`Could not fetch user ${comment.user_id} for comment ${comment.id}:`, userError);
        return { ...comment, user: { name: 'User', role: 'citizen' } };
      }
      
      console.log(`User data for comment ${comment.id}:`, userData);
      
      // Return the comment with attached user data
      return { 
        ...comment, 
        user: userData 
      };
    }));
    
    console.log('Comments with user data attached:', commentsWithUsers);
    return commentsWithUsers;
  } catch (joinError) {
    console.error('Error with joined query:', joinError);
    
    // Fallback to just fetching comments without the join
    const { data, error } = await supabase
      .from('issue_comments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error with fallback query:', error);
      throw error;
    }
    
    // Now fetch user data for each comment
    const commentsWithUsers = await Promise.all(data.map(async (comment) => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, name, email, role, avatar_url')
          .eq('id', comment.user_id)
          .single();
          
        if (userError) throw userError;
        
        return { ...comment, user: userData };
      } catch (e) {
        console.log('Could not fetch user for comment, using default:', e);
        return comment;
      }
    }));
    
    console.log('Comments processed with separate user queries:', commentsWithUsers);
    return commentsWithUsers || [];
  }
};

export const updateComment = async (id: string, content: string) => {
  const { data, error } = await supabase
    .from('issue_comments')
    .update({ content })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteComment = async (id: string) => {
  const { error } = await supabase
    .from('issue_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Real-time subscriptions
export const subscribeToIssues = (callback: (payload: any) => void) => {
  return supabase
    .channel('issues_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, callback)
    .subscribe();
};

export const subscribeToComments = (issueId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`comments_changes_${issueId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'issue_comments',
        filter: `issue_id=eq.${issueId}`
      }, 
      callback
    )
    .subscribe();
}; 