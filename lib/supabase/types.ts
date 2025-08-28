export interface User {
  id: string;
  created_at: string;
  name?: string;
  email?: string;
}

export interface Link {
  id: string;
  created_at: string;
  user_id: string;
  destination_url?: string;
  slug?: string;
  tags?: any; // JSON field
  conversion_tracking?: boolean;
  folder?: string;
  description?: string;
}

export interface Analytics {
  id: string;
  clicked_at: string;
  link_id: string;
}

export interface CreateLinkData {
  user_id: string;
  destination_url: string;
  slug: string;
  tags?: any;
  conversion_tracking?: boolean;
  folder?: string;
  description?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export interface UpdateLinkData {
  destination_url?: string;
  slug?: string;
  tags?: any;
  conversion_tracking?: boolean;
  folder?: string;
  description?: string;
}

export interface DateRange {
  start: string;
  end: string;
}
