"use client"
import React, { useState, createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react'
import { Link as DatabaseLink } from '@/lib/supabase/types'
import { getLinksWithClickCounts, updateLink as updateDatabaseLink } from '@/lib/supabase/helpers'
import { useRealtime } from './use-realtime'
import { showErrorToast } from '@/lib/utils'


// Define the Link type for UI (different from database schema)
export interface Link {
  id: string
  favicon: string
  shortUrl: string
  originalUrl: string
  description: string
  clicks: number
  createdAt: string
  isActive: boolean
  tags?: string
  folder?: string
  conversionTracking?: boolean
}

// Helper function to convert database link to UI link
const convertDatabaseLinkToUI = (dbLink: DatabaseLink, clicks: number = 0): Link => {
  return {
    id: dbLink.id,
    favicon: "/placeholder.svg",
    shortUrl: `localhost:3000/${dbLink.slug || 'unknown'}`,
    originalUrl: dbLink.destination_url || '',
    description: dbLink.description || 'Untitled Link',
    clicks,
    createdAt: new Date(dbLink.created_at).toLocaleDateString(),
    isActive: true, // Default to active
    tags: dbLink.tags ? JSON.stringify(dbLink.tags) : '',
    folder: dbLink.folder || 'links',
    conversionTracking: dbLink.conversion_tracking || false,
  }
}

interface LinksContextType {
  links: Link[]
  updateLink: (id: string, updates: Partial<Link>) => void
  updateLinkInDatabase: (id: string, updates: Partial<DatabaseLink>) => Promise<boolean>
  addLink: (link: Omit<Link, 'id'>) => void
  getLinkById: (id: string) => Link | undefined
  addDatabaseLink: (dbLink: DatabaseLink, clicks?: number) => void
  fetchUserLinks: (userId: string) => Promise<void>
  forceRefreshLinks: (userId: string) => Promise<void>
  isLoading: boolean
  isConnecting: boolean
  hasInitialized: boolean
  error: string | null
  isRealtimeConnected: boolean
}

const LinksContext = createContext<LinksContextType | undefined>(undefined)

export function LinksProvider({ children }: { children: ReactNode }) {
  const [links, setLinks] = useState<Link[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchUserLinks = useCallback(async (userId: string) => {
    // Don't fetch if we already have data and are initialized
    if (hasInitialized && links.length > 0) {
      return
    }
    
    try {
      console.log('Starting to fetch user links for:', userId);
      setCurrentUserId(userId)
      setIsConnecting(true)
      setError(null)
    
      
      setIsConnecting(false)
      setIsLoading(true)
      
      const linksWithCounts = await getLinksWithClickCounts(userId)
      console.log('Received links with counts:', linksWithCounts.length);
      
      const uiLinks = linksWithCounts.map(({ link, clickCount }) => 
        convertDatabaseLinkToUI(link, clickCount)
      )
      console.log('Converted to UI links:', uiLinks.length);
      
      setLinks(uiLinks)
      setHasInitialized(true)
    } catch (error) {
      console.error('Error fetching user links:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch links')
      // Set empty array instead of keeping previous state to prevent flashing
      setLinks([])
      setHasInitialized(true)
    } finally {
      setIsLoading(false)
      setIsConnecting(false)
    }
  }, [hasInitialized, links.length])

  const updateLink = useCallback((id: string, updates: Partial<Link>) => {
    setLinks(prevLinks =>
      prevLinks.map(link =>
        link.id === id ? { ...link, ...updates } : link
      )
    )
  }, [])

  const updateLinkInDatabase = useCallback(async (id: string, updates: Partial<DatabaseLink>): Promise<boolean> => {
    try {
      const updatedLink = await updateDatabaseLink(id, updates)
      if (updatedLink) {
        // Update local state to reflect database changes
        setLinks(prevLinks =>
          prevLinks.map(link => {
            if (link.id === id) {
              return {
                ...link,
                originalUrl: updatedLink.destination_url || link.originalUrl,
                shortUrl: `localhost:3000/${updatedLink.slug || 'unknown'}`,
                tags: updatedLink.tags ? (Array.isArray(updatedLink.tags) ? updatedLink.tags.join(', ') : JSON.stringify(updatedLink.tags)) : link.tags,
                folder: updatedLink.folder || link.folder,
                conversionTracking: updatedLink.conversion_tracking || link.conversionTracking,
                description: updatedLink.description || link.description,
              }
            }
            return link
          })
        )
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating link in database:', error)
      const errorMessage = showErrorToast(error, 'Failed to update link in database')
      setError(errorMessage)
      return false
    }
  }, [])

  const addLink = useCallback((linkData: Omit<Link, 'id'>) => {
    const newLink: Link = {
      ...linkData,
      id: typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now()),
    }
    setLinks(prevLinks => [newLink, ...prevLinks])
  }, [])

  const addDatabaseLink = useCallback((dbLink: DatabaseLink, clicks: number = 0) => {
    const uiLink = convertDatabaseLinkToUI(dbLink, clicks)
    setLinks(prevLinks => [uiLink, ...prevLinks])
  }, [])

  const getLinkById = useCallback((id: string) => {
    return links.find(link => link.id === id)
  }, [links])

  const forceRefreshLinks = useCallback(async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const linksWithCounts = await getLinksWithClickCounts(userId)
      const uiLinks = linksWithCounts.map(({ link, clickCount }) => 
        convertDatabaseLinkToUI(link, clickCount)
      )
      setLinks(uiLinks)
    } catch (error) {
      console.error('Error refreshing user links:', error)
      const errorMessage = showErrorToast(error, 'Failed to refresh links')
      setError(errorMessage)
      // Set empty array on error to prevent flashing
      setLinks([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle realtime analytics updates
  const handleAnalyticsUpdate = useCallback((linkId: string, clickChange: number) => {
    setLinks(prevLinks => 
      prevLinks.map(link => 
        link.id === linkId 
          ? { ...link, clicks: Math.max(0, link.clicks + clickChange) }
          : link
      )
    )
  }, [])

  // Set up realtime subscription
  const { isSubscribed, updateLinkIds } = useRealtime({
    userId: currentUserId || '',
    onAnalyticsUpdate: handleAnalyticsUpdate,
    onError: (error) => {
      console.error('Realtime error:', error)
      const errorMessage = showErrorToast(error, 'Realtime connection error')
      setError(errorMessage)
    }
  })

  // Update realtime subscription when links change
  useEffect(() => {
    if (links.length > 0) {
      const linkIds = links.map(link => link.id)
      updateLinkIds(linkIds)
    }
  }, [links, updateLinkIds])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ 
    links, 
    updateLink, 
    updateLinkInDatabase,
    addLink, 
    getLinkById, 
    addDatabaseLink, 
    fetchUserLinks,
    forceRefreshLinks,
    isLoading,
    isConnecting,
    hasInitialized,
    error,
    isRealtimeConnected: isSubscribed
  }), [
    links, 
    updateLink, 
    updateLinkInDatabase,
    addLink, 
    getLinkById, 
    addDatabaseLink, 
    fetchUserLinks,
    forceRefreshLinks,
    isLoading,
    isConnecting,
    hasInitialized,
    error,
    isSubscribed
  ])

  return (
    <LinksContext.Provider value={contextValue}>
      {children}
    </LinksContext.Provider>
  )
}

export function useLinks() {
  const context = useContext(LinksContext)
  if (context === undefined) {
    throw new Error('useLinks must be used within a LinksProvider')
  }
  return context
} 