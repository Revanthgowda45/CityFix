import { supabase } from './supabase';

/**
 * Function to get the number of reports submitted by a user
 * @param userId The ID of the user
 * @returns Promise resolving to the count of reports submitted
 */
export const getUserReportCount = async (userId: string): Promise<number> => {
  try {
    // Query issues table to count reports submitted by the user
    const { count, error } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user report count:', error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getUserReportCount:', error);
    return 0; // Return 0 if there's an error
  }
};

/**
 * Get additional user stats (reports, comments, upvotes)
 * @param userId The ID of the user
 * @returns Promise resolving to user statistics
 */
export const getUserStats = async (userId: string) => {
  try {
    // Run multiple queries in parallel for efficiency
    const [reportsResult, commentsResult, votesResult] = await Promise.all([
      // Count reports
      supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Count comments
      supabase
        .from('issue_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Count upvotes
      supabase
        .from('issue_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);
    
    // Check for errors in any of the queries
    if (reportsResult.error) throw reportsResult.error;
    if (commentsResult.error) throw commentsResult.error;
    if (votesResult.error) throw votesResult.error;
    
    return {
      reportsCount: reportsResult.count || 0,
      commentsCount: commentsResult.count || 0,
      upvotesCount: votesResult.count || 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return default values if there's an error
    return {
      reportsCount: 0,
      commentsCount: 0,
      upvotesCount: 0
    };
  }
};
