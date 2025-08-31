// Export client
export { createClient } from './client';

// Export types
export type {
  User,
  Link,
  Analytics,
  CreateLinkData,
  UpdateUserData,
  UpdateLinkData,
  DateRange,
} from './types';

// Export helper functions
export {
  // User management
  getUser,
  updateUser,
  
  // Link management
  getLink,
  updateLink,
  deleteLink,
  createLink,
  
  // Analytics
  getAnalytics,
  
  // Additional utilities
  getLinkAnalytics,
  getLinksWithClickCounts,
} from './helpers';
