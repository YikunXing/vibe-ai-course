import { createClient } from './client';
import { User, Link, Analytics } from './types';

// User Management Functions
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUser:', error);
    return null;
  }
};

// Link Management Functions
export const getLink = async (linkId: string): Promise<Link | null> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (error) {
      console.error('Error fetching link:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLink:', error);
    return null;
  }
};

export const getLinkFromSlug = async (slug: string): Promise<Link | null> => {
  try {
    const supabase = createClient();
    console.log(slug)
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching link:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLink:', error);
    return null;
  }
};

export const updateLink = async (linkId: string, updates: Partial<Link>): Promise<Link | null> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('links')
      .update(updates)
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      console.error('Error updating link:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateLink:', error);
    return null;
  }
};

export const deleteLink = async (linkId: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', linkId);

    if (error) {
      console.error('Error deleting link:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteLink:', error);
    return false;
  }
};

export const createLink = async (linkData: Omit<Link, 'id' | 'created_at'>): Promise<Link | null> => {
  try {
    console.log('Creating link:', linkData);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('links')
      .insert(linkData)
      .select()
      .single();

    if (error) {
      console.error('Error creating link:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createLink:', error);
    return null;
  }
};

export const getAnalytics = async (
  options: {
    userId?: string;
    linkId?: string;
    dateRange?: { start: string; end: string };
    includeLinks?: boolean;
    includeClickCounts?: boolean;
  } = {}
): Promise<Analytics[] | { link: Link; clickCount: number }[]> => {
  const {
    userId,
    linkId,
    dateRange,
    includeLinks = false,
    includeClickCounts = false,
  } = options;
  const supabase = createClient();

  try {
    // Case 1: Fetch links with their corresponding click counts for a user.
    if (userId && includeLinks && includeClickCounts) {
      // Step 1: Get all links for the user.
      const { data: links, error: linksError } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const linkIds = links.map((link) => link.id);

      // Step 2: Use an RPC call to the database function to efficiently get counts.
      const { data: counts, error: countsError } = await supabase.rpc(
        'get_click_counts_for_links',
        { link_ids: linkIds }
      );

      if (countsError) throw countsError;

      // Step 3: Map the counts back to the links for the final result.
      const clickCountsMap = new Map<string, number>(
        counts.map((c: { link_id: string; click_count: number }) => [c.link_id, c.click_count])
      );

      return links.map((link) => ({
        link,
        clickCount: clickCountsMap.get(link.id) || 0,
      }));
    }

    // Case 2: Fetch raw analytics data based on various filters.
    let query = supabase.from('analytics').select('*');

    // Add filters conditionally
    if (linkId) {
      query = query.eq('link_id', linkId);
    } else if (userId) {
      // If a userId is given, we need to get their link IDs first.
      const { data: userLinks, error: userLinksError } = await supabase
        .from('links')
        .select('id')
        .eq('user_id', userId);

      if (userLinksError) throw userLinksError;
      if (!userLinks || userLinks.length === 0) return [];

      const linkIds = userLinks.map((link) => link.id);
      query = query.in('link_id', linkIds);
    } else {
      // If no userId or linkId is provided, there's nothing to fetch.
      return [];
    }

    if (dateRange) {
      query = query
        .gte('clicked_at', dateRange.start)
        .lte('clicked_at', dateRange.end);
    }

    const { data, error } = await query.order('clicked_at', {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    return [];
  }
};

// Legacy function names for backward compatibility - these now call the unified function
export const getLinkAnalytics = async (linkId: string): Promise<Analytics[]> => {
  return getAnalytics({ linkId }) as Promise<Analytics[]>;
};

export const getLinksWithClickCounts = async (
  userId: string
): Promise<{ link: Link; clickCount: number }[]> => {
  return getAnalytics({
    userId,
    includeLinks: true,
    includeClickCounts: true,
  }) as Promise<{ link: Link; clickCount: number }[]>;
};



export const recordLinkClick = async (linkId: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    // Create a new analytics record for the click
    const { error } = await supabase
      .from('analytics')
      .insert({
        link_id: linkId,
        clicked_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording link click:', error);
      throw new Error(`Failed to record link click: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error in recordLinkClick:', error);
    throw error;
  }
};


